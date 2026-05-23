#!/usr/bin/env bash
set -euo pipefail

# Hostinger SSH deploy script for TicketLagbe
# Usage (on Hostinger server):
#   1) Edit REPO variable below or export REPO before running
#   2) ./deploy-hostinger.sh /home/username/ticketlagbe main ticketlagbe
# Parameters:
#   $1 -> APP_DIR (default: /home/$USER/ticketlagbe)
#   $2 -> BRANCH (default: main)
#   $3 -> APP_NAME (pm2 process name, default: ticketlagbe)

REPO=${REPO:-"git@github.com:mdlabu661988-ops/ticket-lagbe.git"}
APP_DIR=${1:-"${HOME}/ticketlagbe"}
BRANCH=${2:-"main"}
APP_NAME=${3:-"ticketlagbe"}

echo "Deploying $REPO (branch: $BRANCH) to $APP_DIR"

export PATH="$HOME/node/bin:$PATH"
export RAYON_NUM_THREADS=1

if [ -d "$APP_DIR/.git" ]; then
  echo "Found existing repository, updating..."
  cd "$APP_DIR"
  git fetch --all --prune
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
  git clean -fd
else
  echo "Cloning repository..."
  git clone --depth=1 -b "$BRANCH" "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# Ensure Node/npm available; Hostinger usually provides Node.
# Install/Update pm2 for process management
if ! command -v pm2 >/dev/null 2>&1; then
  echo "Installing pm2 into local Node home..."
  npm install -g pm2 --prefix="$HOME/node"
fi

# Install deps and build
echo "Installing dependencies (using npm ci)..."
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "Building project..."
npm run build

# Ensure PORT is exported by Hostinger's environment or default to 3000
export PORT=${PORT:-3000}

# Start with pm2 (update-env will pick up exported env vars)
echo "Starting app with pm2 (name: $APP_NAME)..."
pm2 start --name "$APP_NAME" --update-env dist/server.cjs || pm2 restart "$APP_NAME" || pm2 start --name "$APP_NAME" --update-env dist/server.cjs

# Save pm2 list (so it can resurrect on reboot if pm2 startup configured)
pm2 save || true

echo "Deployment complete."
echo "Check logs with: pm2 logs $APP_NAME --lines 200"
