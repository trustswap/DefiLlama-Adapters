const axios = require("axios");

const MASTER = "EQD4l0TnN13SmF_wSIL6ho1sBmqc4H_KN1kFqPjLJgIpkBOZ";
const TONAPI = "https://tonapi.io/v2/blockchain/accounts";

async function tvl(api) {
  const url = `${TONAPI}/${MASTER}/methods/get_pool_data`;
  const { data } = await axios.get(url);
  if (data.exit_code !== 0) throw new Error(`get_pool_data exit ${data.exit_code}`);
  const poolTonBalanceNano = BigInt(data.stack[3].num);
  api.add("coingecko:the-open-network", Number(poolTonBalanceNano) / 1e9);
}

module.exports = {
  methodology:
    "TVL is the total TON deposited in the IslandStake liquid staking pool, read on-chain via the get_pool_data getter on the master jetton contract (pool_ton_balance field). iTON is the liquid staking receipt jetton.",
  ton: { tvl },
};
