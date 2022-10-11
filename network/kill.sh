#!/bin/bash

killall axelard
killall tofnd
killall hermes

rm -r ./network/data/axelar

# Kill tendermint
#kill $(lsof -t -i:26657)