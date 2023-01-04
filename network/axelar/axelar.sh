#!/bin/bash

TOFND_RELEASE=v0.10.1

cd $HOME
yes | rm -r axelar-core
git clone https://github.com/schnetzlerjoe/axelar-core
cd axelar-core
git checkout upgrade-ibc3
make build
sudo mv ./bin/axelard /usr/local/bin

# install tofnd
wget https://github.com/axelarnetwork/tofnd/releases/download/$TOFND_RELEASE/tofnd-linux-amd64-$TOFND_RELEASE
mv tofnd-linux-amd64-$TOFND_RELEASE tofnd
chmod +x *
sudo mv ./tofnd /usr/local/bin/
