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

const HELPERS = Object.freeze({
    signAddress : (address, account) => {
        let valueHex = "0x" + address.slice(2);
        let h = web3.sha3(valueHex, {encoding: "hex"});
        let sig = web3.eth.sign(account, h).slice(2);
        let r = `0x${sig.slice(0, 64)}`;
        let s = `0x${sig.slice(64, 128)}`;
        let v = web3.toDecimal(sig.slice(128, 130)) + 27;

        return [v, r, s];
    },
    hex2ascii : (hexx) => {
        const hex = hexx.toString();
        let str = '';
        for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        return str;
    },
    /**
     * Trims character from the beginning and end of string. Useful for trimming \u0000 from smart contract fields.
     */
    trimByChar : (string, character) => {
        const first = [...string].findIndex(char => char !== character);
        const last = [...string].reverse().findIndex(char => char !== character);
        return string.substring(first, string.length - last);
    }
});

module.exports = {
    STRINGS, AGENT_STATE, JOB_STATE, HELPERS
};