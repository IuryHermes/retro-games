#!/bin/bash

echo "--- INICIANDO GERAÇÃO DO MENU N64 ---"

# 1. Cabeçalho do HTML
cat << 'EOF' > index.html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nintendo 64 | NeoTerminal</title>
    <style>
        body { background-color: #050505; color: #7cff9a; font-family: 'Courier New', monospace; text-align: center; margin: 0; padding: 20px; }
        h1 { text-shadow: 0 0 10px #7cff9a; margin-bottom: 30px; letter-spacing: 2px; }
        .game-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; max-width: 1200px; margin: 0 auto; }
        .game-btn {
            background: #111; border: 1px solid #7cff9a; color: #7cff9a;
            padding: 15px 20px; font-family: inherit; font-size: 14px; font-weight: bold;
            cursor: pointer; text-transform: uppercase; transition: all 0.2s;
            width: 100%; max-width: 300px; border-radius: 4px;
        }
        .game-btn:hover { background: #7cff9a; color: #000; box-shadow: 0 0 15px #7cff9a; transform: scale(1.02); }
        .back-btn { display: inline-block; margin-bottom: 20px; color: #555; text-decoration: none; border: 1px solid #555; padding: 10px 20px; }
        .back-btn:hover { color: #fff; border-color: #fff; }
    </style>
</head>
<body>
    <a href="../../index.html" class="back-btn">⬅ VOLTAR AO HUB</a>
    <h1>NINTENDO 64 SYSTEM</h1>
    <div class="game-container">
EOF

# 2. Loop para gerar os botões (Python formatando nomes)
cd roms
for rom in *.z64 *.n64 *.v64; do
    if [ -f "$rom" ]; then
        name=$(python3 -c "print('$rom'.replace('_', ' ').rsplit('.', 1)[0].title())")
        echo "Adicionando: $name"
        echo "        <button class=\"game-btn\" onclick=\"window.location.href='play.html?game=roms/$rom'\">$name</button>" >> ../index.html
    fi
done
cd ..

# 3. Rodapé do HTML
cat << 'EOF' >> index.html
    </div>
</body>
</html>
EOF

echo "--- MENU CRIADO COM SUCESSO! ---"
