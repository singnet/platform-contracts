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

'''

Available Accounts
==================
(0) 0xbdd3c856d398439524a59f9a0e87958016f246e0
(1) 0x6ace9609e9fc2c52c382c5be6fffd1c9750d3b77
(2) 0x76b9faebe2952cc78a8fe29d7a94109b334c15de
(3) 0x2a7f1faa1b9a2fb7e09a5939f6380cfabbf13f30
(4) 0x52a6285b4a8f81640832300417db57e465e87bed
(5) 0xe93b526ecf72116cb4be7aedd6430f199d7f159d
(6) 0x887b15e382a1acb3b6574f832ed0dec39ce54002
(7) 0x11d92eaa00789811c7d1d195c6b98074400efed2
(8) 0x345f39d894802d15a84173f571652eefa7528eb6
(9) 0xb8cddf7d2c78f52b7488963d82a369915acd3f41

Private Keys
==================
(0) 64b0db5ae93afa13b45a5f887f33d9af17bcb30050b8a41ae7468db4c6ba3349
(1) 66922450e3491b1079e464b722934fbb5c9b7c41da9eb8232c8680d26c9d9599
(2) 8bfa373ced7ea151cee363c0465a87c6bc3304a224b74e587362036984505fe2
(3) e1628c93556d28185807b91a3fb25f44ac3652dfd7b9bf778702b4b7ca074ae0
(4) a916a92d812543800d436902976e4e7a9315bdce7118c585844486d86c912de5
(5) 5f9f683bf47a5fe2bb7e425a5ef15636d12a8ae89b550689928421c913a2def8
(6) f2b624c4d03e2ebe069af90f22e67b5c838dd5c32351b868c275d46d980d93fe
(7) 5cd859497f25339a71aeb9cb4d84d2188cb4edfe30aa08ffe00babc4ae9dc1a4
(8) 3ad759b4f915309211f2fdc6911911f34880caf2564933c21dd7048ce2625fbd
(9) e424215eb29e5484ada1301fabdfd61aed2c688364f7988e6229720628f9743d


  Ownable: 0x6c388304d3c7fc40c1a2102cad53047f65bd7683
  Escrow: 0x6394dbb6cf1fbc5985eb799966e43e26cb47103e
  AgentRegistry: 0xbea2b908a51e8cc5f76238cf022d0d5be1c3c5ac
  Agent: 0x45f4f554434a3157ddfb38d17b2b9d4504a8a045
  FixedSupplyToken: 0x709c20a1f3df097d493d7b96f31478cb8ab288b7
  OrganizationFactory: 0x311584fe6518fa0367e6a0d1e56b3c9f09035b35
  AgentFactory: 0x8b6d3d6db2333e6781fa4918926dd742152976c8
  Organization: 0x54c49a1445d827d0336158f406d0349e9b00cf4f
  SingularityNetToken: 0x9f3e6393774fdec4f78186f04f70ca6c28f92d25
'''

#payloads
payload = {'from': web3.eth.coinbase, 'gas': 1500000, 'gasPrice':30000000000000}

#ABI(s)
agentRegistryAbi = parseAbi(json.loads(open('../build/contracts/AgentRegistry.json','r').read()))
agentFactoryAbi = parseAbi(json.loads(open('../build/contracts/AgentFactory.json','r').read()))
agentAbi = parseAbi(json.loads(open('../build/contracts/Agent.json','r').read()))
#addresses
agentRegistryAddress = getAddressByName(json.loads(open('../addresses.json','r').read()),'AgentRegistry')
agentFactoryAddress = getAddressByName(json.loads(open('../addresses.json','r').read()),'AgentFactory')
agentAddress = getAddressByName(json.loads(open('../addresses.json','r').read()),'Agent')


#Contracts
agentRegistryContract = web3.eth.contract(abi = agentRegistryAbi, address=agentRegistryAddress)
agentFactoryContract = web3.eth.contract(abi = agentFactoryAbi, address=agentFactoryAddress)
agentContract = web3.eth.contract(abi = agentAbi, address=agentAddress)


def joinNetwork():
  return agentFactoryContract.transact(payload).create()

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
myself1 = joinNetwork()
print("myself_1          {0}".format(myself1))
myself2 = joinNetwork()
print("myself_2           {0}".format(myself2))

#test_agent = newAgent()
#print("test_agent       {0}".format(test_agent))

#test_agent_two = newAgentTwo()
#print("test_agent_two   {0}".format(test_agent_two))

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

