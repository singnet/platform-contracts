import json
from web3 import Web3, HTTPProvider, IPCProvider

web3 = Web3(HTTPProvider('http://localhost:8545'))

def parseAbi(data):
  for key, value in data.items():
    if key=='abi': 
      return value


#payloads
payload = {'from': web3.eth.coinbase, 'gas': 1500000, 'gasPrice':30000000000000}
#ABI(s)
agentFactoryAbi = parseAbi(json.loads(open('../build/contracts/AgentFactory.json','r').read()))
agentAbi = parseAbi(json.loads(open('../build/contracts/Agent.json','r').read()))
escrowAbi = parseAbi(json.loads(open('../build/contracts/Escrow.json','r').read()))
agentRegistryAbi = parseAbi(json.loads(open('../build/contracts/AgentRegistry.json','r').read()))
#addresses
agentFactoryAddress = '0x73e7ecefa69e418fb51243f5981026b9e700b32b'
agentAddress = '0x7f34787ad5542e0dfdbf4247df2944c93511f5f0'
escrowAddress = '0x6c854ce4d1b58b6f4de6fe3b86892c95b4bc7df3'
agentRegistryAddress = '0x1e4cf401fcd398c4665e00bb8de4ce98e41aa0ad'
#Contracts
agentFactoryContract = web3.eth.contract(abi = agentFactoryAbi, address=agentFactoryAddress)
agentContract = web3.eth.contract(abi = agentAbi, address=agentAddress)
agentRegistryContract = web3.eth.contract(abi = agentRegistryAbi, address=agentRegistryAddress)
escrowContract = web3.eth.contract(abi= escrowAbi, address=escrowAddress)

def joinNetwork():
  return agentFactoryContract.call(payload).create()

def appendPacket(packet):
  return agentContract.transact(payload).appendPacket(packet)

def getPacket(position):
  return agentContract.call(payload).getPacket(position)

def advertiseService(service,agent):
  return agentRegistryContract.transact(payload).addAgent(service,agent)

def findServiceProviders(service):
  return agentRegistryContract.call(payload).getAgentsWithService(service)

def getAgentsById(id):
  return agentRegistryContract.call(payload).getAgent(id)

# assign an integer for each service
# wordSenseDisambiguation = 0, 
# textSummarization = 1


# Here I'm joining the network and putting in myself the address on the blockchain
myself = joinNetwork()

#Here I'm inserting a new agent for a determined service
#print advertiseService(0,myself)

## Here I'm printing 
print getAgentsById(findServiceProviders(0)[0])


## Here I'm adding a packet (bytes32) to the current agent
print appendPacket("0x0000000001")
## Then I'm getting back using a zero-based position
print getPacket(0)
