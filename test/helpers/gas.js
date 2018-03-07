exports.logGasUsed = (msg, tx) => {
  if (tx.receipt) {
    console.log(`Function: ${msg}\nCumulative gas used ${tx.receipt.cumulativeGasUsed}\nGas used ${tx.receipt.gasUsed}`)
  }
}