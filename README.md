[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.png?v=101)](https://www.typescriptlang.org/)

## About

This is a light-weight js lib that aims to make chip signatures for the [PBT](http://pbt.io/) flow as seamless as possible.

The repo for the smart contracts can be found [here](https://github.com/chiru-labs/pbt).

## Getting started

```
yarn add pbt-chip-client
```

After installing, you can import the relevant chip manufacturer’s helpers. Currently, the only chip manufacturer supported in the repo is [Kongiscash](https://twitter.com/kongiscash) ([docs](https://docs.arx.org/)).

React example:

```tsx
import { getPublicKeysFromScan, getSignatureFromScan } from 'pbt-chip-client/kong';

const MyComponent = () => {
  const [keys, setKeys] = useState(null);

  return (
    <>
      <button
        onClick={() => {
          getPublicKeysFromScan().then((keys) => {
            setKeys(keys);
          });
        }}
      >
        Click Me To Initiate Scan
      </button>
      <button
        onClick={() => {
          getSignatureFromScan({
            chipPublicKey: keys.primaryPublicKeyRaw,
            address: '<user_eth_address>',
            hash: '<blockhash>',
          }).then((sig) => {
            setSig(sig);
          });
        }}
      >
        Click Me To Sign EOA+blockhash w/ Chip
      </button>
    </>
  );
}
```

## Documentation

This package exposes two functions for each chip manufacturer:

### `getPublicKeysFromScan`

This function takes in a single object as the argument with the following parameters:

| Parameter | Type | Description | Required |
| ------------- | ------------- | ------------- | ------------- |
| rpId | string | string representing the domain the scan is being called on. For example a workflow hosted on azuki.com would pass in `azuki.com`. Defaults to `URL.hostname` | No |

Return value

```ts
Promise<{
  primaryPublicKeyHash: string;
  primaryPublicKeyRaw: string;
  secondaryPublicKeyHash: string;
  secondaryPublicKeyRaw: string;
  tertiaryPublicKeyHash: string;
  tertiaryPublicKeyRaw: string;
} | undefined>
```


### `getSignatureFromScan`

This function takes in a single object as the argument with the following parameters:

| Parameter | Type | Description | Required |
| ------------- | ------------- | ------------- | ------------- |
| rpId | string | string representing the domain the scan is being called on. For example a workflow hosted on azuki.com would pass in `azuki.com`. Defaults to `URL.hostname` | No |
| chipPublicKey | string | the public key for the chip. See `getPublicKeysFromScan` for how to grab | yes |
| address | string | the address for the wallet that will be minting the PBT | yes |
| hash | string | a recent blockhash. The PBT contract should be verifying that the blockhash signed is from a recent time window | yes |

Return value

```ts
Promise<string | undefined>
```

### `parseKeys`

This function takes a single positional argument:

| Parameter | Type | Description | Required |
| ------------- | ------------- | ------------- | ------------- |
| payload | string | A hex representation of the signature read from scan  | Yes |

Return value

```ts
{
  primaryPublicKeyHash: string;
  primaryPublicKeyRaw: string;
  secondaryPublicKeyHash: string;
  secondaryPublicKeyRaw: string;
  tertiaryPublicKeyHash: string;
  tertiaryPublicKeyRaw: string;
} | undefined
```

## Requirements

- The library must be hosted with secure transport (SSL), even in a development environment.

## Current known limitations

- Scanning only works on mobile devices (powered by [WebAuthn](https://webauthn.guide/)). This is supported on major browsers (Chrome, Safari, Firefox) but not yet on wallet browsers (like [Metamask browser](https://github.com/MetaMask/metamask-mobile/issues/4974)).
- A small handful of Android devices may have trouble completing the PBT scanning process. We are currently investigating a solution with using WebNFC for Android devices.
  - TODO: change implementation to use [libhalo](https://github.com/arx-research/libhalo) under the hood, as it has Android support

## Disclaimer

Chiru Labs is not liable for any outcomes as a result of using this repo.

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

Don't forget to give the project a star! Thanks again!

1. Fork the project
2. Create your feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a pull request

<!-- LICENSE -->

## License

Distributed under the MIT License.
