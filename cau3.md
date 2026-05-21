# Hyperliquid Monitor & Push Notification System

## Question

> If you had to monitor the addresses of 2.5k users on Hyperliquid & send them push notifications when they have an order filled, how would you design the system? Take into account rate limits & scalability of the solution.

## Solution

First, check what Hyperliquid supports, as the system design will depend on their API.

### Case 1: Hyperliquid has WebSocket

If Hyperliquid supports realtime data via websocket, I will open a realtime connection to listen for order fills.

When new data is received, the system will check if that wallet address is in the list of 2.5k users to monitor. If yes, add it to the queue and send push notification to the user.

**This is the best approach because:**
- Fewer requests
- Avoid rate limits
- Low latency
- Easy to scale later

### Case 2: Only REST API

If Hyperliquid doesn't support realtime websocket, I will use optimized polling.

Instead of calling API separately for each user, I will group multiple users together and check for new updates at short intervals. Then only process new transactions that haven't been notified.

### Common Mechanisms for Both Cases

In both cases, I will add mechanisms for:
- Auto-reconnect if connection is lost
- Retry when notification fails
- Skip duplicate data

To keep the system stable and scalable when the number of users increases.

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
- Add workers when load increases
- Shard users into groups if > 10k users
- Horizontal scaling: run multiple instances

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
   - Trigger polling every 10 seconds
   - Smart interval:
     - Active users: 5-10s
     - Inactive users: 30-60s

2. **Rate Limiter**
   - Token bucket algorithm
   - Comply with API rate limit (e.g., 100 req/s)
   - Auto-adjust when encountering 429 error

3. **API Client Pool**
   - Batch requests: 50-100 users/request
   - Connection pooling
   - 5-10 concurrent requests
   - Cursor-based pagination (only fetch new orders)

4. **Dedup Cache**
   - Redis with 1 hour TTL
   - Key: `user_address:order_id`
   - Only process unseen orders

**Scalability:**
- Increase concurrent requests when load increases
- Implement smart polling: reduce frequency for inactive users
- Cache user data to reduce database queries

---

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  address VARCHAR(42) UNIQUE NOT NULL,
  device_token VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_order_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_address ON users(address);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Orders table (for dedup and history)
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  order_id VARCHAR(100) UNIQUE NOT NULL,
  filled_at TIMESTAMP NOT NULL,
  notified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_id ON orders(order_id);
```

---

## Monitoring & Metrics

**Key Metrics to Track:**

1. **System Health**
   - WebSocket connection uptime
   - API request success rate
   - Average response time

2. **Business Metrics**
   - Orders processed per minute
   - Notification delivery rate
   - Average notification latency

3. **Error Tracking**
   - Failed notifications (with retry count)
   - Rate limit hits
   - Connection drops

**Alerting:**
- Alert if notification latency > 5 seconds
- Alert if error rate > 1%
- Alert if WebSocket disconnects > 3 times/hour

---

## Cost Estimation (for 2.5k users)

### WebSocket Approach

**Infrastructure:**
- 1 WebSocket client server: $20/month (small instance)
- Redis (managed): $30/month
- Database (PostgreSQL): $25/month
- Push notification service (FCM/APNS): Free for < 1M/month

**Total: ~$75/month**

### Polling Approach

**Infrastructure:**
- 2-3 API client servers: $60/month
- Redis: $30/month
- Database: $25/month
- API costs: Depends on Hyperliquid pricing

**Total: ~$115/month + API costs**

---

## Implementation Priority

1. **Phase 1: MVP (Week 1)**
   - Basic WebSocket client
   - In-memory user filter
   - Direct push notification (no queue)

2. **Phase 2: Production Ready (Week 2-3)**
   - Add message queue (Redis)
   - Implement dedup cache
   - Add retry logic
   - Monitoring & alerting

3. **Phase 3: Scale (Week 4+)**
   - Horizontal scaling
   - Smart polling fallback
   - Advanced monitoring
   - Performance optimization

---

## Conclusion

**Recommended Approach:** WebSocket-based architecture

**Reasons:**
- Lower latency (< 1 second vs 5-10 seconds)
- Lower cost (fewer API calls)
- Better user experience
- Easier to scale
- More reliable (no polling gaps)

**Fallback:** If WebSocket is not available, use optimized polling with batching and smart intervals.

