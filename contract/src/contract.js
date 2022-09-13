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
 * @type {ContractStartFn}
 */
const start = async () => {
  const creatorFacet = Far('creatorFacet', {
    // The creator of the instance can be called by the creator
  });

  const publicFacet = Far('publicFacet', {
    // Public faucet for anyone to call
    /**
     * This is a contract to interact with Axelar and bridge tokens from Agoric to EVM's
     * with Axelar to any supported chains using ICS-27 through the Interaccounts Contract.
     *
     */
    setupAxelar: async (/** @type {ZoeService} */ zoe, /** @type {NameAdmin} */ nameHub, /** @type {string} */ account, /** @type {Port} */ port, /** @type {string} */ controllerConnectionId, /** @type {string} */ hostConnectionId) => await setupAxelar(zoe, nameHub, account, port, controllerConnectionId, hostConnectionId),
  });
  
  return harden({ creatorFacet, publicFacet });
};

harden(start);
export { start };
