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
let signFuns       = require('./sign_mpe_funs');



async function testErrorRevert(prom)
{
    let rezE = -1
    try { await prom }
    catch(e) {
        rezE = e.message.indexOf('revert') 
//console.log("Error " + e)        
    }
    assert(rezE >= 0, "Must generate error and error message must contain revert");
}
  
contract('MultiPartyEscrow', function(accounts) {

    var escrow;
    var tokenAddress;
    var token;
    let N1 = 42000
    let N2 = 420000
    let N3 = 42
     

    before(async () => 
        {
            escrow        = await MultiPartyEscrow.deployed();
            tokenAddress  = await escrow.token.call();
            token         = Token.at(tokenAddress);
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
            await testErrorRevert(escrow.withdraw(N2 + 1, {from:accounts[4]}))
            
            escrow.withdraw(N3, {from:accounts[4]})
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), N2 - N3)
            assert.equal((await token.balanceOf(escrow.address)).toNumber(), N1 + N2 - N3)
            assert.equal((await token.balanceOf(accounts[4])).toNumber(), N3)

            // Check for the Transfer Function
            await token.transfer(accounts[8],  N2, {from:accounts[0]});
            await token.approve(escrow.address,N2, {from:accounts[8]});
            await escrow.deposit(N2, {from:accounts[8]});
            escrow.transfer(accounts[9], N1, {from:accounts[8]} );
            assert.equal((await escrow.balances.call(accounts[8])).toNumber(), N2 - N1)
            assert.equal((await escrow.balances.call(accounts[9])).toNumber(), N1)

            // Transferring back to a[0] to make the remaining functions in tact
            escrow.withdraw(N2 - N1, {from:accounts[8]})
            escrow.withdraw(N1, {from:accounts[9]})
            await token.transfer(accounts[0],  N2 - N1, {from:accounts[8]});
            await token.transfer(accounts[0],  N1, {from:accounts[9]});

        }); 

        it ("Initial openning (first and second channel)", async function()
        {
            //first channel

            //first try to open with bigger amount (it must fail)
            // sending signer as sender itself
            testErrorRevert( escrow.openChannel(accounts[0], accounts[5], 0, N1 + 1, web3.eth.blockNumber + 10000000, {from:accounts[0]}))
            
            //normal open
            await escrow.openChannel(accounts[0], accounts[5], 0, N1, web3.eth.blockNumber + 10000000, {from:accounts[0]})
            assert.equal((await escrow.nextChannelId.call()).toNumber(), 1)

            //full balance doesn't change
            assert.equal((await token.balanceOf(escrow.address)).toNumber(), N1 + N2 - N3)
            assert.equal((await escrow.balances.call(accounts[0])).toNumber(), 0)
            //second channel
            await escrow.openChannel(accounts[4], accounts[6], 27, N1 * 2, web3.eth.blockNumber + 10000000, {from:accounts[4]})
            assert.equal((await escrow.nextChannelId.call()).toNumber(), 2)
            
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), N2 - N3 - N1 * 2)
            

        });
          
        it("Fail to Claim timeout ", async function()
        {
            await testErrorRevert(escrow.channelClaimTimeout(0, {from:accounts[0]}))
            await testErrorRevert(escrow.channelClaimTimeout(1, {from:accounts[4]}))
        });


       it ("closing transaction (first channel)", async function()
        {
            //sign message by the privet key of accounts[0]
            let sgn = await signFuns.waitSignedClaimMessage(accounts[0], escrow.address, 0, 0, N1 - 1000);

            let vrs = signFuns.getVRSFromSignature(sgn.toString("hex"));

            // With Signature Parameter
            //await escrow.channelClaim(0, N1 - 1000, sgn.toString("hex"), true, {from:accounts[5]});
            await escrow.channelClaim(0, N1 - 1000, N1 - 1000, vrs.v, vrs.r, vrs.s, true, {from:accounts[5]});
            
            assert.equal((await escrow.balances.call(accounts[5])).toNumber(), N1 - 1000)
            assert.equal((await escrow.balances.call(accounts[0])).toNumber(), 1000)
          //  let balance4 = await token.balanceOf.call(accounts[4]);
          //  assert.equal(balance4, 41000, "After closure balance of accounts[4] should be 41000");
       });
        it ("closing transaction (second channel), with partly closure", async function()
        {
            //first we claim, and put remaing funds in the new channel (with nonce 1)
            let sgn = await signFuns.waitSignedClaimMessage(accounts[4], escrow.address, 1, 0, N1);
            let vrs = signFuns.getVRSFromSignature(sgn.toString("hex"));
            
            //await escrow.channelClaim(1, N1, sgn.toString("hex"), false, {from:accounts[6]});
            await escrow.channelClaim(1, N1, N1, vrs.v, vrs.r, vrs.s, false, {from:accounts[6]});
            assert.equal((await escrow.balances.call(accounts[6])).toNumber(), N1)
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), N2 - N3 - N1*2)

            //claim all funds and close channel
            //try to use old signutature (should fail)
            //testErrorRevert( escrow.channelClaim(1, N1, sgn.toString("hex"), false, {from:accounts[6]}))
            testErrorRevert( escrow.channelClaim(1, N1, N1, vrs.v, vrs.r, vrs.s, false, {from:accounts[6]}))

            //make new signature with nonce 1
            let sgn2 = await signFuns.waitSignedClaimMessage(accounts[4], escrow.address, 1, 1, N1 - 1000);
            let vrs2 = signFuns.getVRSFromSignature(sgn2.toString("hex"));
            
            //await escrow.channelClaim(1, N1 - 1000, sgn2.toString("hex"), true, {from:accounts[6]});
            await escrow.channelClaim(1, N1 - 1000, N1 - 1000, vrs2.v, vrs2.r, vrs2.s, true, {from:accounts[6]});
            assert.equal((await escrow.balances.call(accounts[6])).toNumber(), N1 * 2 - 1000)
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), N2 - N3 - N1*2 + 1000)

       });

     it ("Open the third channel", async function()
        {
            let expiration   = web3.eth.blockNumber + 10000000
            let value        = 1000
            let groupId      = "group44"
            await escrow.openChannel(accounts[4], accounts[7], groupId, value, expiration, {from:accounts[4]})
            assert.equal((await escrow.nextChannelId.call()).toNumber(), 3)     
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), N2 - N3 - N1*2)
        });

     it ("Extend and add funds to the third channel", async function()
         {
             let good_expiration  = web3.eth.blockNumber + 10000000 + 1;
             let wrong_expiration = web3.eth.blockNumber;
             let addValue   = N1;

             //try extend from the wrong account
             testErrorRevert( escrow.channelExtendAndAddFunds(2, good_expiration, 1, {from:accounts[0]}) )

             //try extend with the smaller exporation
             testErrorRevert( escrow.channelExtendAndAddFunds(2, wrong_expiration, addValue, {from:accounts[4]}))
             await escrow.channelExtendAndAddFunds(2, good_expiration, addValue, {from:accounts[4]})

             assert.equal((await escrow.balances.call(accounts[4])).toNumber(), N2 - N3 - N1*3)

         });
     it ("Close the third channel", async function()
        {
            //sign message by the privet key of accounts[0]
            let sgn = await signFuns.waitSignedClaimMessage(accounts[4], escrow.address, 2, 0, 1000 - 10);
         
            let vrs = signFuns.getVRSFromSignature(sgn.toString("hex"));
         
            //await escrow.channelClaim(2, 1000 - 10, sgn.toString("hex"), true, {from:accounts[7]});

            testErrorRevert(escrow.channelClaim(2, 1000, 1000 - 10, vrs.v, vrs.r, vrs.s, true, {from:accounts[7]}));

            // Claiming the lower amount
            await escrow.channelClaim(2, 1000 - 10, 1000 - 10, vrs.v, vrs.r, vrs.s, true, {from:accounts[7]});
            assert.equal((await escrow.balances.call(accounts[7])).toNumber(), 1000 - 10)
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), N2 - N3 - N1*2 + 10)
          //  let balance4 = await token.balanceOf.call(accounts[4]);
          //  assert.equal(balance4, 41000, "After closure balance of accounts[4] should be 41000");
       });

     it ("Open the fourh channel and close it by timeout", async function()
        {
            let expiration   = web3.eth.blockNumber - 1
            let groupId      = "group42"
            await escrow.openChannel(accounts[4], accounts[7], groupId, 10, expiration, {from:accounts[4]})
            assert.equal((await escrow.nextChannelId.call()).toNumber(), 4)     
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), N2 - N3 - N1*2)
            
            await escrow.channelClaimTimeout(3, {from:accounts[4]})

            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), N2 - N3 - N1*2 + 10)
            assert.equal((await escrow.balances.call(accounts[7])).toNumber(), 1000 - 10)
        });

        it ("Open the fifth channel for actual claim lesser than planned amount", async function()
        {
            //sign message by the privet key of accounts[0]

            let channelDepositAmount = 100
            let plannedAmount = 90
            let actualAmount = 80
            
            let expiration   = web3.eth.blockNumber + 10000000
            let groupId      = "group42"
            let currentChannelId = (await escrow.nextChannelId.call()).toNumber()
            let accountBal_4 = (await escrow.balances.call(accounts[4])).toNumber()
            let accountBal_7 = (await escrow.balances.call(accounts[7])).toNumber()

            await escrow.openChannel(accounts[4], accounts[7], groupId, channelDepositAmount, expiration, {from:accounts[4]})
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), accountBal_4 - channelDepositAmount)

            let sgn = await signFuns.waitSignedClaimMessage(accounts[4], escrow.address, currentChannelId, 0, plannedAmount);
            let vrs = signFuns.getVRSFromSignature(sgn.toString("hex"));

            // Testing for Actual Amount > Planned Amount
            testErrorRevert(escrow.channelClaim(currentChannelId, actualAmount+plannedAmount, plannedAmount, vrs.v, vrs.r, vrs.s, true, {from:accounts[7]}));
            // Claiming the lower amount and sending remaining channel value back to user
            await escrow.channelClaim(currentChannelId, actualAmount, plannedAmount, vrs.v, vrs.r, vrs.s, true, {from:accounts[7]});
            assert.equal((await escrow.balances.call(accounts[7])).toNumber(), accountBal_7 + actualAmount)
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), accountBal_4 - actualAmount)

        });

        it ("Open the sixth channel by third party", async function()
        {
            //sign message by the privet key of accounts[0]

            let channelDepositAmount = 100
            
            let expiration   = web3.eth.blockNumber + 100000000
            let messageNonce   = web3.eth.blockNumber + 2
            let groupId      = "group42"
            let currentChannelId = (await escrow.nextChannelId.call()).toNumber()

            let accountBal_4 = (await escrow.balances.call(accounts[4])).toNumber()
            let accountBal_7 = (await escrow.balances.call(accounts[7])).toNumber()

            //await escrow.openChannel(accounts[4], accounts[7], groupId, channelDepositAmount, expiration, {from:accounts[4]})
            //assert.equal((await escrow.balances.call(accounts[4])).toNumber(), accountBal_4 - channelDepositAmount)

            // Account 4 Provides the Sign to Account 7 to execute on Blockchain
            let sgn = await signFuns.waitSignOpenChannelMessage(accounts[4], escrow.address, accounts[7], accounts[4], accounts[3], groupId, channelDepositAmount, expiration, messageNonce)
            let vrs = signFuns.getVRSFromSignature(sgn.toString("hex"));

            await escrow.openChannelByThirdParty(accounts[4], accounts[4], accounts[3], groupId, channelDepositAmount, expiration, messageNonce, vrs.v, vrs.r, vrs.s, {from:accounts[7]})

            const [nonce_a, sender_a, signer_a, recipient_a, groupId_a, value_a, expiration_a]
            = await escrow.channels.call(currentChannelId);

            assert.equal((await escrow.nextChannelId.call()).toNumber(), currentChannelId + 1)
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), accountBal_4)
            assert.equal((await escrow.balances.call(accounts[7])).toNumber(), accountBal_7 - channelDepositAmount)
            assert.equal(sender_a, accounts[4])
            assert.equal(signer_a, accounts[4])
            assert.equal(recipient_a, accounts[3])
//console.log(value_a + "===" + channelDepositAmount);            
            assert.equal(value_a.toNumber(), channelDepositAmount)

            // Test for a replay attack
            await testErrorRevert(escrow.openChannelByThirdParty(accounts[4], accounts[4], accounts[3], groupId, channelDepositAmount, expiration, messageNonce, vrs.v, vrs.r, vrs.s, {from:accounts[7]}));
        });
        
        it ("Open the seventh channel for Claim signed by sender", async function()
        {
            //sign message by the privet key of accounts[0]

            let channelDepositAmount = 100
            let plannedAmount = 90
            let actualAmount = 80
            
            let expiration   = web3.eth.blockNumber + 10000000
            let groupId      = "group42"
            let currentChannelId = (await escrow.nextChannelId.call()).toNumber()
            let accountBal_4 = (await escrow.balances.call(accounts[4])).toNumber()
            let accountBal_7 = (await escrow.balances.call(accounts[7])).toNumber()

            // Signer is Different than the sender
            await escrow.openChannel(accounts[5], accounts[7], groupId, channelDepositAmount, expiration, {from:accounts[4]})
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), accountBal_4 - channelDepositAmount)

            // Message signed by the sender/channel owner or creater
            let sgn = await signFuns.waitSignedClaimMessage(accounts[4], escrow.address, currentChannelId, 0, plannedAmount);
            let vrs = signFuns.getVRSFromSignature(sgn.toString("hex"));

            // Testing for Actual Amount > Planned Amount
            testErrorRevert(escrow.channelClaim(currentChannelId, actualAmount+plannedAmount, plannedAmount, vrs.v, vrs.r, vrs.s, true, {from:accounts[7]}));
            // Claiming the lower amount and sending remaining channel value back to user
            await escrow.channelClaim(currentChannelId, actualAmount, plannedAmount, vrs.v, vrs.r, vrs.s, true, {from:accounts[7]});
            assert.equal((await escrow.balances.call(accounts[7])).toNumber(), accountBal_7 + actualAmount)
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), accountBal_4 - actualAmount)

        });

        it ("Open the eight channel for Claim signed by signer", async function()
        {
            //sign message by the privet key of accounts[0]

            let channelDepositAmount = 100
            let plannedAmount = 90
            let actualAmount = 80
            
            let expiration   = web3.eth.blockNumber + 10000000
            let groupId      = "group42"
            let currentChannelId = (await escrow.nextChannelId.call()).toNumber()
            let accountBal_4 = (await escrow.balances.call(accounts[4])).toNumber()
            let accountBal_7 = (await escrow.balances.call(accounts[7])).toNumber()

            // Signer is Different than the sender
            await escrow.openChannel(accounts[5], accounts[7], groupId, channelDepositAmount, expiration, {from:accounts[4]})
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), accountBal_4 - channelDepositAmount)

            // Message signed by the Signer
            let sgn = await signFuns.waitSignedClaimMessage(accounts[5], escrow.address, currentChannelId, 0, plannedAmount);
            let vrs = signFuns.getVRSFromSignature(sgn.toString("hex"));

            // Testing for Actual Amount > Planned Amount
            testErrorRevert(escrow.channelClaim(currentChannelId, actualAmount+plannedAmount, plannedAmount, vrs.v, vrs.r, vrs.s, true, {from:accounts[7]}));
            // Claiming the lower amount and sending remaining channel value back to user
            await escrow.channelClaim(currentChannelId, actualAmount, plannedAmount, vrs.v, vrs.r, vrs.s, true, {from:accounts[7]});
            assert.equal((await escrow.balances.call(accounts[7])).toNumber(), accountBal_7 + actualAmount)
            assert.equal((await escrow.balances.call(accounts[4])).toNumber(), accountBal_4 - actualAmount)

        });
 
    it ("Check validity of the signatures with js-server part (claim)", async function()
        {
            //claim message
            let sgn = await signFuns.waitSignedClaimMessage(accounts[2], escrow.address, 1789, 1917, 31415);  
            assert.equal(signFuns.isValidSignatureClaim(escrow.address, 1789, 1917, 31415, sgn, accounts[2]), true,   "signature should be ok")
            assert.equal(signFuns.isValidSignatureClaim(escrow.address, 1789, 1917, 31415, sgn, accounts[3]), false,  "signature should be false")
            assert.equal(signFuns.isValidSignatureClaim(escrow.address, 1789, 1917, 27182, sgn, accounts[2]), false,  "signature should be false")
            assert.equal(signFuns.isValidSignatureClaim(escrow.address, 1789, 1918, 31415, sgn, accounts[2]), false,  "signature should be false")
            assert.equal(signFuns.isValidSignatureClaim(escrow.address, 1941, 1917, 31415, sgn, accounts[2]), false,  "signature should be false")
            assert.equal(signFuns.isValidSignatureClaim(accounts[2],    1789, 1917, 31415, sgn, accounts[2]), false,  "signature should be false")
             
        });

});
