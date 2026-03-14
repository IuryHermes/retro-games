import os
import string
import zipfile
import struct
import re

def limpar_texto(b_data):
    """Remove lixo binário e deixa apenas letras e números."""
    if not b_data: return "DESCONHECIDO"
    # Filtra apenas caracteres imprimíveis
    texto = "".join([chr(b) if 32 <= b <= 126 else "" for b in b_data]).strip()
    # Remove espaços duplos e lixo
    texto = re.sub(r'\s+', ' ', texto)
    return texto if len(texto) > 2 else "DESCONHECIDO"

def ler_n64(caminho):
    try:
        with open(caminho, 'rb') as f:
            header = f.read(64)
            # Detecta o formato pelo Byte Order Mark
            if header[0:4] == b'\x80\x37\x12\x40': # Big Endian (.z64)
                return limpar_texto(header[32:52])
            elif header[0:4] == b'\x37\x80\x40\x12': # Byte Swapped (.v64)
                # Inverte os bytes para ler corretamente
                swapped = bytes([header[i+1] if i%2==0 else header[i-1] for i in range(len(header))])
                return limpar_texto(swapped[32:52])
    except: pass
    return "N64_GAME"

def ler_snes_zip(caminho):
    try:
        with zipfile.ZipFile(caminho, 'r') as z:
            for name in z.namelist():
                if name.lower().endswith(('.sfc', '.smc')):
                    with z.open(name) as f:
                        # O nome no SNES fica no offset 0x7FC0 (LoROM) ou 0xFFC0 (HiROM)
                        data = f.read(0x10000)
                        nome = limpar_texto(data[0x7FC0:0x7FD5])
                        if nome == "DESCONHECIDO" or len(nome) < 3:
                            nome = limpar_texto(data[0xFFC0:0xFFD5])
                        return nome
    except: pass
    return "SNES_GAME"

def ler_ps1(caminho):
    try:
        if caminho.lower().endswith('.bin') or caminho.lower().endswith('.iso'):
            with open(caminho, 'rb') as f:
                f.seek(0x8000) # Área de boot padrão
                buffer = f.read(100000).decode('ascii', errors='ignore')
                # Procura por IDs como SLUS-00001, SLES-12345
                match = re.search(r'[A-Z]{4}[_-]\d{3}\.?\d{2}', buffer)
                if match: return match.group().replace('_', '-')
    except: pass
    return "PS1_GAME"

def escanear():
    diretorio = "./systems"
    for sistema in os.listdir(diretorio):
        rota = os.path.join(diretorio, sistema, "roms")
        if not os.path.exists(rota): continue
        
        print(f"\n=== SISTEMA: {sistema.upper()} ===")
        for arquivo in os.listdir(rota):
            caminho = os.path.join(rota, arquivo)
            nome_real = "DESCONHECIDO"
            
            if sistema == 'megadrive':
                with open(caminho, 'rb') as f:
                    f.seek(0x150)
                    nome_real = limpar_texto(f.read(48))
            elif sistema == 'gba':
                with open(caminho, 'rb') as f:
                    f.seek(0xA0)
                    nome_real = limpar_texto(f.read(12))
            elif sistema == 'n64':
                nome_real = ler_n64(caminho)
            elif sistema == 'snes':
                nome_real = ler_snes_zip(caminho)
            elif sistema == 'ps1':
                nome_real = ler_ps1(caminho)
            elif sistema == 'nes':
                # NES não tem nome no binário, limpamos o nome do arquivo
                nome_real = arquivo.replace('.nes', '').replace('_', ' ').title()

            print(f"ARQUIVO: {arquivo[:30]}... -> NOME REAL: {nome_real}")

if __name__ == "__main__":
    escanear()
