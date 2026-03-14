#!/bin/bash

echo "Iniciando a limpeza global de nomes das ROMs..."

# O comando 'find' busca recursivamente dentro da pasta 'systems'
# Ele vai procurar APENAS por arquivos com essas extensões clássicas de ROMs.
# Se você tiver alguma outra extensão (ex: .gen), pode adicionar na lista.
find ./systems -type f \( -iname "*.zip" -o -iname "*.md" -o -iname "*.gba" -o -iname "*.bin" -o -iname "*.cue" -o -iname "*.nes" -o -iname "*.smc" -o -iname "*.sfc" -o -iname "*.n64" -o -iname "*.z64" -o -iname "*.iso" -o -iname "*.chd" \) | while read -r file; do
    
    # Extrai o nome do arquivo e o diretório separadamente
    filename=$(basename "$file")
    dir=$(dirname "$file")
    
    # 1. Converte para minúsculas
    # 2. Troca espaços por underscore (_)
    # 3. Remove parênteses, colchetes, vírgulas, aspas
    # 4. Remove underscores duplicados
    new_name=$(echo "$filename" | tr '[:upper:]' '[:lower:]' | sed 's/ /_/g' | sed 's/[(),\[\]'"'"'"]//g' | sed 's/__*/_/g')

    # Se o nome precisou ser alterado, ele faz a cópia
    if [ "$filename" != "$new_name" ]; then
        mv -n "$file" "$dir/$new_name"
        echo "✅ Renomeado: '$filename' -> '$new_name' (em $dir)"
    fi

done

echo "Limpeza de ROMs concluída com sucesso em todas as pastas!"
