#!/bin/bash
# Cloudflare Named Tunnel Setup for Fitness
# Run this once to set up a persistent tunnel with a stable URL

set -e

echo "=== Step 1: Cloudflare Login ==="
echo "A browser window will open. Log into your Cloudflare account."
echo "(If you don't have one, create a free account at cloudflare.com first)"
echo ""
cloudflared tunnel login

echo ""
echo "=== Step 2: Create Named Tunnel ==="
cloudflared tunnel create kgo-fitness

echo ""
echo "=== Step 3: Get Tunnel ID ==="
TUNNEL_ID=$(cloudflared tunnel list | grep kgo-fitness | awk '{print $1}')
echo "Tunnel ID: $TUNNEL_ID"

echo ""
echo "=== Step 4: Write Config ==="
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config-fitness.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: /Users/koda/.cloudflared/${TUNNEL_ID}.json

ingress:
  - hostname: fitness.kgo.local
    service: http://localhost:3102
  - service: http_status:404
EOF

echo ""
echo "Config written to ~/.cloudflared/config-fitness.yml"
echo ""
echo "=== Step 5: Next Steps ==="
echo "You'll need a domain pointed at Cloudflare to route traffic."
echo "If you have one, run:"
echo "  cloudflared tunnel route dns kgo-fitness fitness.yourdomain.com"
echo "  cloudflared tunnel --config ~/.cloudflared/config-fitness.yml run"
echo ""
echo "Or if you just want the free trycloudflare.com URL to be persistent:"
echo "  The quick tunnel is already running and auto-restarts."
