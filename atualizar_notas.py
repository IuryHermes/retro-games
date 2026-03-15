import json
import requests
import time
import os
import re

# SUA CHAVE DA API RAWG
API_KEY = "1e7e5d1463234792821c92d4fc62cb54"

# AGORA SIM: A LISTA COM TODOS OS SEUS SISTEMAS!
SISTEMAS = ["nes", "snes", "n64", "gba", "megadrive", "ps1"]

def limpar_nome_para_rawg(nome):
    """ Remove parênteses, conserta o ', The' e deixa limpo para o RAWG. """
    n = re.sub(r'\(.*?\)|\[.*?\]', '', nome)
    if ", The" in n or ", the" in n:
        n = re.sub(r'(.*?),\s*The', r'The \1', n, flags=re.IGNORECASE)
    n = n.replace("-", " ")
    n = re.sub(r'\s+', ' ', n).strip()
    return n

def buscar_nota_rawg(nome_original):
    nome_busca = limpar_nome_para_rawg(nome_original)
    nome_formatado = requests.utils.quote(nome_busca)
    
    url = f"https://api.rawg.io/api/games?search={nome_formatado}&key={API_KEY}&page_size=5"
    
    try:
        resposta = requests.get(url, timeout=10)
        if resposta.status_code == 200:
            dados = resposta.json()
            resultados = dados.get("results", [])
            for jogo_rawg in resultados:
                nota = jogo_rawg.get("rating", 0)
                if nota > 0:
                    return round(nota * 2, 1) # Converte de 0-5 para 0-10
    except Exception as e:
        print(f"Erro ao buscar {nome_busca}: {e}")
        
    return None

def atualizar_todos_os_sistemas():
    total_geral_atualizados = 0
    total_geral_falhas = 0

    # O ROBÔ VAI PASSAR POR CADA SISTEMA DA LISTA
    for sistema in SISTEMAS:
        json_path = f"systems/{sistema}/games.json"
        relatorio_path = f"systems/{sistema}/relatorio_nao_encontrados.txt"

        print(f"\n" + "="*60)
        print(f"🚀 INICIANDO ATUALIZAÇÃO DO SISTEMA: {sistema.upper()}")
        print("="*60)

        # Se a pasta/json do sistema não existir, ele avisa e pula pro próximo
        if not os.path.exists(json_path):
            print(f"⚠️ Arquivo não encontrado: {json_path}. Pulando para o próximo...")
            continue

        with open(json_path, 'r', encoding='utf-8') as f:
            jogos = json.load(f)

        print(f"Encontrados {len(jogos)} jogos para verificar em {sistema.upper()}...\n")

        modificados = 0
        nao_encontrados = []

        for jogo in jogos:
            # Se já tem nota gravada, ele pula (o SNES já vai passar voando agora)
            if "nota" in jogo and jogo["nota"] not in ["N/A", "S/N"]:
                continue

            nome_original = jogo.get("nome", "Desconhecido")
            print(f"Buscando: {nome_original[:40]:<40} ...", end=" ")
            
            nota = buscar_nota_rawg(nome_original)
            
            if nota is not None:
                jogo["nota"] = str(nota)
                print(f"[⭐ {nota}/10]")
            else:
                jogo["nota"] = "S/N"
                print("[NÃO ENCONTRADO]")
                nao_encontrados.append(nome_original)
            
            modificados += 1
            
            # Salva o JSON na pasta atual
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(jogos, f, indent=4, ensure_ascii=False)
                
            time.sleep(1)

        # GERA O RELATÓRIO DENTRO DA PASTA DO SISTEMA
        if nao_encontrados:
            with open(relatorio_path, 'w', encoding='utf-8') as f:
                f.write(f"RELATÓRIO DE JOGOS NÃO ENCONTRADOS - {sistema.upper()}\n")
                f.write("="*60 + "\n\n")
                for nome in nao_encontrados:
                    f.write(f"- {nome}\n")
            print(f"\n🚨 {len(nao_encontrados)} jogos não encontrados. Relatório em: {relatorio_path}")
        else:
            print(f"\n✅ Todos os jogos de {sistema.upper()} foram encontrados com sucesso!")

        total_geral_atualizados += modificados
        total_geral_falhas += len(nao_encontrados)

    # FINAL DE TUDO
    print("\n" + "="*60)
    print("🏁 VARREDURA COMPLETA EM TODOS OS SISTEMAS 🏁")
    print(f"Total de jogos novos atualizados: {total_geral_atualizados}")
    print(f"Total de falhas (S/N): {total_geral_falhas}")
    print("="*60)

if __name__ == "__main__":
    atualizar_todos_os_sistemas()
