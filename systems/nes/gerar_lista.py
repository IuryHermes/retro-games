import os
import json

# Configurações
PASTA_ROMS = "roms"
PASTA_CAPAS = "capas"
ARQUIVO_SAIDA = "games.json"

lista_jogos = []

# Extensões de imagem aceitas
extensoes_img = ['.jpg', '.png', '.jpeg']

print(f"--- Iniciando escaneamento em '{PASTA_ROMS}' ---")

if not os.path.exists(PASTA_ROMS):
    print(f"ERRO: Pasta '{PASTA_ROMS}' não encontrada!")
    exit()

arquivos = sorted(os.listdir(PASTA_ROMS))

for arquivo in arquivos:
    if arquivo.endswith(".nes") or arquivo.endswith(".zip"):
        nome_real = os.path.splitext(arquivo)[0]
        # Cria um ID simples (sem espaços e caracteres especiais)
        id_jogo = "".join(c for c in nome_real if c.isalnum() or c in " -_").strip().replace(" ", "-").lower()
        
        # Tenta achar a capa (testa jpg, png, etc)
        caminho_capa = ""
        for ext in extensoes_img:
            nome_capa = nome_real + ext
            # Verifica se existe na pasta capas
            if os.path.exists(os.path.join(PASTA_CAPAS, nome_capa)):
                caminho_capa = f"{PASTA_CAPAS}/{nome_capa}"
                break
            
            # Tenta procurar pelo ID também se não achou pelo nome completo
            nome_capa_id = id_jogo + ext
            if not caminho_capa and os.path.exists(os.path.join(PASTA_CAPAS, nome_capa_id)):
                caminho_capa = f"{PASTA_CAPAS}/{nome_capa_id}"
                break

        # Se não achou capa, usa uma genérica (opcional)
        if not caminho_capa:
            caminho_capa = "capas/default.png" # Crie essa imagem se quiser

        jogo = {
            "id": id_jogo,
            "nome": nome_real,
            "rom": f"{PASTA_ROMS}/{arquivo}",
            "capa": caminho_capa
        }
        
        lista_jogos.append(jogo)
        print(f"Adicionado: {nome_real}")

# Salva o arquivo JSON
with open(ARQUIVO_SAIDA, "w", encoding="utf-8") as f:
    json.dump(lista_jogos, f, indent=4, ensure_ascii=False)

print(f"--- Sucesso! {len(lista_jogos)} jogos exportados para {ARQUIVO_SAIDA} ---")
