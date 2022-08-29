# Axelar Transfer Contract

This repo holds the Agoric smart contract for interacting with the Axelar cross-chain protocol through Agoric for cross-chain asset transfers.

Install the [prerequisite smart contract](https://github.com/pitalco/interaccounts). Then follow the following instructions.

## Getting Started
You will need to have Golang, NodeJS and Rust installed to get started.

## Installation

```sh
git clone https://github.com/pitalco/axelar-transfer

cd interaccounts

# Install all required software. Agoric, Axelar, and Hermes Relayer
make install

# Start a local Agoric chain
make start
```


Keep an eye in agoric.log file. Once Agoric starts up, initialize all the connections and the Hermes relayer
```sh
make init
```

Once the process above completes, start the Hermes Relayer to relay transactions across chains. hermes.log tracks all the logs for Hermes
```sh
make start-rly
```

## Deploying the Contract

In a seperate terminal, run the following command to start the local-solo. You will have to keep this terminal up running the solo
```sh
agoric start local-solo --reset
# once local-solo starts up, run
agoric open --repl
```

Once the repl opens, lets deploy the contract to Zoe so we can use it from our repl and our other contracts. Move back to an open terminal and run the following commands
```sh
# Make sure you are in the base contract directory
cd ~/axelar-transfer/contract

agoric deploy ./deploy.js
```