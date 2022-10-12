// @ts-check
import '@agoric/zoe/exported.js';
import { Far } from '@endo/marshal';
import { setupAxelar } from './axelar.js';
import '@agoric/vats/exported.js';

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
     * @param {ZoeService} zoe
     * @param {NameAdmin} nameHub
     * @param {Port} port
     * @param {string} controllerConnectionId
     * @param {string} hostConnectionId
     */
    setupAxelar: async (
      zoe,
      nameHub,
      port,
      controllerConnectionId,
      hostConnectionId,
    ) => {
      const ret = await setupAxelar(
        zoe,
        nameHub,
        port,
        controllerConnectionId,
        hostConnectionId,
      );
      return ret;
    },
  });

  return harden({ creatorFacet, publicFacet });
};

harden(start);
export { start };
