// @ts-check
import '@agoric/zoe/exported.js';
import { setupAxelar } from './axelar.js';
import '@agoric/vats/exported.js';
import '@agoric/swingset-vat/src/vats/network/types.js';
import '@agoric/zoe/exported.js';
import { Far } from '@endo/marshal';

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
  const creatorFacet = Far('creatorFacet', {
    // The creator of the instance can be called by the creator
  });

  /** @type {Axelar} */
  const axelar = {zoe, pegasus, board, ports, interaccounts, controllerConnectionId, hostConnectionId}

  const publicFacet = Far('publicFacet', {
    // Public faucet for anyone to call
    setupAxelar: async (/** @type {Axelar} */ axelar) => setupAxelar(axelar),
  });
  
  return harden({ creatorFacet, publicFacet });
};

harden(start);
export { start };
