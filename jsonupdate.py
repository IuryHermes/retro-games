import os
import json
import re

print("Iniciando a atualização dos arquivos games.json...\n")

# Caminho base (estamos na pasta neoterminalroom)
base_dir = './systems'

# Expressão regular para limpar o nome (mesma lógica do Bash)
# Substitui espaços por _ e remove parênteses, colchetes, vírgulas e aspas simples
def clean_filename(filename):
    # Converte para minúsculas
    name = filename.lower()
    # Substitui espaços por underline
    name = name.replace(' ', '_')
    # Remove caracteres problemáticos
    name = re.sub(r"[(),\[\]']", "", name)
    # Remove underscores duplicados (se existirem)
    name = re.sub(r"_+", "_", name)
    return name

# Percorre todas as pastas dentro de ./systems
for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file == 'games.json':
            json_path = os.path.join(root, file)
            print(f"Processando: {json_path}")
            
            try:
                # Abre o JSON para leitura
                with open(json_path, 'r', encoding='utf-8') as f:
                    games = json.load(f)
                
                modificado = False
                
                # Atualiza a chave 'rom' de cada jogo
                for game in games:
                    if 'rom' in game:
                        old_rom_path = game['rom']
                        
                        # O caminho geralmente é "roms/Nome do Jogo.zip"
                        # Vamos separar a pasta do nome do arquivo
                        if '/' in old_rom_path:
                            parts = old_rom_path.split('/')
                            pasta = '/'.join(parts[:-1])
                            arquivo = parts[-1]
                            
                            novo_arquivo = clean_filename(arquivo)
                            novo_rom_path = f"{pasta}/{novo_arquivo}"
                            
                        else:
                            # Caso a chave 'rom' tenha só o nome do arquivo direto
                            novo_rom_path = clean_filename(old_rom_path)

                        if old_rom_path != novo_rom_path:
                            game['rom'] = novo_rom_path
                            modificado = True
                            print(f"  Atualizado: '{old_rom_path}' -> '{novo_rom_path}'")
                
                # Se algo mudou, salva o JSON de volta com a formatação bonitinha
                if modificado:
                    with open(json_path, 'w', encoding='utf-8') as f:
                        json.dump(games, f, indent=4, ensure_ascii=False)
                    print(f"  Salvo: {json_path}\n")
                else:
                    print("  Nenhuma alteração necessária neste arquivo.\n")

            except Exception as e:
                print(f"  Erro ao processar {json_path}: {e}\n")

print("Atualização dos JSONs concluída!")
