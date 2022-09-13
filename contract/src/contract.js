// @ts-check
import '@agoric/zoe/exported.js';
import { setupAxelar } from './axelar';
import '@agoric/vats/exported.js';
import '@agoric/swingset-vat/src/vats/network/types.js';
import '@agoric/zoe/exported.js';

/**
 * This is a contract to interact with Axelar and bridge tokens from Agoric to EVM's
 * with Axelar to any supported chains using ICS-27 through the Interaccounts Contract.
 *
 * @param {ZoeService} zoe
 * @param {object} agoricnames
 * @param {Board} board
 * @param {[Port]} ports
 * @param {string} icaInstallId
 * @param {string} controllerConnectionId
 * @param {string} hostConnectionId
 * 
 */
const start = async (zoe, agoricnames, board, ports, icaInstallId, controllerConnectionId, hostConnectionId) => {
  return {
    publicFacet: setupAxelar({zoe, agoricnames, board, ports, icaInstallId, controllerConnectionId, hostConnectionId}),
    creatorFacet: () => {},
  }
};

harden(start);
export { start };
