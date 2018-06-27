const STRINGS = Object.freeze({
    "NULL_ADDRESS" : "0x0000000000000000000000000000000000000000"
});

/**
 * Enums are not supported by the ABI, they are just supported by Solidity.
 * You have to do the mapping yourself for now, we might provide some help later.
 *
 * https://solidity.readthedocs.io/en/latest/frequently-asked-questions.html
 */
const AGENT_STATE = Object.freeze({
    "ENABLED" : 0,
    "DISABLED" : 1
});

const JOB_STATE = Object.freeze({
    "PENDING"   : 0,
    "FUNDED"    : 1,
    "COMPLETED" : 2
});

module.exports = {
    STRINGS, AGENT_STATE, JOB_STATE
};