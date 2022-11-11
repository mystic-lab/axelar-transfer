// @ts-check
import { E } from '@endo/eventual-send';
import { Far } from '@endo/marshal';
import { LinkRequest, LinkResponse } from '@axelar-network/axelarjs-types/axelar/axelarnet/v1beta1/tx.js';
import { LinkRequest as EVMLinkRequest, LinkResponse as EVMLinkResponse } from '@axelar-network/axelarjs-types/axelar/evm/v1beta1/tx.js';
import { FungibleTokenPacketData } from 'cosmjs-types/ibc/applications/transfer/v2/packet.js';
import { parseICAAddress } from './utils.js';
import { encodeBase64, decodeBase64 } from '@endo/base64';
import { fromBech32 } from '@cosmjs/encoding/build/bech32';

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
      myaddress = myaddress == "" ? "axelar1q536k3gtvse8nt0q75g7r4tgr932f5uyazxlvfq4nfmujeyx777stqvpmn" : myaddress
      const acc = fromBech32(myaddress);
    
      const tx = LinkRequest.fromPartial({
        sender: acc.data,
        recipientAddr: destAddress,
        recipientChain: destChain,
        asset: denom,
      });
    
      const txBytes = LinkRequest.encode(tx).finish();

      const txBytesBase64 = encodeBase64(txBytes);
    
      const rawResp = await E(ica.publicFacet).sendICATxPacket(
        [
          {
            typeUrl: '/axelar.axelarnet.v1beta1.LinkRequest',
            data: txBytesBase64,
          }
        ],
        connection,
      );

      const resp = JSON.parse(rawResp)

      const bytes = decodeBase64(resp["result"])

      const axelarResponse = LinkResponse.decode(bytes)

      const depositAddress = axelarResponse.depositAddr.replace(/\s/g,'').split("%/axelar.axelarnet.v1beta1.LinkRequestCA")[1]
    
      return depositAddress
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
      myaddress = myaddress == "" ? "axelar1q536k3gtvse8nt0q75g7r4tgr932f5uyazxlvfq4nfmujeyx777stqvpmn" : myaddress
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
    
      const rawResp = await E(ica.publicFacet).sendICATxPacket(
        [
          {
            typeUrl: '/axelar.evm.v1beta1.LinkRequest',
            data: txBytesBase64,
          }
        ],
        connection,
      );

      const resp = JSON.parse(rawResp)

      const bytes = decodeBase64(resp["result"])

      const axelarResponse = LinkResponse.decode(bytes)

      const depositAddress = axelarResponse.depositAddr.replace(/\s/g,'').split("%/axelar.evm.v1beta1.LinkRequestCA")[1]
    
      return depositAddress
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
      myaddress = myaddress == "" ? "axelar1q536k3gtvse8nt0q75g7r4tgr932f5uyazxlvfq4nfmujeyx777stqvpmn" : myaddress
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
    
      const rawResp = await E(ica.publicFacet).sendICATxPacket(
        [
          {
            typeUrl: '/axelar.evm.v1beta1.LinkRequest',
            data: txBytesBase64,
          }
        ],
        connection,
      );
    
      const resp = JSON.parse(rawResp)

      const bytes = decodeBase64(resp["result"])

      const axelarResponse = LinkResponse.decode(bytes)

      const depositAddress = axelarResponse.depositAddr.replace(/\s/g,'').split("%/axelar.evm.v1beta1.LinkRequestCA")[1]
    
      return depositAddress
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
            typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
            data: txBytesBase64,
          }
        ],
        connection,
      );
    
      return resp;
     },
  });
};

