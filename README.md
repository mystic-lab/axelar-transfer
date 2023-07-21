# Axelar EVM Cross Chain Messaging Contract

This repo holds the Agoric smart contract for interacting with the Axelar cross-chain messaging protocol within Agoric smart contracts allowing for cross-chain messaging across the dozens of EVM chains supported by Axelar.

## Getting Started
You will need to have Docker, NodeJS, Agoric SDK and IBC Golang Relayer installed to get started.

NOTE: PLEASE USE https://github.com/schnetzlerjoe/agoric-sdk/tree/community-dev AGORIC SDK

## Installation & Setup
```bash
cd $HOME
git clone https://github.com/pitalco/axelar-transfer
cd axelar-transfer
# Install NPM packages
agoric install
```

## Network Configurations
This demo uses;
* [Axelar Devnet](https://github.com/axelarnetwork/evm-cosmos-gmp-sample/blob/main/native-integration/onboard-devnet.md)
* Agoric Local Chain
* Avalanche Fuji(C-Chain) Testnet
  * [Explorer](https://testnet.snowtrace.io/)

## Run Agoric Node and Solo
```bash
cd $HOME/agoric-sdk/packages/cosmic-swingset
make scenario2-setup
# Look for the bootstrap key mnemonic in the command output marked with **Important**. We need this for next commands
# Lets restore relayer keys
cd $HOME/axelar-transfer
rm -r $HOME/.relayer
cp -r ./network/.relayer $HOME/.relayer
rly keys restore agoriclocal agoric "<bootstrap key mnemonic from above>"
# Run the chain with economy
cd $HOME/agoric-sdk/packages/cosmic-swingset
make scenario2-run-chain-economy
# Run the client in ANOTHER terminal
cd $HOME/agoric-sdk/packages/cosmic-swingset
make scenario2-run-client
```

## Create An IBC Channel
```bash
# Once all chains are running create a transfer channel
rly transact link agoric-axelar --override --src-port transfer --dst-port pegasus
# You can check the channels using
rly query channels agoriclocal
rly query channels axelar
```

## Setup The GMP Agoric Chain
### Add `test` account to `axelard` keys
```bash
axelard keys add --recover test  --keyring-backend test
## Paste this mnemonic to the command line prompt: stove large toddler vital depth claw flat health lonely welcome link again fade avoid lake grain comic hat tiger wreck all frost sunny still
```

### Setup GMP
```bash
axelard tx axelarnet add-cosmos-based-chain Agoric agoric transfer/{channel-id from above} ubld --from test --keyring-backend test --node http://afc5d4a439e4a456bafe34c2d9cd955b-182827533.us-east-2.elb.amazonaws.com:26657 --gas auto --gas-adjustment 1.5 --gas-prices 0.05uwk --chain-id devnet-wk -y

axelard tx nexus activate-chain {chain-name} --from test --keyring-backend test --node tcp://afc5d4a439e4a456bafe34c2d9cd955b-182827533.us-east-2.elb.amazonaws.com:26657 --gas auto --gas-adjustment 1.5 --gas-prices 0.05uwk --chain-id devnet-wk -y

axelard tx axelarnet register-asset {chain-name} uausdc --from test --keyring-backend test --node tcp://afc5d4a439e4a456bafe34c2d9cd955b-182827533.us-east-2.elb.amazonaws.com:26657 --gas auto --gas-adjustment 1.5 --gas-prices 0.05uwk --chain-id devnet-wk -y
```

## Deploying the Axelar Contract

Now lets deploy the Axelar contract
```bash
# Make sure you are in the axelar contract directory
cd $HOME/axelar-transfer/contract

agoric deploy ./deploy.js
```

## Using the Axelar Contract Object

Run the following in the Agoric repl. The returned object is how we will interact with Axelar.
```javascript
// Get the installation for Axelar
installation = E(home.board).getValue(Installation_ID)

// Start the Axelar instance
instance = E(home.zoe).startInstance(installation)

// Peg USDC to IBC Channel
connections = E(home.pegasusConnections).entries()
peg = E(connections[0][1].actions).pegRemote('Axelar', 'uausdc');
E(home.scratch).set("peg-uausdc", peg)

// Lets initialize Axelar and get the Axelar facet
pegasus = E(home.agoricNames).lookup('instance', 'Pegasus')
pegPub = E(home.zoe).getPublicFacet(pegasus)
axelar = E(instance.publicFacet).setupAxelar(pegPub)

// create metadata (note you have to abi encode payload if needed)
/** @type {Metadata} */
const metadata = {
    "payload": null,
    "type": 3,
    "destination_chain": "avalanche",
    "destination_address": "0xb94D8A2f5CAE9A94A8D4364bA2d4c77e87219ff9"
}

// Get your Agoric address. Note this for the rly transact step below
E(home.myAddressNameAdmin).getMyAddress()
```

```bash
# Deploy the Purse in your ag-solo
agoric deploy ./src/deploy-peg.js

# Start the Relayer
rly start agoric-axelar

# Send USDC to Agoric
rly transact transfer axelar agoriclocal 1000000uausdc {agoric address from above} {channel-id from above} --path agoric-axelar
```

```javascript
// Get the USDC purse
localPurseP = E(home.wallet).getPurse("Axelar USDC")
// Lets send a GMP message
await E(axelar).sendGMP(
    home.zoe,
    localPurseP,
    peg,
    'axelar1dv4u5k73pzqrxlzujxg3qp8kvc3pje7jtdvu72npnt5zhq05ejcsn5qme5',
    'agoric1m26r7lnp422hftlspza6e8pkun3nvddacmu8ta',
    1000000n / 4n,
    metadata
);
```

### Send Token and Message
Use `Type: 2` to send a payload to run on remote chain and send token to remote chain.
```javascript
// create metadata (note you have to abi encode payload)
let payload = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,185,77,138,47,92,174,154,148,168,212,54,75,162,212,199,126,135,33,159,249]

/** @type {Metadata} */
const metadata = {
    payload,
    "type": 2,
    "destination_chain": "avalanche",
    "destination_address": "0xF4799D77Cc7280fd3Bd9186A7e86B0540243E32d"
}

// Lets send a GMP message
await E(axelar).sendGMP(
    home.zoe,
    localPurseP,
    peg,
    'axelar1dv4u5k73pzqrxlzujxg3qp8kvc3pje7jtdvu72npnt5zhq05ejcsn5qme5',
    'agoric1m26r7lnp422hftlspza6e8pkun3nvddacmu8ta',
    1000000n / 4n,
    metadata
);
```

Axelar will now take the message and handle the rest running it on the desination chain (Avalanche here)!

### Send Token Only
Use `Type: 3` to send only a token with no payload to run on remote chain.
```javascript
/** @type {Metadata} */
const metadata = {
    "payload": null,
    "type": 3,
    "destination_chain": "avalanche",
    "destination_address": "0xb94D8A2f5CAE9A94A8D4364bA2d4c77e87219ff9"
}

// Lets send a GMP message
await E(axelar).sendGMP(
    home.zoe,
    localPurseP,
    peg,
    'axelar1dv4u5k73pzqrxlzujxg3qp8kvc3pje7jtdvu72npnt5zhq05ejcsn5qme5',
    'agoric1m26r7lnp422hftlspza6e8pkun3nvddacmu8ta',
    1000000n / 4n,
    metadata
);
```

### Send Message Only
Use `Type: 1` to send only a message with payload with no token to send to remote chain.
```javascript
// create metadata (note you have to abi encode payload)
let payload = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,185,77,138,47,92,174,154,148,168,212,54,75,162,212,199,126,135,33,159,249]

/** @type {Metadata} */
const metadata = {
    payload,
    "type": 1,
    "destination_chain": "avalanche",
    "destination_address": "0xF4799D77Cc7280fd3Bd9186A7e86B0540243E32d"
}

// Lets send a GMP message
await E(axelar).sendGMP(
    home.zoe,
    localPurseP,
    peg,
    'axelar1dv4u5k73pzqrxlzujxg3qp8kvc3pje7jtdvu72npnt5zhq05ejcsn5qme5',
    'agoric1m26r7lnp422hftlspza6e8pkun3nvddacmu8ta',
    0n,
    metadata
);
```



### Supported EVM Chains
For supported EVM chains check [here.](https://github.com/axelarnetwork/evm-cosmos-gmp-sample/blob/main/native-integration/onboard-devnet.md#supported-chains)

## Notes
* As of `2023-07-21`, there's no auto-relayer service is supported by Axelar for Type-3 GMP transactions. So if you want
  to test this feature do not forget to implement your own relayer.
* For Type-1 and Type-2 GMP transactions, those include a `payload`, we've deployed our own forwarder contract to
  correctly encode the payload. The contract is an extended version of [Multisend Contract](https://github.com/axelarnetwork/evm-cosmos-gmp-sample/tree/main/native-integration/multi-send/solidity)
  where we hardcoded the forward address (`0xb94D8A2f5CAE9A94A8D4364bA2d4c77e87219ff9`) and deployed it to Avalanche Fuji Testnet.
  This is due to the experimental nature of GMP between Cosmos and EVM chains, in a stable version such a contract should not
  be necessary.