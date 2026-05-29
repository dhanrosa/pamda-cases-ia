# Deploy simples do Chatwoot no Render

Este projeto foi ajustado para o Render usar a imagem oficial pronta do Chatwoot:

```dockerfile
FROM chatwoot/chatwoot:latest
```

Com isso, o Render nao deve executar `bundle install`, `pnpm install`, build de assets ou compilacao local do Chatwoot. O servico precisa estar configurado como Docker Runtime usando o `Dockerfile` da raiz.

## Variaveis de ambiente

Configure no Web Service do Render:

```env
RAILS_ENV=production
NODE_ENV=production
INSTALLATION_ENV=docker
SECRET_KEY_BASE=gere-uma-chave-segura
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DATABASE
REDIS_URL=redis://default:PASSWORD@HOST:PORT
FRONTEND_URL=https://seu-chatwoot.onrender.com
CHATWOOT_HOST=seu-chatwoot.onrender.com
```

Observacoes:

- `SECRET_KEY_BASE`: gere uma string longa e segura. Exemplo local: `openssl rand -hex 64`.
- `FRONTEND_URL`: use a URL publica completa com `https://`.
- `CHATWOOT_HOST`: use somente o host, sem `https://`.
- `DATABASE_URL`: copie a internal database URL do PostgreSQL criado no Render.
- `REDIS_URL`: copie a internal Redis/Key Value URL do Render.

## PostgreSQL

1. No Render, crie um novo PostgreSQL.
2. Use a regiao mais proxima do Web Service.
3. Depois de criado, copie a `Internal Database URL`.
4. Cole essa URL na variavel `DATABASE_URL` do Web Service do Chatwoot.

## Redis / Key Value

1. No Render, crie um Redis ou Key Value.
2. Use a mesma regiao do Web Service.
3. Copie a `Internal Redis URL`.
4. Cole essa URL na variavel `REDIS_URL` do Web Service do Chatwoot.

## Web Service

1. Crie um novo Web Service no Render apontando para este repositorio.
2. Escolha `Docker` como Runtime.
3. Use o `Dockerfile` da raiz do projeto.
4. Deixe `Build Command` vazio.
5. Deixe `Start Command` vazio para usar o comando padrao da imagem oficial.
6. Configure todas as variaveis de ambiente listadas acima.
7. Clique em `Manual Deploy` > `Deploy latest commit`.

## O que remover no painel do Render

Remova qualquer configuracao antiga que force build local:

- Runtime `Node`, `Ruby` ou `Elixir`.
- `Build Command` como `bundle install`, `pnpm install`, `yarn install`, `npm install`, `rails assets:precompile`, `vite build` ou similares.
- `Start Command` antigo que chame scripts do repositorio.
- Caminho de Dockerfile apontando para arquivo inexistente ou subpasta antiga.
- Blueprint antigo baseado em `render.yaml`, se ele ainda existir no painel do Render.

Para este modo simples, o importante e: Docker Runtime, Dockerfile da raiz, Build Command vazio e Start Command vazio.

## Manual Deploy

Depois de salvar as variaveis:

1. Abra o Web Service do Chatwoot.
2. Clique em `Manual Deploy`.
3. Selecione `Deploy latest commit`.
4. Confira os logs. O deploy deve baixar a imagem oficial e iniciar o container, sem compilar o Chatwoot inteiro.

## Sidekiq depois

O Chatwoot precisa de Sidekiq para jobs em background. Depois que o Web Service estiver subindo:

1. Crie um novo Background Worker no Render.
2. Aponte para o mesmo repositorio.
3. Escolha `Docker` como Runtime.
4. Use o mesmo `Dockerfile`.
5. Configure as mesmas variaveis de ambiente do Web Service.
6. No `Start Command` do worker, use:

```sh
bundle exec sidekiq -C config/sidekiq.yml
```

Mantenha o Web Service e o Background Worker usando o mesmo `DATABASE_URL`, `REDIS_URL` e `SECRET_KEY_BASE`.

## Conferencia de configuracao

Arquivos que nao existem neste repositorio e, portanto, nao estao forçando build pesado:

- `docker-compose.yml`
- `docker-compose.yaml`
- `Procfile`
- `render.yaml`
- `render.yml`
- `Gemfile`
- `pnpm-lock.yaml`

O arquivo `package.json` existe porque este repositorio tambem contem uma aplicacao frontend. Ele so causara build Node se o servico no Render estiver configurado como Node Runtime. Para o Chatwoot, use Docker Runtime.
