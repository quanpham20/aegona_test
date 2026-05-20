# Crawl Claim Events - Arbitrum

Câu1-2
Script để crawl tất cả Claim events từ contract trên Arbitrum network.


đọc event từ lúc create contract tới block hiện tại(cập nhật liên tục), zero layer là multichain contract, với cơ chế burn to mint (chain gốc là từ eth) để phân phối qua các chain khác, thì cơ bản mỗi chain đều có contract airdrop riêng, việc ta cần làm là thay rpc và địa chri contract tương ứng để lấy user info. Ở dây mình làm mẫu với ARB.

## Contract Info

- **Network**: Arbitrum One
- **Contract**: `0xd6b6a6701303B5Ea36fa0eDf7389b562d8F894DB`
- **Event**: `Claim(address claimer, uint256 expectedAmount, uint256 actualAmount, address to)`
- **Block Range**: 22377672 → 26312532

## Cách chạy

```bash
yarn 
tsx crawl-claims.ts
```



# Infura Arbitrum
RPC_URL=https://arbitrum-mainnet.infura.io/v3/your-api-key node crawl-claims.js
```

## Kết quả

Script sẽ in ra:
- Tổng số Claim events
- Số lượng unique claimers
- **Tổng số ZRO token đã được claim** (expectedAmount và actualAmount)
- Top 10 claimers
- Lưu chi tiết vào file `claim-results.json`

## Ví dụ output

```
=== SUMMARY ===

Total Claim Events: 1234
Unique Claimers: 567

Total Expected Amount: 123456.789 ZRO
Total Actual Amount: 98765.432 ZRO
```

## Lưu ý

- Script crawl theo batch 10,000 blocks để tránh RPC limit
- Với ~3.9 triệu blocks, sẽ mất khoảng 5-10 phút
- Nếu gặp lỗi rate limit, giảm BATCH_SIZE trong file crawl-claims.ts
