#!/usr/bin/env bash
set -euo pipefail

services=(
  hermes-discord-concursos.service
  hermes-discord-jornalista.service
  neo-discord-live.service
)

for service in "${services[@]}"; do
  printf '%s=' "$service"
  systemctl --user is-active "$service"
done

# Validate the private Worker route without marking anyone as live.
source "$HOME/.config/neo-discord-live.env"
curl --fail --silent --show-error \
  -H 'Content-Type: application/json' \
  -H "X-Monitor-Secret: $MONITOR_SECRET" \
  --data '{"discordId":"1383061667243360366","channelId":"","streaming":false}' \
  "$WORKER_URL/internal/discord-live"
printf '\n'
