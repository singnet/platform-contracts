# SingularityNetwork
Includes contracts, migrations, tests, user interface and webpack build pipeline.

## Design Specifications

[Smart Contracts Design ](./docs/SNContractsDesignSpecs.md)


## Requirements

* [Node.js](https://github.com/nodejs/node) (7.6 +)
* [Npm](https://www.npmjs.com/package/npm)

## Install

### Truffle
```bash
npm i -g truffle
```

### Ethereum  
You can choose between Parity or local testrpc

### testRPC
```bash
npm install -g ethereumjs-testrpc
```

### Parity
  **Parity requires Rust version 1.19.0 to build**
  - Linux:
    ```bash
    $ curl https://sh.rustup.rs -sSf | sh
    ```

    Parity also requires `gcc`, `g++`, `libssl-dev`/`openssl`, `libudev-dev` and `pkg-config` packages to be installed.
  - OSX:
    ```bash
    $ curl https://sh.rustup.rs -sSf | sh
    ```

  ##### Download and build Parity

  ```bash
  # download Parity code
  $ git clone https://github.com/paritytech/parity
  $ cd parity

  # build in release mode
  $ cargo build --release
  ```

  This will produce an executable in the `./target/release` subdirectory.
  Note: if cargo fails to parse manifest try:

  ```bash
  $ ~/.cargo/bin/cargo build --release
  ```

  #### Start Parity
  To start Parity manually, just run
  ```bash
  $ ./target/release/parity
  ```
  and Parity will begin syncing the Ethereum blockchain.

  ##### Hint
  Add parity to your command list:
  ```bash
    cp /target/release/parity /usr/local/bin 
  ```


## Build 
1.  First `cd dao && npm i`
2.  `truffle compile` and run on separated tab `parity` or `testrpc`
3.  `truffle migrate` to deploy the contracts onto your network of choice (default "development").
5. `truffle test`


## Usage

You can choose of using web3 with Python and Javascript

Python
----------

Install web3

`pip install web3`

Using Web3

To use the web3 library you will need to instantiate an instance of the
``Web3`` object.


    >>> from web3 import Web3, HTTPProvider, IPCProvider

    # Note that you should create only one RPCProvider per
    # process, as it recycles underlying TCP/IP network connections between
    # your process and Ethereum node
    >>> web3 = Web3(HTTPProvider('http://localhost:8545'))

    # or for an IPC based connection
    >>> web3 = Web3(IPCProvider())
    >>> web3.eth.blockNumber
    4000000


This ``web3`` instance will now allow you to interact with the Ethereum
blockchain.


Javascript 
----------

`npm i -s web3`

Create in /app folder an index.js file

Use the `web3` object directly from global namespace:

```js
console.log(web3); // {eth: .., shh: ...} // it's here!
```

Set a provider (HttpProvider)

```js
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}
```

Set a provider (HttpProvider using [HTTP Basic Authentication](https://en.wikipedia.org/wiki/Basic_access_authentication))

```js
web3.setProvider(new web3.providers.HttpProvider('http://host.url', 0, BasicAuthUsername, BasicAuthPassword));
```

There you go, now you can use it:

```js
var coinbase = web3.eth.coinbase;
var balance = web3.eth.getBalance(coinbase);
```

You can find more examples in [`example`](https://github.com/ethereum/web3.js/tree/master/example) directory.

