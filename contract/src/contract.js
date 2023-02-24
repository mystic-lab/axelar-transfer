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
     * This is a contract to interact with Axelar and send messages and tokens from Agoric to EVM's with Axelar
     *
     * @param {Port} port
     * @param {string} connectionId
     */
    setupAxelar: async (
      port,
      connectionId,
    ) => {
      const ret = await setupAxelar(
        port,
        connectionId
      );
      return ret;
    },
  });

  return harden({ creatorFacet, publicFacet });
};

harden(start);
export { start };
