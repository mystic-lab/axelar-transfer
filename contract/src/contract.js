// @ts-check
import '@agoric/zoe/exported.js';
import { Far } from '@endo/marshal';
import { setupAxelar } from './axelar';

/**
 * This is a contract to interact with Axelar and perform non-ibc token transfers
 * with Axelar supported chains using ICS-27 through the Interaccounts Contract.
 *
 * @type {ContractStartFn}
 * 
 /**
 * @param {ZCF<{board: ERef<DepositFacet>, namesByAddress: ERef<NameHub>}>} zcf
 */
const start = async (zcf) => {
  zcf.makeInvitation()
  return {
    publicFacet: setupAxelar(zcf),
  }
};

harden(start);
export { start };
