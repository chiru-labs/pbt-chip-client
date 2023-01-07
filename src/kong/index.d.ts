export declare const getSignatureFromScan: ({ rpId, chipPublicKey, address, hash, }: {
    chipPublicKey: string;
    address: string;
    hash: string;
    rpId: string;
}) => Promise<string>;
export declare const getPublicKeyFromScan: ({ rpId }: {
    rpId: string;
}) => Promise<{
    primaryPublicKeyHash: string;
    primaryPublicKeyRaw: string;
    secondaryPublicKeyHash: string;
    secondaryPublicKeyRaw: string;
    tertiaryPublicKeyHash: any;
    tertiaryPublicKeyRaw: any;
}>;
