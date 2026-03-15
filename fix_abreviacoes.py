import json
import os

# Dicionário de Correção (Pedaço do nome do jogo -> Nome do arquivo exato da capa)
correcoes = {
    "gba": {
        "asterix": "asterix-obelix.jpg",
        "boktai the sun": "boktai.jpg",
        "crash bandicoot the huge": "crash-huge.jpg",
        "dinotopia": "dinotopia.jpg",
        "dragon ball gt": "dbgt.jpg",
        "legacy of goku ii": "dbz-legacy-2.jpg",
        "f zero maximum": "f-zero.jpg",
        "final fantasy i ii": "ff-1-2.jpg",
        "chamber of secrets": "hp-chamber.jpg",
        "order of the phoenix": "hp-phoenix.jpg",
        "sorcerer s stone": "hp-stone.jpg",
        "justice league heroes the flash": "jl-flash.jpg",
        "king kong": "king-kong.jpg",
        "kirby and the amazing": "kirby.jpg",
        "koala brothers": "koala.jpg",
        "kong the animated": "kong.jpg",
        "naruto ninja council": "naruto.jpg",
        "r type iii": "rtype-iii.jpg",
        "robot wars": "robot-wars.jpg"
    },
    "ps1": {
        "a i t d": "alone-in-the-dark.jpg",
        "alone in the dark": "alone-in-the-dark.jpg"
    }
}

for sys, regras in correcoes.items():
    json_path = f'systems/{sys}/games.json'
    
    if not os.path.exists(json_path):
        continue
        
    with open(json_path, 'r', encoding='utf-8') as f:
        games = json.load(f)
        
    alterados = 0
    for g in games:
        nome_jogo = g.get('nome', '').lower()
        
        for pedaco_nome, nome_arquivo_certo in regras.items():
            if pedaco_nome in nome_jogo:
                g['capa'] = nome_arquivo_certo
                # Se usar gif, já arruma o preview baseado na extensão da capa
                g['preview'] = nome_arquivo_certo.replace('.jpg', '.gif').replace('.png', '.gif')
                alterados += 1
                break 
                
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(games, f, indent=4, ensure_ascii=False)
        
    print(f"[{sys.upper()}] {alterados} jogos foram costurados com suas capas abreviadas!")
