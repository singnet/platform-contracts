#!/usr/bin/env bash

NETWORK=${2:-ganache}
echo "Using Ehtereum PRC network '${NETWORK}'"

DEPLOY_TO_DIRECTORY=${3:-data/}
echo "Deploying  '${DEPLOY_TO_DIRECTORY}'"

case "$1" in

test)
    # Launch the ganache Test Ethereum RPC server
    echo "> starting ganache-cli"
    ganache-cli > ganache_log.txt &
    sleep 5
    echo "> starting ganache-cli - DONE"

    # First run Truffle test
    echo '> truffle test - start'
    rm -rf build
    node_modules/.bin/truffle test --network ${NETWORK}
    echo "> truffle test - DONE"

    # Now run the Python sanity checks
    rm -rf build
    node_modules/.bin/truffle compile
    node_modules/.bin/truffle migrate --network ${NETWORK}
    cd py
    echo "> python main.py"
    python main.py
    echo "> python main.py - DONE"

    echo "> python test_agent_functions.py"
    python test_agent_functions.py
    echo "> python test_agent_functions.py - DONE"
    ;;

deploy)
    # Compile and deploy the contracts to the specified network
    rm -rf build
    node_modules/.bin/truffle compile
    node_modules/.bin/truffle migrate --network ${NETWORK}

    # Now copy the files
    echo "> Copying compiled constracts and deployed addresses to '${DEPLOY_TO_DIRECTORY}'"
    find build -name "*.json" -type f -exec cp {} "${DEPLOY_TO_DIRECTORY}" \;
    cp addresses.json "${DEPLOY_TO_DIRECTORY}"
    ;;

*) echo "Command '$1' not found - No operation specified"
    exit 0;
    ;;

esac