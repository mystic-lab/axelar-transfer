// @ts-check
import '@agoric/zoe/exported.js';
import { setupAxelar } from './axelar.js';
import '@agoric/vats/exported.js';
import '@agoric/swingset-vat/src/vats/network/types.js';
import '@agoric/zoe/exported.js';

/**
 * This is a contract to interact with Axelar and bridge tokens from Agoric to EVM's
 * with Axelar to any supported chains using ICS-27 through the Interaccounts Contract.
 *
 * @param {ZoeService} zoe
 * @param {Instance} pegasus
 * @param {Board} board
 * @param {[Port]} ports
 * @param {Instance} interaccounts
 * @param {string} controllerConnectionId
 * @param {string} hostConnectionId
 * 
 */
const start = async (zoe, pegasus, board, ports, interaccounts, controllerConnectionId, hostConnectionId) => {
  return {
    publicFacet: setupAxelar({zoe, pegasus, board, ports, interaccounts, controllerConnectionId, hostConnectionId}),
    creatorFacet: () => {},
  }
};

harden(start);
export { start };
