import json
from uuid import UUID
import time

from web3 import Web3, HTTPProvider, IPCProvider

web3 = Web3(HTTPProvider('http://localhost:7545'))

addresses = None

agent_owner_account = web3.eth.accounts[0]
client_account = web3.eth.accounts[1]
singnet_account = web3.eth.accounts[9]

print("Accounts")
print("--------")
print("Agent owner account          = {0}".format(agent_owner_account))
print("Client account               = {0}".format(client_account))
print("Singnet account              = {0}".format(singnet_account))
print()

K_WEI = int(1000)
M_WEI = int(1000000)
G_WEI = int(1000000000)
GAS_LIMIT = int(1.5 * M_WEI)
GAS_PRICE = int(30 * G_WEI)
G_WEI_PER_ETHER = int(1000000000)
ETHER = int(G_WEI_PER_ETHER * G_WEI)

TOKEN_GAS_LIMIT = int(5 * M_WEI)

# payloads
agent_owner_payload = {'from': agent_owner_account, 'gas': GAS_LIMIT, 'gasPrice': GAS_PRICE}
client_payload = {'from': client_account, 'gas': GAS_LIMIT, 'gasPrice': GAS_PRICE}
singnet_payload = {'from': singnet_account, 'gas': TOKEN_GAS_LIMIT, 'gasPrice': GAS_PRICE}

def get_contract_dict(contract_name):
    json_file = open('../build/contracts/' + contract_name + '.json', 'r')
    json_text = json_file.read()
    return json.loads(json_text)

def get_abi(contract_name):
     return get_contract_dict(contract_name)['abi']

def get_bytecode(contract_name):
    return get_contract_dict(contract_name)['bytecode']

def new_contract(contract_name):
    global addresses
    contract_abi = get_abi(contract_name)

    if addresses == None:
        json_file = open('../addresses.json', 'r')
        json_text = json_file.read()
        addresses = json.loads(json_text)

    address = addresses[contract_name]
    print("{0:<20} address = {1}".format(contract_name, address))
    return web3.eth.contract(abi=contract_abi, address=address)

# Instantiate the contracts
print("Instantiating contracts")
print("-----------------------")
agent_contract = new_contract('Agent')
agent_registry_contract = new_contract('AgentRegistry')
agent_factory_contract = new_contract('AgentFactory')
market_job_contract = new_contract('MarketJob')
simplet_job_contract = new_contract('SimpleJob')
print()

# Get the Agent and Job abi's
agent_abi = get_abi('Agent')
simple_job_abi = get_abi('SimpleJob')
market_job_abi = get_abi('MarketJob')
agi_token_abi = get_abi('SingularityNetToken')

#
# Deploy the token contract
#
print("Deploying token contract")
print("------------------------")

# Get the AGI token address, code, and contract
agi_token_address = addresses['SingularityNetToken']
agi_token_bytecode = get_bytecode('SingularityNetToken')

# Setup tokens for client
agi_token_contract = web3.eth.contract(abi = agi_token_abi, bytecode=agi_token_bytecode)
agi_token_deploy_tx = agi_token_contract.deploy(singnet_payload)
receipt = web3.eth.getTransactionReceipt(agi_token_deploy_tx)
agi_token_address = receipt['contractAddress']
agi_token_contract.address = agi_token_address
print("{0:<20} address = {1}".format('SingularityNetToken', agi_token_address))
print()
owner = agi_token_contract.call(singnet_payload).getOwner()
print("AGI token contract owner = {0}".format(owner))
paused = agi_token_contract.call(singnet_payload).isPaused()
print("AGI token paused         = {0}".format(paused))

if paused:
    print("Token is paused - unpausing")
    pause_tx = agi_token_contract.transact(singnet_payload).unpause()

if (owner == singnet_account):
    print("Verified AGI contract owned by SingNET")
else:
    print("NOT VERIFIED AGI contract NOT owned by SingNET")

# Set the Agent Factory token to use the AGI token
agent_factory_contract.transact(agent_owner_payload).setToken(agi_token_address);
token = agent_factory_contract.call(agent_owner_payload).getToken()
print("agent factory token      = {0}".format(token))
print()

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

ONE_AGI       = int(1 * COGS_PER_AGI)
TEN_AGI       = int(10 * COGS_PER_AGI)

#
#     def join_network(self):
#
def joinNetwork():
  return agent_factory_contract.transact(agent_owner_payload).create()

agent_address = None
def agent_created_cb(log_entry):
    global creation_done, agent_address
    print("agent_created %r" % log_entry['args'])
    print("    tx = %r" % log_entry['transactionHash'])
    print("    log = %r" % log_entry)
    agent_address = log_entry['args']['agent_address']
    creation_done = True

agent_factory_contract.on('agent_created', {}, agent_created_cb)

# Create agent_one and agent_two
creation_done = False
agent_one_tx_hash = joinNetwork()
print("agent_one tx hash = {0}".format(agent_one_tx_hash))
TIMEOUT = 20
start_time = time.clock()
while not creation_done and time.clock() - start_time < TIMEOUT:
    pass
agent_one_address = agent_address
print("address   = {0}".format(agent_one_address))
if agent_one_address is None:
    receipt = web3.eth.getTransactionReceipt(agent_one_tx_hash)
    print(receipt)

agent_one = web3.eth.contract(abi=agent_abi, address=agent_one_address)
print("agent_one = {0}".format(agent_one))

creation_done = False
agent_two_tx_hash = joinNetwork()
print("agent_two tx hash = {0}".format(agent_two_tx_hash))
TIMEOUT = 10
start_time = time.clock()
while not creation_done and time.clock() - start_time < TIMEOUT:
    pass
agent_two_address = agent_address
agent_two = web3.eth.contract(abi=agent_abi, address=agent_two_address)
print("agent_two = {0}".format(agent_two))

print("All Agents are mined.")

# Add an agent (address) and its service (id, unit, pricePerUnit) to the registry
if not Web3.isAddress(agent_one_address):
    print("NOT CONFIRMED: agent_one_address is NOT an address")
else:
    print("CONFIRMED: agent_one_address is a valid address")
if not Web3.isAddress(agent_two_address):
    print("NOT CONFIRMED: agent_two_address is NOT an address")
else:
    print("CONFIRMED: agent_two_address is a valid address")


#     def find_service_providers(self, service: ServiceDescriptor) -> list:
#         logger.debug('Finding service providers for: %s', service)
#         contract = self.get_agent_registry_contract()
#         result = contract.call(self.payload).getAgentsWithService(service)
#         logger.debug('%s service provider(s) found for: %s', len(result), service)
#         return result
#

#     def get_url_for_agent(self, agent_id):
#
#         for resolver in self.resolvers:
#             agent_url = resolver.resolve(agent_id)
#             if agent_url:
#                 return agent_url
#
#         raise UnresolvedAgentException(agent_id)

#
#     def advertise_service(self, service: ServiceDescriptor):
#

def advertiseService(service, unit, price, agent):
  return agent_registry_contract.transact(agent_owner_payload).addAgent(service, unit, price, agent)

print("Advertising services")
advertiseService(WORD_SENSE_DISAMBIGUATION, UNIT_PER_DOCUMENT,      PRICE_100_COGS, agent_one_address)
advertiseService(TEXT_SUMMARIZATION,        UNIT_PER_DOCUMENT,      PRICE_100_COGS, agent_one_address)
advertiseService(WORD_SENSE_DISAMBIGUATION, UNIT_PER_100_DOCUMENTS, PRICE_10K_COGS, agent_two_address)


job_address = None
def job_created_cb(log_entry):
    global creation_done, job_address
    # print("job_created %r" % log_entry['args'])
    print("job_created_cb")
    print("    tx      = {0}".format(log_entry['transactionHash']))
    # print("    log = %r" % log_entry)
    job_address = log_entry['args']['job_address']
    print("    address = {0}".format(job_address))
    creation_done = True

agent_job_tx_hash = agent_one.on('job_created', {}, job_created_cb)


#
# send_agent_wei(agent, amount):
#
def send_agent_funds(agent, address, amount):
    send_payload = {'from': agent_owner_account,
                    'to': agent_one_address,
                    'value': amount,
                    'gas': GAS_LIMIT,
                    'gasPrice': GAS_PRICE}
    return agent_one.transact(send_payload).deposit()

# Give the agent_one some ETHER.
print("Sending agent one 0.5 ETH - 6 times")
AGENT_ACCOUNT_STARTING_BALANCE = int(0.5 * ETHER)
agent_send_tx_hash = send_agent_funds(agent_one, agent_one_address, AGENT_ACCOUNT_STARTING_BALANCE)
agent_send_tx_hash = send_agent_funds(agent_one, agent_one_address, AGENT_ACCOUNT_STARTING_BALANCE)
agent_send_tx_hash = send_agent_funds(agent_one, agent_one_address, AGENT_ACCOUNT_STARTING_BALANCE)
agent_send_tx_hash = send_agent_funds(agent_one, agent_one_address, AGENT_ACCOUNT_STARTING_BALANCE)
agent_send_tx_hash = send_agent_funds(agent_one, agent_one_address, AGENT_ACCOUNT_STARTING_BALANCE)
agent_send_tx_hash = send_agent_funds(agent_one, agent_one_address, AGENT_ACCOUNT_STARTING_BALANCE)
print("send_agent_funds to agent_one tx hash = {0}".format(agent_send_tx_hash))
contract_balance = web3.eth.getBalance(agent_one_address)
print("agent_one contract balance = {0}, ETH = {1}".format(contract_balance, web3.fromWei(contract_balance, 'ether')))

# Create a new market job with two agents
amounts = [web3.toWei(0.5, 'ether'), web3.toWei(0.5, 'ether')]
services = [WORD_SENSE_DISAMBIGUATION, TEXT_SUMMARIZATION]

agent_one_payload = {'from': agent_one_address, 'gas': GAS_LIMIT, 'gasPrice': GAS_PRICE}

def is_job_completed(job_contract):
  return job_contract.call(agent_one_payload).isJobCompleted()

def is_job_accepted(job_contract):
  return job_contract.call(agent_one_payload).isJobAccepted()

# Some simple job constants
payer = client_account
job_cost = ONE_AGI
job_hash    = 0xfd05f79af9daaadb378845c0cff74a19c431e3b06fac1d4e99a7957b00e2d960
result_hash = 0xfeedbeefbeeffeedfeedbeefbeeffeed0031e3b06fac1d4e99a7957b00e2d960
agent_payload = {'from': payer, 'gas': GAS_LIMIT, 'gasPrice': GAS_PRICE}


#
# Client-agent interaction tests
#

# 1) Agent creates job
print('Agent creating simple job contract')
creation_done = True
simple_job_tx = agent_one.transact(agent_payload).create_simple_job(payer, job_cost, job_hash)
simple_job_address = agent_one.call(agent_payload).lastJob()
TIMEOUT = 10
start_time = time.clock()
while not creation_done and time.clock() - start_time < TIMEOUT:
    pass

print("    created job {0} - agent owner pays".format(simple_job_address))
if not Web3.isAddress(simple_job_address):
    print("    NOT CONFIRMED: simple_job is NOT an address")
else:
    print("    CONFIRMED: simple_job is a valid address")

simple_job = web3.eth.contract(abi=simple_job_abi, address=simple_job_address)
print("    simple_job = {0}".format(simple_job))

job_payer = simple_job.call(agent_owner_payload).getPayer()
print("        payer      = {0}".format(job_payer))
print("        client     = {0}".format(client_account))

message_sender = simple_job.call({'from': client_account}).getSender()
print("        msg.sender = {0}".format(message_sender))
print("        completed  = {0}".format(is_job_completed(simple_job)))
print("        accepted   = {0}".format(is_job_accepted(simple_job)))

# 2) Client funds job
print('Client funding job')
job_balance = web3.eth.getBalance(simple_job_address)
owner = agi_token_contract.call(singnet_payload).getOwner()
print("    agi owner    = {0}".format(owner))
tokens = agi_token_contract.call(singnet_payload).checkOwnerBalance()

# 2a - client buys tokens
print("    buying tokens from SingNET")
transfer_tx = agi_token_contract.transact(singnet_payload).transferTokens(client_account, TEN_AGI)
print("    receipt     = {0}".format(transfer_tx))

print("    ---------")
print("    simple_job     -> target with singnet payload")
message_sender = simple_job.call(singnet_payload).getSender()
print("    msg.sender  = {0}".format(message_sender))
print("    simple_job -> target with client payload")
message_sender = simple_job.call(client_payload).getSender()
print("    msg.sender  = {0}".format(message_sender))

print("    job balance = {0}, ETH = {1}".format(job_balance, web3.fromWei(job_balance, 'ether')))
print("    tokens      = {0}".format(tokens))
print("    job cost    = {0}".format(job_cost))

job_payer = simple_job.call(agent_owner_payload).getPayer()
print("        payer       = {0}".format(job_payer))
message_sender = simple_job.call(client_payload).getSender()
print("        msg.sender  = {0}".format(message_sender))
amIPayer = simple_job.call(client_payload).amIPayer()
print("        i am payer  = {0}".format(amIPayer))
isJobPending = simple_job.call(client_payload).isJobPending()
print("        pending     = {0}".format(isJobPending))
tokens = agi_token_contract.call(client_payload).checkBalance(client_account)
print("        COG balance = {0}".format(tokens))

tokens = agi_token_contract.call(client_payload).checkBalance(simple_job_address)
job_balance = web3.eth.getBalance(simple_job_address)
print("    job balance     = {0}, ETH = {1}".format(job_balance, web3.fromWei(job_balance, 'ether')))
print("    contract tokens = {0}".format(tokens))

print("    transferringTokens directly to contract ")
transfer_tx = agi_token_contract.transact(singnet_payload).transferTokens(simple_job_address, TEN_AGI)
tokens = agi_token_contract.call(client_payload).checkBalance(simple_job_address)
print("    contract tokens = {0}".format(tokens))

# print("    transferring from SingNET")
# agi_token_contract.transact(singnet_payload).transferFromSingnet(singnet_account, simple_job_address, job_cost)
# tokens = agi_token_contract.call(client_payload).checkBalance(simple_job_address)
# print("    contract tokens = {0}".format(tokens))
this = simple_job.call(client_payload).getThis()
print("    this      = {0}".format(this))
print()
tokens = agi_token_contract.call(client_payload).checkBalance(simple_job_address)
job_balance = web3.eth.getBalance(simple_job_address)
print("    job balance     = {0}, ETH = {1}".format(job_balance, web3.fromWei(job_balance, 'ether')))
print("    contract tokens = {0}".format(tokens))
print()
print("    depositing from agent - bypassing contract")
agi_token_contract.transact(agent_payload).transferSenderTokensTo(simple_job_address, job_cost)


agi_token_contract.transact(client_payload).transferSenderTokensTo(simple_job_address, job_cost)

token = simple_job.call(client_payload).getToken()
print("    token      = {0}".format(token))

print("    call(from_client).deposit(job_cost)")
simple_job.call(client_payload).deposit(job_cost)

print("    depositing from client - bypassing contract")
job_payer = simple_job.call(agent_owner_payload).getPayer()
print("        payer       = {0}".format(job_payer))
message_sender = simple_job.call(client_payload).getSender()
print("        msg.sender  = {0}".format(message_sender))
amIPayer = simple_job.call(client_payload).amIPayer()
print("        i am payer  = {0}".format(amIPayer))
isJobPending = simple_job.call(client_payload).isJobPending()
print("        pending     = {0}".format(isJobPending))
tokens = agi_token_contract.call(client_payload).checkBalance(client_account)
print("        COG balance = {0:>12}".format(tokens))
print("        job cost    = {0:>12}".format(job_cost))

tokens = agi_token_contract.call(client_payload).checkBalance(simple_job_address)
print("    contract tokens = {0}".format(tokens))
print("    transact(from_client).deposit(job_cost)")
deposit_tx = simple_job.transact(client_payload).deposit(job_cost)

# 3) Agent completes job
print('Agent completing job')
print("    Job completed  = {0}".format(is_job_completed(simple_job)))
print("    Job accepted   = {0}".format(is_job_accepted(simple_job)))

print("    Completing Job {0}".format(simple_job))
agent_one.transact(agent_owner_payload).setJobCompleted(simple_job_address, result_hash)
print("    Job completed  = {0}".format(is_job_completed(simple_job)))

print("    Accepting Job {0}".format(simple_job))
simple_job.transact(client_payload).setJobAccepted()
print("    Job accepted   = {0}".format(is_job_accepted(simple_job)))


    #
    #
    # function deposit(uint256 _amount) public onlyPayer jobPending {
    #     require(token.transferFrom(msg.sender, address(this), _amount));
    #     Deposited(msg.sender, _amount);
    # }
    #
    # function setJobCompleted(bytes _jobResult) public onlyMasterAgent jobPending {
    #     jobCompleted = true;
    #     jobResult = _jobResult;
    #     JobCompleted();
    # }
    #
    # function setJobAccepted() public onlyPayer jobDone {
    #     jobAccepted = true;
    #     JobAccepted();
    # }
    #
    # function withdraw() public jobDone jobApproved {
    #     address agent = msg.sender;
    #     require(amount > 0);
    #
    #     amount = 0;
    #     require(token.transfer(agent, amount));
    #     Withdrew(agent, amount);
    # }


#     def logoff_network(self) -> bool:
#         return super().logoff_network()
#
#     def update_ontology(self):
#         super().update_ontology()
#
#     def remove_service_advertisement(self, service: ServiceDescriptor):
#         super().remove_service_advertisement(service)
#
#     def is_agent_a_member(self, agent: AgentABC) -> bool:
#         return super().is_agent_a_member(agent)
#
#     def logon_network(self) -> bool:
#         return super().logon_network()
#
#     def get_network_status(self) -> NetworkStatus:
#         return super().get_network_status()
#
#     def leave_network(self) -> bool:
#         return super().leave_network()
#



def findServiceProviders(service):
  return agent_registry_contract.call(client_account).getAgentsWithService(service)

def getAgentsById(id):
  return agent_registry_contract.call(client_account).getAgent(id)


#     ### These are here because they were in the original code, not sure how to use them
#     def getAgentsById(self, id):
#         """
#         I have no idea what this does - what do you pass in here?
#         :param id:
#         :return:
#         """
#         contract = self.get_agent_registry_contract()
#         return contract.call(self.payload).getAgent(id)
#

#     def payAgent(self, agentAccounts):
#
#         contract = self.get_market_job_contract()
#
#         self.ensure_unlocked()
#
#         return contract.call({'from': agentAccounts[0]}).withdraw()
#
#     # Utility Functions
#
#     def getABI(self, param):
#         filename = '%s.json' % param
#         data = self.load_json(filename)
#         abi = data['abi']
#         return abi
#
#     def load_json(self, filename):
#         filepath = os.path.join(Path(__file__).parent, 'data', filename)
#         with open(filepath, encoding='utf-8') as data_file:
#             return json.loads(data_file.read())
#
#     def getAddress(self, param):
#         return self.addresses[param]
#
#     def get_agent_registry_contract(self):
#         return self.get_contract('AgentRegistry')
#
#     def get_market_job_contract(self):
#         return self.get_contract('MarketJob')
#
#     def get_agent_factory_contract(self):
#         return self.get_contract('AgentFactory')
#
#     def get_contract(self, type_name):
#         abi = self.getABI(type_name)
#         address = self.getAddress(type_name)
#         contract = self.client_connection.eth.contract(abi=abi, address=address)
#         return contract
#
#     def ensure_unlocked(self):
#         unlock_state = self.client_connection.personal.unlockAccount(self.account, self.settings.ACCOUNT_PASSWORD, duration=30)
#
#         if not unlock_state:
#             raise AccountNotUnlockedException()

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

