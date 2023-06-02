// @ts-check
import { E } from '@endo/eventual-send';
import { Far } from '@endo/marshal';
import { makeScalarMapStore } from '@agoric/store';

/**
 * Creates an ics-20 channel with Axelar on connection created and then returns an object with a 
 * function to send GMP messages to remote EVM chains through Axelar
 *
 * @param {Instance} pegasus Pegasus instance
 * @returns {Promise<AxelarResponse>}
 */
export const setupAxelar = async (
  pegasus,
) => {
  /** @type {MapStore<String,Object>} */
  let storeConnection = makeScalarMapStore("connection");

  // store the issuer for the axelar wrapped asset
  storeConnection.init("pegasus", pegasus);

  return Far('axelar', {
    /**
     * Sends a GMP message to an EVM chain from Agoric.
     *
     * @param {ZoeService} zoe
     * @param {Purse} purse
     * @param {Peg} peg
     * @param {string} receiver
     * @param {NatValue} amount
     * @param {Metadata} metadata
     * @returns {Promise<any>}
     */
    sendGMP: async (zoe, purse, peg, receiver, amount, metadata) => {
      /** @type {import('@agoric/pegasus').Pegasus} */
      const pegasus = await storeConnection.get("pegasus");

      const memo = JSON.stringify(metadata);

      const [invitation, brand] = await Promise.all([
        E(pegasus).makeInvitationToTransfer(peg, receiver, memo),
        E(peg).getLocalBrand()
      ]);

      const amt = harden({ brand, value: amount });
      const pmt = await E(purse).withdraw(amt);

      const seat = E(zoe).offer(
        invitation,
        harden({ give: { Transfer: amt } }),
        harden({ Transfer: pmt }),
      );

      const result = await E(seat).getOfferResult();
      console.log(result);

      return result
    }
  });
};
