#!/bin/bash

BINARY=axelard
CHAIN_DIR=./network/data
CHAINID_1=axelar
VAL_MNEMONIC_1="clock post desk civil pottery foster expand merit dash seminar song memory figure uniform spice circle try happy obvious trash crime hybrid hood cushion"
DEMO_MNEMONIC_1="veteran try aware erosion drink dance decade comic dawn museum release episode original list ability owner size tuition surface ceiling depth seminar capable only"
RLY_MNEMONIC_1="record gift you once hip style during joke field prize dust unique length more pencil transfer quit train device arrive energy sort steak upset"
P2PPORT_1=16656
RPCPORT_1=16657
RESTPORT_1=1316
ROSETTA_1=8080
TOFND_RELEASE=v0.10.1

# delete tofnd info
echo "removing tofnd data"
rm -r $CHAIN_DIR/.tofnd
# import tofnd account
echo "importing tofnd mnemonic"
echo $VAL_MNEMONIC_1 | tofnd -m import --no-password -d $CHAIN_DIR/.tofnd

# Stop axelard if it is already running 
if pgrep -x axelard >/dev/null; then
    echo "Terminating axelard..."
    killall axelard
    killall tofnd
fi

echo "Removing previous data..."
rm -rf $CHAIN_DIR/$CHAINID_1 &> /dev/null

# Add directories for all chains, exit if an error occurs
if ! mkdir -p $CHAIN_DIR/$CHAINID_1 2>/dev/null; then
    echo "Failed to create chain folder. Aborting..."
    exit 1
fi

echo "Initializing $CHAINID_1..."
$BINARY init test --home $CHAIN_DIR/$CHAINID_1 --chain-id=$CHAINID_1

echo "Adding genesis accounts..."
echo $VAL_MNEMONIC_1 | $BINARY keys add val1 --home $CHAIN_DIR/$CHAINID_1 --recover --keyring-backend=test
echo $DEMO_MNEMONIC_1 | $BINARY keys add demowallet1  --home $CHAIN_DIR/$CHAINID_1 --recover --keyring-backend=test
echo $RLY_MNEMONIC_1 | $BINARY keys add rly --home $CHAIN_DIR/$CHAINID_1 --recover --keyring-backend=test 

$BINARY add-genesis-account $($BINARY keys show val1 --home $CHAIN_DIR/$CHAINID_1 --keyring-backend test -a) 100000000000uaxl  --home $CHAIN_DIR/$CHAINID_1
$BINARY add-genesis-account $($BINARY keys show demowallet1 --home $CHAIN_DIR/$CHAINID_1 --keyring-backend test -a) 100000000000uaxl  --home $CHAIN_DIR/$CHAINID_1
$BINARY add-genesis-account $($BINARY keys show rly --home $CHAIN_DIR/$CHAINID_1 --keyring-backend test -a) 100000000000uaxl  --home $CHAIN_DIR/$CHAINID_1

$BINARY gentx val1 7000000000uaxl --home $CHAIN_DIR/$CHAINID_1 --chain-id $CHAINID_1 --keyring-backend test
$BINARY collect-gentxs --home $CHAIN_DIR/$CHAINID_1


echo "Changing defaults and ports in app.toml and config.toml files..."
sed -i -e 's#"tcp://0.0.0.0:26656"#"tcp://0.0.0.0:'"$P2PPORT_1"'"#g' $CHAIN_DIR/$CHAINID_1/config/config.toml
sed -i -e 's#"tcp://127.0.0.1:26657"#"tcp://0.0.0.0:'"$RPCPORT_1"'"#g' $CHAIN_DIR/$CHAINID_1/config/config.toml
sed -i -e 's/timeout_commit = "5s"/timeout_commit = "1s"/g' $CHAIN_DIR/$CHAINID_1/config/config.toml
sed -i -e 's/timeout_propose = "3s"/timeout_propose = "1s"/g' $CHAIN_DIR/$CHAINID_1/config/config.toml
sed -i -e 's/index_all_keys = false/index_all_keys = true/g' $CHAIN_DIR/$CHAINID_1/config/config.toml
sed -i -e 's/enable = false/enable = true/g' $CHAIN_DIR/$CHAINID_1/config/app.toml
sed -i -e 's/swagger = false/swagger = true/g' $CHAIN_DIR/$CHAINID_1/config/app.toml
sed -i -e 's#"tcp://0.0.0.0:1317"#"tcp://0.0.0.0:'"$RESTPORT_1"'"#g' $CHAIN_DIR/$CHAINID_1/config/app.toml
sed -i -e 's#":8080"#":'"$ROSETTA_1"'"#g' $CHAIN_DIR/$CHAINID_1/config/app.toml
sed -i -e 's/\"allow_messages\":.*/\"allow_messages\": [\"\*\"]/g' $CHAIN_DIR/$CHAINID_1/config/genesis.json

# delete and move our config to data folder
rm ./network/data/axelar/config/config.toml
cp ./network/axelar/config.toml ./network/data/axelar/config

# add ethereum to genesis
contents="$(jq '.app_state.nexus.chain_states[1] |= . + {"chain": {"name": "Ethereum","supports_foreign_assets": true,"key_type": "KEY_TYPE_MULTISIG","module": "evm"},"maintainers": [],"activated": true,"assets": [{"denom": "eth","is_native_asset": true}],"maintainer_states": []}' $CHAIN_DIR/$CHAINID_1/config/genesis.json)"
echo -E "${contents}" > $CHAIN_DIR/$CHAINID_1/config/genesis.json
# add eth as asset for axelarnet
contents="$(jq '.app_state.nexus.chain_states[0].assets |= . + [{"denom": "eth", "is_native_asset": false}]' $CHAIN_DIR/$CHAINID_1/config/genesis.json)"
echo -E "${contents}" > $CHAIN_DIR/$CHAINID_1/config/genesis.json
contents="$(jq '.app_state.axelarnet.chains[0].assets |= . + [{"denom": "uaxl", "min_amount": "100000"}, {"denom": "eth", "min_amount": "100000"}]' $CHAIN_DIR/$CHAINID_1/config/genesis.json)"
echo -E "${contents}" > $CHAIN_DIR/$CHAINID_1/config/genesis.json
# add ethereum gateway contract byte address to genesis
contents="$(jq '.app_state.evm.chains[0].gateway.address |= [4,63,87,193,111,99,34,228,47,109,29,235,70,224,245,62,111,170,51,121]' $CHAIN_DIR/$CHAINID_1/config/genesis.json)"
echo -E "${contents}" > $CHAIN_DIR/$CHAINID_1/config/genesis.json
# change ethereum gateway status to STATUS_CONFIRMED
contents="$(jq '.app_state.evm.chains[0].gateway.status |= "STATUS_CONFIRMED"' $CHAIN_DIR/$CHAINID_1/config/genesis.json)"
echo -E "${contents}" > $CHAIN_DIR/$CHAINID_1/config/genesis.json

echo "Changing Genesis File"
# Change crisis fee denom to fake detf
contents="$(jq '.app_state.crisis.constant_fee.denom = "uaxl"' $CHAIN_DIR/$CHAINID_1/config/genesis.json)" && \
echo -E "${contents}" > $CHAIN_DIR/$CHAINID_1/config/genesis.json
# Change mint denom to fake detf
contents="$(jq '.app_state.mint.params.mint_denom = "uaxl"' $CHAIN_DIR/$CHAINID_1/config/genesis.json)" && \
echo -E "${contents}" > $CHAIN_DIR/$CHAINID_1/config/genesis.json
# Change staking denom to fake detf
contents="$(jq '.app_state.staking.params.bond_denom = "uaxl"' $CHAIN_DIR/$CHAINID_1/config/genesis.json)" && \
echo -E "${contents}" > $CHAIN_DIR/$CHAINID_1/config/genesis.json
# Change gov deposit denom to fake detf
contents="$(jq '.app_state.gov.deposit_params.min_deposit[0].denom = "uaxl"' $CHAIN_DIR/$CHAINID_1/config/genesis.json)" && \
echo -E "${contents}" > $CHAIN_DIR/$CHAINID_1/config/genesis.json
# Change nexus axelar chain to activated
contents="$(jq '.app_state.nexus.chain_states[0].activated = true' $CHAIN_DIR/$CHAINID_1/config/genesis.json)" && \
echo -E "${contents}" > $CHAIN_DIR/$CHAINID_1/config/genesis.json