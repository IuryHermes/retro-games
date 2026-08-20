#!/usr/bin/env bash
set -euo pipefail
umask 077
base="$HOME/neo-admin-console"
config="$HOME/.config/neo-admin-console.env"
password_file="$base/.password-hash"
username_file="$base/.admin-username"
initial_file="$base/INITIAL_PASSWORD.txt"
mkdir -p "$HOME/.config" "$HOME/.config/systemd/user"
if [[ ! -s "$HOME/.config/neo-admin-worker.secret" ]]; then
  openssl rand -hex 32 > "$HOME/.config/neo-admin-worker.secret"
fi
if [[ ! -s "$username_file" ]]; then printf 'admin\n' > "$username_file"; fi
if [[ ! -s "$password_file" ]]; then
  initial="$(openssl rand -hex 12)"
  INITIAL_PASSWORD="$initial" PASSWORD_HASH_FILE="$password_file" node --input-type=module -e 'import{randomBytes,scrypt as cb}from"node:crypto";import{promisify}from"node:util";import{writeFile}from"node:fs/promises";const s=promisify(cb),salt=randomBytes(16),hash=await s(process.env.INITIAL_PASSWORD,salt,64);await writeFile(process.env.PASSWORD_HASH_FILE,`scrypt:${salt.toString("hex")}:${Buffer.from(hash).toString("hex")}`,{mode:0o600})'
  printf '%s\n' "$initial" > "$initial_file"
fi
{
  printf 'ADMIN_PORT=8790\n'
  printf 'WORKER_URL=https://webhook-pix-cafe.neoterminalroom-oficial.workers.dev\n'
  printf 'PASSWORD_HASH_FILE=%s\n' "$password_file"
  printf 'ADMIN_USERNAME_FILE=%s\n' "$username_file"
  printf 'WORKER_ADMIN_KEY=%s\n' "$(cat "$HOME/.config/neo-admin-worker.secret")"
} > "$config"
chmod 600 "$config" "$password_file" "$username_file" "$HOME/.config/neo-admin-worker.secret"
cp "$base/neo-admin-console.service" "$HOME/.config/systemd/user/neo-admin-console.service"
systemctl --user daemon-reload
systemctl --user enable --now neo-admin-console.service
systemctl --user is-active neo-admin-console.service
