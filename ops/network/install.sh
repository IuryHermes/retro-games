#!/bin/sh
set -eu
BASE=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
install -o root -g root -m 0755 "$BASE/neo-network-recover.sh" /usr/local/sbin/neo-network-recover
install -o root -g root -m 0644 "$BASE/neo-network-recover.service" /etc/systemd/system/neo-network-recover.service
install -o root -g root -m 0644 "$BASE/neo-network-recover.timer" /etc/systemd/system/neo-network-recover.timer
install -o root -g root -m 0440 "$BASE/neo-network-recover.sudoers" /etc/sudoers.d/neo-network-recover
visudo -cf /etc/sudoers.d/neo-network-recover
systemctl daemon-reload
systemctl enable --now neo-network-recover.timer
/usr/local/sbin/neo-network-recover --force