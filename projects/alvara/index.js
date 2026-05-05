const { getLogs2 } = require('../helper/cache/getLogs')
const { sumTokens2 } = require('../helper/unwrapLPs')

const basketCreatedAbi    = 'event BSKTCreated(string name, string symbol, address bskt, address bsktPair, address indexed creator, uint256 amount, string _id, string description, uint256 feeAmount)';
const basketCreatedAbiOld = 'event BSKTCreated(string name, string symbol, address bskt, address bsktPair, address indexed creator, uint256 amount, uint256 _legacy, string _id, string description, uint256 feeAmount)';
const ALVA = '0x8e729198d1C59B82bd6bBa579310C40d740A11C2';

const CONFIG = {
    ethereum: {
        factory: '0xFca3732ca3b501b9B2971065d4B5AeB889B5563a',
        fromBlock: 23048185
    }
}

async function getBsktPairs(api) {
    const cfg = CONFIG[api.chain]
    const [logsNew, logsOld] = await Promise.all([
        getLogs2({ api, eventAbi: basketCreatedAbi,    target: cfg.factory, fromBlock: cfg.fromBlock, extraKey: 'BSKTCreated-new' }),
        getLogs2({ api, eventAbi: basketCreatedAbiOld, target: cfg.factory, fromBlock: cfg.fromBlock, extraKey: 'BSKTCreated-old' }),
    ])
    return [...logsNew, ...logsOld].map(l => l.bsktPair)
}

async function tvl(api) {
    const bsktPairs = await getBsktPairs(api)
    if (!bsktPairs.length) return

    const tokensPerPair = await api.multiCall({
        abi: 'function getTokenList() view returns (address[])',
        calls: bsktPairs.map(target => ({ target })),
        permitFailure: true,
    })

    const tokensAndOwners = []
    for (let i = 0; i < bsktPairs.length; i++) {
        for (const token of tokensPerPair[i] || []) {
            tokensAndOwners.push([token, bsktPairs[i]])
        }
    }
    return sumTokens2({ api, tokensAndOwners, blacklistedTokens: [ALVA] })
}

async function staking(api) {
    const bsktPairs = await getBsktPairs(api)
    if (!bsktPairs.length) return
    return sumTokens2({ api, tokens: [ALVA], owners: bsktPairs })
}

module.exports = {
    methodology: 'TVL counts the underlying tokens held in every Alvara basket pair contract deployed by the BSKT factory. Baskets are discovered via BSKTCreated events (factory has been upgraded once, so both event variants are scanned). The protocol\'s own ALVA governance token is excluded from TVL and reported under staking.',
    ethereum: { tvl, staking }
}
