# Redis Usage & Alternatives Guide

This document explains why Redis is used in the Student Learning Platform and explores alternatives.

---

## Why Redis is Used in This Project

### Primary Purpose: Job Queue Management

Redis serves as the **message broker and job persistence layer** for Bull queue, enabling asynchronous processing of long-running tasks.

```
┌─────────────┐     ┌─────────┐     ┌─────────────┐
│   Frontend  │────→│   API   │────→│ Redis Queue │
│  (React)    │     │(Express)│     │   (Bull)    │
└─────────────┘     └─────────┘     └──────┬──────┘
                                           │
                    ┌──────────────────────┘
                    │
                    ▼
              ┌───────────┐     ┌─────────────┐
              │  Worker   │────→│  Supabase   │
              │ (Node.js) │     │ (Database)  │
              └───────────┘     └─────────────┘
```

### Two Job Queues

| Queue | Purpose | Timeout | Retries |
|-------|---------|---------|---------|
| `video-generation` | Create educational videos from URLs | 5 min | 3x (5s, 10s, 20s backoff) |
| `audio-generation` | Create audio overviews (podcast-style) | 3 min | 2x (10s, 20s, 40s backoff) |

### What Redis Provides

1. **Decoupled Processing**
   - API returns immediately with jobId (202 Accepted)
   - Worker processes in background (2-5 minutes)
   - Frontend polls for status updates

2. **Job Persistence**
   - Jobs survive server restarts
   - Failed jobs automatically retry
   - Job history maintained for debugging

3. **Scalability**
   - Multiple workers can consume from same queue
   - Fair job distribution via FIFO ordering
   - Handles concurrent requests gracefully

4. **Reliability**
   - Atomic operations prevent race conditions
   - Job state tracked throughout lifecycle
   - Automatic cleanup of completed/failed jobs

---

## What Happens WITHOUT Redis

| Problem | Impact |
|---------|--------|
| **Request Timeout** | 2-5 min video generation exceeds HTTP timeout (30-60s) |
| **No Persistence** | Server crash = jobs lost forever |
| **No Retries** | Transient failures become permanent |
| **Resource Exhaustion** | Can't handle concurrent long-running requests |
| **No Progress Tracking** | Can't show real-time status to users |
| **No Cancellation** | Users can't cancel in-progress jobs |

---

## Redis Alternatives Comparison

### Recommended Alternatives

#### 1. PostgreSQL-Based Queue (pg-boss)
**Best for: Projects already using PostgreSQL (like Supabase)**

```javascript
// Current (Bull + Redis)
const Queue = require('bull');
const queue = new Queue('video-generation', { redis: REDIS_URL });

// Alternative (pg-boss + PostgreSQL)
const PgBoss = require('pg-boss');
const boss = new PgBoss(SUPABASE_CONNECTION_STRING);
await boss.start();
await boss.send('video-generation', jobData);
```

| Pros | Cons |
|------|------|
| Uses existing Supabase database | 20-50% slower than Redis |
| No additional service to manage | Adds load to database |
| ACID transactions for jobs | Polling-based (not push) |
| Free tier compatible | Less ecosystem support |

**Migration Effort:** Medium (2-3 days)

---

#### 2. BullMQ with Upstash Redis (Current Architecture)
**Best for: Production deployments, scalability**

```javascript
// Already implemented in queue.js
const { Queue } = require('bullmq');
const queue = new Queue('video-generation', {
  connection: { host: 'upstash.io', port: 6379, tls: {} }
});
```

| Pros | Cons |
|------|------|
| Fastest performance | Monthly cost ($10-50+) |
| Managed service (no maintenance) | Vendor dependency |
| Auto-scaling, TLS included | Another service to manage |
| Production-ready | Requires internet connectivity |

**Current Choice:** This is what the project uses now.

---

#### 3. In-Memory Queue (for Development Only)
**Best for: Local development without Redis**

```javascript
// Simple in-memory fallback
const jobs = new Map();
const queue = {
  add: (name, data) => {
    const id = Date.now().toString();
    jobs.set(id, { data, status: 'pending' });
    setTimeout(() => processJob(id), 0);
    return { id };
  }
};
```

| Pros | Cons |
|------|------|
| Zero dependencies | Jobs lost on restart |
| Works offline | No persistence |
| Good for testing | Not production-ready |
| Simple implementation | No retry logic |

**Migration Effort:** Low (1 day)

---

#### 4. SQLite Queue (Embedded Alternative)
**Best for: Single-server deployments**

```javascript
// Using better-queue with SQLite
const Queue = require('better-queue');
const SQLiteStore = require('better-queue-sqlite');

const queue = new Queue(processJob, {
  store: new SQLiteStore({ path: './jobs.sqlite' })
});
```

| Pros | Cons |
|------|------|
| Embedded (no external service) | Single-server only |
| Persistent across restarts | No distributed workers |
| Simple setup | Limited scalability |
| Works offline | Less feature-rich |

**Migration Effort:** Medium (2 days)

---

#### 5. RabbitMQ
**Best for: Enterprise, multi-service architectures**

```javascript
const amqp = require('amqplib');
const conn = await amqp.connect('amqp://localhost');
const channel = await conn.createChannel();
await channel.assertQueue('video-generation');
channel.sendToQueue('video-generation', Buffer.from(JSON.stringify(jobData)));
```

| Pros | Cons |
|------|------|
| Enterprise-grade reliability | Heavy resource usage |
| AMQP protocol (multi-language) | Complex setup |
| Advanced routing | Overkill for this project |
| High throughput | Requires dedicated server |

**Migration Effort:** High (1 week)

---

#### 6. Cloud-Native Options

| Service | Best For | Cost Model |
|---------|----------|------------|
| **AWS SQS** | AWS deployments | Pay per message |
| **Google Cloud Tasks** | GCP deployments | Pay per operation |
| **Azure Service Bus** | Azure deployments | Pay per operation |

---

## Recommendation Matrix

| Scenario | Recommended Solution |
|----------|---------------------|
| **Keep current (production)** | Upstash Redis (current) |
| **Reduce costs** | pg-boss with Supabase |
| **Local development** | In-memory queue fallback |
| **Self-hosted** | SQLite or pg-boss |
| **Enterprise scale** | RabbitMQ or AWS SQS |

---

## Implementation: Adding Redis Fallback

To make the project work without Redis (for development):

```javascript
// backend/src/jobs/queue.js - Add fallback
const Queue = require('bull');

let videoGenerationQueue;
let audioGenerationQueue;

if (process.env.REDIS_URL) {
  // Production: Use Redis
  videoGenerationQueue = new Queue('video-generation', process.env.REDIS_URL);
  audioGenerationQueue = new Queue('audio-generation', process.env.REDIS_URL);
} else {
  // Development: Use in-memory mock
  console.warn('REDIS_URL not set - using in-memory queue (not for production)');

  const createMockQueue = (name) => ({
    name,
    jobs: new Map(),
    add: async (jobName, data, opts) => {
      const id = `${name}-${Date.now()}`;
      const job = { id, data, opts, status: 'waiting' };
      this.jobs.set(id, job);
      // Process immediately in development
      setImmediate(() => this.process(job));
      return job;
    },
    process: (handler) => { this.handler = handler; },
    on: () => {},
    getJob: async (id) => this.jobs.get(id)
  });

  videoGenerationQueue = createMockQueue('video-generation');
  audioGenerationQueue = createMockQueue('audio-generation');
}

module.exports = { videoGenerationQueue, audioGenerationQueue };
```

---

## Current Redis Configuration

```javascript
// From backend/src/jobs/queue.js
const queueOptions = {
  redis: {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => Math.min(times * 500, 5000),
    reconnectOnError: (err) => err.message.includes('READONLY'),
    tls: process.env.REDIS_URL?.includes('upstash') ? {} : undefined,
    keepAlive: 30000
  }
};

// Video queue: 3 retries, 5min timeout
const videoGenerationQueue = new Queue('video-generation', {
  ...queueOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200
  }
});
```

---

## Summary

**Why Redis?**
- Enables async processing of 2-5 minute video generation jobs
- Provides job persistence, retries, and scalability
- Decouples API from worker for better user experience

**Best Alternative for This Project:**
- **pg-boss** if you want to eliminate Redis dependency (uses existing Supabase)
- **Keep Upstash Redis** for production reliability

**For Development Without Redis:**
- Add in-memory queue fallback (shown above)
- Or run local Redis: `docker run -p 6379:6379 redis`
