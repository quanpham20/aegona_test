# Claim user + total token claim


This script reads events from contract creation to the current block (continuously updated). ZeroLayer is a multichain contract with a burn-to-mint mechanism (original chain is ETH) to distribute across other chains. Basically, each chain has its own airdrop contract. What we need to do is change the RPC and corresponding contract address to get user info. Here we use ARB as an example.

## Contract Info

- **Network**: Arbitrum One
- **Contract**: `0xd6b6a6701303B5Ea36fa0eDf7389b562d8F894DB`
- **Event**: `Claim(address claimer, uint256 expectedAmount, uint256 actualAmount, address to)`
- **Block Range**: 223776722 → 263125325

## How to Run

```bash
yarn 
tsx crawl-claims.ts
```

## Setup

1. Install dependencies:
```bash
yarn install
```

2. Create `.env` file with your Infura API key:
```bash
# Infura Arbitrum
RPC_URL=https://arbitrum-mainnet.infura.io/v3/your-api-key 
```

## Output

The script will display:
- Total number of Claim events
- Number of unique claimers
- **Total ZRO tokens claimed** (expectedAmount and actualAmount)
- Top 10 claimers
- Save details to `claim-results.json` file (uploaded in repo)

## Example Output (example only, crawled 1/10)

```
=== SUMMARY ===

Total Claim Events: 1234
Unique Claimers: 567

Total Expected Amount: 123456.789 ZRO
Total Actual Amount: 98765.432 ZRO
```

## Notes

- Script crawls in batches of 1000 blocks to avoid RPC limits due to too many events

