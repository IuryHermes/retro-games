# Painel administrativo do NeoTerminalRoom

## Acesso

- Rede local: `http://192.168.2.52:8790/`
- No próprio servidor: `http://127.0.0.1:8790/`
- Usuário inicial: `admin`

A senha inicial existe apenas em `~/neo-admin-console/INITIAL_PASSWORD.txt` até a primeira troca. Depois disso ela não pode ser recuperada, somente redefinida. Nunca grave a senha no repositório.

O painel usa HTTP apenas dentro da LAN. Não encaminhe a porta 8790 no roteador. Para acesso remoto, use uma VPN privada ou Cloudflare Tunnel protegido por Cloudflare Access e HTTPS.

## Serviço

```bash
systemctl --user status neo-admin-console.service
systemctl --user restart neo-admin-console.service
journalctl --user -u neo-admin-console.service --since today
```

O instalador preserva a senha, o usuário e a chave privada do Worker e reinicia o serviço para carregar novas versões.

## Diagnóstico

O diagnóstico pode usar a configuração privada do serviço sem revelar a chave:

```bash
set -a
. ~/.config/neo-admin-console.env
set +a
node ~/neo-admin-console/diagnose-actions.mjs
```

O smoke test completo exige que a senha seja fornecida apenas no ambiente da sessão:

```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD='senha-atual' node smoke-test.mjs
```

## Backup e recuperação

Antes de excluir uma conta, use **Exportar dados**. O arquivo contém perfil, histórico, recompensas e inventário dos saves. A exclusão exige digitar o UID completo e remove perfil, histórico, presença, recompensas, código de indicação, imagens e saves associados às identidades normal e `firebase-`.

Os binários dos saves permanecem protegidos no R2 e não são incluídos no JSON administrativo para evitar respostas de até dezenas de megabytes. Backups integrais do bucket devem ser feitos pelas ferramentas de R2/Cloudflare e testados antes de qualquer restauração.

## Auditoria

As ações mutáveis registram administrador, data, alvo e detalhes. A tela permite busca e exportação. Ajustes de perfil registram valores anteriores e posteriores.

## Atualização segura

1. Validar sintaxe e executar os testes.
2. Executar `npx wrangler deploy --dry-run` no diretório `worker`.
3. Implantar o Worker.
4. Copiar `server.mjs` e `public/` para `~/neo-admin-console/`.
5. Executar `install-kali.sh` para recarregar e reiniciar o serviço.
6. Executar `diagnose-actions.mjs` e confirmar todas as respostas HTTP 200.
