import json
import os

sistemas = ['gba', 'ps1']
base_dir = 'systems'
output_file = 'relatorio_erros.txt'

with open(output_file, 'w', encoding='utf-8') as out:
    out.write("=== RELATÓRIO DE ERROS GBA E PS1 ===\n")

    for sys in sistemas:
        out.write(f"\n======================================\n")
        out.write(f"SISTEMA: {sys.upper()}\n")
        out.write(f"======================================\n")
        
        sys_dir = os.path.join(base_dir, sys)
        json_path = os.path.join(sys_dir, 'games.json')
        capas_dir = os.path.join(sys_dir, 'capas')
        
        if not os.path.exists(json_path):
            out.write("JSON não encontrado!\n")
            continue
            
        capas_reais = set(os.listdir(capas_dir)) if os.path.exists(capas_dir) else set()
        
        with open(json_path, 'r', encoding='utf-8') as f:
            games = json.load(f)
        
        erros_capa = []
        multi_discos = []
        
        for g in games:
            capa = g.get('capa', '')
            rom = g.get('rom', '').lower()
            nome = g.get('nome', '').lower()
            
            # Identifica jogos multi-disco no PS1
            if sys == 'ps1':
                if '.m3u' in rom or 'cd1' in rom or 'cd2' in rom or 'cd 1' in nome or 'cd 2' in nome or 'disco' in nome or 'disc' in rom:
                    multi_discos.append(g)
            
            # Identifica capas que estão no JSON mas não existem na pasta
            if capa not in capas_reais:
                erros_capa.append(g)
        
        if sys == 'ps1':
            out.write(f"\n[!] JOGOS MULTI-DISCO ({len(multi_discos)} encontrados):\n")
            for m in multi_discos[:20]:
                out.write(f" - {m.get('nome')} | ROM: {m.get('rom')}\n")
            if len(multi_discos) > 20:
                out.write("   ... e mais.\n")
                
        out.write(f"\n[X] CAPAS QUEBRADAS ({len(erros_capa)} encontrados):\n")
        for e in erros_capa[:20]:
            out.write(f" - Jogo: {e.get('nome')}\n   Pede a capa: {e.get('capa')}\n   ROM original: {e.get('rom')}\n\n")
        if len(erros_capa) > 20:
            out.write("   ... e mais.\n")
            
print(f"Relatório gerado com sucesso em {output_file}")
