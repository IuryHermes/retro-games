# Fluxo de navegação — NeoTerminalRoom

Atualizado em: 2026-09-01
Commit de referência: atualizar junto à mudança de navegação.

```mermaid
flowchart TD
  A[Entrada: Home, Google, link de jogo ou convite] --> B{Destino}
  B -->|Descobrir| H[Home: hero, busca, sistemas, aclamados e coletâneas]
  B -->|Jogo| J[Página pública do jogo]
  B -->|Convite| M[Sala multiplayer]
  B -->|Área| X[Comunidade, Achados, Clube ou Perfil]

  H --> J
  J --> L[Jogar local]
  J --> O[Jogar online]
  L --> P[Player universal]
  P --> S{Conta?}
  S -->|Não| SL[Save local e até 3 continues]
  S -->|Sim| SN[Histórico e saves na nuvem]

  O --> MH[Hub multiplayer]
  MH --> C{Conta concluída?}
  C -->|Não| CA[Login ou cadastro]
  CA --> RT[Retomar objetivo original]
  RT --> MH
  C -->|Sim| CR[Criar sala ou entrar em sala]
  CR --> LB[Lobby, QR e convites]
  LB --> PJ[Partida: vídeo, áudio e controles]

  X --> XA{Área protegida?}
  XA -->|Achados, mensagens ou convite| CA
  XA -->|Conteúdo público| XP[Exibir conteúdo]
```

## Contrato de atualização

Sempre que uma rota, gate de autenticação, retorno pós-login, entrada do player ou etapa multiplayer mudar:

1. Atualizar este fluxograma e a data acima.
2. Atualizar `tests/navigation-contract.mjs` e o teste específico da área.
3. Executar `node tests/site-navigation.mjs`.
4. Executar `node tests/navigation-contract.mjs`.
5. Para multiplayer, executar também `node tests/multiplayer-client.mjs` e preencher a matriz de `multiplayer-diagnostics.html` em aparelhos reais.
