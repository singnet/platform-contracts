var ethereumjsabi  = require('ethereumjs-abi');
var ethereumjsutil = require('ethereumjs-util');


function sleep(ms) 
{
  return new Promise(resolve => setTimeout(resolve, ms));
}


function sign_message(from_account, message, callback) 
{
    web3.eth.sign(from_account, "0x" + message.toString("hex"), callback)
}


function compose_claim_message(contract_address, channel_id, nonce, amount)
{
    return ethereumjsabi.soliditySHA3(
        ["address",        "uint256",  "uint256", "uint256"],
        [contract_address, channel_id, nonce,      amount]);
}

function compose_open_channel_message(contract_address, recipient_address, value, expiration, replica_id, message_nonce)
{
   return ethereumjsabi.soliditySHA3(
        ["address",        "address",        "uint256", "uint256", "uint256", "uint256"],
        [contract_address, recipient_address, value,    expiration, replica_id, message_nonce]);

}


function sign_claim_message(from_account, contract_address, channel_id, nonce, amount, callback) 
{
    var message = compose_claim_message(contract_address, channel_id, nonce, amount);
    sign_message(from_account, message, callback);
}

function sign_open_channel_message(from_account, contract_address, recipient_address, value, expiration, replica_id, message_nonce, callback)
{
    var message = compose_open_channel_message(contract_address, recipient_address, value, expiration, replica_id, message_nonce);
    sign_message(from_account, message, callback);
}


// this mimics the prefixing behavior of the eth_sign JSON-RPC method.
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

function isValidSignature_claim(contract_address, channel_id, nonce, amount, signature, expectedSigner) {
    var message = prefixed(compose_claim_message(contract_address, channel_id, nonce, amount));
    var signer = recoverSigner(message, signature);
    return signer.toLowerCase() ==
        ethereumjsutil.stripHexPrefix(expectedSigner).toLowerCase();
}

function isValidSignature_open_channel(contract_address, recipient_address, value, expiration, replica_id, message_nonce, signature, expectedSigner) {
    var message = prefixed(compose_open_channel_message(contract_address, recipient_address, value, expiration, replica_id, message_nonce));
    var signer = recoverSigner(message, signature);
    return signer.toLowerCase() ==
        ethereumjsutil.stripHexPrefix(expectedSigner).toLowerCase();
}



async function wait_signed_claim_message(from_account, contract_address, channel_id, nonce, amount)
{
    let det_wait = true;
    let rez_sign;
    sign_claim_message(from_account, contract_address, channel_id, nonce, amount, function(err,sgn)
        {   
            det_wait = false;
            rez_sign = sgn
        });
    while(det_wait)
    {
        await sleep(1)
    }
    return rez_sign;
} 

async function wait_signed_open_channel_message(from_account, contract_address, recipient_address, value, expiration, replica_id, message_nonce)
{
    let det_wait = true;
    let rez_sign;
    sign_open_channel_message(from_account, contract_address, recipient_address, value, expiration, replica_id, message_nonce, function(err,sgn)
        {   
            det_wait = false;
            rez_sign = sgn
        });
    while(det_wait)
    {
        await sleep(1)
    }
    return rez_sign;
} 


module.exports.wait_signed_claim_message         = wait_signed_claim_message;
module.exports.wait_signed_open_channel_message  = wait_signed_open_channel_message;
module.exports.isValidSignature_claim            = isValidSignature_claim;
module.exports.isValidSignature_open_channel     = isValidSignature_open_channel;

