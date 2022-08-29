import { createHash } from 'crypto';

/**
 * Marshal an IBC denom via path and denom to a hashed ibc denom
 *
 * @param {String} channel
 * @param {String} denom
 * @returns {String}
 */
export const marshalDenomTrace = (channel, denom) => {
    return "ibc/" + createHash("sha256").update(`transfer/${channel}/${denom}`).digest("hex").toUpperCase()
}