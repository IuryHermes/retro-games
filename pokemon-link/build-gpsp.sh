#!/usr/bin/env bash
set -euo pipefail

# Requer Emscripten e um checkout do commit 8d268a6 de libretro/gpsp no
# diretório passado como primeiro argumento.
GPSP_DIR="${1:?informe o diretório do checkout libretro/gpsp}"
OUT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$GPSP_DIR"
emmake make -f Makefile platform=emscripten -j2
cp gpsp_libretro_emscripten.bc gpsp_libretro_emscripten.a
emcc "$OUT_DIR/gpsp_web_frontend.c" -Ilibretro/libretro-common/include -O3 -c -o /tmp/neo_gpsp_frontend.o
em++ /tmp/neo_gpsp_frontend.o -Wl,--whole-archive gpsp_libretro_emscripten.a -Wl,--no-whole-archive -O3 \
  -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -s INITIAL_MEMORY=67108864 -s MAXIMUM_MEMORY=268435456 \
  -s FORCE_FILESYSTEM=1 -s MODULARIZE=1 -s EXPORT_NAME=createNeoGpsp -s ENVIRONMENT=web,node \
  -s 'EXPORTED_RUNTIME_METHODS=[FS,HEAPU8,HEAP16,ccall]' \
  -s 'EXPORTED_FUNCTIONS=[_malloc,_free,_neo_init,_neo_run,_neo_set_input,_neo_frame_ptr,_neo_frame_width,_neo_frame_height,_neo_frame_pitch,_neo_audio_ptr,_neo_audio_frames,_neo_save_ptr,_neo_save_size,_neo_net_start,_neo_net_stop,_neo_queue_packet]' \
  -o "$OUT_DIR/gpsp.js"
