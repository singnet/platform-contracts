"use strict";

let Web3 = require("web3");
let {gasData} = require("../data/gas-data-etherscan.json");
let {etherUsdData} = require("../data/ether-usd-etherscan.json");
let moment = require("moment");
let fs = require('fs');

let web3 = new Web3(); // only need utils


// convert gas price data
const gasEntryToWei = (gasPriceStr) => {
    let gasPriceParts = gasPriceStr.split(' ');
    return web3.toWei(gasPriceParts[0], gasPriceParts[1]);
};

let gasStream = fs.createWriteStream("../data/gas-data-converted.csv", {flags:'w'});

gasStream.write("Date (UTC), Gas Price Average, Gas Price Min, Gas Price Max\n");

gasData.forEach(obj => {
    let {y, dt, gasPriceAvg, gasPriceMax, gasPriceMin} = obj;

    let momentDate = moment(dt, "ddd, MMMM DD, YYYY");

    if (momentDate.year() >= 2017) {

        let dateString = momentDate.format("YYYY-MM-DD");
        let gasPriceAvgWei = gasEntryToWei(gasPriceAvg);
        let gasPriceMaxWei = gasEntryToWei(gasPriceMax);
        let gasPriceMinWei = gasEntryToWei(gasPriceMin);

        let csv = [dateString, gasPriceAvgWei, gasPriceMinWei, gasPriceMaxWei].join(',');

        gasStream.write(csv + "\n");
    }
});

gasStream.end();

// convert ether price data
let priceStream = fs.createWriteStream("../data/ether-usd-converted.csv", {flags:'w'});

priceStream.write("Date (UTC), Ether Price Average (USD)\n");

etherUsdData.forEach(obj => {
    let {y, dt} = obj;

    let momentDate = moment(dt, "ddd, MMMM DD, YYYY");

    if (momentDate.year() >= 2017) {

        let dateString = momentDate.format("YYYY-MM-DD");
        let etherPrice = y;

        let csv = [dateString, etherPrice].join(',');

        priceStream.write(csv + "\n");
    }
});

priceStream.end();