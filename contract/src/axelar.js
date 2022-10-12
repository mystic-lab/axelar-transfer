// @ts-check
import { E } from '@endo/eventual-send';
import { Far } from '@endo/marshal';
import { LinkRequest } from '@axelar-network/axelarjs-types/axelar/axelarnet/v1beta1/tx.js';
import { LinkRequest as EVMLinkRequest } from '@axelar-network/axelarjs-types/axelar/evm/v1beta1/tx.js';
import { BaseAccount } from 'cosmjs-types/cosmos/auth/v1beta1/auth.js';
import { FungibleTokenPacketData } from 'cosmjs-types/ibc/applications/transfer/v2/packet.js';
import { parseICAAddress } from './utils.js';

/**
 * Sends a token from Agoric to an EVM chain supported by Axelar
 *
 * @param {object} ica
 * @param {Connection} connection
 * @param {string} destChain
 * @param {string} destAddress
 * @param {string} denom
 * @returns {Promise<string>}
 */
const sendFromAgoricToEVM = async (
  ica,
  connection,
  destChain,
  destAddress,
  denom,
) => {
  const myaddress = parseICAAddress(connection);

  const baseAcc = BaseAccount.fromJSON({
    address: myaddress,
  });
  const acc = BaseAccount.encode(baseAcc).finish();

  const tx = LinkRequest.fromPartial({
    sender: acc,
    recipientAddr: destAddress,
    recipientChain: destChain,
    asset: denom,
  });

  const txBytes = LinkRequest.encode(tx).finish();

  const msg = await E(ica.publicFacet).makeMsg({
    typeUrl: '/axelar.axelarnet.v1beta1.LinkRequest',
    value: harden(txBytes),
  });

  const packet = await E(ica.publicFacet).makeICAPacket([msg]);

  const resp = await connection.send(JSON.stringify(packet));

  return resp;
};

/**
 * Sends a token from an EVM chain supported by Axelar to Axelar. Once the transfer
 * is complete, to get the assets on Agoric, you must call transferFromDepositAddr
 *
 * @param {object} ica
 * @param {Connection} connection
 * @param {string} srcChain
 * @param {string} denom
 * @returns {Promise<string>}
 */
const sendToAgoricFromEVM = async (ica, connection, srcChain, denom) => {
  const myaddress = parseICAAddress(connection);

  const baseAcc = BaseAccount.fromJSON({
    address: myaddress,
  });
  const acc = BaseAccount.encode(baseAcc).finish();

  const tx = EVMLinkRequest.fromPartial(harden({
    sender: acc,
    chain: srcChain,
    recipientAddr: myaddress,
    recipientChain: 'Axelarnet',
    asset: denom,
  }));

  const txBytes = EVMLinkRequest.encode(tx).finish();

  const msg = await E(ica.publicFacet).makeMsg(harden({
    typeUrl: '/axelar.evm.v1beta1.LinkRequest',
    value: harden(txBytes),
  }));

  const packet = await E(ica.publicFacet).makeICAPacket([msg]);

  const resp = await connection.send(JSON.stringify(packet));

  return resp;
};

/**
 * Sends a token from an EVM chain supported by Axelar to Another EVM chain supported by Axelar.
 *
 * @param {object} ica
 * @param {Connection} connection
 * @param {string} srcChain
 * @param {string} destChain
 * @param {string} destAddress
 * @param {string} denom
 * @returns {Promise<string>}
 */
const sendToEVMFromEVM = async (
  ica,
  connection,
  srcChain,
  destChain,
  destAddress,
  denom,
) => {
  const myaddress = parseICAAddress(connection);

  const baseAcc = BaseAccount.fromJSON({
    address: myaddress,
  });
  const acc = BaseAccount.encode(baseAcc).finish();

  const tx = EVMLinkRequest.fromPartial(harden({
    sender: acc,
    chain: srcChain,
    recipientAddr: destAddress,
    recipientChain: destChain,
    asset: denom,
  }));

  const txBytes = EVMLinkRequest.encode(tx).finish();

  const msg = await E(ica.publicFacet).makeMsg({
    typeUrl: '/axelar.evm.v1beta1.LinkRequest',
    value: txBytes,
  });

  const packet = await E(ica.publicFacet).makeICAPacket([msg]);

  const resp = await connection.send(JSON.stringify(packet));

  return harden(resp);
};

/**
 * IBC transfer amount specified from the ICA controller account held on Axelar to the Agoric account
 * that calls the message.
 *
 * @param {object} ica
 * @param {Connection} connection
 * @param {string} denom
 * @param {string} amount
 * @param {string} agoricAddress
 * @returns {Promise<string>}
 */
const transferFromICAAccount = async (
  ica,
  connection,
  denom,
  amount,
  agoricAddress,
) => {
  const myaddress = parseICAAddress(connection);

  const tx = FungibleTokenPacketData.fromPartial({
    denom,
    amount,
    sender: myaddress,
    receiver: agoricAddress,
  });

  const txBytes = FungibleTokenPacketData.encode(tx).finish();

  const msg = await E(ica.publicFacet).makeMsg(harden({
    typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
    value: txBytes,
  }));

  const packet = await E(ica.publicFacet).makeICAPacket([msg]);

  const resp = await connection.send(JSON.stringify(packet));

  return harden(resp);
};

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

  const connectionICA = await E(instanceIca.publicFacet).createICAAccount(
    icaPort,
    connectionHandlerICA,
    controllerConnectionId,
    hostConnectionId,
  );

  return Far('axelar', {
    /**
     * Creates an Axelar deposit account for a cross chain transfer. Returns the deposit address.
     *
     * @param {string} destChain
     * @param {string} destAddress
     * @param {string} denom
     * @returns {Promise<string>}
     */
    async bridgeToEVM(destChain, destAddress, denom) {
      const ret = await sendFromAgoricToEVM(
        instanceIca,
        connectionICA,
        destChain,
        destAddress,
        denom,
      );
      return harden(ret);
    },
    /**
     * Create an Axelar deposit account for a cross chain transfer. Returns the deposit address.
     *
     * @param {string} srcChain
     * @param {string} denom
     * @returns {Promise<string>}
     */
    async bridgeFromEVM(srcChain, denom) {
      const ret = await sendToAgoricFromEVM(
        instanceIca,
        connectionICA,
        srcChain,
        denom
      );
      return harden(ret);
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
    async bridgeToEVMFromEVM(srcChain, destChain, destAddress, denom) {
      const ret = await sendToEVMFromEVM(
        instanceIca,
        connectionICA,
        srcChain,
        destChain,
        destAddress,
        denom,
      );
      return harden(ret);
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
    async transferFromICAAccount(denom, amount, agoricAddress) {
      const ret = await transferFromICAAccount(
        instanceIca,
        connectionICA,
        denom,
        amount,
        agoricAddress,
      );
      return harden(ret);
    },
  });
};
