var ethereumjsabi  = require('ethereumjs-abi');
var ethereumjsutil = require('ethereumjs-util');


function sleep(ms) 
{
  return new Promise(resolve => setTimeout(resolve, ms));
}


function signMessage(fromAccount, message, callback) 
{
    web3.eth.sign(fromAccount, "0x" + message.toString("hex"), callback)
}


function composeClaimMessage(contractAddress, channelId, nonce, amount)
{
    return ethereumjsabi.soliditySHA3(
        ["address",        "uint256",  "uint256", "uint256"],
        [contractAddress, channelId, nonce,      amount]);
}

function composeOpenChannelMessage(contractAddress, recipientAddress, value, expiration, replicaId, messageNonce)
{
   return ethereumjsabi.soliditySHA3(
        ["address",        "address",        "uint256", "uint256", "uint256", "uint256"],
        [contractAddress, recipientAddress, value,    expiration, replicaId, messageNonce]);

}


function signClaimMessage(fromAccount, contractAddress, channelId, nonce, amount, callback) 
{
    var message = composeClaimMessage(contractAddress, channelId, nonce, amount);
    signMessage(fromAccount, message, callback);
}

function signOpenChannelMessage(fromAccount, contractAddress, recipientAddress, value, expiration, replicaId, messageNonce, callback)
{
    var message = composeOpenChannelMessage(contractAddress, recipientAddress, value, expiration, replicaId, messageNonce);
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

function isValidSignatureOpenChannel(contractAddress, recipientAddress, value, expiration, replicaId, messageNonce, signature, expectedSigner) {
    var message = prefixed(composeOpenChannelMessage(contractAddress, recipientAddress, value, expiration, replicaId, messageNonce));
    var signer  = recoverSigner(message, signature);
    return signer.toLowerCase() ==
        ethereumjsutil.stripHexPrefix(expectedSigner).toLowerCase();
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

async function waitSignedOpenChannelMessage(fromAccount, contractAddress, recipientAddress, value, expiration, replicaId, messageNonce)
{
    let detWait = true;
    let rezSign;
    signOpenChannelMessage(fromAccount, contractAddress, recipientAddress, value, expiration, replicaId, messageNonce, function(err,sgn)
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


module.exports.waitSignedClaimMessage        = waitSignedClaimMessage;
module.exports.waitSignedOpenChannelMessage  = waitSignedOpenChannelMessage;
module.exports.isValidSignatureClaim         = isValidSignatureClaim;
module.exports.isValidSignatureOpenChannel   = isValidSignatureOpenChannel;

