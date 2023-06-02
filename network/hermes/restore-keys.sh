#!/bin/bash
set -e

# Load shell variables
. ./network/hermes/variables.sh

### Sleep is needed otherwise the relayer crashes when trying to init
sleep 1s
### Restore Keys
hermes --config ./network/hermes/config.toml keys add --hd-path "m/44'/564'/0'/0/0" --chain agoriclocal --mnemonic-file ./network/hermes/mnemonic.txt --overwrite
sleep 5s

hermes --config ./network/hermes/config.toml keys add --chain axelar-testnet-lisbon-3 --mnemonic-file ./network/hermes/mnemonic.txt --overwrite
