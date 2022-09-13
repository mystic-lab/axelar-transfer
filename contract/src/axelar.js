// @ts-check
import { E } from '@endo/eventual-send';
import { Far } from '@endo/marshal';
import makeWeakMap from '@agoric/store';
import { LinkRequest } from '@axelar-network/axelarjs-types/axelar/axelarnet/v1beta1/tx.js'
import { LinkRequest as EVMLinkRequest } from '@axelar-network/axelarjs-types/axelar/evm/v1beta1/tx.js'
import { parseICAAddress } from './utils.js';
import { BaseAccount } from 'cosmjs-types/cosmos/auth/v1beta1/auth.js'
import { FungibleTokenPacketData } from 'cosmjs-types/ibc/applications/transfer/v2/packet.js'

/**
 * Create ICS-20 (transfer) + ICS-27 (ICA) channel (which creates an ICA account) and then
 * returns an object with the Axelar contract functions that are to be called
 * to interact with Axelar through Agoric.
 * 
 * @param {Axelar} axelar
 * @returns {Promise<AxelarResponse>}
 */
 export const setupAxelar = async (axelar) => {

    // create a store for axelar
    const connections = makeWeakMap('axelar');

    const icaPort = axelar.ports[0]

    // Get pf from interaccounts instance
    const pf = E(axelar.zoe).getPublicFacet(axelar.interaccounts)
    connections.init("ica", pf)

    /** @type {ConnectionHandler} */
    const connectionHandlerICA = Far('handler', { 
      onOpen: async (...args) => { 
        console.log(...args) 
      }, 
      onReceive: async (c, p) => {
        console.log('received packet: ', p);
        const ret = await ""
        return ret
      }, 
      onClose: async (c) => { 
        console.log(`transfer connection opened ${c.getLocalAddress()}`) 
      } 
    });

    const connectionICA = await E(pf).createICAAccount(icaPort, connectionHandlerICA, axelar.controllerConnectionId, axelar.hostConnectionId)

    // set the connection object for ica
    connections.init("icaConnection", connectionICA)

    // set the transfer object to send ibc transfers
    const publicFacet = E(axelar.zoe).getPublicFacet(axelar.pegasus)
    connections.init("transfer", publicFacet)

    return Far('interaccounts', {
      /**
       * Creates an Axelar deposit account for a cross chain transfer. Returns the deposit address.
       *
       * @param {LegacyMap<string, object>} connections
       * @param {String} destChain
       * @param {String} destAddress
       * @param {String} denom
       * @returns {Promise<String>}
       */
      bridgeToEVM (connections, destChain, destAddress, denom) {
        return sendFromAgoricToEVM(connections, destChain, destAddress, denom)
      },
      /**
       * Create an Axelar deposit account for a cross chain transfer. Returns the deposit address.
       *
       * @param {LegacyMap<string, object>} connections
       * @param {String} srcChain
       * @param {String} denom
       * @returns {Promise<String>}
       */
      bridgeFromEVM (connections, srcChain, denom) {
        return sendToAgoricFromEVM(connections, srcChain, denom)
      },
      /**
       * Create an EVM deposit account for EVM to EVM bridging. Returns the deposit address.
       *
       * @param {LegacyMap<string, object>} connections
       * @param {String} srcChain
       * @param {String} destChain
       * @param {String} destAddress
       * @param {String} denom
       * @returns {Promise<String>}
       */
      bridgeToEVMFromEVM (connections, srcChain, destChain, destAddress, denom) {
        return sendToEVMFromEVM(connections, srcChain, destChain, destAddress, denom)
      },
      /**
       * IBC transfer amount specified from the ICA controller account held on Axelar to the Agoric account
       * that calls the message.
       *
       * @param {LegacyMap<string, object>} connections
       * @param {String} denom
       * @param {String} amount
       * @param {String} agoricAddress
       * @returns {Promise<String>}
       */
      transferFromICAAccount (connections, denom, amount, agoricAddress) {
        return transferFromICAAccount(connections, denom, amount, agoricAddress)
      }
    });
};

/**
 * Sends a token from Agoric to an EVM chain supported by Axelar
 *
 * @param {LegacyMap<string, object>} connections
 * @param {String} destChain
 * @param {String} destAddress
 * @param {String} denom
 * @returns {Promise<String>}
 */
const sendFromAgoricToEVM = async (connections, destChain, destAddress, denom) => {
    /**
     * Get the ica connection object and ica public facet from state
     *
     * @type {Connection}
     */
    const icaConnection = connections.get("icaConnection")
    const ica = connections.get("ica")
    const myaddress = parseICAAddress(icaConnection)

    const baseAcc = BaseAccount.fromJSON({
      address: myaddress
    })
    const acc = BaseAccount.encode(baseAcc).finish()

    const tx = LinkRequest.fromPartial({
      sender: acc,
      recipientAddr: destAddress,
      recipientChain: destChain,
      asset: denom,
    })

    const msg = await E(ica).makeMsg({type: "/axelar.axelarnet.v1beta1.LinkRequest", value: tx})

    const packet = await E(ica).makeICAPacket([msg]);
    
    const resp = await icaConnection.send(JSON.stringify(packet))

    return resp
}

/**
 * Sends a token from an EVM chain supported by Axelar to Axelar. Once the transfer
 * is complete, to get the assets on Agoric, you must call transferFromDepositAddr
 *
 * @param {LegacyMap<string, object>} connections
 * @param {String} srcChain
 * @param {String} denom
 * @returns {Promise<String>}
 */
const sendToAgoricFromEVM = async (connections, srcChain, denom) => {
    /**
     * Get the ica connection object and ica public facet from state
     *
     * @type {Connection}
     */
    const icaConnection = connections.get("icaConnection")
    const ica = connections.get("ica")
    const myaddress = parseICAAddress(icaConnection)

    const baseAcc = BaseAccount.fromJSON({
      address: myaddress
    })
    const acc = BaseAccount.encode(baseAcc).finish()

    const tx = EVMLinkRequest.fromPartial({
      sender: acc,
      chain: srcChain,
      recipientAddr: myaddress,
      recipientChain: "Axelarnet",
      asset: denom,
    })
  
    const msg = await E(ica).makeMsg({type: "/axelar.evm.v1beta1.LinkRequest", value: tx})

    const packet = await E(ica).makeICAPacket([msg]);
    
    const resp = await icaConnection.send(JSON.stringify(packet))

    return resp
}

/**
 * Sends a token from an EVM chain supported by Axelar to Another EVM chain supported by Axelar.
 *
 * @param {LegacyMap<string, object>} connections
 * @param {String} srcChain
 * @param {String} destChain
 * @param {String} destAddress
 * @param {String} denom
 * @returns {Promise<String>}
 */
 const sendToEVMFromEVM = async (connections, srcChain, destChain, destAddress, denom) => {
  /**
   * Get the ica connection object and ica public facet from state
   *
   * @type {Connection}
   */
  const icaConnection = connections.get("icaConnection")
  const ica = connections.get("ica")
  const myaddress = parseICAAddress(icaConnection)

  const baseAcc = BaseAccount.fromJSON({
    address: myaddress
  })
  const acc = BaseAccount.encode(baseAcc).finish()

  const tx = EVMLinkRequest.fromPartial({
    sender: acc,
    chain: srcChain,
    recipientAddr: destAddress,
    recipientChain: destChain,
    asset: denom,
  })

  const msg = await E(ica).makeMsg({type: "/axelar.evm.v1beta1.LinkRequest", value: tx})

  const packet = await E(ica).makeICAPacket([msg]);
  
  const resp = await icaConnection.send(JSON.stringify(packet))

  return resp
}

/**
 * IBC transfer amount specified from the ICA controller account held on Axelar to the Agoric account
 * that calls the message.
 *
 * @param {LegacyMap<string, object>} connections
 * @param {String} denom
 * @param {String} amount
 * @param {String} agoricAddress
 * @returns {Promise<String>}
 */
 const transferFromICAAccount = async (connections, denom, amount, agoricAddress) => {
  /**
   * Get the ica connection object and ica public facet from state
   *
   * @type {Connection}
   */
  const icaConnection = connections.get("icaConnection")
  const ica = connections.get("ica")
  const myaddress = parseICAAddress(icaConnection)

  const tx = FungibleTokenPacketData.fromPartial({
    denom: denom,
    amount: amount,
    sender: myaddress,
    receiver: agoricAddress,
  })

  const msg = await E(ica).makeMsg({type: "/ibc.applications.transfer.v1.MsgTransfer", value: tx})

  const packet = await E(ica).makeICAPacket([msg]);
  
  const resp = await icaConnection.send(JSON.stringify(packet))

  return resp
}
