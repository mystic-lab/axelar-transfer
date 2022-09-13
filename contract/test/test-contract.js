// @ts-nocheck
import '@agoric/babel-standalone';

import { test } from '@agoric/zoe/tools/prepare-test-env-ava.js';
import path from 'path';

import { E } from '@endo/eventual-send';
import pegasusBundle from '@agoric/pegasus/bundles/bundle-pegasus.js';
import {
  makeNetworkProtocol,
  makeLoopbackProtocolHandler,
} from '@agoric/swingset-vat/src/vats/network/index.js';
import { Far } from '@endo/marshal';
import { makePromiseKit } from '@endo/promise-kit';
import { makeZoeKit } from '@agoric/zoe';
import { makeBoard } from '@agoric/vats/src/lib-board.js';

const filename = new URL(import.meta.url).pathname;
const dirname = path.dirname(filename);

const contractPath = `${dirname}/../src/contract.js`;

const protocol = makeNetworkProtocol(makeLoopbackProtocolHandler());

const zoe = makeZoeKit()
const board = makeBoard()

// install the pegasus bundle and start pegasus instance
const installationP = await E(zoe.zoeService).install(pegasusBundle);
const instanceP = E(zoe.zoeService).startInstance(installationP);

// install the interaccounts bundle and start interaccounts instance
const installationIca = await E(zoe.zoeService).install(icaBundle);
const instanceIca = E(zoe.zoeService).startInstance(installationIca);

// Create ports
const port1 = await protocol.bind('/loopback/foo/1');
const port2 = await protocol.bind('/loopback/foo/2');
const port3 = await protocol.bind('/loopback/foo/3');
const ports = [port1, port2, port3]

const testAgoricToEVM = async (t, axelar) => {
  // Create a network protocol to be used for testing
  const protocol = makeNetworkProtocol(makeLoopbackProtocolHandler());
  const closed = makePromiseKit();
  t.is("test", "test")
};

const testEVMToAgoric = async (t, axelar) => {
  // Create a network protocol to be used for testing
  const protocol = makeNetworkProtocol(makeLoopbackProtocolHandler());
  const closed = makePromiseKit();
  t.is("test", "test")
};

const testEVMToEVM = async (t, axelar) => {
  // Create a network protocol to be used for testing
  const protocol = makeNetworkProtocol(makeLoopbackProtocolHandler());
  const closed = makePromiseKit();
  t.is("test", "test")
};

const testICATransfer = async (t, axelar) => {
  // Create a network protocol to be used for testing
  const protocol = makeNetworkProtocol(makeLoopbackProtocolHandler());
  const closed = makePromiseKit();
  t.is("test", "test")
};

test('Agoric -> EVM Bridge', async (t) => {
  const mod = await import(contractPath);
  const { publicFacet } = await mod.start();
  const axelar = await E(publicFacet).setupAxelar({zoe, instanceP, board, ports, instanceIca, controllerConnectionId, hostConnectionId})
  await testAgoricToEVM(t, axelar);
});

test('EVM -> Agoric Bridge', async (t) => {
  const mod = await import(contractPath);
  const { publicFacet } = await mod.start();
  const axelar = await E(publicFacet).setupAxelar({zoe, instanceP, board, ports, instanceIca, controllerConnectionId, hostConnectionId})
  await testEVMToAgoric(t, axelar);
});

test('EVM -> EVM Bridge', async (t) => {
  const mod = await import(contractPath);
  const { publicFacet } = await mod.start();
  const axelar = await E(publicFacet).setupAxelar({zoe, instanceP, board, ports, instanceIca, controllerConnectionId, hostConnectionId})
  await testEVMToEVM(t, axelar);
});

test('ICA IBC Transfer', async (t) => {
  const mod = await import(contractPath);
  const { publicFacet } = await mod.start();
  const axelar = await E(publicFacet).setupAxelar({zoe, instanceP, board, ports, instanceIca, controllerConnectionId, hostConnectionId})
  await testICATransfer(t, axelar);
});
