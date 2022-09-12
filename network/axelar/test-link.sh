#!/bin/bash

BINARY=axelard
CHAIN_DIR=./network/data
CHAINID_1=axelar
VAL_MNEMONIC_1="clock post desk civil pottery foster expand merit dash seminar song memory figure uniform spice circle try happy obvious trash crime hybrid hood cushion"
DEMO_MNEMONIC_1="veteran try aware erosion drink dance decade comic dawn museum release episode original list ability owner size tuition surface ceiling depth seminar capable only"
RLY_MNEMONIC_1="record gift you once hip style during joke field prize dust unique length more pencil transfer quit train device arrive energy sort steak upset"
P2PPORT_1=16656
RPCPORT_1=16657
RESTPORT_1=1316
ROSETTA_1=8080
TOFND_RELEASE=v0.10.1

$BINARY tx evm link ethereum axelarnet axelar10h9stc5v6ntgeygf5xf945njqq5h32r54jk580 eth --node tcp://localhost:$RPCPORT_1 --home $CHAIN_DIR/$CHAINID_1 --from demowallet1 --keyring-backend test