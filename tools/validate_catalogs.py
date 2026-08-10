"""Read-only validation for the NeoTerminalRoom game catalogs."""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SYSTEMS = ("nes", "snes", "n64", "gba", "megadrive", "ps1")
REQUIRED = ("nome", "rom")


def validate(system: str) -> tuple[list[str], list[str]]:
    path = ROOT / "systems" / system / "games.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    errors: list[str] = []
    if not isinstance(data, list):
        return [f"{system}: catálogo não é uma lista"], []
    for index, game in enumerate(data):
        missing = [field for field in REQUIRED if not game.get(field)]
        if missing:
            errors.append(f"{system}[{index}]: campos ausentes: {', '.join(missing)}")
    duplicates = [rom for rom, count in Counter(game.get("rom") for game in data).items() if count > 1]
    warnings = [f"{system}: ROM duplicada: {rom}" for rom in duplicates]
    return errors, warnings


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    total = 0
    for system in SYSTEMS:
        path = ROOT / "systems" / system / "games.json"
        if not path.exists():
            errors.append(f"{system}: games.json não encontrado")
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        total += len(data) if isinstance(data, list) else 0
        current_errors, current_warnings = validate(system)
        errors.extend(current_errors)
        warnings.extend(current_warnings)
    if errors:
        print("CATÁLOGO INVÁLIDO")
        print("\n".join(errors))
        return 1
    print(f"OK: {total} registros validados em {len(SYSTEMS)} sistemas (somente leitura).")
    if warnings:
        print("AVISOS (não alterados por escopo):")
        print("\n".join(warnings))
    return 0


if __name__ == "__main__":
    sys.exit(main())
