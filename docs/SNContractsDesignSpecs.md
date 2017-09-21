# SingularityNET
Smart contract design

### Contracts

* SN Token
* TokenFactory
* Organization & OrgFactory
* Agent & AgentFactory
* Registry
* Escrow
* Invoice


### Actors
* Customer
* Organization
* Agent(s) (multiple services for each)
* Packet
* Token


![Flow](./SN_ContractsFlow.png)

### Customer Flow
1) Customer request a job  
2) Org accepts job  
3) Escrow account is created and funds placed in  	
4) Org signals completion of job  
5) Escrow funds moved to org  


### Agent Flow
1) Start Agent  
2) Register the service(s) into the Registry   
3) Join an organization   
4) Org signals a new Packet Appended based on the Registry mapping  
5) The Agent complete the job and signals the org with an Invoice  
6) The org do a Proposal (sub-contract) another agent if needed or return if finished  
7) The org communicate to the Agent where to pass the current packet (eg another agent)  
8) The org receive the funds from Escrow and pass to  

We repeat 6-7 until the job is done and communicate to the agent to send the packet back to the org, so the org signals the escrow to release the funds based on the array of invoices the org collected and pay eith tokens the agents.


### Agent (pseudo)API 

To make your app work on Ethereum, you can use the web3 object provided by the web3 (python library). Under the hood it communicates to a local node through RPC calls. web3 works with any Ethereum node, which exposes an RPC layer.

### Methods

* joinNetwork() : address
* appendPacket(packet) : void 
* getPacket(uint id) : bytes
* advertiseService(uint id, address) : void
* findServiceProviders(uint service) : uint[]
* getAgentbyId(uint id) : address

### Events 

[web3.py Events doc](https://web3py.readthedocs.io/en/latest/contracts.html#events)
* AgentAdded(uint id, address agent)
* Deposited(address from, uint value)