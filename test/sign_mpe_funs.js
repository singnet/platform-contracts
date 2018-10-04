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


function signClaimMessage(fromAccount, contractAddress, channelId, nonce, amount, callback) 
{
    var message = composeClaimMessage(contractAddress, channelId, nonce, amount);
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


module.exports.waitSignedClaimMessage        = waitSignedClaimMessage;
module.exports.isValidSignatureClaim         = isValidSignatureClaim;

