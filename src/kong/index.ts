import { ethers } from "ethers";
import { buf2hex, fromHexString } from "./utils/bufferUtils";
import {
  hashMessageEIP191SolidityKeccak,
  unpackDERsignature,
} from "./utils/cryptoUtils";

const IS_BROWSER = typeof window !== "undefined";

function parseHostName() {
  const url = new URL(window.location.href);

  return url.hostname;
}

function generateCmd(
  cmd: number,
  keyslot: number,
  address: string,
  hash: string
) {
  // EIP-191 signed data for local verification.
  // let messageBytes = ethers.utils.hashMessage(message);
  let messageBytes = hashMessageEIP191SolidityKeccak(address, hash);

  // Remove prepended 0x.
  messageBytes = messageBytes.slice(2);

  // Structure command bytes.
  const cmdBytes = new Uint8Array(2);
  cmdBytes[0] = cmd;
  cmdBytes[1] = keyslot;
  const cmdHex = buf2hex(cmdBytes);

  // Prepend the message with the command.
  const inputBytes = cmdHex + messageBytes;

  return inputBytes;
}

export function parseKeys(payload: string) {
  try {
    const primaryPublicKeyLength = parseInt("0x" + payload.slice(0, 2)) * 2;
    const primaryPublicKeyRaw = payload.slice(2, primaryPublicKeyLength + 2);
    const primaryPublicKeyHash = ethers.utils.sha256(
      "0x" + primaryPublicKeyRaw.slice(2)
    );

    const secondaryPublicKeyLength =
      parseInt(
        "0x" +
          payload.slice(primaryPublicKeyLength + 2, primaryPublicKeyLength + 4)
      ) * 2;

    const secondaryPublicKeyRaw = payload.slice(
      primaryPublicKeyLength + 4,
      primaryPublicKeyLength + secondaryPublicKeyLength + 4
    );

    const secondaryPublicKeyHash = ethers.utils.sha256(
      "0x" + secondaryPublicKeyRaw.slice(2)
    );

    const tertiaryPublicKeyLength =
      parseInt(
        "0x" +
          payload.slice(
            primaryPublicKeyLength + secondaryPublicKeyLength + 4,
            primaryPublicKeyLength + secondaryPublicKeyLength + 6
          )
      ) * 2;

    let tertiaryPublicKeyRaw = null;
    let tertiaryPublicKeyHash = null;

    if (tertiaryPublicKeyLength > 0) {
      tertiaryPublicKeyRaw = payload.slice(
        primaryPublicKeyLength + secondaryPublicKeyLength + 6,
        primaryPublicKeyLength +
          secondaryPublicKeyLength +
          tertiaryPublicKeyLength +
          6
      );

      tertiaryPublicKeyHash = ethers.utils.sha256(
        "0x" + tertiaryPublicKeyRaw.slice(2)
      );
    }

    const keys = {
      primaryPublicKeyHash,
      primaryPublicKeyRaw,
      secondaryPublicKeyHash,
      secondaryPublicKeyRaw,
      tertiaryPublicKeyHash,
      tertiaryPublicKeyRaw,
    };

    return keys;
  } catch (err) {
    return false;
  }
}

async function triggerScan({ reqx, rpId }: { reqx: string; rpId: string }) {
  try {
    const xdd = await navigator.credentials.get({
      publicKey: {
        allowCredentials: [
          {
            id: fromHexString(reqx),
            transports: ["nfc"],
            type: "public-key",
          },
        ],
        challenge: new Uint8Array([
          113, 241, 176, 49, 249, 113, 39, 237, 135, 170, 177, 61, 15, 14, 105,
          236, 120, 140, 4, 41, 65, 225, 107, 63, 214, 129, 133, 223, 169, 200,
          21, 88,
        ]),
        rpId,
        timeout: 60000,
        userVerification: "discouraged",
      },
    });

    if (xdd?.type === "public-key") {
      return (xdd.response as AuthenticatorAssertionResponse).signature;
    }
  } catch (err) {
    console.log("Error with scan", err);
  }

  // Unexpected
  return null;
}

// EIP-191 ECDSA, decode-able with OZ ECDSA library like so:
//
// bytes32 signedHash = keccak256(
//   abi.encodePacked(addr, block.blockhash(block.number - 1))
// ).toEthSignedMessageHash();
// address signerOz = signedHash.recover(signature);
export const getSignatureFromScan = async ({
  rpId,
  chipPublicKey,
  address,
  hash,
}: {
  chipPublicKey: string;
  address: string;
  hash: string;
  rpId?: string;
}) => {
  if (!IS_BROWSER) {
    console.warn("This function is only available in a browser environment.");

    return;
  }

  const sigCmd = generateCmd(1, 1, address, hash);

  const sig = await triggerScan({
    reqx: sigCmd,
    rpId: rpId ?? parseHostName(),
  });

  if (!sig) {
    if (process.env.ENV === "development") {
      throw new Error("Failure to fetch a signature.");
    }

    console.warn("Failure to fetch a signature.");
    return;
  }

  let vType = undefined;

  const computedAddress = ethers.utils.computeAddress("0x" + chipPublicKey);
  const addressToLower = computedAddress.toLowerCase();
  const messageHash = hashMessageEIP191SolidityKeccak(address, hash);

  const sigString = buf2hex(sig);
  const sigSplit = unpackDERsignature(sigString);

  const vArr27 = new Uint8Array(1);
  const vArr28 = new Uint8Array(1);

  vArr27[0] = 27;
  vArr28[0] = 28;

  const v27 = buf2hex(vArr27);
  const v28 = buf2hex(vArr28);

  const v27Sig = `0x${sigSplit.r}${sigSplit.s}${v27}`;
  const v28Sig = `0x${sigSplit.r}${sigSplit.s}${v28}`;

  const isV27 =
    ethers.utils.recoverAddress(messageHash, v27Sig).toLowerCase() ===
    addressToLower;
  const isV28 =
    ethers.utils.recoverAddress(messageHash, v28Sig).toLowerCase() ===
    addressToLower;

  if (isV27) {
    vType = "27";
  } else if (isV28) {
    vType = "28";
  } else {
    throw new Error("addressMismatch");
  }

  const r = sigSplit.r.padStart(64, "0");
  let s = sigSplit.s;

  // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/66ec91bc450ff997ca7f7291491f7a1e49107767/contracts/utils/cryptography/ECDSA.sol#L143
  let sn = BigInt("0x" + s);
  // SECP256k1 order constant
  const curveOrder =
    115792089237316195423570985008687907852837564279074904382605163141518161494337n;
  if (sn > curveOrder / 2n) {
    // malleable signature, not compliant with Ethereum's EIP-2
    // we need to flip s value in the signature
    sn = -sn + curveOrder;
    s = sn.toString(16).padStart(64, "0");
    if (vType === "27") {
      vType = "28";
    } else if (vType === "28") {
      vType = "27";
    }
  }

  if (vType === "27") {
    return `0x${r}${s}${v27}`;
  }
  if (vType === "28") {
    return `0x${r}${s}${v28}`;
  }

  throw new Error("Error in signing, try again.");
};

export const getPublicKeysFromScan = async ({
  rpId,
}: { rpId?: string } = {}) => {
  if (!IS_BROWSER) {
    console.warn("This function is only available in a browser environment.");

    return;
  }

  const sig = await triggerScan({ reqx: "02", rpId: rpId ?? parseHostName() });

  if (sig != null) {
    const sss = buf2hex(sig);
    const chipKeys = parseKeys(sss);

    if (chipKeys) {
      return chipKeys;
    }
  }

  throw new Error("Error in getting public key.");
};
