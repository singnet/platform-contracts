import json
from uuid import UUID

from web3 import Web3, HTTPProvider, IPCProvider

web3 = Web3(HTTPProvider('http://localhost:8545'))

addresses = None

# payloads
payload = {'from': web3.eth.accounts[1], 'gas': 1500000, 'gasPrice':30000000000000}

def new_contract(contract_name):
    global addresses, agi_token_address
    json_file = open('../build/contracts/' + contract_name + '.json', 'r')
    json_text = json_file.read()
    conract_dict = json.loads(json_text)
    abi = conract_dict['abi']

    if addresses == None:
        json_file = open('../addresses.json', 'r')
        json_text = json_file.read()
        addresses = json.loads(json_text)

    address = addresses[contract_name]
    return web3.eth.contract(abi=abi, address=address)

# Instantiate the contracts
print("Instantiating the contracts")
agent_contract = new_contract('Agent')
agent_registry_contract = new_contract('AgentRegistry')
agent_factory_contract = new_contract('AgentFactory')
market_job_contract = new_contract('MarketJob')
market_job_factory_contract = new_contract('MarketJobFactory')
agi_crowdsale_contract = new_contract('SingularityNetToken')

# Get the AGI token address
agi_token_address = addresses['SingularityNetToken']

def joinNetwork():
  return agent_factory_contract.transact(payload).create()

def advertiseService(service, unit, price, agent):
  return agent_registry_contract.transact(payload).addAgent(service, unit, price, agent)

def findServiceProviders(service):
  return agent_registry_contract.call(payload).getAgentsWithService(service)

def getAgentsById(id):
  return agent_registry_contract.call(payload).getAgent(id)

def createMarketJob(agents, amounts, services, payer, hash):
  return market_job_factory_contract.transact(payload)\
            .create(agents, amounts, services, agi_token_address, payer, hash)

def setJobCompleted():
  return market_job_factory_contract.call(payload).setJobCompleted()

def payAgent(agentAccounts):
  return market_job_factory_contract.call({'from': agentAccounts[0]}).withdraw()

def uuid_to_web3_int(uuid_string):
    uuid = UUID(uuid_string)
    return int(uuid.int)

# Constants for testing
WORD_SENSE_DISAMBIGUATION = uuid_to_web3_int('deadbeef-aaaa-bbbb-cccc-000000000001')
TEXT_SUMMARIZATION = uuid_to_web3_int('deadbeef-aaaa-bbbb-cccc-000000000002')
UNIT_PER_DOCUMENT = 1
UNIT_PER_100_DOCUMENTS = 2

COGS_PER_AGI = int(100000000)
PRICE_100_COGS = int(100)
PRICE_10K_COGS = int(10000)

creation_done = False
agent_address = None
def agent_created_cb(log_entry):
    global creation_done, agent_address
    print("agent_created %r" % log_entry['args']);
    print("    tx = %r" % log_entry['transactionHash']);
    print("    log = %r" % log_entry);
    creation_done = True
    agent_address = log_entry['args']['agent_address']

agent_factory_contract.on('agent_created', {}, agent_created_cb)

# Here I'm joining the network and putting in myself the address on the blockchain
creation_done = False
agent_one_tx_hash = joinNetwork()
print("agent_one tx hash = {0}".format(agent_one_tx_hash))
while not creation_done:
    pass
agent_one = agent_address

creation_done = False
agent_two_tx_hash = joinNetwork()
print("agent_two tx hash = {0}".format(agent_two_tx_hash))
while not creation_done:
    pass
agent_two = agent_address

print("All Agents are mined.")

# Add an agent (address) and its service (id, unit, pricePerUnit) to the registry
if not Web3.isAddress(agent_one):
    print("NOT CONFIRMED: agent_one is NOT an address")
else:
    print("CONFIRMED: agent_one is a valid address")
if not Web3.isAddress(agent_two):
    print("NOT CONFIRMED: agent_two is NOT an address")
else:
    print("CONFIRMED: agent_two is a valid address")

advertiseService(WORD_SENSE_DISAMBIGUATION, UNIT_PER_DOCUMENT,      PRICE_100_COGS, agent_one)
advertiseService(TEXT_SUMMARIZATION,        UNIT_PER_DOCUMENT,      PRICE_100_COGS, agent_one)
advertiseService(WORD_SENSE_DISAMBIGUATION, UNIT_PER_100_DOCUMENTS, PRICE_10K_COGS, agent_two)

# Create a new market with two agents
agents = [agent_one, agent_two]
amounts = [web3.toWei(0.5, 'ether'), web3.toWei(0.5, 'ether')]
services = [WORD_SENSE_DISAMBIGUATION, TEXT_SUMMARIZATION]
payer = agent_one
job_hash = b"0xfd05f79af9daaadb378845c0cff74a19c431e3b06fac1d4e99a7957b00e2d960"

market_job_tx = createMarketJob(agents, amounts, services, payer, job_hash)
print("Created market job {0}".format(market_job_tx))

# print("market_job          {0}".format(marketJob))
# # Complete all jobs
# setJobCompleted()
# # Let agent be payed for his service(s)
# payAgent(agentAccounts)
# ## Here I'm printing
# print("\n\nfind service providers for 0\n")
# print(getAgentsById(findServiceProviders(0)[0]))
# print(getAgentsById(findServiceProviders(0)[1]))
# print("\n\nfind service providers for 72182\n")
# print(findServiceProviders(72182)[0])
# test_provider_address = findServiceProviders(72182)[0]
# test_provider = getAgentsById(test_provider_address)

