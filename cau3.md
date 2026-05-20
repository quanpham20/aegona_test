# Hệ thống Monitor & Push Notification cho Hyperliquid

## Câu hỏi

> If you had to monitor the addresses of 2.5k users on Hyperliquid & send them push notifications when they have an order filled, how would you design the system? Take into account rate limits & scalability of the solution.

## Giải pháp

Đầu tiên, kiểm tra Hyperliquid hỗ trợ những gì, vì cách thiết kế hệ thống sẽ phụ thuộc vào API của họ.

### Trường hợp 1: Hyperliquid có WebSocket

Nếu Hyperliquid có hỗ trợ dữ liệu realtime qua websocket, tôi sẽ mở một kết nối realtime để lắng nghe các lệnh được khớp.

Khi có dữ liệu mới gửi về, hệ thống sẽ kiểm tra xem địa chỉ ví đó có nằm trong danh sách 2.5k user cần theo dõi hay không. Nếu có thì đưa vào hàng đợi và gửi push notification cho user.

**Đây là cách tốt nhất vì:**
- Ít tốn request
- Tránh bị rate limit
- Độ trễ thấp
- Dễ mở rộng sau này

### Trường hợp 2: Chỉ có REST API

Nếu Hyperliquid không hỗ trợ realtime websocket, tôi sẽ dùng polling tối ưu.

Thay vì gọi API riêng cho từng user, tôi sẽ gom nhiều user lại và kiểm tra cập nhật mới theo từng khoảng thời gian ngắn. Sau đó chỉ xử lý những giao dịch mới chưa được gửi thông báo.

### Cơ chế chung cho cả hai trường hợp

Ở cả hai trường hợp, tôi sẽ thêm cơ chế:
- Tự kết nối lại nếu mất kết nối
- Retry khi gửi notification thất bại
- Bỏ qua dữ liệu trùng lặp

Để hệ thống ổn định và có thể mở rộng khi số lượng user tăng lên.

---

## System Design

### Architecture Option 1: WebSocket-based (Recommended)

```
┌─────────────────┐
│   Hyperliquid   │
│   WebSocket     │
└────────┬────────┘
         │ Order Fill Events
         ▼
┌─────────────────┐
│  WebSocket      │
│  Client         │
│  (Single Conn)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User Filter    │◄─── 2.5k User Addresses
│  (Hash Set)     │     (In-memory or Redis)
└────────┬────────┘
         │ Matched Events Only
         ▼
┌─────────────────┐
│  Message Queue  │
│  (Redis/Kafka)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Worker Pool    │
│  (5-10 workers) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Dedup Cache    │
│  (Redis)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Push Notif     │
│  Service        │
│  (FCM/APNS)     │
└─────────────────┘
```

**Components:**

1. **WebSocket Client**
   - Duy trì 1 kết nối duy nhất với Hyperliquid
   - Subscribe channel "order fills"
   - Auto-reconnect khi disconnect

2. **User Filter**
   - Hash Set chứa 2.5k addresses
   - O(1) lookup để check nhanh
   - Load từ database khi khởi động

3. **Message Queue**
   - Buffer events để tránh mất data
   - Redis Stream hoặc Kafka
   - Đảm bảo at-least-once delivery

4. **Worker Pool**
   - 5-10 workers xử lý parallel
   - Mỗi worker:
     - Lấy event từ queue
     - Gửi push notification
     - Retry nếu thất bại (exponential backoff)

5. **Dedup Cache**
   - Redis với TTL 1 giờ
   - Key: `order_id`
   - Tránh gửi duplicate notifications

**Scalability:**
- Thêm workers khi load tăng
- Shard users thành groups nếu > 10k users
- Horizontal scaling: chạy nhiều instances

---

### Architecture Option 2: Polling-based

```
┌─────────────────┐
│   Scheduler     │
│   (Cron/Timer)  │
└────────┬────────┘
         │ Every 10s
         ▼
┌─────────────────┐
│  Rate Limiter   │
│  (Token Bucket) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Client     │◄─── Batch 50-100 users/request
│  Pool           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Aggregator     │
│  (Merge Results)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Dedup Cache    │
│  (Redis)        │
└────────┬────────┘
         │ New Orders Only
         ▼
┌─────────────────┐
│  Notification   │
│  Service        │
└─────────────────┘
```

**Components:**

1. **Scheduler**
   - Trigger polling mỗi 10 giây
   - Smart interval:
     - Active users: 5-10s
     - Inactive users: 30-60s

2. **Rate Limiter**
   - Token bucket algorithm
   - Tuân thủ API rate limit (ví dụ: 100 req/s)
   - Auto-adjust khi gặp 429 error

3. **API Client Pool**
   - Batch requests: 50-100 users/request
   - Connection pooling
   - 5-10 concurrent requests
   - Cursor-based pagination (chỉ fetch orders mới)

4. **Dedup Cache**
   - Redis với TTL 1 giờ
   - Key: `user_address:order_id`
   - Chỉ xử lý orders chưa thấy

