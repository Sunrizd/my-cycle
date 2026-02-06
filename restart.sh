#!/bin/bash

# Kill processes on ports 3005 (API) and 5173 (Vite)
echo "Stopping existing processes..."
fuser -k 3005/tcp >/dev/null 2>&1
fuser -k 5173/tcp >/dev/null 2>&1

# Wait a moment for ports to clear
sleep 1

# Start again
./start.sh
