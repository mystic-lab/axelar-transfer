// @ts-nocheck
import '@agoric/babel-standalone';

import { test } from './prepare-test-env-ava.js';
import path from 'path';

import { E } from '@endo/eventual-send';
import {
  makeNetworkProtocol,
  makeLoopbackProtocolHandler,
} from '@agoric/swingset-vat/src/vats/network/index.js';
import { Far } from '@endo/marshal';
import fakeVatAdmin from '@agoric/zoe/tools/fakeVatAdmin.js';
import { makeZoeKit } from '@agoric/zoe';
import bundleSource from '@endo/bundle-source';
import { Interface } from '../../node_modules/ethers/lib.esm/abi/index.js';
import { parseEther } from '../../node_modules/ethers/lib.esm/utils/index.js';
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
  /**
   * @type {PromiseRecord<import('@agoric/ertp').DepositFacet>}
   */
  const { promise: localDepositFacet, resolve: _resolveLocalDepositFacet } =
    makePromiseKit();
  const myAddressNameAdmin = Far('fakeNamesByAddress', {
    lookup(...keys) {
      t.is(keys[0], 'agoric1234567', 'unrecognized fakeNamesByAddress');
      t.is(keys[1], 'depositFacet', 'lookup not for the depositFacet');
      t.is(keys.length, 2);
      return localDepositFacet;
    },
  });

  const { zoeService: zoe } = makeZoeKit(fakeVatAdmin);

  // setup connections
  const controllerConnectionId = 'connection-0';

  const feePurse = await E(zoe).getFeeIssuer()

  return {
    zoe,
    feePurse,
    myAddressNameAdmin,
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
  const { promise: localDepositFacet, resolve: _resolveLocalDepositFacet } =
    makePromiseKit();
  // Setup pegasus
  const fakeBoard = Far('fakeBoard', {
    getValue(id) {
      if (id === '0x1234') {
        return localDepositFacet;
      }
      t.is(id, 'agoric1234567', 'tried bech32 first in board');
      throw Error(`unrecognized board id ${id}`);
    },
  });
  const fakeNamesByAddress = Far('fakeNamesByAddress', {
    lookup(...keys) {
      t.is(keys[0], '0x1234', 'unrecognized fakeNamesByAddress');
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
  E(port).addListener(
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
                amount: '100000000000000000001',
                denom: 'portdef/chanabc/axlUSDC',
                receiver: 'markaccount',
                sender: 'pegasus',
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
    sender: 'FIXME:sender',
    memo: ""
  };
  t.assert(connP);
  const sendAckDataP = E(axelarConnection).send(JSON.stringify(sendPacket));
  const sendAckData = await sendAckDataP;
  const sendAck = JSON.parse(sendAckData);
  t.deepEqual(sendAck, { result: 'AQ==' }, 'Gaia sent the atoms');
  if (!sendAck.result) {
    console.log(sendAckData, sendAck.error);
  }
  
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
  /////////////////////////////////////////////////////////////////

  // run the setup axelar process to receive the Axelar action object
  const axelar = await E(instance.publicFacet).setupAxelar(
    pegasus,
  );

  // construct abi payload
  let ABI = [
    "function transfer(address to, uint amount)"
  ];
  let iface = new Interface(ABI);
  let payload = iface.encodeFunctionData("transfer", [ "0x1234567890123456789012345678901234567890", parseEther("1.0") ])

  /** @type {Metadata} */
  const metadata = {
    sender: "agoric1",
    sourceChain: "Axelarnet",
    payload,
    type: 1,
    destChain: "Ethereum",
    destAddress: "0xb794f5ea0ba39494ce839613fffba74279579268"
  }

  const res = await E(axelar).sendGMP(
    zoe,
    feePurse,
    peg,
    'axelar1',
    1000000n / 4n,
    metadata
  );

  console.log(res);

  return
};

test('Axelar Contract', async (t) => {
  await testAxelar(t);
});
