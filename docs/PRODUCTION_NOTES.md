# ORBIT Dispatch System - Production Architecture & Scaling Notes

This document details the enterprise architectural design, scaling strategy, geospatial indexing migration path, event streaming pipeline, and observability for the **ORBIT Real-Time Nearby Partner Tracking and Dispatch System**.

---

## 1. Horizontal Scaling with Redis Socket.IO Adapter

To scale the WebSocket gateway horizontally across multiple API node instances (e.g., Kubernetes pods behind NGINX or AWS ALB), Socket.IO server instances must use `@socket.io/redis-adapter` backed by Redis Pub/Sub.

### Architecture
```
                     [ NGINX / AWS ALB ]
                             | (Sticky Sessions - ip_hash)
           +-----------------+-----------------+
           |                                   |
    [ Node API - Pod 1 ]                [ Node API - Pod 2 ]
    (Express + Socket.IO)               (Express + Socket.IO)
           |                                   |
           +-----------------+-----------------+
                             |
                   [ Redis Cluster Pub/Sub ]
```

### Implementation Pattern (`services/api/src/config/redis.ts`)
```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

const pubClient = new Redis({ host: process.env.REDIS_HOST });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

---

## 2. NGINX Sticky Sessions Configuration

WebSocket handshakes begin over HTTP long-polling before upgrading to WS. In multi-node deployments, sticky sessions ensure handshakes land on the same container node.

### `nginx.conf`
```nginx
upstream orbit_api_cluster {
    ip_hash; # Sticky sessions based on client IP
    server api-node-1:5000;
    server api-node-2:5000;
    server api-node-3:5000;
}

server {
    listen 80;
    server_name api.orbit.com;

    location / {
        proxy_pass http://orbit_api_cluster;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 3. Uber H3 Geospatial Indexing Migration Path

While Redis GEO (`GEOADD`, `GEOSEARCH`) provides sub-millisecond distance sorting up to 100,000 active partners, migrating to **Uber H3 (Hexagonal Hierarchical Spatial Index)** unlocks discrete cell aggregations, sub-zone demand heatmaps, and constant time lookup.

### H3 Resolution Mapping
- **Resolution 8** (~0.73 km² cell area): Ideal for dispatch matching radius.
- **Resolution 9** (~0.1 km² cell area): Ideal for precise partner density calculations.

### H3 Migration Steps
1. Install `h3-js` or `uber-h3` in `@orbit/api`.
2. Convert GPS coordinates `(lat, lng)` to H3 Index string:
   ```typescript
   import { latLngToCell, gridDisk } from 'h3-js';
   const h3Index = latLngToCell(latitude, longitude, 8);
   ```
3. Store partner IDs in Redis Sets keyed by H3 Cell ID: `partners:h3:<h3Index>`.
4. Perform k-ring expansion queries using `gridDisk(h3Index, 1)` to fetch immediate hexagonal neighbor cells in constant $O(1)$ time.

---

## 4. Kafka Event Streaming Upgrade

For long-term analytics, automated surge pricing, partner payout ledgering, and AI-driven matching models, transition dispatch events from Socket.IO in-memory pubsub to Apache Kafka / Redpanda.

### Kafka Topic Schemas
- `orbit.partner.location-updates`: High-frequency location telemetry stream.
- `orbit.booking.dispatches`: Dispatch offers, acceptances, rejections, and timeouts.
- `orbit.booking.lifecycle`: State transitions (`EN_ROUTE`, `SHOOTING`, `EDITING`, `DELIVERED`).

```
[ Mobile Partner App ] ---> [ Socket Gateway ] ---> [ Kafka Topic ] ---> [ Flink / Spark ] (Real-time Analytics)
                                                                 ---> [ Postgres ] (Primary DB)
                                                                 ---> [ ClickHouse ] (Audit Logs)
```

---

## 5. Monitoring & Observability (Prometheus + Grafana)

### Key Metrics to Monitor
1. `orbit_active_websocket_connections`: Gauge tracking online sockets.
2. `orbit_partner_location_updates_total`: Counter for GPS pings/sec.
3. `orbit_dispatch_match_duration_seconds`: Histogram measuring time from booking creation to partner acceptance.
4. `orbit_dispatch_timeouts_total`: Counter for expired 15s offer timers.
5. `orbit_gps_spoof_attempts_total`: Counter for detected illegal GPS jumps (> 5km in 10s).

### Prometheus Exporter Configuration
Use `prom-client` in Express to expose `/metrics` endpoint for Prometheus scraping.
