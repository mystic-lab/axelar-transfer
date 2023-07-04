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

const payload = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,116,122,110,56,36,250,176,209,38,99,6,195,180,146,252,185,65,197,221,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,224,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,0,0,0,0,0,0,0,0,0,87,241,198,52,151,174,224,190,48,91,136,82,179,84,206,199,147,218,67,187,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,87,241,198,52,151,174,224,190,48,91,136,82,179,84,206,199,147,218,67,187,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,68,9,94,167,179,0,0,0,0,0,0,0,0,0,0,0,0,45,153,171,217,0,141,201,51,255,92,12,210,113,184,131,9,89,58,185,33,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,87,241,198,52,151,174,224,190,48,91,136,82,179,84,206,199,147,218,67,187,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,45,153,171,217,0,141,201,51,255,92,12,210,113,184,131,9,89,58,185,33,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,224,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,4,103,101,40,209,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,181,31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,146,42,183,194,207,210,112,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,0,0,0,0,0,0,0,0,0,0,0,0,116,122,110,56,36,250,176,209,38,99,6,195,180,146,252,185,65,197,221,147,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,136,109,229,72,165,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,87,241,198,52,151,174,224,190,48,91,136,82,179,84,206,199,147,218,67,187,0,0,0,0,0,0,0,0,0,0,0,0,208,10,224,132,3,185,187,185,18,75,179,5,192,144,88,227,44,57,164,140,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,87,241,198,52,151,174,224,190,48,91,136,82,179,84,206,199,147,218,67,187,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
const memo = {"payload":payload,"type":1,"destination_chain":"Polygon","destination_address":"0xb94D8A2f5CAE9A94A8D4364bA2d4c77e87219ff9"}

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
                sender: 'agoric1jmd7lwdyykrxm5h83nlhg74fctwnky04ufpqtc',
                memo: JSON.stringify(memo)
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
  
  /** @type {Metadata} */
  const metadata = {
    payload,
    type: 1,
    destination_chain: "Polygon",
    destination_address: "0xb94D8A2f5CAE9A94A8D4364bA2d4c77e87219ff9"
  }

  const res = await E(axelar).sendGMP(
    zoe,
    localPurseP,
    peg,
    'axelar1',
    'agoric1jmd7lwdyykrxm5h83nlhg74fctwnky04ufpqtc',
    1000000n / 4n,
    metadata
  );

  t.assert(res == undefined)

  return res
};

test('Axelar Contract', async (t) => {
  await testAxelar(t);
});
