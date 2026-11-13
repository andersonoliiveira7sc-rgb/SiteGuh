# MISSÃO ROBUX — como rodar este projeto fora da Lovable

Este pacote contém todo o código-fonte do site. Ele não inclui `node_modules`,
`.git` nem pastas de build — só o código que você precisa para continuar o trabalho.

## Requisitos

- Node.js 20 ou mais novo (https://nodejs.org) — ou Bun (https://bun.sh)

## Rodar no computador

```sh
npm install
npm run dev
```

Abra http://localhost:8080 no navegador.

Com Bun, os comandos são `bun install` e `bun run dev`.

## Outros comandos

```sh
npm run build     # gera a versão de produção
npm run preview   # testa a versão de produção localmente
npm run lint      # verifica o código
npm run test      # roda os testes
```

## Onde fica cada coisa

| Caminho | O que é |
| --- | --- |
| `src/routes/index.tsx` | Página principal: etapa 1 (busca do nick) e o rodapé com o aviso |
| `src/components/tiktok-study-step.tsx` | Etapa 2 (os dois passos e o botão) |
| `src/lib/roblox.functions.ts` | Função de servidor que recebe a busca do nick |
| `src/lib/roblox-lookup.server.ts` | Consulta ao Roblox (várias fontes, tempo limite, cache) |
| `src/styles.css` | Cores, fontes e tema do site |
| `src/routes/__root.tsx` | Título da aba, descrição e carregamento das fontes |

## O botão da etapa 2

No arquivo `src/components/tiktok-study-step.tsx` existe a linha:

```ts
const TIKTOK_LITE_URL = "";
```

Enquanto ela estiver vazia, o botão mostra "O link ainda não foi adicionado."
Você pode apontar esse botão para o seu próprio canal, grupo ou perfil.

## Publicar em outro lugar

O projeto é um app TanStack Start (React + TypeScript + Tailwind CSS v4) e roda em
qualquer hospedagem Node. O build (`npm run build`) gera a pasta `dist/`.
Para hospedar em outro serviço, ajuste `vite.config.ts` se o serviço exigir um
alvo diferente do padrão (`cloudflare`).
