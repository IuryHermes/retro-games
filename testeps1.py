import json
import requests
import os

# Configurações
JSON_PATH = "systems/ps1/games.json"
BASE_URL = "https://pub-44d40f83db2141efb7e8a7658c74557e.r2.dev/"

def checar_url(url):
    try:
        r = requests.head(url, timeout=5)
        return r.status_code == 200
    except:
        return False

print("="*60)
print("🔍 ANALISANDO CAPAS E PREVIEWS DO PS1".center(60))
print("="*60)

if not os.path.exists(JSON_PATH):
    print(f"❌ Erro: Arquivo {JSON_PATH} não encontrado!")
    exit()

with open(JSON_PATH, 'r', encoding='utf-8') as f:
    jogos = json.load(f)

erros = 0
for jogo in jogos:
    nome_jogo = jogo.get('nome', 'Sem Nome')
    capa = jogo.get('capa', '')
    preview = jogo.get('preview', '')

    print(f"\n🎮 Jogo: {nome_jogo}")

    # Testar Capa
    if capa:
        url_capa = capa if capa.startswith('http') else BASE_URL + capa
        if checar_url(url_capa):
            print(f"  ✅ Capa OK")
        else:
            print(f"  ❌ Capa FORA: {url_capa}")
            erros += 1

    # Testar Preview
    if preview:
        url_preview = preview if preview.startswith('http') else BASE_URL + preview
        if checar_url(url_preview):
            print(f"  ✅ Preview OK")
        else:
            print(f"  ❌ Preview FORA: {url_preview}")
            erros += 1

print("\n" + "="*60)
print(f"ANÁLISE CONCLUÍDA | Erros encontrados: {erros}")
print("="*60)
