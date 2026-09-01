#include <emscripten.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include "libretro.h"

static const struct retro_netpacket_callback *net_iface;
static uint16_t input_mask;
static const uint16_t *frame_ptr;
static unsigned frame_width, frame_height, frame_pitch;
static int16_t audio_samples[32768];
static size_t audio_frames;
static const char *serial_value = "rfu";

typedef struct { uint16_t from; size_t len; uint8_t data[2048]; } queued_packet;
static queued_packet packets[128];
static unsigned packet_read, packet_write;

EM_JS(void, web_send_packet, (const void *buf, size_t len, uint16_t to), {
  if (!Module.neoPokemonSend) return;
  Module.neoPokemonSend(HEAPU8.slice(buf, buf + len), to);
});

static void net_send(int flags, const void *buf, size_t len, uint16_t client_id) {
  (void)flags;
  if (buf && len) web_send_packet(buf, len, client_id);
}

static void drain_packets(void) {
  while (packet_read != packet_write && net_iface && net_iface->receive) {
    queued_packet *packet = &packets[packet_read];
    net_iface->receive(packet->data, packet->len, packet->from);
    packet_read = (packet_read + 1) % 128;
  }
}

static bool environment(unsigned command, void *data) {
  switch (command) {
    case RETRO_ENVIRONMENT_SET_NETPACKET_INTERFACE:
      net_iface = (const struct retro_netpacket_callback *)data; return true;
    case RETRO_ENVIRONMENT_SET_PIXEL_FORMAT:
    case RETRO_ENVIRONMENT_SET_INPUT_DESCRIPTORS:
    case RETRO_ENVIRONMENT_SET_MEMORY_MAPS:
    case RETRO_ENVIRONMENT_SET_CORE_OPTIONS_V2:
    case RETRO_ENVIRONMENT_SET_CORE_OPTIONS_V2_INTL:
    case RETRO_ENVIRONMENT_SET_CORE_OPTIONS_UPDATE_DISPLAY_CALLBACK:
      return true;
    case RETRO_ENVIRONMENT_GET_INPUT_BITMASKS:
      return true;
    case RETRO_ENVIRONMENT_GET_VARIABLE: {
      struct retro_variable *var = (struct retro_variable *)data;
      if (!strcmp(var->key, "gpsp_serial")) var->value = serial_value;
      else if (!strcmp(var->key, "gpsp_bios")) var->value = "builtin";
      else if (!strcmp(var->key, "gpsp_boot_mode")) var->value = "game";
      else if (!strcmp(var->key, "gpsp_rtc")) var->value = "auto";
      else if (!strcmp(var->key, "gpsp_rtc_time_source")) var->value = "host";
      else if (!strcmp(var->key, "gpsp_frameskip")) var->value = "disabled";
      else if (!strcmp(var->key, "gpsp_frameskip_threshold")) var->value = "33";
      else if (!strcmp(var->key, "gpsp_frameskip_interval")) var->value = "0";
      else var->value = NULL;
      return var->value != NULL;
    }
    case RETRO_ENVIRONMENT_GET_VARIABLE_UPDATE:
      *(bool *)data = false; return true;
    case RETRO_ENVIRONMENT_GET_SYSTEM_DIRECTORY:
    case RETRO_ENVIRONMENT_GET_SAVE_DIRECTORY:
    case RETRO_ENVIRONMENT_GET_CONTENT_DIRECTORY:
      *(const char **)data = "/"; return true;
    case RETRO_ENVIRONMENT_GET_AUDIO_VIDEO_ENABLE:
      *(int *)data = 3; return true;
    default: return false;
  }
}

static void video(const void *data, unsigned width, unsigned height, size_t pitch) {
  if (!data) return;
  frame_ptr = (const uint16_t *)data;
  frame_width = width; frame_height = height; frame_pitch = (unsigned)pitch;
}
static size_t audio_batch(const int16_t *data, size_t frames) {
  size_t room = 16384 - audio_frames;
  if (frames > room) frames = room;
  memcpy(audio_samples + audio_frames * 2, data, frames * 4);
  audio_frames += frames;
  return frames;
}
static void audio_sample(int16_t left, int16_t right) {
  if (audio_frames >= 16384) return;
  audio_samples[audio_frames * 2] = left;
  audio_samples[audio_frames * 2 + 1] = right;
  audio_frames++;
}
static void input_poll(void) { drain_packets(); }
static int16_t input_state(unsigned port, unsigned device, unsigned index, unsigned id) {
  (void)index;
  if (port || device != RETRO_DEVICE_JOYPAD) return 0;
  if (id == RETRO_DEVICE_ID_JOYPAD_MASK) return (int16_t)input_mask;
  return (input_mask & (1u << id)) ? 1 : 0;
}

EMSCRIPTEN_KEEPALIVE int neo_init(const char *path, const char *mode) {
  struct retro_game_info game = {0};
  serial_value = mode && !strcmp(mode, "cable") ? "mul_poke" : "rfu";
  retro_set_environment(environment);
  retro_set_video_refresh(video);
  retro_set_audio_sample(audio_sample);
  retro_set_audio_sample_batch(audio_batch);
  retro_set_input_poll(input_poll);
  retro_set_input_state(input_state);
  retro_init();
  game.path = path;
  return retro_load_game(&game) ? 1 : 0;
}
EMSCRIPTEN_KEEPALIVE void neo_run(void) { audio_frames = 0; drain_packets(); retro_run(); }
EMSCRIPTEN_KEEPALIVE void neo_set_input(uint16_t value) { input_mask = value; }
EMSCRIPTEN_KEEPALIVE uintptr_t neo_frame_ptr(void) { return (uintptr_t)frame_ptr; }
EMSCRIPTEN_KEEPALIVE unsigned neo_frame_width(void) { return frame_width; }
EMSCRIPTEN_KEEPALIVE unsigned neo_frame_height(void) { return frame_height; }
EMSCRIPTEN_KEEPALIVE unsigned neo_frame_pitch(void) { return frame_pitch; }
EMSCRIPTEN_KEEPALIVE uintptr_t neo_audio_ptr(void) { return (uintptr_t)audio_samples; }
EMSCRIPTEN_KEEPALIVE unsigned neo_audio_frames(void) { return (unsigned)audio_frames; }
EMSCRIPTEN_KEEPALIVE uintptr_t neo_save_ptr(void) { return (uintptr_t)retro_get_memory_data(RETRO_MEMORY_SAVE_RAM); }
EMSCRIPTEN_KEEPALIVE unsigned neo_save_size(void) { return (unsigned)retro_get_memory_size(RETRO_MEMORY_SAVE_RAM); }
EMSCRIPTEN_KEEPALIVE void neo_net_start(unsigned local_id) {
  packet_read = packet_write = 0;
  if (net_iface && net_iface->start) net_iface->start((uint16_t)local_id, net_send, drain_packets);
  if (!local_id && net_iface && net_iface->connected) net_iface->connected(1);
}
EMSCRIPTEN_KEEPALIVE void neo_net_stop(void) { if (net_iface && net_iface->stop) net_iface->stop(); }
EMSCRIPTEN_KEEPALIVE int neo_queue_packet(const void *data, size_t len, unsigned from) {
  unsigned next = (packet_write + 1) % 128;
  if (!data || len > 2048 || next == packet_read) return 0;
  packets[packet_write].from = (uint16_t)from;
  packets[packet_write].len = len;
  memcpy(packets[packet_write].data, data, len);
  packet_write = next;
  return 1;
}
