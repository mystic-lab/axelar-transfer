/// @ts-nocheck
import '@agoric/babel-standalone';

import { test } from './prepare-test-env-ava.js';
import path from 'path';

import { E } from '@endo/eventual-send';
import {
  makeNetworkProtocol,
  makeLoopbackProtocolHandler,
} from '@agoric/swingset-vat/src/vats/network/index.js';
import { Far } from '@endo/marshal';
import { makeFakeVatAdmin } from '@agoric/zoe/tools/fakeVatAdmin.js';
import { makeZoeKit } from '@agoric/zoe';
import bundleSource from '@endo/bundle-source';
import { makeFakeMyAddressNameAdmin } from '../src/utils.js';
import { makeSubscription } from '@agoric/notifier';
import { makePromiseKit } from '@endo/promise-kit';

const filename = new URL(import.meta.url).pathname;
const dirname = path.dirname(filename);

const contractPath = `${dirname}/../src/contract.js`;

/**
 * @template T
 * @param {ERef<Subscription<T>>} sub
 * @returns {AsyncIterator<T, T>}
 */
const makeAsyncIteratorFromSubscription = async sub => {
  const ret = makeSubscription(await E(sub).getSharableSubscriptionInternals())[
    Symbol.asyncIterator
  ]();
  return ret
}

const setupAxelarContract = async () => {
  const { zoeService: zoe } = makeZoeKit(makeFakeVatAdmin().admin);
  const feePurse = await E(E(zoe).getFeeIssuer()).makeEmptyPurse();
  const myAddressNameAdmin = await makeFakeMyAddressNameAdmin();

  // setup connections
  const controllerConnectionId = 'connection-0';

  // get your agoric address
  const address = await E(myAddressNameAdmin).getMyAddress();

  return {
    zoe,
    feePurse,
    myAddressNameAdmin,
    address,
    controllerConnectionId,
  };
};

const testAxelar = async (t) => {
  const {
    zoe,
    feePurse,
  } = await setupAxelarContract();

  const bundle = await bundleSource(contractPath);
  const installation = await E(zoe).install(bundle);
  const instance = await E(zoe).startInstance(installation);

  // Create a network protocol to be used for testing
  const protocol = makeNetworkProtocol(makeLoopbackProtocolHandler());

  /**
   * @type {PromiseRecord<import('@agoric/ertp').DepositFacet>}
   */
  const { promise: localDepositFacet, resolve: resolveLocalDepositFacet } =
    makePromiseKit();
  // Setup pegasus
  const fakeBoard = Far('fakeBoard', {
    getValue(id) {
      if (id === 'agoric1234567') {
        return localDepositFacet;
      }
      throw Error(`unrecognized board id ${id}`);
    },
  });
  const fakeNamesByAddress = Far('fakeNamesByAddress', {
    lookup(...keys) {
      t.is(keys[0], 'agoric1234567', 'unrecognized fakeNamesByAddress');
      t.is(keys[1], 'depositFacet', 'lookup not for the depositFacet');
      t.is(keys.length, 2);
      return localDepositFacet;
    },
  });
  const contractBundle = await bundleSource(`${dirname}/../node_modules/@agoric/pegasus/src/pegasus.js`);
  const installationHandle = await E(zoe).install(contractBundle);
  const { publicFacet: publicAPI } = await E(zoe).startInstance(
    installationHandle,
    {},
    { board: fakeBoard, namesByAddress: fakeNamesByAddress },
  );
  /**
   * @type {import('@agoric/pegasus').Pegasus}
   */
  const pegasus = await publicAPI;

  const port = E(protocol).bind('/ibc-channel/chanabc/ibc-port/portdef');
  const portName = await E(port).getLocalAddress();

  /**
   * Pretend we're Axelar.
   *
   * @type {import('@agoric/swingset-vat/src/vats/network').Connection?}
   */
  let axelarConnection;
  await E(port).addListener(
    Far('acceptor', {
      async onAccept(_p, _localAddr, _remoteAddr) {
        return Far('handler', {
          async onOpen(c) {
            axelarConnection = c;
          },
          async onReceive(_c, packetBytes) {
            const packet = JSON.parse(packetBytes);
            console.log("Received packet on Axelar: ", packet);
            t.deepEqual(
              packet,
              {
                amount: '250000',
                denom: 'portdef/chanabc/axlUSDC',
                receiver: 'axelar1',
                sender: 'pegasus',
                memo: "7b2273656e646572223a2261676f72696331222c227061796c6f6164223a223078303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303032303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030313034643739323036653631366436353230363937333230346436663732363732653030303030303030303030303030303030303030303030303030303030303030222c2274797065223a312c2264657374436861696e223a22506f6c79676f6e222c226465737441646472657373223a22307862393444384132663543414539413934413844343336346241326434633737653837323139666639227d"
              },
              'expected transfer packet',
            );
            return JSON.stringify({ result: 'AQ==' });
          },
        });
      },
    }),
  );

  // Pretend we're Agoric.
  const { handler: chandler, subscription: connectionSubscription } = await E(
    pegasus,
  ).makePegasusConnectionKit();
  const connP = await E(port).connect(portName, chandler);

  // Get some local Axelar USDC.
  const sendPacket = {
    amount: '100000000000000000001',
    denom: 'axlUSDC',
    receiver: 'agoric1234567',
    sender: 'pegasus',
    memo: ""
  };
  t.assert(await connP);
  const sendAckDataP = E(axelarConnection).send(JSON.stringify(sendPacket));
  
  const connectionAit = makeAsyncIteratorFromSubscription(
    connectionSubscription,
  );
  const {
    value: {
      actions: pegConnActions,
      localAddr,
      remoteAddr,
      remoteDenomSubscription,
    },
  } = await E(connectionAit).next();
  // Check the connection metadata.
  t.is(localAddr, '/ibc-channel/chanabc/ibc-port/portdef/nonce/1', 'localAddr');
  t.is(
    remoteAddr,
    '/ibc-channel/chanabc/ibc-port/portdef/nonce/2',
    'remoteAddr',
  );

  const peg = await E(pegConnActions).pegRemote('Axelar', 'axlUSDC');
  const localBrand = await E(peg).getLocalBrand();
  const localIssuerP = await E(pegasus).getLocalIssuer(localBrand);
  const localPurseP = await E(localIssuerP).makeEmptyPurse();
  resolveLocalDepositFacet(E(localPurseP).getDepositFacet());

  const sendAckData = await sendAckDataP;
  const sendAck = JSON.parse(sendAckData);
  t.deepEqual(sendAck, { result: 'AQ==' }, 'Gaia sent the atoms');
  if (!sendAck.result) {
    console.log(sendAckData, sendAck.error);
  }
  /////////////////////////////////////////////////////////////////

  // run the setup axelar process to receive the Axelar action object
  const axelar = await E(instance.publicFacet).setupAxelar(
    pegasus,
  );

  let payload = "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000104d79206e616d65206973204d6f72672e00000000000000000000000000000000"

  /** @type {Metadata} */
  const metadata = {
    sender: "agoric1",
    payload,
    type: 1,
    destChain: "Polygon",
    destAddress: "0xb94D8A2f5CAE9A94A8D4364bA2d4c77e87219ff9"
  }

  const res = await E(axelar).sendGMP(
    zoe,
    localPurseP,
    peg,
    'axelar1',
    1000000n / 4n,
    metadata
  );

  t.assert(res == undefined)

  return res
};

test('Axelar Contract', async (t) => {
  await testAxelar(t);
});
