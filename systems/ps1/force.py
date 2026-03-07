import json
import os

# Configurações
ROMS_DIR = "roms"
JSON_FILE = "games.json"

print("--- ☢️ INICIANDO MODO FORÇA BRUTA (.BIN) ---")

# 1. Atualizar games.json para apontar direto para o .bin
with open(JSON_FILE, "r", encoding="utf-8") as f:
    games = json.load(f)

changed = False
for game in games:
    rom = game["rom"]
    # Se for .cue, troca para .bin
    if rom.endswith(".cue"):
        new_rom = rom.replace(".cue", ".bin")
        # Verifica se o .bin realmente existe antes de trocar
        if os.path.exists(new_rom):
            game["rom"] = new_rom
            changed = True
            print(f"JSON Atualizado: {rom} -> {new_rom}")
        else:
            print(f"⚠️ AVISO: {new_rom} não encontrado! Mantendo .cue")

if changed:
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(games, f, indent=2, ensure_ascii=False)
    print("✅ games.json salvo com sucesso!")

# 2. Atualizar arquivos .m3u para listar .bin
for filename in os.listdir(ROMS_DIR):
    if filename.endswith(".m3u"):
        path = os.path.join(ROMS_DIR, filename)
        with open(path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        
        new_lines = []
        file_changed = False
        for line in lines:
            clean_line = line.strip()
            if clean_line.endswith(".cue"):
                # Tenta achar o .bin correspondente
                bin_name = clean_line.replace(".cue", ".bin")
                if os.path.exists(os.path.join(ROMS_DIR, bin_name)):
                    new_lines.append(bin_name)
                    file_changed = True
                    print(f"Playlist {filename}: {clean_line} -> {bin_name}")
                else:
                    new_lines.append(clean_line)
            else:
                new_lines.append(clean_line)
        
        if file_changed:
            with open(path, "w", encoding="utf-8") as f:
                f.write("\n".join(new_lines))

print("--- 🏁 TUDO CONVERTIDO PARA BINÁRIO ---")
