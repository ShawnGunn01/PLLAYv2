/**
 * @typedef {Object} SetStartPayload
 * @property {string} setId - ID of the started set
 * @property {string} tournamentId - Tournament ID of the set
 * @property {string} matchId - Match ID of the set
 * @property {string} roundId - Round ID of the set (set results ID)
 * @property {string} globalMetadata - Metadata from game dashboard
 * @property {number} setEndTimeUnix - Set end time in unix timestamp
 * @property {Array<Array<Participant>>} participants - Array of team arrays
 */

/**
 * @typedef {Object} Participant
 * @property {string} playerId - PLLAY player ID
 * @property {string} ingamePlayerId - Registered in-game player ID
 * @property {string} username - User's PLLAY username
 * @property {string} firstName - User's first name
 * @property {string} lastName - User's last name
 * @property {string} avatar - User's avatar URL
 * @property {string} ingameMetadata - In-game metadata
 */

/**
 * @typedef {Object} SetEndPayload
 * @property {string} setId - ID of the finished set
 * @property {string} matchId - Match ID of the set
 */

/**
 * @typedef {Object} MatchPayload
 * @property {string} matchId - ID of the match
 */

module.exports = {}; // Types are for documentation only