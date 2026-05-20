# ZRO Claim Events Crawler

Script để crawl tất cả Claim events từ ZRO contract trên Arbitrum và tính tổng số token đã được claim.

## Thông tin Contract

- **Network**: Arbitrum One
- **Contract Address**: `0xd6b6a6701303B5Ea36fa0eDf7389b562d8F894DB`
- **Event**: `Claim(address claimer, uint256 expectedAmount, uint256 actualAmount, address to)`
- **Block Range**: 223,776,722 → 263,125,325

## Yêu cầu hệ thống

- Node.js >= 18
- Yarn
- RPC endpoint cho Arbitrum (Infura, Alchemy, hoặc public RPC)

## Cài đặt

### 1. Clone hoặc tải project về

```bash
cd your-project-folder
```

### 2. Cài đặt dependencies

```bash
yarn install
```

### 3. Cấu hình RPC endpoint

**QUAN TRỌNG**: Bạn cần có RPC endpoint để kết nối với Arbitrum.

#### Option A: Sử dụng file .env (Khuyến nghị)

1. Copy file `.env.example` thành `.env`:
```bash
cp .env.example .env
```

2. Mở file `.env` và điền RPC URL của bạn:
```
RPC_URL=https://arbitrum-mainnet.infura.io/v3/YOUR_API_KEY_HERE
```

#### Option B: Lấy API key miễn phí

**Infura** (Khuyến nghị):
1. Đăng ký tại: https://infura.io/
2. Tạo project mới
3. Chọn network: Arbitrum
4. Copy API key và điền vào `.env`:
```
RPC_URL=https://arbitrum-mainnet.infura.io/v3/YOUR_API_KEY
```

**Alchemy**:
1. Đăng ký tại: https://www.alchemy.com/
2. Tạo app mới với network Arbitrum
3. Copy API key và điền vào `.env`:
```
RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

**Public RPC** (Không khuyến nghị - có thể chậm và bị rate limit):
```
RPC_URL=https://arb1.arbitrum.io/rpc
```

## Chạy script

### Bước 1: Đảm bảo đã cấu hình RPC trong file .env

Kiểm tra file `.env` đã có RPC_URL chưa:
```bash
cat .env
```

Phải thấy dòng:
```
RPC_URL=https://arbitrum-mainnet.infura.io/v3/...
```

### Bước 2: Chạy script crawl

**Option 1: Chạy TypeScript trực tiếp (Khuyến nghị)**
```bash
yarn tsx crawl-claims.ts
```

**Option 2: Compile rồi chạy JavaScript**
```bash
yarn build
node crawl-claims.js
```

Script sẽ:
- Đọc RPC_URL từ file `.env`
- Crawl tất cả Claim events từ block 223,776,722 đến 263,125,325
- Hiển thị progress real-time
- Tự động xử lý rate limits và errors
- Lưu kết quả vào `claim-results.json`

### Thời gian chạy

- **Total blocks**: ~39.3 triệu blocks
- **Batch size**: 1,000 blocks/batch
- **Delay**: 1 giây giữa mỗi batch
- **Ước tính**: 10-12 giờ

💡 **Tip**: Bạn có thể để script chạy qua đêm hoặc chạy trong background.

## Kết quả

Sau khi script chạy xong, file `claim-results.json` sẽ chứa:

```json
{
  "summary": {
    "totalEvents": 123456,
    "uniqueClaimers": 45678,
    "totalExpectedAmount": "123456789012345678901234",
    "totalActualAmount": "98765432109876543210987",
    "totalExpectedAmountEther": "123456.789 ZRO",
    "totalActualAmountEther": "98765.432 ZRO"
  },
  "claimers": [
    {
      "address": "0xabc...",
      "expectedAmount": "1000000000000000000000",
      "actualAmount": "500000000000000000000",
      "expectedAmountEther": "1000.0 ZRO",
      "actualAmountEther": "500.0 ZRO",
      "claimCount": 2
    }
  ]
}
```

### Giải thích kết quả

- **totalEvents**: Tổng số lần claim
- **uniqueClaimers**: Số lượng địa chỉ unique đã claim
- **totalExpectedAmount**: Tổng số ZRO expected (wei)
- **totalActualAmount**: Tổng số ZRO thực tế đã claim (wei)
- **totalExpectedAmountEther**: Tổng số ZRO expected (đơn vị ZRO)
- **totalActualAmountEther**: Tổng số ZRO thực tế đã claim (đơn vị ZRO)
- **claimers**: Danh sách chi tiết từng địa chỉ đã claim

## Xử lý lỗi

### Lỗi: "Missing required environment variable: RPC_URL"

**Nguyên nhân**: Chưa cấu hình RPC_URL trong file `.env`

**Giải pháp**:
1. Tạo file `.env` từ `.env.example`
2. Điền RPC URL vào file `.env`

### Lỗi: "Too Many Requests"

**Nguyên nhân**: RPC provider đang rate limit

**Giải pháp**: Script tự động retry sau 10 giây. Nếu vẫn lỗi:
- Dùng RPC provider khác (Infura, Alchemy)
- Upgrade plan của RPC provider

### Lỗi: "query returned more than 10000 results"

**Nguyên nhân**: Batch có quá nhiều events

**Giải pháp**: Script tự động chia nhỏ batch và retry. Không cần làm gì.

## Tùy chỉnh

### Thay đổi block range

Mở file `crawl-claims.ts` và sửa:

```typescript
const FROM_BLOCK = 223776722;  // Block bắt đầu
const TO_BLOCK = 263125325;    // Block kết thúc
```

Sau đó compile lại:
```bash
npx tsc crawl-claims.ts --outDir . --module commonjs --target es2022 --lib es2022 --esModuleInterop --skipLibCheck
```

### Thay đổi batch size

Mở file `crawl-claims.ts` và sửa:

```typescript
const BATCH_SIZE = 1000;  // Số blocks mỗi batch
```

**Lưu ý**: Batch size càng lớn càng nhanh nhưng dễ bị rate limit hoặc vượt quá 10k results.

### Thay đổi delay

Mở file `crawl-claims.ts` và sửa:

```typescript
const DELAY_BETWEEN_BATCHES = 1000;  // Milliseconds (1000 = 1 giây)
```

## Files trong project

- `crawl-claims.ts` - Source code TypeScript
- `crawl-claims.js` - Compiled JavaScript (chạy file này)
- `ABI.json` - Contract ABI
- `.env` - Cấu hình RPC endpoint (BẠN CẦN TẠO FILE NÀY)
- `.env.example` - Template cho file .env
- `claim-results.json` - Kết quả crawl (tự động tạo sau khi chạy xong)
- `README.md` - File này

## Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra file `.env` đã có RPC_URL chưa
2. Kiểm tra RPC endpoint có hoạt động không
3. Kiểm tra Node.js version >= 18
4. Kiểm tra đã chạy `yarn install` chưa

## License

MIT
