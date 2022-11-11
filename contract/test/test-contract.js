// @ts-nocheck
import '@agoric/babel-standalone';

import { test } from '@agoric/zoe/tools/prepare-test-env-ava.js';
import path from 'path';

import { E } from '@endo/eventual-send';
import {
  makeNetworkProtocol,
  makeLoopbackProtocolHandler,
} from '@agoric/swingset-vat/src/vats/network/index.js';
import { Far } from '@endo/marshal';
import { makePromiseKit } from '@endo/promise-kit';
import { makeFakeVatAdmin } from '@agoric/zoe/tools/fakeVatAdmin.js';
import { makeZoeKit } from '@agoric/zoe';
import bundleSource from '@endo/bundle-source';
import { homedir } from 'os';
import { makeFakeMyAddressNameAdmin } from '../src/utils.js';

const filename = new URL(import.meta.url).pathname;
const dirname = path.dirname(filename);

const contractPath = `${dirname}/../src/contract.js`;

const setupAxelarContract = async () => {
  const { zoeService } = makeZoeKit(makeFakeVatAdmin().admin);
  const feePurse = E(zoeService).makeFeePurse();
  const zoe = E(zoeService).bindDefaultFeePurse(feePurse);
  const myAddressNameAdmin = makeFakeMyAddressNameAdmin();

  // install the interaccounts bundle and start interaccounts instance
  const icaBundle = await bundleSource(
    `${homedir()}/interaccounts/contract/src/contract.js`,
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

  // Lets create all the test values we will compare against
  const axelarnetRes =
    '{"result":"CmwKJS9heGVsYXIuYXhlbGFybmV0LnYxYmV0YTEuTGlua1JlcXVlc3QSQwpBYXhlbGFyMTBxMzM4eGhqdmxldTZxNTlsa242dzZlMm44bnprNmdscTBmNTRoZmxneG01emdyN2Qzd3F5eWdqczQ="}';

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
          t.is(1, json.type, 'expected 1');
          return axelarnetRes;
        },
      });
    },
  });
  await port.addListener(listener);

  // run the setup axelar process to receive the Axelar action object
  const axelar = await E(instance.publicFacet).setupAxelar(
    zoe,
    myAddressNameAdmin,
    port2,
    controllerConnectionId,
    hostConnectionId,
  );

  await E(axelar).bridgeToEVM(
    'Ethereum',
    '0x2b9b278Ed8754112ba6317EB277b46662B2bC365',
    'ubld',
  );

  await E(axelar).bridgeFromEVM('Ethereum', 'uaxl');

  await E(axelar).bridgeToEVMFromEVM(
    'Ethereum',
    'Avalanche',
    'avax1brulqthe045psg4r1wygzlx7yhc2e9h2n0hpjp',
    'weth',
  );

  await E(axelar).transferFromICAAccount('weth', '1', address);

  await port.removeListener(listener);

  closed.promise;
};

test('Axelar Contract', async (t) => {
  await testAxelar(t);
});
