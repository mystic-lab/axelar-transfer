import { createHash } from 'crypto';
import { makeNameHubKit } from '@agoric/vats/src/nameHub.js';
import { Far } from '@endo/marshal';
import { E } from '@endo/eventual-send';

/**
 * Marshal an IBC denom via path and denom to a hashed ibc denom
 *
 * @param {String} channel
 * @param {String} denom
 * @returns {String}
 */
export const marshalDenomTrace = (channel, denom) => {
    return "ibc/" + createHash("sha256").update(`transfer/${channel}/${denom}`).digest("hex").toUpperCase()
}

/**
 * Parses an IBC ICA connection version and responds with the ica controller
 * account address (in Bech32) on the host chain
 *
 * @param {Connection} connection
 * @returns {String}
 */
 export const parseICAAddress = async (connection) => {
    const remote = await E(connection).getRemoteAddress()
    const version = remote.split("/")[6]
    const versionJSON = JSON.parse(version)
    return versionJSON.address
}

export const makeFakeMyAddressNameAdmin = async () => {
    const { nameHub, nameAdmin: rawMyAddressNameAdmin } = makeNameHubKit();
    return Far('fakeMyAddressNameAdmin', {
      ...nameHub,
      ...rawMyAddressNameAdmin,
      getMyAddress() {
        return 'agoric1test1';
      },
    });
  }