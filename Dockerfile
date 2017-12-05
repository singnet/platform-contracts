FROM node:6

WORKDIR /code

ADD . /code

RUN npm install -g truffle
