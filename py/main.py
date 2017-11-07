import json
from web3 import Web3, HTTPProvider, IPCProvider

web3 = Web3(HTTPProvider('http://localhost:8545'))

def getAddressByName(addresses,name):
  for key, value in addresses.items():
    if key==name:
      return value

def parseAbi(data):
  for key, value in data.items():
    if key=='abi':
      return value
#payloads
payload = {'from': web3.eth.coinbase, 'gas': 1500000, 'gasPrice':30000000000000}

#ABI(s)
agentRegistryAbi = parseAbi(json.loads(open('../build/contracts/AgentRegistry.json','r').read()))
agentFactoryAbi = parseAbi(json.loads(open('../build/contracts/AgentFactory.json','r').read()))
marketJobAbi = parseAbi(json.loads(open('../build/contracts/MarketJob.json','r').read()))
agentAbi = parseAbi(json.loads(open('../build/contracts/Agent.json','r').read()))
crowdsaleAbi = parseAbi(json.loads(open('../build/contracts/AgiCrowdsale.json','r').read()))
#addresses
agentRegistryAddress = getAddressByName(json.loads(open('../addresses.json','r').read()),'AgentRegistry')
agentFactoryAddress = getAddressByName(json.loads(open('../addresses.json','r').read()),'AgentFactory')
marketJobAddress = getAddressByName(json.loads(open('../addresses.json','r').read()),'MarketJob')
agentAddress = getAddressByName(json.loads(open('../addresses.json','r').read()),'Agent')
crowdsaleAddress = getAddressByName(json.loads(open('../addresses.json','r').read()),'AgiCrowdsale')

#Contracts
agentRegistryContract = web3.eth.contract(abi = agentRegistryAbi, address=agentRegistryAddress)
agentFactoryContract = web3.eth.contract(abi = agentFactoryAbi, address=agentFactoryAddress)
marketJobContract = web3.eth.contract(abi = marketJobAbi, address=marketJobAddress, bytecode="0x6060604052604051610760380380610760833981016040528080518201919060200180518201919060200180519190602001805182019190602001805190910190505b60005b60008054600160a060020a03191633600160a060020a03161790555b845186511461006f57600080fd5b60018054600160a060020a031916600160a060020a038616179055600282805161009d92916020019061011f565b5060038380516100b192916020019061011f565b50600090505b8451811015610113578481815181106100cc57fe5b90602001906020020151600560008884815181106100e657fe5b90602001906020020151600160a060020a031681526020810191909152604001600020555b6001016100b7565b5b5050505050506101bf565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061016057805160ff191683800117855561018d565b8280016001018555821561018d579182015b8281111561018d578251825591602001919060010190610172565b5b5061019a92915061019e565b5090565b6101bc91905b8082111561019a57600081556001016101a4565b5090565b90565b610592806101ce6000396000f300606060405236156100a15763ffffffff7c0100000000000000000000000000000000000000000000000000000000600035041663123119cd81146100a65780632f54bf6e146100d55780633ccfd60b1461010857806355a3b2c11461011d578063626568dc1461014e5780638da5cb5b146101d9578063a552386b14610208578063b2a7a8371461022f578063e33b39cf146102ba578063f2fde38b146102cf575b600080fd5b34156100b157600080fd5b6100b96102f0565b604051600160a060020a03909116815260200160405180910390f35b34156100e057600080fd5b6100f4600160a060020a03600435166102ff565b604051901515815260200160405180910390f35b341561011357600080fd5b61011b610316565b005b341561012857600080fd5b61013c600160a060020a036004351661039e565b60405190815260200160405180910390f35b341561015957600080fd5b6101616103b0565b60405160208082528190810183818151815260200191508051906020019080838360005b8381101561019e5780820151818401525b602001610185565b50505050905090810190601f1680156101cb5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34156101e457600080fd5b6100b961044e565b604051600160a060020a03909116815260200160405180910390f35b341561021357600080fd5b6100f461045d565b604051901515815260200160405180910390f35b341561023a57600080fd5b610161610466565b60405160208082528190810183818151815260200191508051906020019080838360005b8381101561019e5780820151818401525b602001610185565b50505050905090810190601f1680156101cb5780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34156102c557600080fd5b61011b610504565b005b34156102da57600080fd5b61011b600160a060020a0360043516610525565b005b600154600160a060020a031681565b600054600160a060020a038281169116145b919050565b60045460009060ff16151560011461032d57600080fd5b600160a060020a0333166000908152600560205260408120541161035057600080fd5b50600160a060020a033316600081815260056020526040808220805492905590919082156108fc0290839051600060405180830381858888f19350505050151561039957600080fd5b5b5b50565b60056020526000908152604090205481565b60038054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156104465780601f1061041b57610100808354040283529160200191610446565b820191906000526020600020905b81548152906001019060200180831161042957829003601f168201915b505050505081565b600054600160a060020a031681565b60045460ff1681565b60028054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156104465780601f1061041b57610100808354040283529160200191610446565b820191906000526020600020905b81548152906001019060200180831161042957829003601f168201915b505050505081565b60045460ff161561051457600080fd5b6004805460ff191660011790555b5b565b61052e336102ff565b151561053957600080fd5b6000805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a0383161790555b5b505600a165627a7a723058204b360ed4e2a55422759240b12589fce4b67afa92f3d4db7484283b50c211d5210029")
agentContract = web3.eth.contract(abi = agentAbi, address=agentAddress)
crowdsaleContract = web3.eth.contract(abi = crowdsaleAbi, address=crowdsaleAddress, args)


def joinNetwork():
  return agentFactoryContract.transact(payload).create()

def advertiseService(service,agent):
  return agentRegistryContract.transact(payload).addAgent(service,agent)

def findServiceProviders(service):
  return agentRegistryContract.call(payload).getAgentsWithService(service)

def getAgentsById(id):
  return agentRegistryContract.call(payload).getAgent(id)

def createMarketJob(agents,amounts,payer,firstService,lastService):
  return marketJobContract.deploy(transaction={'from': web3.eth.accounts[8],'value': web3.toWei(1, 'ether')},args=(agents,amounts,payer,firstService,lastService))

def setJobCompleted():
  return marketJobContract.call(payload).setJobCompleted()

def payAgent(agentAccounts):
  return marketJobContract.call({'from': agentAccounts[0]}).withdraw()


# assign an integer for each service
# wordSenseDisambiguation = 0,
# textSummarization = 1



# # Here I'm joining the network and putting in myself the address on the blockchain
# myself1 = joinNetwork()
# print("myself_1          {0}".format(myself1))
# myself2 = joinNetwork()
# print("myself_2           {0}".format(myself2))

# #TODO: add event watch AgentAdded
# #Add an agent (address) and its service (id, unit, pricePerUnit) to the registry
# advertiseService(0, 0, 20, web3.eth.accounts[1])

# #Create a new market with two agents
# agentAccounts = [web3.eth.accounts[4],web3.eth.accounts[5]]
# rewardsForServices = [web3.toWei(0.5, 'ether'),web3.toWei(0.5, 'ether')]
# payer = web3.eth.accounts[2]

# marketJob = createMarketJob(agentAccounts,rewardsForServices,payer,"0","1")
# print("market_job          {0}".format(marketJob))
# #Complete all jobs
# setJobCompleted()
# #Let agent be payed for his service(s)
# payAgent(agentAccounts)

#Here I'm inserting a new agent for a determined service
'''print("\n\nadvertize service\n")
print(advertiseService(0,myself))
print(advertiseService(0,test_agent))
print(advertiseService(72182,test_agent))

## Here I'm printing
print("\n\nfind service providers for 0\n")
print(getAgentsById(findServiceProviders(0)[0]))
print(getAgentsById(findServiceProviders(0)[1]))
print("\n\nfind service providers for 72182\n")
print(findServiceProviders(72182)[0])
test_provider_address = findServiceProviders(72182)[0]
test_provider = getAgentsById(test_provider_address)'''

