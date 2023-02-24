// @ts-check
import { E } from '@endo/eventual-send';
import { Far } from '@endo/marshal';
import { makeScalarMapStore } from '@agoric/store';
import { toHex } from '@cosmjs/encoding/build/hex';
import { toAscii } from '@cosmjs/encoding/build/ascii';

/**
 * Creates an ics-20 channel with Axelar on connection created and then returns an object with a 
 * function to send GMP messages to remote EVM chains through Axelar
 *
 * @param {Port} port
 * @param {string} connectionId
 * @returns {Promise<AxelarResponse>}
 */
export const setupAxelar = async (
  port,
  connectionId,
) => {
  /** @type {MapStore<String,Object>} */
  let storeConnection = makeScalarMapStore("connection");

  /** @type {ConnectionHandler} */
  const connectionHandlerICA = Far('handler', {
    onOpen: async (c) => {
      console.log("Opened channel: ", c)
    },
    onReceive: async (c, p) => {
      console.log('Received packet: ', p);
      const ret = await '';
      return ret;
    }
  });

  const remoteEndpoint = `/ibc-hop/${connectionId}/ibc-port/transfer/ordered/ics20-1`;
  const c = await E(port).connect(remoteEndpoint, connectionHandlerICA);
  storeConnection.init("connection", c);

  return Far('axelar', {
    /**
     * Sends a GMP message to an EVM chain from Agoric.
     *
     * @param {string} denom
     * @param {string} amount
     * @param {string} sender
     * @param {string} receiver
     * @param {Metadata} metadata
     * @returns {Promise<string>}
     */
    sendGMP: async (denom, amount, sender, receiver, metadata) => {
      /** @type {Connection} */
      const connection = await storeConnection.get("connection");

      // escrow the tokens if provided

      const memo = toAscii(JSON.stringify(metadata));

      const ack = await E(connection).send(JSON.stringify({
        denom,
        amount,
        sender,
        receiver,
        memo: toHex(memo)
      }))

      return ack;
    }
  });
};
