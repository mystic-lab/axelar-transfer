#!/bin/bash

BINARY=axelard
CHAIN_DIR=./network/data
CHAINID_1=axelar
GRPCPORT_1=7090
GRPCWEB_1=7091

echo "Starting Axelar in $CHAIN_DIR..."
echo "Creating log file at $CHAIN_DIR/$CHAINID_1.log"
$BINARY start --log_level trace --log_format json --home $CHAIN_DIR/$CHAINID_1 --pruning=nothing --grpc.address="0.0.0.0:$GRPCPORT_1" --grpc-web.address="0.0.0.0:$GRPCWEB_1" > $CHAIN_DIR/$CHAINID_1.log 2>&1 &