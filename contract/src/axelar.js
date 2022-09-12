// @ts-check
import { E } from '@endo/eventual-send';
import { Far } from '@endo/marshal';

/**
 * Create ICS-20 (transfer) + ICS-27 (ICA) channel (which creates an ICA account) and then
 * returns a publicFacet object with the Axelar contract functions that are to be called
 * to interact with Axelar through Agoric.
 * 
 * @param {Axelar} axelar
 * @returns {Promise<AxelarResponse>}
 */
 export const setupAxelar = async (axelar) => {

    const transferPort = axelar.ports[0]
    const icaPort = axelar.ports[1]

    // Get installation from board
    const installation = await E(axelar.board).getValue(axelar.icaInstallId)

    // Start the instance from above
    const instance = await E(axelar.zoe).startInstance(installation)

    const versionICS20 = "ics20-1"

    /** @type {ConnectionHandler} */
    const connectionHandlerTransfer = Far('handler', { 
      "infoMessage": async (...args) => { 
        console.log(...args) 
      }, 
      "onReceive": async (c, p) => {
        console.log('received packet: ', p);
        const ret = await ""
        return ret
      }, 
      "onOpen": async (c) => { 
        console.log('opened') 
      } 
    });

    /** @type {ConnectionHandler} */
    const connectionHandlerICA = Far('handler', { 
      "infoMessage": async (...args) => { 
        console.log(...args) 
      }, 
      "onReceive": async (c, p) => { 
        console.log('received packet: ', p);
        const ret = await ""
        return ret
      }, 
      "onOpen": async (c) => { 
        console.log('opened') 
      } 
    });

    const connectionTransfer = await E(transferPort).connect(
      `/ibc-hop/${axelar.controllerConnectionId}/ibc-port/transfer/unordered/${versionICS20}`,
      connectionHandlerTransfer,
    );

    const connectionICA = await E(instance.publicFacet).createICAAccount(icaPort, connectionHandlerICA, axelar.controllerConnectionId, axelar.hostConnectionId)

    return {
      transferConnection: connectionTransfer, 
      icaConnection: connectionICA
    };
};

/**
 * Create an Axelar deposit account for a cross chain transfer. Returns the deposit address.
 *
 * @param {String} environment
 * @param {String} srcChain
 * @param {String} destChain
 * @param {String} destAddress
 * @param {String} denom
 * @returns {Promise<String>}
 */
 const createDepositAddress = async (environment, srcChain, destChain, destAddress, denom) => {
  return ""
};

/**
 * Sends a token from Agoric to an EVM chain supported by Axelar
 *
 * @param {String} environment
 * @param {String} srcChain
 * @param {String} destChain
 * @param {String} destAddress
 * @param {String} denom
 * @returns {Promise<String>}
 */
export const sendFromAgoricToEVM = async (environment, srcChain, destChain, destAddress, denom) => {
  return ""
}

/**
 * Sends a token from an EVM chain supported by Axelar to Axelar. Once the transfer
 * is complete, to get the assets on Agoric, you must call transferFromDepositAddr
 *
 * @param {String} environment
 * @param {String} srcChain
 * @param {String} destChain
 * @param {String} destAddress
 * @param {String} denom
 * @returns {Promise<String>}
 */
export const sendToAgoricFromEVM = async (environment, srcChain, destChain, destAddress, denom) => {
  return ""
}
