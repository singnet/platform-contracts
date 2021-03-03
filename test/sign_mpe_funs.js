var ethereumjsabi  = require('ethereumjs-abi');
var ethereumjsutil = require('ethereumjs-util');


function sleep(ms) 
{
  return new Promise(resolve => setTimeout(resolve, ms));
}


function signMessage(fromAccount, message, callback) 
{
    web3.eth.sign("0x" + message.toString("hex"),fromAccount,callback);
}


function composeClaimMessage(contractAddress, channelId, nonce, amount)
{
    var sigPrefix = "__MPE_claim_message";
    return ethereumjsabi.soliditySHA3(
        ["string", "address",        "uint256",  "uint256", "uint256"],
        [sigPrefix, contractAddress, channelId, nonce,      amount]);
}


function signClaimMessage(fromAccount, contractAddress, channelId, nonce, amount, callback) 
{
    var message = composeClaimMessage(contractAddress, channelId, nonce, amount);
    signMessage(fromAccount, message, callback);
}

function signOpenChannelMessage(fromAccount, contractAddress, sender, signer, recipient, groupId, value, expiration, messageNonce, callback)
{
    var sigPrefix = "__openChannelByThirdParty";
    var message = ethereumjsabi.soliditySHA3(
        ["string", "address", "address", "address", "address", "bytes32", "uint256", "uint256", "uint256"],
        [sigPrefix, contractAddress, sender, signer, recipient, groupId, value, expiration, messageNonce]);
    signMessage(fromAccount, message, callback);    
}


// this mimics the prefixing behavior of the ethSign JSON-RPC method.
function prefixed(hash) {
    return ethereumjsabi.soliditySHA3(
        ["string", "bytes32"],
        ["\x19Ethereum Signed Message:\n32", hash]
    );
}

function recoverSigner(message, signature) {
    var split = ethereumjsutil.fromRpcSig(signature);
    var publicKey = ethereumjsutil.ecrecover(message, split.v, split.r, split.s);

    var signer = ethereumjsutil.pubToAddress(publicKey).toString("hex");
    return signer;
}

function isValidSignatureClaim(contractAddress, channelId, nonce, amount, signature, expectedSigner) {
    var message = prefixed(composeClaimMessage(contractAddress, channelId, nonce, amount));
    var signer  = recoverSigner(message, signature);
    return signer.toLowerCase() ==
        ethereumjsutil.stripHexPrefix(expectedSigner).toLowerCase();
}

function getVRSFromSignature(signature) {
    signature = signature.substr(2); //remove 0x
    const r = '0x' + signature.slice(0, 64);
    const s = '0x' + signature.slice(64, 128);
    const v = '0x' + signature.slice(128, 130);    // Should be either 27 or 28
    const v_decimal =  web3.utils.toDecimal(v);
    const v_compute = (web3.utils.toDecimal(v) < 27 ) ? v_decimal + 27 : v_decimal ;

    return {
        v: v_compute,
        r: r,
        s: s
    };

}

async function waitSignedClaimMessage(fromAccount, contractAddress, channelId, nonce, amount)
{
    let detWait = true;
    let rezSign;
    signClaimMessage(fromAccount, contractAddress, channelId, nonce, amount, function(err,sgn)
        {   
            detWait = false;
            rezSign = sgn
        });
    while(detWait)
    {
        await sleep(1)
    }
    return rezSign;
} 

async function waitSignOpenChannelMessage(fromAccount, contractAddress, sender, signer, recipient, groupId, value, expiration, messageNonce, callback)
{
    let detWait = true;
    let rezSign;
    signOpenChannelMessage(fromAccount, contractAddress, sender, signer, recipient, groupId, value, expiration, messageNonce, function(err,sgn)
        {   
            detWait = false;
            rezSign = sgn
        });
    while(detWait)
    {
        await sleep(1)
    }
    return rezSign;
}


module.exports.waitSignedClaimMessage   = waitSignedClaimMessage;
module.exports.waitSignOpenChannelMessage = waitSignOpenChannelMessage;
module.exports.isValidSignatureClaim    = isValidSignatureClaim;
module.exports.getVRSFromSignature      = getVRSFromSignature; 
