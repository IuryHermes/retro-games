import json
import os
import requests
import re
from time import sleep
import random

# --- CONFIGURAÇÃO ---
# Como você já está na pasta do NES, o diretório é o atual (.)
DIR_SISTEMA = "." 
JSON_FILE = "games.json"
DIR_CAPAS = "capas"
DIR_GIFS = "previews"

# Cabeçalhos para evitar bloqueio 403
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
}

def setup_dirs():
    if not os.path.exists(DIR_CAPAS): os.makedirs(DIR_CAPAS)
    if not os.path.exists(DIR_GIFS): os.makedirs(DIR_GIFS)

def limpar_nome(nome):
    nome = nome.replace('.nes', '').replace('.zip', '')
    nome = re.sub(r'\([^)]*\)', '', nome) 
    nome = re.sub(r'\[[^\]]*\]', '', nome) 
    nome = re.sub(r'[^a-zA-Z0-9 \-\&]', '', nome) 
    return nome.strip()

def buscar_links_bing(query, tipo='imagem'):
    q = query.replace(" ", "+")
    if tipo == 'gif':
        url = f"https://www.bing.com/images/search?q={q}&qft=+filterui:photo-animatedgif&first=1"
    else:
        url = f"https://www.bing.com/images/search?q={q}&first=1"

    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        links = re.findall(r'murl&quot;:&quot;(http[^&]+?)&quot;', res.text)
        return links[:3] 
    except Exception:
        return []

def baixar_arquivo(urls, destino_base, extensao_forca=None):
    for i, url in enumerate(urls):
        try:
            ext = ".jpg"
            if ".png" in url.lower(): ext = ".png"
            if ".gif" in url.lower(): ext = ".gif"
            if extensao_forca: ext = extensao_forca

            caminho_final = destino_base + ext
            
            print(f"    ⬇ Baixando (Opção {i+1})...", end="", flush=True)
            r = requests.get(url, headers=HEADERS, timeout=15)
            
            if r.status_code == 200:
                with open(caminho_final, 'wb') as f:
                    f.write(r.content)
                print(" ✅ Sucesso!")
                return ext 
            else:
                print(f" ✖ Erro {r.status_code}")
                
        except Exception:
            continue
    return None 

def main():
    print(f"🔧 INICIANDO SINCRONIZAÇÃO E CORREÇÃO: NES")
    setup_dirs()
    
    if not os.path.exists(JSON_FILE):
        print(f"❌ JSON não encontrado: {os.path.abspath(JSON_FILE)}")
        return

    with open(JSON_FILE, 'r', encoding='utf-8') as f:
        games = json.load(f)
    
    alteracoes = 0
    
    try:
        for idx, game in enumerate(games):
            nome_limpo = limpar_nome(game['nome'])
            
            # Limpa o ID removendo .nes se houver
            clean_id = game['id']
            if clean_id.endswith('.nes'):
                clean_id = clean_id[:-4]
            if clean_id.endswith('.zip'):
                clean_id = clean_id[:-4]

            path_capa_base = f"{DIR_CAPAS}/{clean_id}"
            path_gif_base = f"{DIR_GIFS}/{clean_id}"
            
            print(f"\n[{idx+1}/{len(games)}] {game['nome']}")

            # --- CORREÇÃO DE CAPAS ---
            nova_capa = None
            
            # 1. Verifica se JÁ EXISTE o arquivo físico
            if os.path.exists(path_capa_base + ".png"):
                nova_capa = f"capas/{clean_id}.png"
                print("  ✔ Arquivo PNG detectado localmente.")
            elif os.path.exists(path_capa_base + ".jpg"):
                nova_capa = f"capas/{clean_id}.jpg"
                print("  ✔ Arquivo JPG detectado localmente.")
            
            # 2. Se não existe, BAIXA
            else:
                print(f"  📥 Arquivo não existe. Buscando no Bing...")
                links = buscar_links_bing(f"{nome_limpo} nes box art front official", 'imagem')
                ext = baixar_arquivo(links, path_capa_base)
                if ext:
                    nova_capa = f"capas/{clean_id}{ext}"
                    sleep(random.uniform(1.5, 2.5))

            # 3. ATUALIZA O JSON SE PRECISAR
            # Importante: Como estamos na pasta, o caminho no json deve ser relativo a ela ou a raiz?
            # O player usa systems/nes/capas/... então aqui salvamos como capas/...
            if nova_capa and game.get('capa') != nova_capa:
                game['capa'] = nova_capa
                alteracoes += 1
                print(f"  💾 JSON Atualizado: {nova_capa}")
            elif not nova_capa:
                print("  ⚠️ Nenhuma capa encontrada.")

            # --- CORREÇÃO DE GIFS ---
            if not os.path.exists(path_gif_base + ".gif"):
                 print(f"  🎬 GIF faltando. Buscando...")
                 links = buscar_links_bing(f"{nome_limpo} nes gameplay", 'gif')
                 baixar_arquivo(links, path_gif_base, ".gif")
                 sleep(random.uniform(1.5, 2.5))
            else:
                 print("  ✔ GIF OK")

            # Salva periodicamente
            if alteracoes > 0 and alteracoes % 10 == 0:
                with open(JSON_FILE, 'w', encoding='utf-8') as f:
                    json.dump(games, f, indent=4, ensure_ascii=False)

    except KeyboardInterrupt:
        print("\n🛑 Parado pelo usuário.")

    # Salva final
    with open(JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(games, f, indent=4, ensure_ascii=False)
    
    print(f"\n✅ PROCESSO CONCLUÍDO! {alteracoes} entradas corrigidas no JSON.")

if __name__ == "__main__":
    main()
