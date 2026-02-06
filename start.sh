#!/bin/bash

# Start Application (Unified)
echo "Starting Period Tracker (API + Web)..."
echo "Access via http://localhost:5173"

# Run in background (nohup) using the unified npm script
nohup npm run dev > app.log 2>&1 &

echo "PID: $!"
echo "Logs available in app.log"
