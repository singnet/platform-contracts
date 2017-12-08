FROM node:8

RUN apt-get update \
  && apt-get install -y build-essential python3 python3-dev python3-pip \
  && cd /usr/local/bin \
  && ln -s /usr/bin/python3 python \
  && pip3 install --upgrade pip

RUN  pip3 install web3

ADD package.json /core/
WORKDIR /core/

RUN npm install -g ganache-cli \
    && npm install

ADD . /core/


