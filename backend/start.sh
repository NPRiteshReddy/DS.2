#!/bin/sh
# Start both server and worker
echo "Starting server and worker..."

# Start worker in background
node src/worker.js &

# Start server in foreground
node src/server.js
