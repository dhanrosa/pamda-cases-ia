# Pamda Cases

Projeto React + Vite para montar capinhas personalizadas.

## Rodar Localmente

1. Instale as dependencias:

```bash
npm install
```

2. Crie um arquivo `.env` na raiz:

```env
VITE_SUPABASE_URL="https://bdgllnodryzbtypcbjpe.supabase.co"
VITE_SUPABASE_ANON_KEY="SUA_CHAVE_ANON_OU_PUBLISHABLE"
VITE_SUPABASE_BUCKET="catalogo-pamdacases"
VITE_SUPABASE_CATALOG_FOLDER="CATALOGO LOJAS"
GOOGLE_MODELOS_SHEET_ID="ID_DA_PLANILHA_DE_MODELOS"
GOOGLE_STORE_ACCESS_SHEET_ID="ID_DA_PLANILHA_DE_LOJAS"
```

3. Rode:

```bash
npm run dev
```

## Supabase Storage

Crie um bucket chamado `catalogo-pamdacases` em **Storage**.

Para o catalogo publico do site, deixe o bucket publico ou crie uma policy de leitura publica para objetos do bucket.

A pasta principal dentro do bucket deve ser:

```txt
CATALOGO LOJAS
```

Organize as imagens mantendo categorias e subcategorias no caminho:

```txt
CATALOGO LOJAS/animais/cachorros/imagem1.png
CATALOGO LOJAS/animais/gatos/imagem2.png
CATALOGO LOJAS/letras/letra-diamante/A.png
CATALOGO LOJAS/letras/letra-floral/A.png
```

O app percorre essa pasta recursivamente usando Supabase Storage e gera a URL publica com:

```js
supabase.storage.from(bucket).getPublicUrl(caminho)
```

## Categorias

As categorias sao derivadas automaticamente do caminho:

```txt
CATALOGO LOJAS/animais/cachorros/dog1.png
categoria = animais
subcategoria = cachorros

CATALOGO LOJAS/letras/letra-diamante/A.png
categoria = letras
subcategoria = letra-diamante
```

## Vercel

Configure em **Project Settings > Environment Variables**:

```env
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_BUCKET
VITE_SUPABASE_CATALOG_FOLDER
GOOGLE_MODELOS_SHEET_ID
GOOGLE_STORE_ACCESS_SHEET_ID
```

Nao use `service_role` no frontend. Use apenas a chave publica `anon` ou `publishable`.

As variaveis das planilhas nao devem usar o prefixo `VITE_`. Elas sao lidas somente
pelo backend para evitar expor os IDs no JavaScript enviado ao navegador.
