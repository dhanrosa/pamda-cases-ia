# Cadastro de acessos pela planilha

A planilha de acessos usa a aba `Pagina1`:

- Coluna `A`: codigo da loja
- Coluna `B`: nome da loja
- Coluna `C`: frete da loja (`R$ 10,00`, `10,00` ou `RETIRADA`)
- Primeira linha de dados: linha `3`

Alteracoes feitas diretamente na planilha passam a valer automaticamente no site.

## Habilitar cadastro pelo site

1. Abra a planilha de acessos.
2. Acesse `Extensoes > Apps Script`.
3. Cole o conteudo de `scripts/store-access-apps-script.js`.
4. Clique em `Implantar > Nova implantacao`.
5. Selecione `App da Web`.
6. Execute como proprietario da planilha e permita acesso para qualquer pessoa.
7. Copie a URL terminada em `/exec`.
8. Configure `GOOGLE_STORE_ACCESS_SCRIPT_URL` no ambiente do site.

O painel administrativo fica disponivel somente para o codigo `1806`.
