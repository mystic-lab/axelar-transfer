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
import { makePromiseKit } from '@endo/promise-kit';
import { makeFakeVatAdmin } from '@agoric/zoe/tools/fakeVatAdmin.js';
import { makeZoeKit } from '@agoric/zoe';
import bundleSource from '@endo/bundle-source';
import { makeFakeMyAddressNameAdmin } from '../src/utils.js';
import { Interface } from '../../node_modules/ethers/lib.esm/abi/index.js';
import { parseEther } from '../../node_modules/ethers/lib.esm/utils/index.js';

const filename = new URL(import.meta.url).pathname;
const dirname = path.dirname(filename);

const contractPath = `${dirname}/../src/contract.js`;

const setupAxelarContract = async () => {
  const { zoeService } = makeZoeKit(makeFakeVatAdmin().admin);
  const feePurse = E(zoeService).makeFeePurse();
  const zoe = E(zoeService).bindDefaultFeePurse(feePurse);
  const myAddressNameAdmin = makeFakeMyAddressNameAdmin();

  // setup connections
  const controllerConnectionId = 'connection-0';

  // get your agoric address
  const address = await E(myAddressNameAdmin).getMyAddress();

  return {
    zoe,
    myAddressNameAdmin,
    address,
    controllerConnectionId,
  };
};

const testAxelar = async (t) => {
  const {
    zoe,
    controllerConnectionId,
  } = await setupAxelarContract();

  const bundle = await bundleSource(contractPath);
  const installation = await E(zoe).install(bundle);
  const instance = await E(zoe).startInstance(installation);

  // Create a network protocol to be used for testing
  const protocol = makeNetworkProtocol(makeLoopbackProtocolHandler());

  const closed = makePromiseKit();

  // Create first port that packet will be sent to
  const port = await protocol.bind(
    '/ibc-hop/connection-0/ibc-port/transfer/ordered/ics20-1',
  );
  // Create and send packet to first port utilizing port 2
  const port2 = await protocol.bind(
    '/ibc-hop/connection-1/ibc-port/transfer/ordered/ics20-1',
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
          const expected = {
            denom: 'axlUSDC',
            amount: '1000000',
            sender: 'agoric1',
            receiver: 'axelar1',
            memo: '7b2273656e646572223a2261676f72696331222c22736f75726365436861696e223a224178656c61726e6574222c227061796c6f6164223a22307861393035396362623030303030303030303030303030303030303030303030303132333435363738393031323334353637383930313233343536373839303132333435363738393030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030303030646530623662336137363430303030222c2274797065223a312c2264657374436861696e223a22457468657265756d222c226465737441646472657373223a22307862373934663565613062613339343934636538333936313366666662613734323739353739323638227d'
          }
          t.is(packet, JSON.stringify(expected))
        },
      });
    },
  });
  await port.addListener(listener);

  // run the setup axelar process to receive the Axelar action object
  const axelar = await E(instance.publicFacet).setupAxelar(
    port2,
    controllerConnectionId,
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

  await E(axelar).sendGMP(
    'axlUSDC',
    '1000000',
    'agoric1',
    'axelar1',
    metadata
  );

  await port.removeListener(listener);

  closed.promise;
};

test('Axelar Contract', async (t) => {
  await testAxelar(t);
});
