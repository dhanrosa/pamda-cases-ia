# Expansao de imagens com IA

## Objetivo

Este prototipo completa somente as areas vazias ao redor de uma fotografia para adapta-la ao formato vertical de uma capinha. O recurso e opt-in, fica desligado por padrao e nao altera o fluxo atual quando inativo.

Com a feature ativa, novas imagens entram em `contain`: inteiras, centralizadas e sem corte automatico. O fundo quadriculado diferencia as areas vazias. A sugestao de IA e recalculada conforme zoom, deslocamento, rotacao, layout e area de impressao; restaurar o enquadramento retorna a zoom 100% e posicao central. Com a feature desligada, o editor conserva o comportamento anterior de preenchimento tipo `cover`.

## Arquitetura

- `src/features/ai-outpainting`: interface, estado, cliente HTTP, configuracao, geometria, canvas e mascara.
- `server/aiOutpainting.js`: validacao segura, prompt, chamada ao SDK oficial e recomposicao dos pixels originais.
- `api/ai/outpaint.js`: funcao serverless Vercel com `multipart/form-data`.
- `server.js` e `vite.config.ts`: adaptadores do mesmo servico para Express e desenvolvimento Vite.

A imagem-base e a mascara tem 1024 x 1536 por padrao. A foto e desenhada sobre fundo transparente; na mascara, apenas as regioes externas ficam transparentes/editaveis. A camada visual do aparelho nao e enviada para a OpenAI. Depois da resposta, o servidor recompõe a imagem-base sobre o resultado para preservar os pixels opacos originais.

A deteccao usa `scale = min(printWidth/imageWidth, printHeight/imageHeight)`, calcula o tamanho renderizado e mede as lacunas em cada lado. A tolerancia centralizada e o maior valor entre 1% da dimensao correspondente e 4 pixels internos.

## Variaveis de ambiente

```env
VITE_ENABLE_AI_OUTPAINTING=false
VITE_AI_OUTPAINTING_MOCK=true
OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=
AI_OUTPAINTING_SERVER_ENABLED=false
```

`OPENAI_API_KEY`, `OPENAI_IMAGE_MODEL` e `AI_OUTPAINTING_SERVER_ENABLED` sao exclusivamente de servidor. Nunca crie `VITE_OPENAI_API_KEY`. No modo real, o endpoint tambem valida novamente o codigo da loja na fonte de acessos existente e aplica um intervalo server-side em memoria.

O frontend aparece somente quando `VITE_ENABLE_AI_OUTPAINTING=true` e `AI_OUTPAINTING_SERVER_ENABLED=true` estavam definidos no momento do build/inicio do Vite. O valor exposto ao bundle e apenas um booleano de disponibilidade, nunca um segredo.

## Modo mock

Configure:

```env
VITE_ENABLE_AI_OUTPAINTING=true
VITE_AI_OUTPAINTING_MOCK=true
AI_OUTPAINTING_SERVER_ENABLED=true
```

Reinicie o Vite. O navegador simula a espera e usa a composicao local preparada, sem chamar o endpoint ou gerar custo.

## API real

Configure `VITE_AI_OUTPAINTING_MOCK=false`, habilite as duas flags e informe `OPENAI_API_KEY` e `OPENAI_IMAGE_MODEL`. O modelo recomendado pela documentacao oficial no momento da implementacao e `gpt-image-2`, mas nao existe valor fixo no codigo. O endpoint aceita somente POST, PNG/JPEG/WebP, mascara PNG, dois arquivos de ate 10 MB e uma requisicao por vez no cliente.

## Execucao e testes

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```

## Mascaras e area segura do aparelho

Os modelos carregados pela aplicacao ja trazem `col2` e `col3`. A previa reaplica `col3` por cima do resultado. Quando ela nao existe, o contorno da capinha e a area tracejada amarela funcionam como mascara generica de teste e aviso visual de seguranca ao redor da camera. Para adicionar um aparelho, inclua suas URLs de base e sobreposicao na fonte de modelos de teste; nao altere a planilha de producao durante a validacao.

## Privacidade e custos

- O usuario precisa confirmar o aviso antes da primeira geracao.
- Original, composicao e resultado permanecem na memoria do navegador; URLs temporarias sao revogadas quando substituidas ou desmontadas.
- Nada e enviado ao Supabase, Cloudinary, pedidos ou buckets.
- O endpoint nao registra imagens, prompts completos, chaves ou dados pessoais.
- Ha trava de clique, uma geracao por vez, intervalo minimo de 12 segundos e confirmacao explicita para cada chamada.
- Antes de disponibilizar externamente, adicione autenticacao server-side e rate limit persistente por loja/usuario/IP. A protecao no navegador nao substitui controles de servidor.

## Desativacao e remocao

Para desativar completamente, mantenha ambas as flags em `false` e refaca o build. Para remover o prototipo, reverta os arquivos listados nesta documentacao, remova os adaptadores `/api/ai/outpaint`, as dependencias `openai`, `multer`, `sharp`, `@types/multer` e `vitest`, e rode lint/test/build. Nao use comandos destrutivos em uma arvore com alteracoes nao revisadas.

## Publicacao futura sem afetar o oficial

Crie um projeto Vercel separado apontando para a branch `feature/ia-imagens`, use dominio de preview, configure somente variaveis de teste e habilite primeiro o mock. Depois, adicione chave OpenAI de projeto com limite de gasto baixo, autenticacao/rate limit no endpoint e execute uma bateria de imagens sem dados sensiveis. Nao conecte buckets, Supabase ou dominio do site oficial durante o piloto.

## Limitacoes atuais

- A area segura da camera e generica; coordenadas especificas por aparelho podem ser adicionadas depois.
- A protecao de custo persistente e autenticacao server-side ainda sao pontos obrigatorios antes de exposicao publica.
- O mock valida o fluxo e a mascara, mas nao simula a qualidade visual de um modelo generativo.
