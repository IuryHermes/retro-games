# Teste real periódico do multiplayer

Periodicidade recomendada: mensal e antes de mudanças em `multiplayer-v2.js`, `multiplayer-room.html`, autenticação ou player.

## Preparação

- Duas contas de teste distintas, sem usar contas pessoais.
- Um desktop atualizado.
- Um iPhone com Safari atualizado.
- Um Android com Chrome atualizado.
- A página técnica de diagnóstico não aparece na navegação dos visitantes. Use-a somente durante uma verificação conduzida pela equipe.

## Roteiro obrigatório

1. Visitante toca em **Jogar online** e confirma que recebe explicação e cadastro antes do jogo.
2. Concluir login e confirmar retorno automático à seleção de jogos.
3. Criar sala no desktop e entrar pelo QR no iPhone.
4. Confirmar imagem, áudio, toque, orientação retrato/paisagem e retomada após bloquear/desbloquear a tela.
5. Repetir com Android/Chrome.
6. Inverter o anfitrião: smartphone hospeda e desktop entra.
7. Testar uma sala pública, um convite privado e modo espectador.
8. Confirmar no GA4 os eventos `multiplayer_hub_open`, `multiplayer_auth_required`, `multiplayer_room_created`, `multiplayer_joined` e `multiplayer_session_feedback`, sem dados pessoais.

## Critério de aprovação

- Nenhum início online silencioso sem orientação de cadastro.
- Retorno pós-login preservado.
- Vídeo e áudio permanecem ativos por pelo menos 10 minutos.
- Controles não ficam presos após alternar de aplicativo.
- Nenhum evento contém nome, e-mail, token ou ID de sala.

Registre data, aparelhos, versões dos navegadores, jogo e resultado em uma issue ou no histórico operacional do projeto. O diagnóstico técnico detalhado é opcional e deve ser usado somente pela equipe.
