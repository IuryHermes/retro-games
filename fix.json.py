import json
import os
import re

sistemas = ['nes', 'snes', 'n64', 'gba', 'megadrive', 'ps1']
base_dir = 'systems'

def get_clean_name(filename):
    """Remove extensão e caracteres problemáticos para comparação."""
    name, _ = os.path.splitext(filename)
    return re.sub(r'[^a-zA-Z0-9]', '', name).lower()

for sys in sistemas:
    sys_dir = os.path.join(base_dir, sys)
    json_path = os.path.join(sys_dir, 'games.json')
    capas_dir = os.path.join(sys_dir, 'capas')
    previews_dir = os.path.join(sys_dir, 'previews')
    
    if not os.path.exists(json_path):
        continue
        
    print(f"--- Processando sistema: {sys} ---")
    
    # Mapeia as capas reais na pasta
    capas_reais = {}
    if os.path.exists(capas_dir):
        for f in os.listdir(capas_dir):
            if f.endswith(('.jpg', '.png', '.jpeg')):
                capas_reais[get_clean_name(f)] = f

    # Mapeia os previews reais na pasta
    previews_reais = {}
    if os.path.exists(previews_dir):
        for f in os.listdir(previews_dir):
            if f.endswith(('.gif', '.mp4')):
                previews_reais[get_clean_name(f)] = f
                
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            games = json.load(f)
            
        for g in games:
            # Extrai o nome base da ROM a partir do que está no JSON
            rom_filename = os.path.basename(g.get('rom', ''))
            clean_rom_name = get_clean_name(rom_filename)
            
            # Tenta encontrar a capa correspondente
            if clean_rom_name in capas_reais:
                # Agora o JSON aponta apenas para o nome do arquivo da capa
                g['capa'] = capas_reais[clean_rom_name] 
            
            # Tenta encontrar o preview correspondente
            if clean_rom_name in previews_reais:
                g['preview'] = previews_reais[clean_rom_name]
            elif 'preview' not in g:
                g['preview'] = '' # Garante que o campo exista

        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(games, f, indent=4, ensure_ascii=False)
            
        print(f"Atualizado: {json_path}")
        
    except Exception as e:
        print(f"Erro ao processar {json_path}: {e}")
