// @ts-check
import { E } from '@endo/eventual-send';

/**
 * Create ICS-20 (transfer) + ICS-27 (ICA) channel (which creates an ICA account) and then
 * returns a publicFacet object with the Axelar contract functions that are to be called
 * to interact with Axelar through Agoric.
 * 
 * @param {String} zoe
 * @param {String} icaInstallId
 * @param {String} controllerConnectionId
 * @param {String} hostConnectionId
 * @returns {Promise<Connection>}
 */
 export const setupAxelar = async (zoe, icaInstallId, controllerConnectionId, hostConnectionId) => {

    const transferPort = ibcports[0]
    const icaPort = ibcports[1]

    // Get installation from board
    const installation = E(board).getValue(icaInstallId)

    // Start the instance from above
    const instance = E(zoe).startInstance(installation)

    const versionICS20 = "ics20-1"

    const connectionTransfer = await E(transferPort).connect(
      `/ibc-hop/${controllerConnectionId}/ibc-port/transfer/unordered/${versionICS20}`,
      connectionHandlerTransfer,
    );

    const connectionICA = await E(instance.publicFacet).createICAAccount(icaPort, connectionHandlerICA, controllerConnectionId, hostConnectionId)

    return connection;
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
export const sendFromAgoricToEVM = async () => {}

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
export const sendToAgoricFromEVM = async () => {}
