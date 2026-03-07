import json
import os
import requests
from duckduckgo_search import DDGS
from time import sleep

# --- CONFIGURAÇÃO PADRÃO IURY ---
SISTEMA = 'snes'
PASTA_IMAGENS = 'capas'  # Nome da pasta que você usa por padrão
TERMO_BUSCA = "snes box art high quality"

BASE_DIR = f"systems/{SISTEMA}"
JSON_FILE = f"{BASE_DIR}/games.json"
CAPAS_DIR = f"{BASE_DIR}/{PASTA_IMAGENS}"

if not os.path.exists(CAPAS_DIR):
    os.makedirs(CAPAS_DIR)

def download_capa(game_name, file_base_path):
    print(f"   🖼️  Buscando Capa: {game_name}...")
    try:
        with DDGS() as ddgs:
            query = f"{game_name} {TERMO_BUSCA}"
            results = list(ddgs.images(query, max_results=1))
            if results:
                img_url = results[0]['image']
                ext = ".png"
                if ".jpg" in img_url.lower() or ".jpeg" in img_url.lower():
                    ext = ".jpg"
                
                final_path = file_base_path + ext
                response = requests.get(img_url, timeout=15)
                if response.status_code == 200:
                    with open(final_path, 'wb') as f:
                        f.write(response.content)
                    print(f"      ✅ Salvo em capas/: {os.path.basename(final_path)}")
                    return ext
    except Exception as e:
        print(f"      ❌ Erro: {e}")
    return None

def main():
    print(f"🚀 INICIANDO DOWNLOAD PARA A PASTA: {PASTA_IMAGENS.upper()}")
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            games = json.load(f)
        
        for game in games:
            clean_id = game['id']
            base_save_path = f"{CAPAS_DIR}/{clean_id}"
            
            # Verifica se já existe para não baixar de novo
            ext = None
            if os.path.exists(base_save_path + ".png"): ext = ".png"
            elif os.path.exists(base_save_path + ".jpg"): ext = ".jpg"
            
            if not ext:
                ext = download_capa(game['nome'], base_save_path)
                if ext: sleep(1) # Pausa curta
            
            if ext:
                # Atualiza o caminho no JSON para o seu padrão 'capas/'
                game['capa'] = f"{PASTA_IMAGENS}/{clean_id}{ext}"

        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(games, f, indent=4, ensure_ascii=False)
        print(f"\n✅ PROCESSO CONCLUÍDO! O games.json agora aponta para a pasta '{PASTA_IMAGENS}'.")

except Exception as e:
    print(f"❌ Erro geral: {e}")

if __name__ == "__main__":
    main()
