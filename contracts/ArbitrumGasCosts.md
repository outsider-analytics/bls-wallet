# Arbitrum Gas Costs

This file compares the gas costs between one BLS transaction to BLSExpander.blsCallMultiSameCallerContractFunction 
and multiple regular ERC20 token transfers. If 31 transfers are aggregated inside one BLS transaction, then a comparison
will be made between that one BLS transaction and 31 normal token transfers.

### Table Fields:
* Commit - git commit the gas results were computed for
* Tx Type - "BLS" for BLS aggregated transactions or "Normal" for normal token transfers
* Number Txs - Number of transactions aggregated in one BLS transaction
* Units - Units may vary slightly from run to run, but should remain close to constant if the bls-wallet implementation stays the same.
  * L1 Calldata Units Used - number of calldata units stored on L1 for the transaction(s)
  * L1 Transaction Units - number of distinct transactions (always 1 for BLS transactions)
  * L2 Computation Units - number of computation units used on L2
  * L2 Storage Units - number of L2 storage units used
* Cost - All costs are denominated in ETH according to current Arbitrum mainnet prices
  * L1 Calldata Cost - Cost of the transaction due to storing calldata on L1
  * L2 Tx Cost - Cost of sending the transactions (the more transactions sent, the higher this cost) 
  * L2 Storage Cost - Cost of storing data in L2
  * L2 Computation Cost - Cost of computation on L2
  * Total Cost - Total cost of either the BLS transaction, or all of the normal token transfers
* Tx Hash - Hash of the transaction on the Arbitrum Testnet

### Results
| Commit | Tx Type | Number Txs | L1 Calldata Units Used | L1 Transaction Units | L2 Computation Units | L2 Storage Units | L1 Calldata Cost | L2 Tx Cost | L2 Storage Cost | L2 Computation Cost | Total Cost (ETH) | Tx Hash |
| ----------- | ----------- | ----------- | ----------- | ----------- | ----------- | ----------- | ----------- | ----------- | ----------- |---------------------| ----------- |------------------|
| 116c920b2469d279773c2546b0f00575828c11c2 | BLS | 31 | 23388 | 1 | 312116 | 1 | 0.0015691 | 0.0001342 | 0.0000292 | 0.0001821 | 0.0019145 | 0xae4c5f62536743630eab5056671296e130bcd9d64650013a86c268fd59c6bc81 |
| 116c920b2469d279773c2546b0f00575828c11c2 | Normal | 31 | 60388 | 31 | 25730 | 0 | 0.0040514 | 0.0041596 | 0.0000000 | 0.0000150 | 0.0082260 | 0x78cfceea76233ed83a49d67919ec4e6ce30d71a15cbcb64821514a1eabed257c |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | BLS | 30 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 758207 | 0x0f17c7bb341247a59ee8157bdbd2e8371b597400270b697beba15545fd07f0d4 |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | Normal | 30 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 1030200 | 0x677ec08625f006141e3a8a535e05a989b5c4f5989393527b3490147f3f2b75e3 |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | BLS | 50 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 880375 | 0x95afa68cf98cf53379093bb1a1940208c237964d4068fee1be3aea87ea92128c |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | Normal | 50 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 2572000 | 0x85a4ddafc49b0f28336e8456aea5e17700b28f42f7fb538353aa37096947fdb7 |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | BLS | 100 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 2235700 | 0x2add424671bb5d3ca41957c46842861e3ace0afd1e33aeb870a2e8e009da961e |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | Normal | 100 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 5144000 | 0x306e9f70173accb4e5463f2cdfa366ca48814b1c031a72a0a3eed9f21c92ae83 |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | BLS | 150 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 6333805 | 0xaa8abc3dd3e2206ef33367c9e59bee3fa7929a37706812d5908fc92e70cae587 |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | Normal | 150 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 5151000 | 0x58f33897f26acdf125d252a613125524f413add063ca78223fcb4966e9fa2fdd |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | BLS | 200 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 12755906 | 0xd983b471321e6be9a15757f7803b9b8521add04888e9ebc1678caa5e0346a00b |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | Normal | 200 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 6868000 | 0x40dddb552dd32942a3a09111f06fc09e65553f83558d84be25da4d4a559edc6f |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | BLS | 210 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 12955773 | 0xd015d385c2e37a91c4b4533daf9fc9780170ad73929aa67626160c96e852afed |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | Normal | 210 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 10802400 | 0x2bdf371a0f9a405ed60d11f9865ec9a408161d31172b0b73e9f6d8e2cf13b825 |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | BLS | 220 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 14876140 | 0x1f7218dc3efe972d434beeea2f7fce10efb4d420b2dbc126513c1556ebf2182e |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | Normal | 220 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 11316800 | 0x7c4ea5a344391bf3ea4527bcaf8fa23a2514660492a390c15a8ca8403daa5aae |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | BLS | 230 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 18785019 | 0x06fb3130b21cc9e5afb4388b54ae1bbfa1f1237bcf4cd8f27191071ba8c7aae5 |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | Normal | 230 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 7898200 | 0x9f4af82825d47626a35cbf514e2b00e3d2c5ce7d2258ffa206819fd6da6675ab |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | BLS | 240 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 19401501 | 0xe9bb72b3bfb5ef8016fd71c4798bc282fa14b70def0ece6d921d6da30b55ba7f |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | Normal | 240 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 12345600 | 0x46a6d565522936396934c9497fc9903fdf0663f60323bc9035edff06c10a9534 |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | BLS | 241 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 19654758 | 0xd41c37cbda462af38437cdc357cf44a4f414672154f1a994af6958c396ed377c |
| 3a519cd6e4259a27546b34c861d0a0b9b51603db | Normal | 241 | -1 | -2 | -3 | -4 | -4 | -5 | -6 | -7 | 12397040 | 0xb489d0b2bb28fb0455a00aca974a6db525f6e5cfc1c1c832c89b7dd66ca6235a |