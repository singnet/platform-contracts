"use strict";
var  MultiPartyEscrow = artifacts.require("./MultiPartyEscrow.sol");

let Contract = require("truffle-contract");
let TokenAbi = require("singularitynet-token-contracts/abi/SingularityNetToken.json");
let TokenNetworks = require("singularitynet-token-contracts/networks/SingularityNetToken.json");
let TokenBytecode = require("singularitynet-token-contracts/bytecode/SingularityNetToken.json");
let Token = Contract({contractName: "SingularityNetToken", abi: TokenAbi, networks: TokenNetworks, bytecode: TokenBytecode});
Token.setProvider(web3.currentProvider);

var ethereumjsabi  = require('ethereumjs-abi');
var ethereumjsutil = require('ethereumjs-util');
let sign_funs      = require('./sign_mpe_funs');

//console.log(sign_funs)

async function test_error_revert(prom)
{
    let rez_e = -1
    try { await prom }
    catch(e) {
        rez_e = e.message.indexOf('revert') 
    }
    assert(rez_e >= 0, "Must generate error and error message must contain revert");
}
  
contract('MultiPartyEscrow', function(accounts) {

    var escrow;
    var token_address;
    var token;
    let N1 = 42000
    let N2 = 420000
    let N3 = 42
     

    before(async () => 
        {
            escrow        = await MultiPartyEscrow.deployed();
            token_address = await escrow.token.call();
            token         = Token.at(token_address);
        });


    it ("Test Simple wallet 1", async function()
        { 
           //Deposit 42000 from accounts[0]
            await token.approve(escrow.address,N1, {from:accounts[0]});
            await escrow.deposit(N1, {from:accounts[0]});
            assert.equal((await escrow.balances.call(accounts[0])).toNumber(), N1)

            //Deposit 420000 from accounts[4] (frist we need transfert from a[0] to a[4])
            await token.transfer(accounts[4],  N2, {from:accounts[0]});
            await token.approve(escrow.address,N2, {from:accounts[4]}); 
            await escrow.deposit(N2, {from:accounts[4]});
            
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), N2)

            assert.equal((await token.balanceOf(escrow.address)).toNumber(), N1 + N2)
           
            //try to withdraw more than we have
            await test_error_revert(escrow.withdraw(N2 + 1, {from:accounts[4]}))
            
            escrow.withdraw(N3, {from:accounts[4]})
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), N2 - N3)
            assert.equal((await token.balanceOf(escrow.address)).toNumber(), N1 + N2 - N3)
            assert.equal((await token.balanceOf(accounts[4])).toNumber(), N3)
        }); 

        it ("Initial openning (first and second channel)", async function()
        {
            //first channel
            test_error_revert( escrow.open_channel(accounts[5], N1 + 1, web3.eth.getBlock(web3.eth.blockNumber).timestamp + 10000000, 0, {from:accounts[0]}))
            await escrow.open_channel(accounts[5], N1, web3.eth.getBlock(web3.eth.blockNumber).timestamp + 10000000, 0, {from:accounts[0]})
            assert.equal((await escrow.next_channel_id.call()).toNumber(), 1)

            //full balance doesn't change
            assert.equal((await token.balanceOf(escrow.address)).toNumber(), N1 + N2 - N3)
            assert.equal((await escrow.balances.call(accounts[0])).toNumber(), 0)
            //second channel
            await escrow.open_channel(accounts[6], N1 * 2, web3.eth.getBlock(web3.eth.blockNumber).timestamp + 10000000, 27, {from:accounts[4]})
            assert.equal((await escrow.next_channel_id.call()).toNumber(), 2)
            
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), N2 - N3 - N1 * 2)
            

        });
          
        it("Fail to Claim timeout ", async function()
        {
            await test_error_revert(escrow.channel_claim_timeout(0, {from:accounts[0]}))
            await test_error_revert(escrow.channel_claim_timeout(1, {from:accounts[4]}))
        });


       it ("closing transaction (first channel)", async function()
        {
            //sign message by the privet key of accounts[0]
            let sgn = await sign_funs.wait_signed_claim_message(accounts[0], escrow.address, 0, 0, N1 - 1000);
            await escrow.channel_claim(0, N1 - 1000, sgn.toString("hex"), true, {from:accounts[5]});
            assert.equal((await escrow.balances.call(accounts[5])).toNumber(), N1 - 1000)
            assert.equal((await escrow.balances.call(accounts[0])).toNumber(), 1000)
          //  let balance4 = await token.balanceOf.call(accounts[4]);
          //  assert.equal(balance4, 41000, "After closure balance of accounts[4] should be 41000");
       });
        it ("closing transaction (second channel), with partly closure", async function()
        {
            //first we claim, and put remaing funds in the new channel (with nonce 1)
            let sgn = await sign_funs.wait_signed_claim_message(accounts[4], escrow.address, 1, 0, N1);
            await escrow.channel_claim(1, N1, sgn.toString("hex"), false, {from:accounts[6]});
            assert.equal((await escrow.balances.call(accounts[6])).toNumber(), N1)
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), N2 - N3 - N1*2)

            //claim all funds and close channel
            //try to use old signutature (should fail)
            test_error_revert( escrow.channel_claim(1, N1, sgn.toString("hex"), false, {from:accounts[6]}))

            //make new signature with nonce 1
            let sgn2 = await sign_funs.wait_signed_claim_message(accounts[4], escrow.address, 1, 1, N1 - 1000);
            await escrow.channel_claim(1, N1 - 1000, sgn2.toString("hex"), true, {from:accounts[6]});
            assert.equal((await escrow.balances.call(accounts[6])).toNumber(), N1 * 2 - 1000)
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), N2 - N3 - N1*2 + 1000)

       });

     it ("Open the third channel from the server side", async function()
        {
            let expiration = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 10000000
            let value      = 1000
            let replica_id = 44
            let message_nonce = 666
            //open the channel from the server side
            let sgn = await sign_funs.wait_signed_open_channel_message(accounts[4], escrow.address, accounts[7], value, expiration, replica_id, message_nonce)          

            await escrow.open_channel_by_recipient(accounts[4], value, expiration, replica_id , message_nonce, sgn, {from:accounts[7]})
            //console.log(accounts)
            assert.equal((await escrow.next_channel_id.call()).toNumber(), 3)    
            
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), N2 - N3 - N1*2)
            

            //try replay attack. It MUST fail

            test_error_revert(escrow.open_channel_by_recipient(accounts[4], value, expiration, replica_id , message_nonce, sgn, {from:accounts[7]}))

        });

     it ("Extend and add funds to the third channel", async function()
         {
             let expiration = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 10000000 + 1;
             let add_value  = N1;

             //try extend from the wrong account
             test_error_revert( escrow.channel_extend_and_add_funds(2, expiration, 1, {from:accounts[0]}) )
             await escrow.channel_extend_and_add_funds(2, expiration, add_value, {from:accounts[4]})

             assert.equal((await escrow.balances.call(accounts[4])).toNumber(), N2 - N3 - N1*3)

         });
     it ("Close the third channel", async function()
        {
            //sign message by the privet key of accounts[0]
            let sgn = await sign_funs.wait_signed_claim_message(accounts[4], escrow.address, 2, 0, 1000 - 10);
            await escrow.channel_claim(2, 1000 - 10, sgn.toString("hex"), true, {from:accounts[7]});
            assert.equal((await escrow.balances.call(accounts[7])).toNumber(), 1000 - 10)
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), N2 - N3 - N1*2 + 10)
          //  let balance4 = await token.balanceOf.call(accounts[4]);
          //  assert.equal(balance4, 41000, "After closure balance of accounts[4] should be 41000");
       });
 
    it ("Check validity of the signatures with js-server part (claim)", async function()
        {
            //claim message
            let sgn = await sign_funs.wait_signed_claim_message(accounts[2], escrow.address, 1789, 1917, 31415);  
            assert.equal(sign_funs.isValidSignature_claim(escrow.address, 1789, 1917, 31415, sgn, accounts[2]), true,   "signature should be ok")
            assert.equal(sign_funs.isValidSignature_claim(escrow.address, 1789, 1917, 31415, sgn, accounts[3]), false,  "signature should be false")
            assert.equal(sign_funs.isValidSignature_claim(escrow.address, 1789, 1917, 27182, sgn, accounts[2]), false,  "signature should be false")
            assert.equal(sign_funs.isValidSignature_claim(escrow.address, 1789, 1918, 31415, sgn, accounts[2]), false,  "signature should be false")
            assert.equal(sign_funs.isValidSignature_claim(escrow.address, 1941, 1917, 31415, sgn, accounts[2]), false,  "signature should be false")
            assert.equal(sign_funs.isValidSignature_claim(accounts[2],    1789, 1917, 31415, sgn, accounts[2]), false,  "signature should be false")
             
        });

   it ("Check validity of the signatures with js-server part (open channel)", async function()
        {
            //open the channel message
            let expiration = web3.eth.getBlock(web3.eth.blockNumber).timestamp + 10000000
            let value      = 1000
            let replica_id = 44
            let message_nonce = 666

            let sgn = await sign_funs.wait_signed_open_channel_message(accounts[4], escrow.address, accounts[7], value, expiration, replica_id, message_nonce)
            assert.equal(sign_funs.isValidSignature_open_channel(escrow.address, accounts[7], value, expiration, replica_id, message_nonce, sgn, accounts[4]), true, "signature should be ok")
            assert.equal(sign_funs.isValidSignature_open_channel(escrow.address, accounts[7], value, expiration, replica_id, message_nonce, sgn, accounts[5]), false, "signature should be false")
            assert.equal(sign_funs.isValidSignature_open_channel(escrow.address, accounts[7], value, expiration, replica_id, 42,            sgn, accounts[4]), false, "signature should be false")
            assert.equal(sign_funs.isValidSignature_open_channel(escrow.address, accounts[7], value, expiration, 0         , message_nonce, sgn, accounts[4]), false, "signature should be false")
            assert.equal(sign_funs.isValidSignature_open_channel(escrow.address, accounts[7], value, 42,         replica_id, message_nonce, sgn, accounts[4]), false, "signature should be false")
            assert.equal(sign_funs.isValidSignature_open_channel(escrow.address, accounts[7], 42,    expiration, replica_id, message_nonce, sgn, accounts[4]), false, "signature should be false")
            assert.equal(sign_funs.isValidSignature_open_channel(escrow.address, accounts[4], value, expiration, replica_id, message_nonce, sgn, accounts[4]), false, "signature should be false")
            assert.equal(sign_funs.isValidSignature_open_channel(accounts[0],    accounts[7], value, expiration, replica_id, message_nonce, sgn, accounts[4]), false, "signature should be false")
        });

});

