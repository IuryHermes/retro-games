#!/usr/bin/env bash
set -euo pipefail

services=(
  hermes-discord-concursos.service
  hermes-discord-jornalista.service
)

for service in "${services[@]}"; do
  printf '%s=' "$service"
  systemctl --user is-active "$service"
done
