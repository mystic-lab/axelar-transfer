// @ts-check
import { E } from '@endo/eventual-send';
import { Far } from '@endo/marshal';
import { LinkRequest } from '@axelar-network/axelarjs-types/axelar/axelarnet/v1beta1/tx.js';
import { LinkRequest as EVMLinkRequest } from '@axelar-network/axelarjs-types/axelar/evm/v1beta1/tx.js';
import { FungibleTokenPacketData } from 'cosmjs-types/ibc/applications/transfer/v2/packet.js';
import { parseICAAddress } from './utils.js';
import { encodeBase64 } from '@endo/base64';
import { fromBech32 } from '@cosmjs/encoding';

/**
 * Create ICS-27 (ICA) channel (which creates an ICA account) and then
 * returns an object with the Axelar contract functions that are to be called
 * to interact with Axelar through Agoric.
 *
 * @param {ZoeService} zoe
 * @param {NameAdmin} nameAdmin
 * @param {Port} port
 * @param {string} controllerConnectionId
 * @param {string} hostConnectionId
 * @returns {Promise<AxelarResponse>}
 */
export const setupAxelar = async (
  zoe,
  nameAdmin,
  port,
  controllerConnectionId,
  hostConnectionId,
) => {
  const nameHub = await E(nameAdmin).readonly();

  // grab the interaccount installation from name hub
  /** @type {Installation} */
  const interaccounts = await E(nameHub).lookup('interaccounts');
  const instanceIca = await E(zoe).startInstance(interaccounts);
  let ica = harden(instanceIca)

  const icaPort = port;

  /** @type {ConnectionHandler} */
  const connectionHandlerICA = Far('handler', {
    onOpen: async (...args) => {
      console.log('Connection opened: ', ...args);
    },
    onReceive: async (c, p) => {
      console.log('Received packet: ', p);
      const ret = await '';
      return ret;
    },
    onClose: async (c) => {
      console.log(`Connection closed: `, c);
    },
  });

  const connection = await E(ica.publicFacet).createICAAccount(
    icaPort,
    connectionHandlerICA,
    controllerConnectionId,
    hostConnectionId,
  );

  return Far('axelar', {
    /**
     * Gets the ICA remote address and returns it.
     *
     * @returns {Promise<string>}
     */
     getICAAddress: async () => {
      const myaddress = await parseICAAddress(connection);
    
      return myaddress;
     },
    /**
     * Creates an Axelar deposit account for a cross chain transfer. Returns the deposit address.
     *
     * @param {string} destChain
     * @param {string} destAddress
     * @param {string} denom
     * @returns {Promise<string>}
     */
     bridgeToEVM: async (destChain, destAddress, denom) => {
      let myaddress = await parseICAAddress(connection);
      // we set default sender address for testing purposes
      myaddress = myaddress == "" ? "axelar1tw556a6ag5e60wnpgkf970k9nzuugzem33tag2x06e3xlhwsvyzq236pur" : myaddress
      const acc = fromBech32(myaddress);
    
      const tx = LinkRequest.fromPartial({
        sender: acc.data,
        recipientAddr: destAddress,
        recipientChain: destChain,
        asset: denom,
      });
    
      const txBytes = LinkRequest.encode(tx).finish();

      const txBytesBase64 = encodeBase64(txBytes);

      console.log("txBytesBase64: ", txBytesBase64, "\n")
    
      const resp = await E(ica.publicFacet).sendICATxPacket(
        [
          {
            typeUrl: 'axelar.axelarnet.v1beta1.LinkRequest',
            data: txBytesBase64,
          }
        ],
        connection,
      );
    
      return resp;
     },
    /**
     * Create an Axelar deposit account for a cross chain transfer. Returns the deposit address.
     *
     * @param {string} srcChain
     * @param {string} denom
     * @returns {Promise<string>}
     */
     bridgeFromEVM: async (srcChain, denom) => {
      let myaddress = await parseICAAddress(connection);
      // we set default sender address for testing purposes
      myaddress = myaddress == "" ? "axelar1tw556a6ag5e60wnpgkf970k9nzuugzem33tag2x06e3xlhwsvyzq236pur" : myaddress
      const acc = fromBech32(myaddress);
    
      const tx = EVMLinkRequest.fromPartial({
        sender: acc.data,
        chain: srcChain,
        recipientAddr: myaddress,
        recipientChain: 'Axelarnet',
        asset: denom,
      });
    
      const txBytes = EVMLinkRequest.encode(tx).finish();

      const txBytesBase64 = encodeBase64(txBytes)

      console.log("txBytesBase64 Two: ", txBytesBase64, "\n")
    
      const resp = await E(ica.publicFacet).sendICATxPacket(
        [
          {
            typeUrl: 'axelar.evm.v1beta1.LinkRequest',
            data: txBytesBase64,
          }
        ],
        connection,
      );
    
      return resp;
     },
    /**
     * Create an EVM deposit account for EVM to EVM bridging. Returns the deposit address.
     *
     * @param {string} srcChain
     * @param {string} destChain
     * @param {string} destAddress
     * @param {string} denom
     * @returns {Promise<string>}
     */
     bridgeToEVMFromEVM: async (srcChain, destChain, destAddress, denom) => {
      let myaddress = await parseICAAddress(connection);
      // we set default sender address for testing purposes
      myaddress = myaddress == "" ? "axelar1txctskw7qy8cn2ph0hzyntq77vqd035el8nm383phj64wpdqp5cqutfg7u" : myaddress
      const acc = fromBech32(myaddress);
    
      const tx = EVMLinkRequest.fromPartial({
        sender: acc.data,
        chain: srcChain,
        recipientAddr: destAddress,
        recipientChain: destChain,
        asset: denom,
      });
    
      const txBytes = EVMLinkRequest.encode(tx).finish();

      const txBytesBase64 = encodeBase64(txBytes)
    
      const resp = await E(ica.publicFacet).sendICATxPacket(
        [
          {
            typeUrl: 'axelar.evm.v1beta1.LinkRequest',
            data: txBytesBase64,
          }
        ],
        connection,
      );
    
      return resp;
     },
    /**
     * IBC transfer amount specified from the ICA controller account held on Axelar to the Agoric account
     * that calls the message.
     *
     * @param {string} denom
     * @param {string} amount
     * @param {string} agoricAddress
     * @returns {Promise<string>}
     */
     transferFromICAAccount: async (denom, amount, agoricAddress) => {
      const myaddress = await parseICAAddress(connection);

      const tx = FungibleTokenPacketData.fromPartial({
        denom,
        amount,
        sender: myaddress,
        receiver: agoricAddress,
      });
    
      const txBytes = FungibleTokenPacketData.encode(tx).finish();

      const txBytesBase64 = encodeBase64(txBytes)
    
      const resp = await E(ica.publicFacet).sendICATxPacket(
        [
          {
            typeUrl: 'ibc.applications.transfer.v1.MsgTransfer',
            data: txBytesBase64,
          }
        ],
        connection,
      );
    
      return resp;
     },
  });
};
