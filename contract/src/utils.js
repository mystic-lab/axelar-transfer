import { makeNameHubKit } from '@agoric/vats/src/nameHub.js';
import { Far } from '@endo/marshal';
import { E } from '@endo/eventual-send';
import { encodeBase64 } from '@endo/base64';
import { TxBody } from 'cosmjs-types/cosmos/tx/v1beta1/tx.js';
import { Any } from 'cosmjs-types/google/protobuf/any.js';

/**
 * Parses an IBC ICA connection version and responds with the ica controller
 * account address (in Bech32) on the host chain
 *
 * @param {Connection} connection
 * @returns {string}
 */
export const parseICAAddress = async (connection) => {
  const remote = await E(connection).getRemoteAddress();
  const version = remote.split('/')[6];
  const versionJSON = await JSON.parse(version);
  const addr = await versionJSON["address"]
  return addr;
};

export const makeFakeMyAddressNameAdmin = async () => {
  const { nameHub, nameAdmin: rawMyAddressNameAdmin } = makeNameHubKit();
  return Far('fakeMyAddressNameAdmin', {
    ...nameHub,
    ...rawMyAddressNameAdmin,
    getMyAddress() {
      return 'agoric1test1';
    },
  });
};

/**
* Create an interchain transaction from a msg - {type, value}
*
* @param {string} typeUrl
* @param {Uint8Array} value
* @returns {Promise<Any>}
*/
export const makeMsg = async (typeUrl, value) => {
  // Asserts/checks
  assert.typeof(typeUrl, 'string', X`typeUrl ${typeUrl} must be a string`);

  // Generate the msg.
  /** @type {Any} */
  const txmsg = Any.fromPartial({
    typeUrl,
    value,
  });
  
  return txmsg;
};

/**
 * Create an interchain transaction from a list of msg's
 *
 * @param {[{typeUrl: string, value: Uint8Array}]} msgs
 * @returns {Promise<Bytes>}
 */
 export const makeICS27ICAPacket = async (msgs) => {
  const body = TxBody.fromPartial({
    messages: Array.from(msgs),
  });

  const buf = TxBody.encode(body).finish();

  // Generate the ics27-1 packet.
  const ics27 = {
    type: 1,
    data: encodeBase64(buf),
    memo: '',
  };

  const packet = JSON.stringify(ics27);

  return packet;
};