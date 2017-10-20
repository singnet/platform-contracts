#!/usr/bin/env sh

set -o errexit
set -o nounset


case "$1" in

noop)
    ;;

run)
    cd /dao
    npm install zeppelin-solidity
    truffle compile-all
    truffle migrate --reset
#    truffle test
    ;;

*) echo 'No operation specified'
    exit 0;
    ;;

esac
