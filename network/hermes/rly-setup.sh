#!/bin/bash

# Send some BLD and RUN tokens to the rly account from the provision account
~/agoric-sdk/golang/cosmos/build/agd tx bank send provision agoric13c4scsfy4tjvm3gqrry9fwmz8w7xa2tuprkzdm 200000ubld --gas auto --home=_agstate/keys --keyring-backend test -y --chain-id agoriclocal
~/agoric-sdk/golang/cosmos/build/agd tx bank send provision agoric13c4scsfy4tjvm3gqrry9fwmz8w7xa2tuprkzdm 50000urun --gas auto --home=_agstate/keys --keyring-backend test -y --chain-id agoriclocal

~/agoric-sdk/golang/cosmos/build/agd tx bank send provision agoric13c4scsfy4tjvm3gqrry9fwmz8w7xa2tuprkzdm 1000000ubld --home ./_agstate/keys --keyring-backend test --chain-id agoriclocal -y