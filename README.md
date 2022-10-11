# Axelar Transfer Contract

This repo holds the Agoric smart contract for interacting with the Axelar cross-chain protocol through Agoric for cross-chain asset transfers and cross-chain messaging (once supported) for EVM chains supported by Axelar.

## Getting Started
You will need to have Golang, NodeJS and Rust installed to get started.

## Installation & Setup

```sh
git clone https://github.com/pitalco/axelar-transfer

cd axelar-transfer

# Install all required software. Agoric, Axelar, and Hermes Relayer
make install

# Initialize everything needed
make init

# Start a local Agoric chain. Wait for the chain to start spitting out blocks. Keep running and go to a new terminal.
agoric start local-chain --reset

# print out the repl address (do not clear this, keep this present)
agoric open --repl

# start the repl/ag-solo. Wait for the wallet to fully launch!!!! Keep running in terminal.
agoric start local-solo --reset

# In another terminal start a local Axelar chain. Will log to log file in Axelar directory
make start

# Wait for the chains to start up by checking logs. When producing blocks run this IN ANOTHER NEW TERMINAL to start axelar local evm mock chains. Keep running
cd ~/axelar-transfer/axelar-local-gmp-examples
npm run build
node scripts/createLocal

# then in a free terminal run this to start up the Axelar tofnd process
make start-tofnd

# Finally start the vald Axelar process
make start-vald

# Then start hermes relayer. Will log everything in hermes.log file
make start-rly
```

## Deploying the Interaccounts Contract

Lets deploy the dependency contract to Zoe so we can use it for our Axelar contract. Move back to an open terminal and run the following commands
```sh
# Make sure you are in the linked interaccounts base directory
cd ~/axelar-transfer/interaccounts/contract

agoric deploy ./deploy.js
```

Lets save the installation on our name board. In the repl, run:
```javascript
installation = E(home.board).getValue(Installation_ID)
E(home.myAddressNameAdmin).default("interaccounts", installation)
```

## Deploying the Axelar Contract

Now lets deploy the Axelar contract
```sh
# Make sure you are in the axelar contract directory
cd ~/axelar-transfer/contract

agoric deploy ./deploy.js
```

## Using the Axelar Contract Object

Run the following in the Agoric repl. The returned object is how we will interact with Axelar.
```javascript
// Get the installation for Axelar
installation = E(home.board).getValue(Installation_ID)

// Start the Axelar instance
instance = E(home.zoe).startInstance(installation)

// Lets initialize Axelar and get the Axelar facet
const axelar = E(instance.publicFacet).setupAxelar(zoe, myAddressNameAdmin, port2, controllerConnectionId, hostConnectionId)

// Lets create a deposit address on Axelar to bridge to Avalanche
E(axelar).bridgeToEVM("Avalanche", "avax1brulqthe045psg4r1wygzlx7yhc2e9h2n0hpjp", "ubld");
```

Send the assets to the deposit address on `Axelar` using the Pegasus contract, and let Axelar handle the rest!