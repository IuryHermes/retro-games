#!/bin/bash
OUTPUT="relatorio_neo.txt"
> $OUTPUT
echo "=== RELATÓRIO DE MAPEAMENTO NEOTERMINALROOM ===" >> $OUTPUT

for sys in nes snes n64 gba megadrive ps1; do
    echo -e "\n======================================" >> $OUTPUT
    echo "SISTEMA: $sys" >> $OUTPUT
    echo "======================================" >> $OUTPUT
    
    if [ -d "systems/$sys" ]; then
        echo -e "\n--> games.json (Amostra de 1 item):" >> $OUTPUT
        head -n 8 systems/$sys/games.json >> $OUTPUT
        
        echo -e "\n--> CAPAS (Amostra de 10 arquivos):" >> $OUTPUT
        ls -1 systems/$sys/capas 2>/dev/null | head -n 10 >> $OUTPUT
        
        echo -e "\n--> PREVIEWS (Amostra de 10 arquivos):" >> $OUTPUT
        ls -1 systems/$sys/previews 2>/dev/null | head -n 10 >> $OUTPUT
        
        echo -e "\n--> ROMS (Amostra de 10 arquivos):" >> $OUTPUT
        ls -1 systems/$sys/roms 2>/dev/null | head -n 10 >> $OUTPUT
    else
        echo "Pasta systems/$sys não encontrada localmente." >> $OUTPUT
    fi
done
echo "Relatório gerado com sucesso em $OUTPUT"
