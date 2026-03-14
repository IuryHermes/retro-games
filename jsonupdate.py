import os
import json
import re

def limpar_nome_bonito(nome):
    # Remove extensões
    nome = re.sub(r'\.(nes|snes|smc|sfc|gba|md|bin|gen|z64|v64|n64|iso|cue|img|zip)', '', nome, flags=re.I)
    # Remove tudo dentro de parênteses e colchetes (USA, Europe, [!], Pt-Br)
    nome = re.sub(r'[\(\[][^\]\)]*[\)\]]', '', nome)
    # Troca underscores e hífens por espaços
    nome = nome.replace('_', ' ').replace('-', ' ')
    # Limpa espaços duplos e coloca em Título
    nome = ' '.join(nome.split()).title()
    return nome

def gerar_catalogo():
    base_path = "./systems"
    sistemas = ['nes', 'snes', 'megadrive', 'gba', 'ps1', 'n64']
    
    for sys in sistemas:
        pasta_roms = os.path.join(base_path, sys, "roms")
        if not os.path.exists(pasta_roms):
            continue

        lista_jogos = []
        print(f"[*] Processando {sys.upper()}...")

        for arquivo in sorted(os.listdir(pasta_roms)):
            # Ignorar arquivos de sistema e bios
            if arquivo.startswith('.') or 'scph' in arquivo.lower():
                continue
            
            # Para PS1, focamos apenas no arquivo principal (bin ou m3u) para não duplicar com .cue
            if sys == 'ps1' and not arquivo.lower().endswith(('.bin', '.m3u', '.pbp')):
                continue

            nome_exibicao = limpar_nome_bonito(arquivo)
            
            # Monta o objeto do jogo
            jogo = {
                "nome": nome_exibicao,
                "rom": f"roms/{arquivo}",
                "capa": f"assets/capas/{sys}/{arquivo.replace(os.path.splitext(arquivo)[1], '.jpg')}"
            }
            lista_jogos.append(jogo)

        # Salva o games.json dentro da pasta do sistema
        caminho_json = os.path.join(base_path, sys, "games.json")
        with open(caminho_json, 'w', encoding='utf-8') as f:
            json.dump(lista_jogos, f, indent=4, ensure_ascii=False)
        
        print(f"[V] {len(lista_jogos)} jogos listados em {sys}/games.json")

if __name__ == "__main__":
    gerar_catalogo()
