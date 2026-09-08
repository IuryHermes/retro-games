# Etapa 1: fundação e auditoria

Data: 08/09/2026. Base: commit `cef8aa81`. Branch: `feat/plano-90-dias-fundacao`.

**Resultado:** existem bases técnicas suficientes para iniciar o plano, com correções pequenas já preparadas. Não foi encontrado bloqueio crítico geral de rastreamento na amostra consultada. A etapa não está encerrada: indexação, métricas reais e validação do GA4 em produção permanecem pendentes.

## Escopo e evidências

Leitura textual dos três PDFs completos (28 + 4 + 4 páginas), inspeção do repositório, auditoria de todas as URLs declaradas nos sitemaps e consulta pública de 18 URLs. A amostra inclui home, robots, três sitemaps, Clube, Achados, coletâneas, HTTP, www, uma URL inexistente e um jogo de cada um dos sete sistemas presentes no sitemap.

O navegador não pôde ser iniciado: falha do isolamento do Windows `apply deny-read ACLs`. Não foram acessados dados privados do Search Console/GA4, nem executados testes visuais/interativos no navegador. Os PDFs foram extraídos como texto; a visualização das prévias também foi impedida pelo isolamento. Nenhuma métrica real de aquisição ou receita foi inferida desses limites.

## O que já funciona

- 1.161 URLs únicas no sitemap atual: 1.157 jogos e 4 páginas estáticas.
- Todos esses caminhos têm arquivo local. Não foram encontrados links internos estáticos para arquivos ausentes nas páginas auditadas; links gerados por JavaScript não foram exercitados.
- Robots permite rastreamento e declara o sitemap. Sitemap principal e filhos responderam HTTP 200.
- Home e páginas da amostra responderam 200; URL inexistente respondeu 404; HTTP e www chegaram ao domínio HTTPS sem www.
- Os 1.157 jogos têm title, descrição, H1, canonical e JSON-LD analisável; isso não certifica elegibilidade a resultados especiais do Google.
- GA4 `G-CJNYR5QTZX` está configurado no código. Há eventos de jogo/multiplayer e carregamento condicionado ao consentimento.
- Apoio/Clube, metas, resultados, saves, afiliados e painel já existem. Existência de código não comprova receita, conversão ou operação integral desses fluxos.

## Problemas por prioridade

| Nível | Achado | Situação / ação |
|---|---|---|
| Crítico | Nenhum bloqueio geral confirmado na amostra | Não equivale a garantir indexação de todo o domínio |
| Alto | Eventos personalizados entram numa fila que não é drenada depois que GA4 carrega | Reproduzido antes da correção; corrigido e testado na branch |
| Alto | Linha de base de indexação, cliques, usuários e receita desconhecida | Consultar painéis e preencher METRICAS.md |
| Alto | Descrição de Metal Gear Solid fala em ondas de inimigos | Confirmada no HTML; corrigir fonte editorial no lote dos Dias 16–30 |
| Médio | Canonical ausente em social, ofertas e Clube | Corrigido na branch |
| Médio | Clube ausente no sitemap estático | Incluído no XML e no gerador, sem regenerar o catálogo |
| Médio | 8 grupos de titles duplicados e 9 grupos de descriptions duplicadas | Revisar versões de jogos, sem renomear/apagar URLs automaticamente |
| Médio | Gerador apaga e recria jogos; slugs repetidos dependem da ordem | Antes de alterar catálogo, comparar rotas e preservar URLs; nenhuma regeneração feita nesta etapa |
| Médio | Sem BreadcrumbList nas páginas auditadas | Backlog da Etapa 2; não é requisito para indexar |
| Médio | Template declara inLanguage pt-BR para todos os VideoGame | Revisar semântica e origem do idioma na Etapa 2; não assumir que o idioma da página é o do jogo |
| Baixo | Home contém 3 H1 estáticos e headings adicionais em templates JS | Revisar hierarquia na Etapa 2; não classificar como bloqueio de indexação |
| Baixo | Open Graph ausente em páginas estáticas de comunidade/ofertas/coletâneas/Clube | Completar na Etapa 2 |

Os números de duplicação indicam grupos, não número de páginas; existem variantes que podem precisar de descrições próprias. Neo Geo tem catálogo local vazio neste snapshot, portanto não foi apresentado como sistema com páginas faltantes.

## Alterações de produto preparadas

- `analytics-consent.js`: retorna sucesso quando a biblioteca já está carregada e há consentimento. Assim neoTrack envia todos os eventos seguintes.
- `social.html`: canonical e meta description.
- `ofertas.html` e `apoie.html`: canonical próprio.
- `sitemap-static.xml` e `scripts/generate-game-pages.mjs`: incluem apoie.html apenas no sitemap estático.

Ferramentas/evidências adicionadas: `scripts/audit-seo-foundation.mjs`, `tests/analytics-events.mjs` e `docs/plano-90-dias/`.

Após as correções locais, o sitemap contém 1.162 URLs únicas (mesmos 1.157 jogos + 5 estáticas), todas com canonical correspondente e descrição. O snapshot de produção anterior permanece separado do resultado local posterior.

## Validação

Passaram: analytics-events, privacy-consent, game-routes, global-chat-community, account-session e support-goal-admin. O teste novo falhou antes da correção: esperava dois eventos e recebeu nenhum. Depois passou com consentimento inicial/tardio, eventos consecutivos, recusa, revogação de eventos personalizados, reativação e evento antes do DOMContentLoaded.

Sintaxe validada nos scripts alterados e `git diff --check` sem erros. Testes usam mocks; não comprovam recebimento pelo Google. O teste de revogação cobre neoTrack, não todos os eventos automáticos de uma biblioteca GA4 já carregada; revisar a revogação completa em navegador na verificação de consentimento.

## Pendências para fechar a etapa

1. Revisar e publicar este lote pequeno, com possibilidade de reverter o commit.
2. No Search Console, consultar a propriedade do domínio, confirmar processamento do sitemap e exportar desempenho dos últimos 28 dias, consultas, páginas e motivos de exclusão.
3. Inspecionar uma página prioritária no Search Console e registrar canonical selecionado pelo Google e estado de indexação.
4. No GA4, validar dois eventos reais consecutivos com consentimento, em DebugView/Tempo real. Não gerar compra, Pix ou publicação em Discord para testar.
5. Preencher a linha de base e registrar decisão do Iury antes da Etapa 2.

O PDF técnico, página 4, determina: “Não avance automaticamente para a próxima etapa.” Por isso este lote permanece na Etapa 1, para revisão. Isso vem do plano fornecido, não de uma limitação técnica de implementação.

## Repetir a auditoria

Na cópia de trabalho:

```powershell
node scripts/audit-seo-foundation.mjs --live
node tests/analytics-events.mjs
node tests/privacy-consent.mjs
node tests/game-routes.mjs
```

O parâmetro `--live` faz somente leituras HTTP. O relatório examina HTML estático e uma amostra pública, não substitui crawler completo, teste de emuladores, auditoria de desempenho ou Search Console.
