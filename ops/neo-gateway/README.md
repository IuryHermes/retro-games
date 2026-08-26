# NeoTerminalRoom Gateway

Bot Gateway complementar ao Worker. O Worker continua cuidando de saves, pagamentos,
ofertas e avisos agendados; este processo cuida apenas dos eventos em tempo real do
Discord (boas-vindas, automoderação, comandos, logs e reaction roles).

## Configuração

Defina `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID` e, opcionalmente, `WELCOME_CHANNEL_ID`,
`LOG_CHANNEL_ID`, `MOD_ROLE_ID` e `REACTION_ROLE_MAP` (JSON `{ "emoji": "role_id" }`).
Use `DISCORD_GATEWAY_DRY_RUN=1` para auditar sem apagar mensagens ou alterar cargos.

Intents necessários no Developer Portal: Guilds, Guild Members, Guild Messages e
Message Content. Só remova Carlbot/Dyno/Disboard depois de validar o relatório de
permissões e desligar o modo dry-run.
