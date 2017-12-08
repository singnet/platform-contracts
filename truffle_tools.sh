#!/usr/bin/env bash

# Launch the ganache Test Ethereum RPC server
echo '> starting ganache-cli'
ganache-cli > ganache_log.txt &
sleep 5
echo '> starting ganache-cli - DONE'

# Compile the contracts.
echo '> truffle compile - start'
rm -rf build
node_modules/.bin/truffle compile
echo '> truffle compile - DONE'

# Migrate the contracts.
echo '> truffle migrate - start'
node_modules/.bin/truffle migrate --network ganache
echo '> truffle migrate - DONE'

# First run Truffle test
echo '> truffle test - start'
rm -rf build
node_modules/.bin/truffle test --network ganache ./test/TestAgent.js
node_modules/.bin/truffle test --network ganache ./test/TestAgentFactory.js
node_modules/.bin/truffle test --network ganache ./test/TestMarketJob.js
node_modules/.bin/truffle test --network ganache ./test/TestMarketJobFactory.js
node_modules/.bin/truffle test --network ganache --compile-all
echo '> truffle test - DONE'

# Now run the Python sanity checks
cd py
echo '> python main.py'
python main.py
echo '> python main.py - DONE'

echo '> python main.py'
python test_agent_functions.py
echo '> python main.py - DONE'
