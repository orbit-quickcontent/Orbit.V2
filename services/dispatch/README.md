# ORBIT — Nearby Partner Dispatch Service

High-performance real-time partner dispatch microservice built with **Node.js 20, Express, Socket.IO, and Redis GEO**.

## Features
- 📍 **Redis GEO Spatial Engine:** Live location indexing and sub-millisecond radius search.
- ⚡ **Cascading Search:** Radius expansion from 3 km → 5 km → 8 km → 12 km.
- 🎯 **Multi-Factor Ranking Formula:** Weighted scoring based on proximity (70%), active workload (20%), and historical acceptance score (10%).
- ⏳ **15-Second Offer Window:** Socket-driven offer popup with visual timer and automatic next-nearest partner fallback.
- 🔄 **Firestore Lifecycle Compatible:** 12-state booking lifecycle sync across Client, Partner, Editor, and Admin apps.
- 🔒 **Security:** JWT role-based socket authentication, rate limiting, and Helmet protections.

## Quick Start (Local Development)

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Redis Container:**
   ```bash
   docker-compose up -d redis
   ```

3. **Run Dev Server:**
   ```bash
   npm run dev
   ```

4. **Simulate 2-Partner Booking Dispatch:**
   ```bash
   npm run test
   ```
