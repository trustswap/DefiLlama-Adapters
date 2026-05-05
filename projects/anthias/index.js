const { getCuratorExport } = require("../helper/curators");

const configs = {
  methodology: 'Count all assets deposited in all vaults curated by Anthias Labs.',
  blockchains: {
    base: {
      morphoVaultOwners: [
        '0x8b621804a7637b781e2BbD58e256a591F2dF7d51',
      ],
    },
  }
}
module.exports = getCuratorExport(configs)
