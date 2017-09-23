#!/usr/bin/env bash

trap cleanup EXIT

cleanup() {
  if [ -n "$testrpc_pid" ] && ps -p $testrpc_pid > /dev/null; then
    kill -9 $testrpc_pid
  fi
}

testrpc_running() {
  nc -z localhost 8545
}

if testrpc_running; then
  echo "Using existing testrpc"
else
  echo "testrpc is running "
  node_modules/.bin/testrpc > /dev/null &
  testrpc_pid=$!
fi

node_modules/.bin/truffle test "$@"