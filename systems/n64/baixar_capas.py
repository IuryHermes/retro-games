import os
import json
import urllib.request
import difflib
import ssl

# --- CONFIGURAÇÃO ---
PASTA_ROMS = "roms"
PASTA_CAPAS = "capas"
# Repositório oficial de capas (Thumbnails) do Libretro
API_URL = "https://api.github.com/repos/libretro-thumbnails/Nintendo_-_Nintendo_64/contents/Named_Boxarts"
RAW_URL_BASE = "https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Nintendo_64/master/Named_Boxarts/"

# Ignora verificação SSL (para evitar erros no Kali)
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def main():
    if not os.path.exists(PASTA_CAPAS):
        os.makedirs(PASTA_CAPAS)
        print(f"[+] Pasta '{PASTA_CAPAS}' criada.")

    print("[*] Conectando ao banco de dados de capas (GitHub)...")
    try:
        # Baixa a lista de todas as capas disponíveis no repositório
        req = urllib.request.Request(API_URL, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx) as response:
            data = json.loads(response.read().decode())
            # Cria lista apenas com os nomes dos arquivos (ex: "Super Mario 64.png")
            db_capas = [item['name'] for item in data if item['name'].endswith('.png')]
            print(f"[+] Banco de dados carregado: {len(db_capas)} capas disponíveis.")
    except Exception as e:
        print(f"[-] Erro ao conectar no GitHub: {e}")
        return

    # Lista roms locais
    local_roms = [f for f in os.listdir(PASTA_ROMS) if f.endswith(('.z64', '.n64', '.v64'))]
    print(f"[*] Analisando {len(local_roms)} jogos locais...")

    for rom in local_roms:
        # 1. Limpa o nome da ROM para tentar achar (ex: "007_goldeneye.z64" -> "007 goldeneye")
        nome_limpo = rom.replace('_', ' ').rsplit('.', 1)[0]
        
        # 2. Tenta encontrar o nome mais parecido no banco de dados
        match = difflib.get_close_matches(nome_limpo, db_capas, n=1, cutoff=0.4)
        
        if match:
            capa_remota = match[0] # Ex: "GoldenEye 007 (USA).png"
            url_download = RAW_URL_BASE + urllib.request.quote(capa_remota)
            arquivo_destino = os.path.join(PASTA_CAPAS, rom.rsplit('.', 1)[0] + ".jpg")
            
            # Se a capa já existe, pula
            if os.path.exists(arquivo_destino):
                print(f"[.] Já existe: {rom}")
                continue

            print(f"[⬇] Baixando: {capa_remota} -> {os.path.basename(arquivo_destino)}")
            try:
                urllib.request.urlretrieve(url_download, arquivo_destino)
            except Exception as e:
                print(f"   [X] Falha ao baixar: {e}")
        else:
            print(f"[!] Nenhuma capa encontrada para: {rom} (Nome muito diferente?)")

    print("\n--- FINALIZADO ---")
    print("Se algum jogo ficou sem capa, verifique se o nome está correto.")

if __name__ == "__main__":
    main()
