#!/bin/sh
# Selah — why is the API not answering?
cd "$(dirname "$0")/platform" || exit 1
echo "═══ 1. Are the containers running? ═══════════════════════════════"
docker compose ps
echo
echo "═══ 2. What did the API say before it died? ══════════════════════"
docker compose logs api --tail=60
echo
echo "═══ 3. Can the API be reached directly, bypassing nginx? ═════════"
curl -s -o /dev/null -w "  direct  http://localhost:3000/api/healthz  ->  %{http_code}\n" http://localhost:3000/api/healthz
curl -s -o /dev/null -w "  proxied http://localhost:8080/api/healthz  ->  %{http_code}\n" http://localhost:8080/api/healthz
echo
echo "  If (3) direct works but proxied is 502, the problem is nginx's upstream."
echo "  If both fail, the API container is down — read (2)."
