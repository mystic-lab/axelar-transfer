// @ts-check
import '@agoric/zoe/exported.js';
import { Far } from '@endo/marshal';

/**
 * This is a contract to interact with Axelar and perform non-ibc token transfers
 * with Axelar supported chains using ICS-27 through the Interaccounts Contract.
 *
 * @type {ContractStartFn}
 */
const start = async (zcf) => {
  const creatorFacet = Far('creatorFacet', {
  });

  const publicFacet = Far('publicFacet', {
    // Creates the transfer channel with axelar
    createAxelarTransferChannel: () => issuer,
    // Creates a deposit address on Axelar and then sends the specified
    // ERTP assets to the deposit address to be sent to the chain 
    // specified.
    sendAxelarTransfer: () => sendAxelarTransfer
  });

  // Return the creatorFacet to the creator, so they can make
  // invitations for others to get payments of tokens. Publish the
  // publicFacet.
  return harden({ creatorFacet, publicFacet });
};

harden(start);
export { start };
