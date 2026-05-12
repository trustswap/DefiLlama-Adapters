const { getConnection, sumTokens2 } = require('../helper/solana')
const { PublicKey } = require('@solana/web3.js')
const bs58 = require('bs58').default

// https://github.com/riserich/rise-docs/blob/main/idl/mayflower.json#L5422
// MarketMeta layout (Anchor, 8-byte discriminator + publicKey fields):
//   104  marketGroup       (32)  memcmp filter target (Rise group pubkey)
//   200  liqVaultMain      (32)  SPL token account holding the actual cash
const MAYFLOWER = 'AVMmmRzwc2kETQNhPiFVnyu62HrgsQXTD6D7SnSfEz7v'

// Mayflower hosts other tenants too; pin to Rise's MarketGroup so we never
// accidentally count a non-Rise market.
const RISE_MARKET_GROUP = 'HA9pvTe8F2MLhQK1ZgHn7r2rfd2DJgA7NJBxDfKn9P7d'

// Anchor account discriminator for MarketMeta = sha256("account:MarketMeta")[:8].
const MARKET_META_DISC = bs58.encode(Buffer.from([95, 146, 205, 231, 152, 205, 151, 183]))

const MM_MARKET_GROUP_OFFSET = 104
const MM_LIQ_VAULT_OFFSET    = 200

async function tvl(api) {
  const connection = getConnection()
  const metas = await connection.getProgramAccounts(new PublicKey(MAYFLOWER), {
    encoding: 'base64',
    filters: [
      { memcmp: { offset: 0, bytes: MARKET_META_DISC } },
      { memcmp: { offset: MM_MARKET_GROUP_OFFSET, bytes: RISE_MARKET_GROUP } },
    ],
    dataSlice: { offset: MM_LIQ_VAULT_OFFSET, length: 32 },
  })
  if (!metas.length) return

  const liqVaultMains = metas.map(m => new PublicKey(m.account.data).toBase58())
  return sumTokens2({ api, tokenAccounts: liqVaultMains })
}

module.exports = {
  timetravel: false,
  methodology: `TVL: sum of the main quote token (WSOL, USDC, etc.) actually held on-chain in each Rise market's liquidity vault (the liqVaultMain SPL token account stored on its MarketMeta). Rise markets are identified on-chain by selecting Mayflower MarketMeta accounts whose marketGroup field is Rise's group pubkey (HA9pvTe8...).`,
  solana: { tvl },
}
