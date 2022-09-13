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
  var myAddressNameAdmin = makeFakeMyAddressNameAdmin();

  // install the pegasus bundle and start pegasus instance
  const installationP = await E(zoe).install(pegasusBundle);
  await E(myAddressNameAdmin).default("pegasus", installationP)

  // install the interaccounts bundle and start interaccounts instance
  const icaBundle = await bundleSource(`../interaccounts/contract/src/contract.js`);
  const installationIca = await E(zoe).install(icaBundle);
  // set the lookup for ica interaccounts
  await E(myAddressNameAdmin).default("interaccounts", installationIca)

  // setup connections
  const controllerConnectionId = "connection-0"
  const hostConnectionId = "connection-0"

  // get your agoric address
  const address = await E(myAddressNameAdmin).getMyAddress()

  return {
    zoe,
    myAddressNameAdmin,
    address,
    controllerConnectionId,
    hostConnectionId
  }

}

const testAxelar = async (t, publicFacet) => {

  const {zoe, myAddressNameAdmin, address, controllerConnectionId, hostConnectionId} = await setupAxelarContract()

  // Create a network protocol to be used for testing
  const protocol = makeNetworkProtocol(makeLoopbackProtocolHandler());

  const closed = makePromiseKit();

  // Create first port that packet will be sent to
  const port = await protocol.bind('/loopback/foo');

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
          console.log("Received Packet on Port 1:", packet);
          t.is(`${packet}`, `${sendPacket}`, 'expected ping');
          return 'pingack';
        },
      });
    },
  });
  await port.addListener(listener);

  // run the setup axelar process to receive the Axelar action object
  const axelar = await E(publicFacet).setupAxelar(zoe, myAddressNameAdmin, address, port, controllerConnectionId, hostConnectionId)

  // Create and send packet to first port utilizing port 2
  const port2 = await protocol.bind('/loopback/bar');
  await port2.connect(
    port.getLocalAddress(),
    Far('opener', {
      async onOpen(c, localAddr, remoteAddr, _connectionHandler) {
        t.is(localAddr, '/loopback/bar/nonce/1');
        t.is(remoteAddr, '/loopback/foo/nonce/2');
        const pingack = await E(publicFacet).sendICAPacket(sendPacket, c);;
        t.is(pingack, 'pingack', 'expected pingack');
        closed.resolve();
      },
    }),
  );

  await closed.promise;

  await port.removeListener(listener);
  t.is("test", "test")
};

test('Axelar Contract', async (t) => {
  const mod = await import(contractPath);
  const { publicFacet } = await mod.start();
  await testAxelar(t, publicFacet);

  await closed.promise;
});
