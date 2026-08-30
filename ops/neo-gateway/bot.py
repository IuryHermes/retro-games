import asyncio
import json
import logging
import os
import re
import sys
from datetime import datetime, timezone

import discord
from discord import app_commands
from discord.ext import commands

# Algumas instalações Linux possuem libopus, mas o discord.py não a encontra
# automaticamente. Sem o encoder Opus o bot conecta, porém nenhum áudio é ouvido.
for opus_path in ("/usr/lib/x86_64-linux-gnu/libopus.so.0", "libopus.so.0"):
    try:
        discord.opus.load_opus(opus_path)
        if discord.opus.is_loaded():
            break
    except OSError:
        continue

TOKEN = os.environ.get("DISCORD_BOT_TOKEN", "")
GUILD_ID = int(os.environ.get("DISCORD_GUILD_ID", "0") or 0)
WELCOME_CHANNEL_ID = int(os.environ.get("WELCOME_CHANNEL_ID", "0") or 0)
LOG_CHANNEL_ID = int(os.environ.get("LOG_CHANNEL_ID", "0") or 0)
MOD_ROLE_ID = int(os.environ.get("MOD_ROLE_ID", "0") or 0)
RULES_MESSAGE_ID = int(os.environ.get("RULES_MESSAGE_ID", "1407859513113182300") or 0)
MEMBER_ROLE_ID = int(os.environ.get("MEMBER_ROLE_ID", "1407835148199919840") or 0)
ROLE_MESSAGE_ID = int(os.environ.get("ROLE_MESSAGE_ID", "1407869883504525443") or 0)
DRY_RUN = os.environ.get("DISCORD_GATEWAY_DRY_RUN", "1") != "0"
RADIO_ENABLED = os.environ.get("RADIO_ENABLED", "0") == "1"
RADIO_CHANNEL_ID = int(os.environ.get("RADIO_CHANNEL_ID", "0") or 0)
RADIO_URL = os.environ.get("RADIO_URL", "https://www.youtube.com/watch?v=PP1HTYB2Rtg")
FFMPEG_PATH = os.environ.get("FFMPEG_PATH", "ffmpeg")
try:
    REACTION_ROLE_MAP = json.loads(os.environ.get("REACTION_ROLE_MAP", "{}"))
except json.JSONDecodeError:
    REACTION_ROLE_MAP = {}

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
log = logging.getLogger("neo-terminalroom-gateway")
INVITE_RE = re.compile(r"(?:discord\.gg|discord(?:app)?\.com/invite)/\S+", re.I)
BLOCKED_RE = re.compile(r"(?:@everyone|@here|free nitro|nitro gratis)", re.I)

intents = discord.Intents.default()
intents.members = True
intents.message_content = True
intents.messages = True
bot = commands.Bot(command_prefix="!neo ", intents=intents)
radio_task = None
radio_voice = None
radio_last_state = None


async def log_event(text: str):
    log.info(text)
    if not LOG_CHANNEL_ID:
        return
    channel = bot.get_channel(LOG_CHANNEL_ID)
    if channel:
        await channel.send(f"`{datetime.now(timezone.utc).isoformat()}` {text}", allowed_mentions=discord.AllowedMentions.none())


def is_mod(member: discord.Member) -> bool:
    return bool(member.guild_permissions.manage_messages or MOD_ROLE_ID and any(r.id == MOD_ROLE_ID for r in member.roles))


@bot.event
async def on_ready():
    global radio_task
    if GUILD_ID:
        guild = discord.Object(id=GUILD_ID)
        await bot.tree.sync(guild=guild)
    log.info("NeoTerminalRoom Gateway conectado como %s (dry_run=%s)", bot.user, DRY_RUN)
    await log_event("Gateway online; dry-run=%s" % DRY_RUN)
    if RADIO_ENABLED and RADIO_CHANNEL_ID and radio_task is None:
        radio_task = asyncio.create_task(radio_loop())
        log.info("Rádio 24h ativada no canal %s", RADIO_CHANNEL_ID)


async def resolve_radio_url():
    """Resolve a URL do YouTube sob demanda, pois o endereço de áudio expira."""
    process = await asyncio.create_subprocess_exec(
        sys.executable, "-m", "yt_dlp", "--no-playlist", "-f", "bestaudio/best", "-g", RADIO_URL,
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=45)
    direct = stdout.decode().strip().splitlines()
    if process.returncode or not direct:
        raise RuntimeError(stderr.decode(errors="replace")[-400:])
    return direct[0]


async def radio_loop():
    global radio_voice, radio_last_state
    await bot.wait_until_ready()
    while not bot.is_closed():
        try:
            channel = bot.get_channel(RADIO_CHANNEL_ID)
            if not isinstance(channel, discord.VoiceChannel):
                raise RuntimeError("canal de rádio não encontrado ou não é de voz")
            voice = discord.utils.get(bot.voice_clients, guild=channel.guild)
            if voice is None or not voice.is_connected():
                voice = await channel.connect(reconnect=True)
            radio_voice = voice
            state = channel.guild.me.voice
            current_state = (voice.is_connected(), getattr(state, "self_mute", None),
                             getattr(state, "self_deaf", None))
            if current_state != radio_last_state:
                log.info("Estado da rádio: conectado=%s self_mute=%s self_deaf=%s", *current_state)
                radio_last_state = current_state
            if not voice.is_playing():
                stream = await resolve_radio_url()
                # Entrega pacotes Opus prontos ao Discord. Isso evita codificar
                # PCM dentro do processo Python, que causava atrasos e cortes
                # quando o servidor estava sob carga.
                source = discord.FFmpegOpusAudio(
                    stream, executable=FFMPEG_PATH,
                    before_options="-reconnect 1 -reconnect_streamed 1 -reconnect_on_network_error 1 -reconnect_on_http_error 4xx,5xx -reconnect_delay_max 5 -thread_queue_size 4096",
                    options="-vn -application audio -frame_duration 20")
                def radio_finished(error):
                    if error:
                        log.error("Rádio encerrou com erro: %s", error)
                    else:
                        log.warning("Rádio encerrou sem erro; será reconectada")
                voice.play(source, after=radio_finished)
                log.info("Rádio reproduzindo em #%s", channel.name)
            # Streams HLS podem cair sem aviso; detectar rapidamente evita
            # deixar a sala silenciosa durante o intervalo de recuperação.
            await asyncio.sleep(2)
        except asyncio.CancelledError:
            return
        except Exception as exc:
            log.warning("Rádio temporariamente indisponível: %s", exc)
            if radio_voice and radio_voice.is_connected():
                await radio_voice.disconnect(force=True)
            radio_voice = None
            await asyncio.sleep(20)


@bot.event
async def on_member_join(member: discord.Member):
    channel = bot.get_channel(WELCOME_CHANNEL_ID) or member.guild.system_channel
    if channel:
        await channel.send(f"🎮 Bem-vindo(a), {member.mention}! Conheça o NeoTerminalRoom e jogue direto no navegador: https://neoterminalroom.com.br", allowed_mentions=discord.AllowedMentions(users=True))
    await log_event(f"membro entrou: {member.id}")


@bot.event
async def on_message(message: discord.Message):
    if message.author.bot or not message.guild:
        return
    if not is_mod(message.author) and (INVITE_RE.search(message.content) or BLOCKED_RE.search(message.content)):
        await log_event(f"automod sinalizou mensagem {message.id} de {message.author.id}")
        if not DRY_RUN:
            await message.delete()
            await message.channel.send(f"{message.author.mention}, convite e spam são moderados neste servidor.", delete_after=8, allowed_mentions=discord.AllowedMentions(users=True))
        return
    await bot.process_commands(message)


@bot.tree.command(name="neo-status", description="Mostra o status do NeoTerminalRoom Gateway")
async def neo_status(interaction: discord.Interaction):
    await interaction.response.send_message(f"NeoTerminalRoom online · dry-run={'sim' if DRY_RUN else 'não'}", ephemeral=True)


@bot.tree.command(name="neo-ajuda", description="Mostra os fluxos automáticos do NeoTerminalRoom")
async def neo_help(interaction: discord.Interaction):
    await interaction.response.send_message("Avisos, saves, ofertas, onboarding e suporte são automáticos. Use o site para jogar e gerenciar seus saves.", ephemeral=True)


@bot.event
async def on_raw_reaction_add(payload: discord.RawReactionActionEvent):
    if payload.guild_id == GUILD_ID and payload.message_id == RULES_MESSAGE_ID and str(payload.emoji) == "✅":
        guild = bot.get_guild(payload.guild_id)
        member = guild.get_member(payload.user_id) if guild else None
        role = guild.get_role(MEMBER_ROLE_ID) if guild else None
        if member and role and not member.bot and not DRY_RUN:
            await member.add_roles(role, reason="Aceite das regras do NeoTerminalSec")
            await log_event(f"regras aceitas: {member.id}")
        return
    role_id = REACTION_ROLE_MAP.get(str(payload.emoji))
    if not role_id or payload.guild_id != GUILD_ID or payload.user_id == bot.user.id or payload.message_id != ROLE_MESSAGE_ID:
        return
    guild = bot.get_guild(payload.guild_id)
    member = guild.get_member(payload.user_id) if guild else None
    role = guild.get_role(int(role_id)) if guild else None
    if member and role and not DRY_RUN:
        await member.add_roles(role, reason="NeoTerminalRoom reaction role")


@bot.event
async def on_raw_reaction_remove(payload: discord.RawReactionActionEvent):
    role_id = REACTION_ROLE_MAP.get(str(payload.emoji))
    if role_id and payload.guild_id == GUILD_ID and payload.message_id == ROLE_MESSAGE_ID:
        guild = bot.get_guild(payload.guild_id)
        member = guild.get_member(payload.user_id) if guild else None
        role = guild.get_role(int(role_id)) if guild else None
        if member and role and not member.bot and not DRY_RUN:
            await member.remove_roles(role, reason="NeoTerminalRoom reaction role removida")
        return
    if payload.guild_id != GUILD_ID or payload.message_id != RULES_MESSAGE_ID or str(payload.emoji) != "✅":
        return
    guild = bot.get_guild(payload.guild_id)
    member = guild.get_member(payload.user_id) if guild else None
    role = guild.get_role(MEMBER_ROLE_ID) if guild else None
    if member and role and not member.bot and not DRY_RUN:
        await member.remove_roles(role, reason="Reacao das regras removida")
        await log_event(f"reacao de regras removida: {member.id}")


if not TOKEN:
    raise SystemExit("DISCORD_BOT_TOKEN ausente")
bot.run(TOKEN)
