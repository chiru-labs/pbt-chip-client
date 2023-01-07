import { ethers } from "ethers";

// Fork of ethers.utils.hashMessage, but uses solidityKeccak instead
// TODO: consider using 712 instead https://www.npmjs.com/package/ethers-eip712
// Would need to mimic _signTypedData functionality https://docs.ethers.io/v5/api/signer/#Signer-signTypedData raw with chip
// https://github.com/kong-org/halo-verify-web/blob/e821759c0d6190bdc8ffd45aab49b3db300a4b21/src/stores/registerStore.tsx#L156
export const hashMessageEIP191SolidityKeccak = (
  address: string,
  hash: string
) => {
  const messagePrefix = "\x19Ethereum Signed Message:\n32";
  const message = address
    ? ethers.utils.solidityKeccak256(["address", "bytes32"], [address, hash])
    : ethers.utils.solidityKeccak256(["bytes32"], [hash]);
  return ethers.utils.solidityKeccak256(
    ["string", "bytes32"],
    [messagePrefix, ethers.utils.arrayify(message)]
  );
};

export const unpackDERsignature = (signature: string) => {
  const header0 = signature.slice(0, 2);
  if (parseInt("0x" + header0) !== 0x30) {
    throw Error("Invalid header.");
  }

  const header_r0 = signature.slice(4, 6);
  const header_r1 = signature.slice(6, 8);

  if (parseInt("0x" + header_r0) !== 0x02) {
    throw Error("Invalid header (2).");
  }

  const length_r = parseInt("0x" + header_r1) * 2;
  let r = signature.slice(8, length_r + 8);

  const header_s0 = signature.slice(length_r + 8, length_r + 10);
  const header_s1 = signature.slice(length_r + 10, length_r + 12);

  if (parseInt("0x" + header_s0) !== 0x02) {
    throw Error("Invalid header (2).");
  }

  let s = signature.slice(
    length_r + 12,
    length_r + 12 + parseInt("0x" + header_s1) * 2
  );

  if (r.length == 66) {
    r = r.slice(2, 130);
  }

  if (s.length == 66) {
    s = s.slice(2, 130);
  }

  return {
    r,
    s,
  };
};
