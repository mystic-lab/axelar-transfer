#!/bin/bash

rm agoric.log

echo "Staring agoric and logging to agoric.log"
~/bin/agoric start local-chain >& agoric.log &
