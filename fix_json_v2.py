import json
import os
import re
import difflib

sistemas = ['nes', 'snes', 'n64', 'gba', 'megadrive', 'ps1']
base_dir = 'systems'

def simplify(name):
    name, _ = os.path.splitext(name)
    # Remove tags como (USA), [!], etc
    name = re.sub(r'\(.*?\)|\[.*?\]', '', name)
    name = re.sub(r'[^a-z0-9]', '', name.lower())
    # Remove sufixos comuns que ficam sobrando
    for code in ['usa', 'europe', 'japan', 'world', 'rev', 'beta', 'ptbr', 'dublado']:
        if name.endswith(code):
            name = name[:-len(code)]
    return name

for sys in sistemas:
    sys_dir = os.path.join(base_dir, sys)
    json_path = os.path.join(sys_dir, 'games.json')
    capas_dir = os.path.join(sys_dir, 'capas')
    previews_dir = os.path.join(sys_dir, 'previews')
    
    if not os.path.exists(json_path):
        continue
        
    capas_reais = os.listdir(capas_dir) if os.path.exists(capas_dir) else []
    previews_reais = os.listdir(previews_dir) if os.path.exists(previews_dir) else []
    
    capas_map = {simplify(f): f for f in capas_reais if f.endswith(('.jpg', '.png', '.jpeg'))}
    previews_map = {simplify(f): f for f in previews_reais if f.endswith(('.gif', '.mp4'))}
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            games = json.load(f)
            
        for g in games:
            rom_filename = os.path.basename(g.get('rom', ''))
            simp_rom = simplify(rom_filename)
            
            # Match capa
            if simp_rom in capas_map:
                g['capa'] = capas_map[simp_rom]
            else:
                matches = difflib.get_close_matches(simp_rom, capas_map.keys(), n=1, cutoff=0.5)
                if matches:
                    g['capa'] = capas_map[matches[0]]
                else:
                    g['capa'] = g.get('capa', '').split('/')[-1] # Tira caminhos velhos
            
            # Match preview
            if simp_rom in previews_map:
                g['preview'] = previews_map[simp_rom]
            else:
                matches = difflib.get_close_matches(simp_rom, previews_map.keys(), n=1, cutoff=0.5)
                if matches:
                    g['preview'] = previews_map[matches[0]]
                else:
                    g['preview'] = g.get('preview', '').split('/')[-1]

        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(games, f, indent=4, ensure_ascii=False)
            
        print(f"Atualizado com SUCESSO: {sys}")
    except Exception as e:
        print(f"Erro em {sys}: {e}")
