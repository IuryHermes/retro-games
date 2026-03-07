import os
import json

roms_path = "roms"
games = []

# Lista de extensões de N64
extensoes = ('.z64', '.n64', '.v64')

if os.path.exists(roms_path):
    files = sorted(os.listdir(roms_path))
    for file in files:
        if file.endswith(extensoes):
            # Cria um nome bonito (remove extensão, troca underline por espaço)
            nome_display = file.replace('_', ' ').rsplit('.', 1)[0].title()
            
            # Define o nome da imagem (assume que será .jpg)
            nome_capa = file.rsplit('.', 1)[0] + ".jpg"
            
            games.append({
                "id": file,
                "nome": nome_display,
                "rom": f"roms/{file}",
                "capa": f"capas/{nome_capa}"
            })

    # Salva o arquivo games.json formatado
    with open("games.json", "w", encoding="utf-8") as f:
        json.dump(games, f, indent=2, ensure_ascii=False)
    
    print(f"Sucesso! {len(games)} jogos catalogados em games.json")
else:
    print("Erro: Pasta 'roms' não encontrada.")
