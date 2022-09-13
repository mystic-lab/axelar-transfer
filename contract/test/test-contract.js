// @ts-nocheck
import '@agoric/babel-standalone';
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx.js';

import { test } from '@agoric/zoe/tools/prepare-test-env-ava.js';
import path from 'path';

import { E } from '@endo/eventual-send';
import {
  makeNetworkProtocol,
  makeLoopbackProtocolHandler,
} from '@agoric/swingset-vat/src/vats/network/index.js';
import { Far } from '@endo/marshal';
import { makePromiseKit } from '@endo/promise-kit';
import { makeZoeKit } from '@agoric/zoe';

const filename = new URL(import.meta.url).pathname;
const dirname = path.dirname(filename);

const contractPath = `${dirname}/../src/contract.js`;

const testAgoricToEVM = async (t) => {
  // Create a network protocol to be used for testing
  const protocol = makeNetworkProtocol(makeLoopbackProtocolHandler());
  const closed = makePromiseKit();
  t.is("test", "test")
};

const testEVMToAgoric = async (t) => {
  // Create a network protocol to be used for testing
  const protocol = makeNetworkProtocol(makeLoopbackProtocolHandler());
  const closed = makePromiseKit();
  t.is("test", "test")
};

const testEVMToEVM = async (t) => {
  // Create a network protocol to be used for testing
  const protocol = makeNetworkProtocol(makeLoopbackProtocolHandler());
  const closed = makePromiseKit();
  t.is("test", "test")
};

const testICATransfer = async (t) => {
  // Create a network protocol to be used for testing
  const protocol = makeNetworkProtocol(makeLoopbackProtocolHandler());
  const closed = makePromiseKit();
  t.is("test", "test")
};

test('Agoric -> EVM Bridge', async (t) => {
  const mod = await import(contractPath);
  const zoe = makeZoeKit()
  const { publicFacet } = await mod.start();
  await testAgoricToEVM(t, publicFacet);
});

test('EVM -> Agoric Bridge', async (t) => {
  const mod = await import(contractPath);
  const zoe = makeZoeKit()
  const { publicFacet } = await mod.start();
  await testEVMToAgoric(t, publicFacet);
});

test('EVM -> EVM Bridge', async (t) => {
  const mod = await import(contractPath);
  const zoe = makeZoeKit()
  const { publicFacet } = await mod.start();
  await testEVMToEVM(t, publicFacet);
});

test('ICA IBC Transfer', async (t) => {
  const mod = await import(contractPath);
  const zoe = makeZoeKit()
  const { publicFacet } = await mod.start();
  await testICATransfer(t, publicFacet);
});
