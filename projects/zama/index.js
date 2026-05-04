const { sumTokens2 } = require("../helper/unwrapLPs");

const REGISTRY = '0xeb5015fF021DB115aCe010f23F55C2591059bBA0';
const ZAMA_TOKEN = '0xA12CC123ba206d4031D1c7f6223D1C2Ec249f4f3';
const registryGetPairsAbi =
  'function getTokenConfidentialTokenPairs() view returns (tuple(address tokenAddress, address confidentialTokenAddress, bool isValid)[])';

async function getPairs(api) {
  return api.call({ target: REGISTRY, abi: registryGetPairsAbi });
}

async function tvl(api) {
  const pairs = await getPairs(api);
  const tokensAndOwners = pairs.map(d => [d.tokenAddress, d.confidentialTokenAddress]);
  await sumTokens2({ api, tokensAndOwners, blacklistedTokens: [ZAMA_TOKEN] });
}

async function staking(api) {
  const pairs = await getPairs(api);
  const zama = pairs.find(d => d.tokenAddress.toLowerCase() === ZAMA_TOKEN.toLowerCase());
  if (!zama) return {};
  await sumTokens2({ api, tokensAndOwners: [[zama.tokenAddress, zama.confidentialTokenAddress]] });
}

module.exports = {
  methodology: "Counts the public ERC-20 reserves locked in Zama's confidential wrapper contracts on Ethereum. E.g. the balance of USDC in cUSDC, tGBP in the confidential tGBP wrapper, and USDT in cUSDT, etc.",
  ethereum: { tvl, staking },
};
