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
import bundleSource from '@endo/bundle-source';
import { makeFakeMyAddressNameAdmin } from '../src/utils.js';

const filename = new URL(import.meta.url).pathname;
const dirname = path.dirname(filename);

const contractPath = `${dirname}/../src/contract.js`;

const setupAxelarContract = async () => {
  const { zoeService } = makeZoeKit(makeFakeVatAdmin().admin);
  const feePurse = E(zoeService).makeFeePurse();
  const zoe = E(zoeService).bindDefaultFeePurse(feePurse);
  const myAddressNameAdmin = makeFakeMyAddressNameAdmin();

  // install the pegasus bundle and start pegasus instance
  const installationP = await E(zoe).install(pegasusBundle);
  await E(myAddressNameAdmin).default('pegasus', installationP);

  // install the interaccounts bundle and start interaccounts instance
  const icaBundle = await bundleSource(
    `../interaccounts/contract/src/contract.js`,
  );
  const installationIca = await E(zoe).install(icaBundle);
  // set the lookup for ica interaccounts
  await E(myAddressNameAdmin).default('interaccounts', installationIca);

  // setup connections
  const controllerConnectionId = 'connection-0';
  const hostConnectionId = 'connection-1';

  // get your agoric address
  const address = await E(myAddressNameAdmin).getMyAddress();

  return {
    zoe,
    myAddressNameAdmin,
    address,
    controllerConnectionId,
    hostConnectionId,
  };
};

const testAxelar = async (t) => {
  const {
    zoe,
    myAddressNameAdmin,
    address,
    controllerConnectionId,
    hostConnectionId,
  } = await setupAxelarContract();

  const bundle = await bundleSource(contractPath);
  const installation = await E(zoe).install(bundle);
  const instance = await E(zoe).startInstance(installation);

  // Create a network protocol to be used for testing
  const protocol = makeNetworkProtocol(makeLoopbackProtocolHandler());

  const closed = makePromiseKit();

  // Create first port that packet will be sent to
  const port = await protocol.bind(
    '/ibc-hop/connection-0/ibc-port/icahost/ordered',
  );
  // Create and send packet to first port utilizing port 2
  const port2 = await protocol.bind(
    '/ibc-hop/connection-1/ibc-port/icahost/ordered',
  );

  /**
   * Create the listener for the test port
   *
   * @type {import('../src/vats/network').ListenHandler}
   */
  const listener = Far('listener', {
    async onAccept(_p, _localAddr, _remoteAddr, _listenHandler) {
      return harden({
        async onReceive(c, packet, _connectionHandler) {
          // Check that recieved packet is the packet we created above
          const json = await JSON.parse(packet);
          console.log('Received Packet on Port 1:', json);
          return 'AQ==';
        },
      });
    },
  });
  await port.addListener(listener);

  // run the setup axelar process to receive the Axelar action object
  const axelar = await E(instance.publicFacet).setupAxelar(
    zoe,
    myAddressNameAdmin,
    address,
    port2,
    controllerConnectionId,
    hostConnectionId,
  );

  let pingack = await E(axelar).bridgeToEVM(
    'Avalanche',
    'avax1brulqthe045psg4r1wygzlx7yhc2e9h2n0hpjp',
    'ubld',
  );
  t.is(pingack, 'AQ==', 'expected success bytes');

  pingack = await E(axelar).bridgeFromEVM('Ethereum', 'axelar1234567', 'weth');
  t.is(pingack, 'AQ==', 'expected success bytes');

  pingack = await E(axelar).bridgeToEVMFromEVM(
    'Ethereum',
    'Avalanche',
    'avax1brulqthe045psg4r1wygzlx7yhc2e9h2n0hpjp',
    'weth',
  );
  t.is(pingack, 'AQ==', 'expected success bytes');

  pingack = await E(axelar).transferFromICAAccount('weth', '1', address);
  t.is(pingack, 'AQ==', 'expected success bytes');

  await port.removeListener(listener);
  t.is('test', 'test');

  closed.promise;
};

test('Axelar Contract', async (t) => {
  await testAxelar(t);
});
