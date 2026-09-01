# Batalhas Pokémon GBA no navegador

Frontend WebAssembly mínimo para o núcleo `libretro/gpsp`, usado somente nas
versões GBA validadas pelo catálogo. O processamento acontece no aparelho do
jogador; WebRTC transporta os pacotes do cabo/adaptador sem servidor de jogo.

O gpSP é distribuído sob GPL-2.0. Código-fonte original:
https://github.com/libretro/gpsp (revisão usada: `8d268a6`). O frontend desta
pasta e os binários derivados seguem a mesma licença. O ajuste de compilação
Emscripten adiciona apenas metadados `.size` aos símbolos de `bios_data.S`.

Modos expostos:

- `rfu`: FireRed, LeafGreen e Emerald (Wireless Adapter/Union Room);
- `cable`: Ruby e Sapphire (Cable Club).

ROMs modificadas só podem conversar quando os dois jogadores usam os mesmos
bytes. Hacks ficam desativados até validação individual.
