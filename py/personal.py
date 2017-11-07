import json
from web3 import Web3, HTTPProvider, IPCProvider

web3 = Web3(HTTPProvider('http://localhost:8545'))

#password for encrypting account
psw = '1234'
# seconds
duration = 5 


print("list of accounts           {0}".format(web3.personal.listAccounts))

newAccount = web3.personal.newAccount(psw)
print("Account created        {0}".format(newAccount))
print("Unlocked:        {0}".format(web3.personal.unlockAccount(newAccount, psw)))

# Unlocking with a duration
print("Unlocked with a duration:        {0}".format(web3.personal.unlockAccount(newAccount, psw, duration)))





