#!/usr/bin/env bash

npm i
node_modules/.bin/truffle test "$@"
