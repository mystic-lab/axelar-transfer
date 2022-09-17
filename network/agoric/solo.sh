#!/bin/bash

echo "Staring agoric and logging to agoric-solo.log"
~/bin/agoric start local-solo 7000 --reset >& agoric-solo.log &