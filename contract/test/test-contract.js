// @ts-nocheck
import '@agoric/babel-standalone';

import { test } from '@agoric/zoe/tools/prepare-test-env-ava.js';
import path from 'path';

import { E } from '@endo/eventual-send';
import {
  makeNetworkProtocol,
  makeLoopbackProtocolHandler,
} from '@agoric/swingset-vat/src/vats/network/index.js';
import pegasusBundle from '@agoric/pegasus/bundles/bundle-pegasus.js';
import { Far } from '@endo/marshal';
import { makePromiseKit } from '@endo/promise-kit';
import { makeFakeVatAdmin } from '@agoric/zoe/tools/fakeVatAdmin.js';
import { makeZoeKit } from '@agoric/zoe';
import { makeBoard } from '@agoric/vats/src/lib-board.js';

import bundleSource from '@endo/bundle-source';

const filename = new URL(import.meta.url).pathname;
const dirname = path.dirname(filename);

const contractPath = `${dirname}/../src/contract.js`;

const protocol = makeNetworkProtocol(makeLoopbackProtocolHandler());

const { zoeService } = makeZoeKit(makeFakeVatAdmin().admin);
const board = makeBoard()

// install the pegasus bundle and start pegasus instance
const installationP = await E(zoeService).install(pegasusBundle);
const instanceP = await E(zoeService).startInstance(installationP);

// install the interaccounts bundle and start interaccounts instance
const icaBundle = await bundleSource(`../interaccounts/contract/src/contract.js`);
const installationIca = await E(zoeService).install(icaBundle);
const instanceIca = await E(zoeService).startInstance(installationIca);

// Create ports
const port1 = await protocol.bind('/loopback/foo/1');
const port2 = await protocol.bind('/loopback/foo/2');
const port3 = await protocol.bind('/loopback/foo/3');
const ports = [port1, port2, port3]

// setup connections
const controllerConnectionId = "connection-0"
const hostConnectionId = "connection-0"

const closed = makePromiseKit();

const testAgoricToEVM = async (t, axelar) => {
  t.is("test", "test")
};

const testEVMToAgoric = async (t, axelar) => {
  // Create a network protocol to be used for testing
  t.is("test", "test")
};

const testEVMToEVM = async (t, axelar) => {
  // Create a network protocol to be used for testing
  t.is("test", "test")
};

const testICATransfer = async (t, axelar) => {
  // Create a network protocol to be used for testing
  t.is("test", "test")
};

test('Axelar Contract', async (t) => {
  const mod = await import(contractPath);
  const { publicFacet } = await mod.start();
  const axelar = await E(publicFacet).setupAxelar({zoeService, instanceP, board, ports, instanceIca, controllerConnectionId, hostConnectionId})
  await testAgoricToEVM(t, axelar);
  await testEVMToAgoric(t, axelar);
  await testEVMToEVM(t, axelar);
  await testICATransfer(t, axelar);

  await closed.promise;
});
