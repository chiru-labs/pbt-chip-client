import { getPublicKeysFromScan } from "../../src/kong";

describe("Kong chip", () => {
  let credentialsGetterMock: jest.SpyInstance;

  beforeAll(() => {
    credentialsGetterMock = jest.fn();

    Object.defineProperty(window.navigator, "credentials", {
      value: {
        get: credentialsGetterMock,
      },
    });
  });

  beforeEach(() => {
    window.location.assign("https://foobar.com/chip");

    credentialsGetterMock.mockReturnValue({
      type: "public-key",
      response: {
        // ArrayBuffer corresponding to 0xdc32837b21abd89ea413ac3da205c451f254b361bb48514fd00dc40bbeefa99a4abcabf49c1060d576f23f670fb1e074f24c3d1376cdc93a32a09d540982b3661b
        signature: new Uint8Array([
          48, 120, 100, 99, 51, 50, 56, 51, 55, 98, 50, 49, 97, 98, 100, 56, 57,
          101, 97, 52, 49, 51, 97, 99, 51, 100, 97, 50, 48, 53, 99, 52, 53, 49,
          102, 50, 53, 52, 98, 51, 54, 49, 98, 98, 52, 56, 53, 49, 52, 102, 100,
          48, 48, 100, 99, 52, 48, 98, 98, 101, 101, 102, 97, 57, 57, 97, 52,
          97, 98, 99, 97, 98, 102, 52, 57, 99, 49, 48, 54, 48, 100, 53, 55, 54,
          102, 50, 51, 102, 54, 55, 48, 102, 98, 49, 101, 48, 55, 52, 102, 50,
          52, 99, 51, 100, 49, 51, 55, 54, 99, 100, 99, 57, 51, 97, 51, 50, 97,
          48, 57, 100, 53, 52, 48, 57, 56, 50, 98, 51, 54, 54, 49, 98,
        ]),
      },
    });
  });

  afterEach(() => {
    credentialsGetterMock.mockClear();
    window.location.assign("/");
  });

  it("getPublicKeysFromScan", async () => {
    const result = await getPublicKeysFromScan({
      rpId: "foobar.com",
    });

    if (result) {
      const { primaryPublicKeyHash, primaryPublicKeyRaw } = result;

      expect(primaryPublicKeyHash).toEqual(
        "0x844821a2bad46a9ed8f65761debc79af0c7f0cf4af0a4f81e97a12afe0affb0d"
      );
      expect(primaryPublicKeyRaw).toEqual(
        "786463333238333762323161626438396561343133616333646132303563343531663235346233363162623438353134"
      );
    }
  });

  it("getPublicKeysFromScan without explicit rpId", async () => {
    const result = await getPublicKeysFromScan();

    if (result) {
      const { primaryPublicKeyHash, primaryPublicKeyRaw } = result;

      expect(primaryPublicKeyHash).toEqual(
        "0x844821a2bad46a9ed8f65761debc79af0c7f0cf4af0a4f81e97a12afe0affb0d"
      );
      expect(primaryPublicKeyRaw).toEqual(
        "786463333238333762323161626438396561343133616333646132303563343531663235346233363162623438353134"
      );
    }
  });
});
