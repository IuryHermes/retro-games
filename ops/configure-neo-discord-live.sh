#!/usr/bin/env bash
set -euo pipefail

config_dir="$HOME/.config"
secret_file="$config_dir/neo-discord-monitor.secret"
env_file="$config_dir/neo-discord-live.env"
token_file="$HOME/hermes-discord/boot_jornalista/.env"

umask 077
mkdir -p "$config_dir"

if [[ ! -s "$secret_file" ]]; then
  openssl rand -hex 32 > "$secret_file"
fi

bot_token="$(sed -n 's/^DISCORD_BOT_TOKEN=//p' "$token_file" | head -n 1)"
monitor_secret="$(tr -d '\r\n' < "$secret_file")"

if [[ -z "$bot_token" || -z "$monitor_secret" ]]; then
  echo "Token do bot ou segredo do monitor ausente." >&2
  exit 1
fi

tmp_file="${env_file}.tmp"
{
  printf 'DISCORD_BOT_TOKEN=%s\n' "$bot_token"
  printf 'MONITOR_SECRET=%s\n' "$monitor_secret"
  printf 'WORKER_URL=%s\n' 'https://webhook-pix-cafe.neoterminalroom-oficial.workers.dev'
  printf 'DISCORD_LIVE_CHANNEL_ID=%s\n' '1537280728922849332'
} > "$tmp_file"
mv "$tmp_file" "$env_file"
chmod 600 "$secret_file" "$env_file"
