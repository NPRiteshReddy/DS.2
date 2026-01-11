const Queue = require('bull');

// Create video generation queue
// For Upstash or other Redis URLs with TLS
let queueOptions;

if (process.env.REDIS_URL) {
  const isUpstash = process.env.REDIS_URL.includes('upstash.io');

  queueOptions = {
    redis: process.env.REDIS_URL,
    createClient: (type, config) => {
      const Redis = require('ioredis');
      const url = process.env.REDIS_URL;

      const client = new Redis(url, {
        maxRetriesPerRequest: null, // Important for Bull
        enableReadyCheck: false,
        tls: isUpstash ? { rejectUnauthorized: false } : undefined,
        family: 4,
        // Reconnection settings
        retryStrategy: (times) => {
          const delay = Math.min(times * 1000, 30000);
          console.log(`Redis reconnecting... attempt ${times}, delay ${delay}ms`);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
        connectTimeout: 30000,
        keepAlive: 30000,
        lazyConnect: false
      });

      client.on('error', (err) => {
        console.error(`Redis ${type} connection error:`, err.message);
      });

      client.on('connect', () => {
        console.log(`Redis ${type} client connected`);
      });

      client.on('ready', () => {
        console.log(`Redis ${type} client ready`);
      });

      client.on('reconnecting', () => {
        console.log(`Redis ${type} client reconnecting...`);
      });

      return client;
    }
  };
} else {
  queueOptions = {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null
    }
  };
}

const videoGenerationQueue = new Queue('video-generation', {
  ...queueOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    timeout: 900000, // 15 minutes - AI-enhanced Manim takes longer
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200 // Keep last 200 failed jobs
  },
  settings: {
    lockDuration: 300000, // 5 minutes lock duration (default 30s is too short)
    stalledInterval: 120000, // Check for stalled jobs every 2 minutes
    maxStalledCount: 2, // Allow up to 2 stalls before failing
    lockRenewTime: 150000, // Renew lock every 2.5 minutes
    drainDelay: 5 // Delay between job processing
  }
});

// Audio generation queue for NotebookLM-style podcasts
const audioGenerationQueue = new Queue('audio-generation', {
  ...queueOptions,
  defaultJobOptions: {
    attempts: 2, // Fewer retries for audio (takes longer)
    backoff: {
      type: 'exponential',
      delay: 10000
    },
    removeOnComplete: 100,
    removeOnFail: 200
  }
});

// Event listeners for video queue
videoGenerationQueue.on('error', (error) => {
  console.error('❌ Video Queue error:', error.message);
});

videoGenerationQueue.on('waiting', (jobId) => {
  console.log(`⏳ Video Job ${jobId} is waiting`);
});

videoGenerationQueue.on('active', (job) => {
  console.log(`▶️  Video Job ${job.id} is now active`);
});

videoGenerationQueue.on('completed', (job, result) => {
  console.log(`✅ Video Job ${job.id} completed`);
});

videoGenerationQueue.on('failed', (job, err) => {
  console.error(`❌ Video Job ${job.id} failed:`, err.message);
});

// Event listeners for audio queue
audioGenerationQueue.on('error', (error) => {
  console.error('❌ Audio Queue error:', error.message);
});

audioGenerationQueue.on('waiting', (jobId) => {
  console.log(`🎧 Audio Job ${jobId} is waiting`);
});

audioGenerationQueue.on('active', (job) => {
  console.log(`🎙️  Audio Job ${job.id} is now active`);
});

audioGenerationQueue.on('completed', (job, result) => {
  console.log(`🎵 Audio Job ${job.id} completed`);
});

audioGenerationQueue.on('failed', (job, err) => {
  console.error(`❌ Audio Job ${job.id} failed:`, err.message);
});

module.exports = {
  videoGenerationQueue,
  audioGenerationQueue
};
