#!/bin/bash

killall axelard
killall tofnd

# Kill tendermint
kill $(lsof -t -i:26657)
# kill ag-solo
kill $(lsof -t -i:8000)
# kill hermes
kill $(lsof -t -i:3000)

kill $(lsof -t -i:7090)
kill $(lsof -t -i:7091)
kill $(lsof -t -i:1317)