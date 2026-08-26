# Estratégia de Discord — NeoTerminalRoom

## Auditoria do estado atual

- O Worker já sincroniza os cargos **Continue**, **Cartucho** e **Arcade** com os pagamentos aprovados.
- Os benefícios pagos duram 30 dias e são removidos automaticamente ao expirar.
- As enquetes semanais são publicadas para Cartucho e Arcade.
- O site já oferece cadastro, saves locais/nuvem, multiplayer, chat global e página de apoio.
- O monitor de gameplay publica transmissões no canal de lives.
- Concursos e notícias geek continuam sendo funções do HERMES; não devem ser apresentados como recursos do NeoTerminalRoom.
- A API de afiliados da Shopee ainda não foi liberada para a conta. Não anunciar “ofertas Shopee automáticas” até a aprovação.

## Estrutura recomendada

### Área pública

- `#comece-aqui`: mensagem fixa, regras curtas e botão/link para o site.
- `#jogos-e-saves`: novidades de catálogo, correções e dicas de save.
- `#multiplayer`: convites para salas e transmissões ao vivo.
- `#chat-da-comunidade`: conversa livre e suporte entre jogadores.
- `#achados`: somente ofertas com preço, imagem e link afiliado validados.

### Área do Clube

- `#agradecimentos`: confirmação automática dos apoios.
- `#enquetes`: enquetes semanais apenas para Cartucho e Arcade.
- `#sugestoes-prioritarias`: sugestões e votação do Arcade.

## Mensagem fixa para `#comece-aqui`

```text
🎮 BEM-VINDO AO NEOTERMINALROOM

Jogue clássicos direto do navegador: NES, SNES, Mega Drive, N64, GBA, PS1 e Atari.

1. Entre no site: https://neoterminalroom.com.br
2. Crie seu cadastro gratuito para proteger seu progresso e continuar em outros dispositivos.
3. Abra o botão ☁ SAVES dentro do player para gerenciar seus saves.
4. Quer jogar com outras pessoas? Escolha um jogo, abra ONLINE e compartilhe o convite.

O cadastro gratuito é opcional. O Discord só é necessário para vincular os planos do Clube.
Nunca envie senha, código de verificação ou dados de pagamento no chat.
``` 

## Divulgação dos planos

Publicar no máximo uma vez por semana, sempre com link para `https://neoterminalroom.com.br/apoie.html#planos`:

```text
☁ SEU PROGRESSO MERECE CONTINUAR

Cadastro gratuito: saves neste aparelho e perfil no NeoTerminalRoom.
Continue — R$ 5/30 dias: 7 slots manuais por jogo + autosave em até 5 jogos.
Cartucho — R$ 12/30 dias: 20 slots + autosave em até 15 jogos + enquetes.
Arcade — R$ 25/30 dias: saves manuais e autosaves ilimitados + prioridade nas sugestões.

Os planos são apoios avulsos, não assinatura automática. Confira os detalhes:
https://neoterminalroom.com.br/apoie.html#planos
``` 

## Rotina de conteúdo

- **Segunda:** enquete do Clube (automática) e resumo curto da semana.
- **Terça:** dica de um jogo do catálogo ou de save compatível.
- **Quarta:** convite para uma sala multiplayer ou live.
- **Sexta:** destaque de catálogo, atualização ou oferta validada.
- **Domingo:** resumo da comunidade, sem spam e sem promessa de recurso ainda indisponível.

## Regras de comunicação

- Dizer sempre “autosave na nuvem” e informar os limites de cada plano.
- Não prometer que todo emulador aceita qualquer estado de save; a compatibilidade depende do núcleo.
- Não chamar doação livre de plano nem prometer cargo/benefício para ela.
- Não anunciar Shopee/API como ativa antes da liberação oficial.
- Toda oferta deve usar link afiliado válido e mostrar preço, imagem e validade.
- Usar o Discord para comunidade e suporte; o site continua sendo o local de jogar, salvar e pagar.

## Atualização de escopo

Não utilizar canais, anúncios ou recompensas de lives/transmissões. O multiplayer permanece apenas para partidas compartilhadas. A página antiga de conteúdo antecipado foi removida.

## Integração com o NeoTerminalSec

O NeoTerminalSec é a comunidade principal: programação, IA, segurança e hacktivismo. O NeoTerminalRoom entra como um produto/projeto da comunidade, não como uma marca separada que tenta substituir sua identidade.

### Automação sem trabalho manual

- O site mostra um lembrete contextual após o primeiro período de jogo convidando o visitante a criar uma conta e proteger o progresso.
- O Worker mantém cargos, validade, remoção de acesso, confirmação de pagamento e enquete semanal automaticamente.
- O Discord deve receber apenas resumos programados: novidade do catálogo, atualização técnica, enquete e chamada para jogar.
- Mensagens de ofertas só entram quando preço, imagem, validade e link afiliado estiverem validados.
- Nunca enviar DM promocional sem opt-in; limitar avisos para evitar spam.

### Posição editorial

Falar com a linguagem da comunidade: tecnologia aberta, preservação digital, segurança, autonomia e jogos retrô. O CTA principal é **testar, contribuir e construir junto**; o apoio financeiro vem depois da experiência, sem prometer acesso antecipado ou lives.
