#!/bin/sh
set -eu
CONNECTION_UUID="${NEO_CONNECTION_UUID:-cfd41123-404b-4de7-9e48-8ce376352f24}"
INTERFACE="${NEO_INTERFACE:-eth0}"
STAMP="/run/neo-network-recover.last"
COOLDOWN=600
NOW=$(date +%s)
has_ipv4() {
  ip -4 route show default | grep -q '^default ' && curl -4fsS --connect-timeout 6 --max-time 10 -o /dev/null https://discord.com/api/v10/gateway
}
if has_ipv4; then exit 0; fi
if [ "${1:-}" != "--force" ] && [ -f "$STAMP" ]; then
  LAST=$(cat "$STAMP" 2>/dev/null || printf '0')
  [ $((NOW - LAST)) -ge "$COOLDOWN" ] || exit 0
fi
printf '%s\n' "$NOW" > "$STAMP"
logger -t neo-network-recover "IPv4 indisponivel; renovando ${INTERFACE}"
nmcli --wait 30 connection up uuid "$CONNECTION_UUID" ifname "$INTERFACE"
sleep 5
if has_ipv4; then logger -t neo-network-recover "IPv4 e Discord restaurados"; exit 0; fi
logger -t neo-network-recover "IPv4 ainda indisponivel apos renovacao DHCP"
exit 1