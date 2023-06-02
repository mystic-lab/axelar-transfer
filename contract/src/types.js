// @ts-check

/**
/**
 *
 * @typedef {object} Axelar
 * @property {Instance} pegasus
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
