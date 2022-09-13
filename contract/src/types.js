// @ts-check

/**
/**
 *
 * @typedef {object} Axelar
 * @property {ZoeService} zoe
 * @property {object} agoricnames
 * @property {Board} board
 * @property {Array<Port>} ports
 * @property {string} icaInstallId
 * @property {string} controllerConnectionId
 * @property {string} hostConnectionId
 */

/**
 *
 * @typedef {object} AxelarResponse
 * @property {Function} bridgeToEVM
 * @property {Function} bridgeFromEVM
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