#!/bin/bash

killall axelard
killall tofnd
killall hermes

# Kill tendermint
#kill $(lsof -t -i:26657)