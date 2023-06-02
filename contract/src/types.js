// @ts-check

/**
/**
 *
 * @typedef {object} Axelar
 * @property {Instance} pegasus
<<<<<<< HEAD
=======
 * @property {import("@agoric/vats").Board} board
 * @property {Array<Port>} ports
 * @property {Instance} interaccounts
 * @property {string} controllerConnectionId
 * @property {string} hostConnectionId
>>>>>>> 4be8b162adbdac7caa45fb938ef17a6d264c9f47
 */

/**
 *
 * @typedef {object} AxelarResponse
 * @property {Function} sendGMP
 */

/**
 *
 * @typedef {number} Type
 * @typedef {string} Memo
 * @typedef {string} MsgType
 * @typedef {Uint8Array} MsgValue
 */

/**
 * @typedef {object} Packet
 * @property {Type} type
 * @property {Data} data
 * @property {Memo} memo
 */

/**
 * @typedef {object} Msg
 * @property {MsgType} typeUrl
 * @property {MsgValue} value
 */

/**
 * @typedef {object} Metadata
 * @property {Uint8Array} payload
 * @property {Number} type
 * @property {string} destination_chain
 * @property {string} destination_address
 */
