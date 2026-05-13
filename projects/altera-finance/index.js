const { sumTokens2 } = require('../helper/unwrapLPs')
const { getLogs2 } = require('../helper/cache/getLogs')

const eventAbi = 'event StrategyDeployed(address indexed strategy, address indexed token0, address indexed token1, uint24 fee, int24 tickLower, int24 tickUpper)';
const config = { ethereum: {factory: '0xf24F99795D1Cb1F0816101D4e0A41a84b44ac8c3', fromBlock: 24988527} }

async function tvl(api) {
  const {factory, fromBlock} = config[api.chain]
  const logs = await getLogs2({api, eventAbi, factory, fromBlock})
  const strategies = logs.map(s => s.strategy)

  return sumTokens2({ api, owners: strategies, resolveUniV3: true })
}

module.exports = {
  methodology: 'TVL is the value of all Uniswap v3 positions held by Altera strategy contracts.',
  ethereum: { tvl },
}
