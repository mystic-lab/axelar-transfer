#!/bin/bash

BINARY=axelard
CHAIN_DIR=./network/data
CHAINID_1=axelar
GRPCPORT_1=7090
GRPCWEB_1=7091

tofnd -m existing --no-password -d $CHAIN_DIR/.tofnd > $CHAIN_DIR/$CHAINID_1-tofnd.log 2>&1 &