const v3Tokens = {
  ethereum: [],
  polygon: [
    {
      address: '0xf329e36C7bF6E5E86ce2150875a84Ce77f477375',
      symbol: 'aPolAAVE',
      baseTokenAddress: '0xD6DF932A45C0f255f85145f286eA0b292B21C90B',
      baseTokenSymbol: 'AAVE'
    },
    {
      address: '0x82E64f49Ed5EC1bC6e43DAD4FC8Af9bb3A2312EE',
      symbol: 'aPolDAI',
      baseTokenAddress: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      baseTokenSymbol: 'DAI'
    },
    {
      address: '0x6ab707Aca953eDAeFBc4fD23bA73294241490620',
      symbol: 'aPolUSDT',
      baseTokenAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      baseTokenSymbol: 'USDT'
    },
    {
      address: '0x191c10Aa4AF7C30e871E70C95dB0E4eb77237530',
      symbol: 'aPolLINK',
      baseTokenAddress: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39',
      baseTokenSymbol: 'LINK'
    },
    {
      address: '0x6d80113e533a2C0fe82EaBD35f1875DcEA89Ea97',
      symbol: 'aPolWMATIC',
      baseTokenAddress: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      baseTokenSymbol: 'WMATIC'
    },
    {
      address: '0x625E7708f30cA75bfd92586e17077590C60eb4cD',
      symbol: 'aPolUSDC',
      baseTokenAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      baseTokenSymbol: 'USDC'
    },
    {
      address: '0x8437d7C167dFB82ED4Cb79CD44B7a32A1dd95c77',
      symbol: 'aPolAGEUR',
      baseTokenAddress: '0xE0B52e49357Fd4DAf2c15e02058DCE6BC0057db4',
      baseTokenSymbol: 'agEUR'
    },
    {
      address: '0x38d693cE1dF5AaDF7bC62595A37D667aD57922e5',
      symbol: 'aPolEURS',
      baseTokenAddress: '0xE111178A87A3BFf0c8d18DECBa5798827539Ae99',
      baseTokenSymbol: 'EURS'
    },
    {
      address: '0x078f358208685046a11C85e8ad32895DED33A249',
      symbol: 'aPolWBTC',
      baseTokenAddress: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
      baseTokenSymbol: 'WBTC'
    },
    {
      address: '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8',
      symbol: 'aPolWETH',
      baseTokenAddress: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      baseTokenSymbol: 'WETH'
    },
    {
      address: '0x513c7E3a9c69cA3e22550eF58AC1C0088e918FFf',
      symbol: 'aPolCRV',
      baseTokenAddress: '0x172370d5Cd63279eFa6d502DAB29171933a610AF',
      baseTokenSymbol: 'CRV'
    },
    {
      address: '0xc45A479877e1e9Dfe9FcD4056c699575a1045dAA',
      symbol: 'aPolSUSHI',
      baseTokenAddress: '0x0b3F868E0BE5597D5DB7fEB59E1CADBb0fdDa50a',
      baseTokenSymbol: 'SUSHI'
    },
    {
      address: '0x8Eb270e296023E9D92081fdF967dDd7878724424',
      symbol: 'aPolGHST',
      baseTokenAddress: '0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7',
      baseTokenSymbol: 'GHST'
    },
    {
      address: '0x6533afac2E7BCCB20dca161449A13A32D391fb00',
      symbol: 'aPolJEUR',
      baseTokenAddress: '0x4e3Decbb3645551B8A19f0eA1678079FCB33fB4c',
      baseTokenSymbol: 'jEUR'
    },
    {
      address: '0x724dc807b04555b71ed48a6896b6F41593b8C637',
      symbol: 'aPolDPI',
      baseTokenAddress: '0x85955046DF4668e1DD369D2DE9f3AEB98DD2A369',
      baseTokenSymbol: 'DPI'
    },
    {
      address: '0x8ffDf2DE812095b1D19CB146E4c004587C0A0692',
      symbol: 'aPolBAL',
      baseTokenAddress: '0x9a71012B13CA4d3D0Cdc72A177DF3ef03b0E76A3',
      baseTokenSymbol: 'BAL'
    }
  ],
  avalanche: [
    {
      address: '0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8',
      symbol: 'aAvaWETH',
      baseTokenAddress: '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab',
      baseTokenSymbol: 'WETH.e'
    },
    {
      address: '0x078f358208685046a11c85e8ad32895ded33a249',
      symbol: 'aAvaWBTC',
      baseTokenAddress: '0x50b7545627a5162f82a992c33b87adc75187b218',
      baseTokenSymbol: 'WBTC.e'
    },
    {
      address: '0x625e7708f30ca75bfd92586e17077590c60eb4cd',
      symbol: 'aAvaUSDC',
      baseTokenAddress: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
      baseTokenSymbol: 'USDC.e'
    },
    {
      address: '0x6ab707aca953edaefbc4fd23ba73294241490620',
      symbol: 'aAvaUSDT',
      baseTokenAddress: '0xc7198437980c041c805a1edcba50c1ce5db95118',
      baseTokenSymbol: 'USDT.e'
    },
    {
      address: '0x82e64f49ed5ec1bc6e43dad4fc8af9bb3a2312ee',
      symbol: 'aAvaDAI',
      baseTokenAddress: '0xd586e7f844cea2f87f50152665bcbc2c279d8d70',
      baseTokenSymbol: 'DAI.e'
    },
    {
      address: '0xf329e36c7bf6e5e86ce2150875a84ce77f477375',
      symbol: 'aAvaAAVE',
      baseTokenAddress: '0x63a72806098bd3d9520cc43356dd78afe5d386d9',
      baseTokenSymbol: 'AAVE.e'
    }
  ]
}

export default v3Tokens
