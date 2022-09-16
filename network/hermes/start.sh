#!/bin/bash

# Load shell variables
. ./network/hermes/variables.sh

echo "Hermes Relayer Version Check......"
hermes version

# Start the hermes relayer in multi-paths mode
echo "Starting hermes relayer..."
hermes --config ./network/hermes/config.toml start >& hermes.log &
