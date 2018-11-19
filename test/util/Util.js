const STRINGS = Object.freeze({
    "NULL_ADDRESS" : "0x0000000000000000000000000000000000000000",
    "REGISTRY_ERC165_ID"  : "0x256b3545"
});

/**
 * Enums are not supported by the ABI, they are just supported by Solidity.
 * You have to do the mapping yourself for now, we might provide some help later.
 *
 * https://solidity.readthedocs.io/en/latest/frequently-asked-questions.html
 */
const AGENT_STATE = Object.freeze({
    "ENABLED"  : 0,
    "DISABLED" : 1
});

const JOB_STATE = Object.freeze({
    "PENDING"   : 0,
    "FUNDED"    : 1,
    "COMPLETED" : 2
});

const TX_STATUS = Object.freeze({
    "FAILURE" : 0,
    "SUCCESS" : 1
});

const HELPERS = Object.freeze({
    signAddress : (address, account) => {
        let sig = web3.eth.sign(account, web3.fromUtf8(address)).slice(2);
        let r = `0x${sig.slice(0, 64)}`;
        let s = `0x${sig.slice(64, 128)}`;
        let v = web3.toDecimal(sig.slice(128, 130)) + 27;

        return [v, r, s];
    },
    /**
     * Trims character from the beginning and end of string. Useful for trimming \u0000 from smart contract fields.
     */
    trimByChar : (string, character) => {
        const first = [...string].findIndex(char => char !== character);
        const last = [...string].reverse().findIndex(char => char !== character);
        return string.substring(first, string.length - last);
    },
    /**
     * Convert bytes retrieved from the EVM to a usable/printable javascript string.
     */
    bytesToString : (string) => HELPERS.trimByChar(web3.toAscii(string), '\0'),
    /**
     * Convert an address retrieved from the EVM to a usable/printable javascript string.
     */
    addressToString : (address) => HELPERS.trimByChar(address, '\0'),
    /**
     * Returns an array like [start, start + 1, ..., end]
     */
    intRange : (start, end) => {
        return [...Array(end-start).keys()] // generates array [0, 1, ..., (end-start)
                .map(e => start + e);       // converts array to [start, start + 1, ..., end]
    },
    /**
     * Compares that the arrays given are 'equal' in length and elements according to the assertEqualFn function.
     */
    assertArraysEqual : (assertEqualFn, arrayExpected, arrayActual, message) => {
        assertEqualFn(arrayExpected.length, arrayActual.length, message + ": Array length mismatch.");

        const arrayExpectedSorted = arrayExpected.sort();
        const arrayActualSorted   = arrayActual.sort();

        // console.log("Expected ", arrayExpectedSorted);
        // console.log("Actual ", arrayActualSorted);

        for (let i = 0; i < arrayExpectedSorted.length; i++) {
            assertEqualFn(arrayExpectedSorted[i], arrayActualSorted[i], message + `: sorted arrays differ at element ${i}`);
        }
    },
    /**
     * Takes a truffle contract object and returns an array of all function selectors
     *
     * e.g.
     *
     * [
     *  'createOrganization(bytes32,address[])',
     *  'changeOrganizationOwner(bytes32,address)',
     *  ...
     * ]
     */
    generateSelectorArray : (contract) =>
        contract.abi
            .filter(x => x.type === 'function') // filter only functions
            .map(x => `${x.name}(${x.inputs.map(y=>y.type).join(',')})`), // map to $name($paramType1,$paramType2...)

    /**
     * Generates an erc165 compatible interface id from an array of method signatures.
     * Adapted from openzeppelin-solidity which we cannot import due to ES6 module issues
     *   https://github.com/ldub/openzeppelin-solidity/blob/master/test/helpers/makeInterfaceId.js
     */
    generateInterfaceId : (methodSignatures = []) =>
        "0x" + methodSignatures
            .map(methodSignature => web3.sha3(methodSignature)) // keccak256
            .map(h => Buffer
                .from(h.substring(2), 'hex')
                .slice(0, 4) // bytes4()
            )
            .reduce((memo, bytes) => {
                for (let i = 0; i < 4; i++) {
                    memo[i] = memo[i] ^ bytes[i]; // xor
                }
                return memo;
            }, Buffer.alloc(4))
            .toString('hex')
});

module.exports = {
    STRINGS, AGENT_STATE, JOB_STATE, TX_STATUS, HELPERS
};
