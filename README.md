# Axelar Transfer Contract

This repo holds the Agoric smart contract for interacting with the Axelar cross-chain protocol through Agoric for cross-chain asset transfers.

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

# Start a local Agoric chain and local Axelar chain
make start

# Wait for the chains to start up by checking logs. When producing blocks run this IN A NEW TERMINAL to start axelar local evm mock chains.
cd ~/axelar-transfer/axelar-local-gmp-examples
npm run build
node scripts/createLocal

# then in the original terminal run this to start up the Axelar tofnd process
make start-tofnd

# Finally start the vald Axelar process
make start-vald

# Then start hermes relayer. Will log everything in hermes.log file
make start-rly
```

## Deploying the Interaccounts Contract

In a seperate terminal, run the following command to start the local-solo. You will have to keep this terminal up running the solo
```sh
# print out the repl address
agoric open --repl
# start the repl/ag-solo
agoric start local-solo 7000 --reset
```

Once the repl opens, lets deploy the dependency contract to Zoe so we can use it for out Axelar contract. Move back to an open terminal and run the following commands
```sh
cd ~
git clone https://github.com/pitalco/interaccounts
# Make sure you are in the base contract directory
cd interaccounts
cd ./contract

agoric deploy ./deploy.js
```

## Deploying the Axelar Contract

Now lets deploy the Axelar contract
```sh
# Make sure you are in the axelar contract directory
cd ~/axelar-transfer/contract

agoric deploy ./deploy.js
```

## Using the Axelar Contract Object