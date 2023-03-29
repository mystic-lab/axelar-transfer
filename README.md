# Axelar EVM Cross Chain Messaging Contract

This repo holds the Agoric smart contract for interacting with the Axelar cross-chain mesaging protocol within Agoric smart contracts allowing for cross-chain messaging across the dozens of EVM chains supported by Axelar.

## Getting Started
You will need to have Golang, NodeJS and Rust installed to get started.

## Installation & Setup
```bash
cd $HOME
git clone https://github.com/pitalco/axelar-transfer
cd axelar-transfer

# Install all required software. Agoric, Axelar, and Hermes Relayer
make install

# install all dependencies
agoric install

# Start a local Agoric chain. Wait for the chain to start spitting out blocks. Keep running and go to a new terminal.
agoric start local-chain --reset

# print out the repl address (do not clear this, keep this present)
agoric open --repl

# start the repl/ag-solo. Wait for the wallet to fully launch!!!! Keep running in terminal.
agoric start local-solo --reset

# Then start hermes relayer. Will log everything in hermes.log file
make start-rly
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
axelar = E(instance.publicFacet).setupAxelar(zoe, myAddressNameAdmin, port2, controllerConnectionId, hostConnectionId)

// create metadata (note you have to abi encode payload)
let payload = "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000104d79206e616d65206973204d6f72672e00000000000000000000000000000000"

/** @type {Metadata} */
const metadata = {
    sender: "agoric1",
    payload,
    type: 1,
    destChain: "Polygon",
    destAddress: "0xb94D8A2f5CAE9A94A8D4364bA2d4c77e87219ff9"
}

// Lets send a GMP message
await E(axelar).sendGMP(
    zoe,
    localPurseP,
    peg,
    'axelar1',
    1000000n / 4n,
    metadata
);
```

Axelar will now take the message and handle the rest running it on the desination chain (Polygon here)!