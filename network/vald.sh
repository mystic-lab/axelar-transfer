#!/bin/bash

BINARY=axelard
CHAIN_DIR=./network/data
CHAINID_1=axelar
GRPCPORT_1=7090
GRPCWEB_1=7091
RPCPORT_1=16657

$BINARY vald-start --node tcp://localhost:$RPCPORT_1 --log_level trace --log_format json --home $CHAIN_DIR/$CHAINID_1 --validator-addr $(axelard keys show val1 --home $CHAIN_DIR/$CHAINID_1 --keyring-backend test --bech val --output json | jq -r .address) --from val1 --keyring-backend test > $CHAIN_DIR/$CHAINID_1-vald.log 2>&1 &