# desafio_teste_ludo

Casos de teste em **JavaScript** para testar um **Ludo** em JavaScript.

## Especificação do desafio

Partida para **2 jogadores**, 4 peças cada.

- Percurso comum de 52 casas; jogador 0 sai na casa 0 e jogador 1 na casa 26. Progresso da peça: `-1` base, `0..50` percurso, `51..55` reta final, `56` chegada.
- Só sai da base com **6**; tirar 6 dá nova jogada; sem jogada legal a vez passa.
- Pousar sobre peça adversária fora de casa segura a **captura** (volta à base). Casas seguras: 0, 8, 13, 21, 26, 34, 39, 47. Reta final não é capturável.
- Chegada exige dado **exato**. Vence quem levar as 4 peças à chegada.

## Como os casos de teste funcionam

- Usam o executor nativo do Node.js (`node:test`) e `node:assert`; **não há dependências** (Node 18+).
- Ficam em `test/ludo.test.js`, agrupados por assunto; cada caso tem um código `CTxx`.
- Cada teste monta um estado conhecido, executa **uma** ação e verifica o resultado esperado (incluindo valores-limite e entradas inválidas).
- Os testes importam `../src` (`new LudoGame({ firstPlayer, pieces })`, `rollDice(valor)`, `movePiece(i)`, `legalMoves(j,dado)`). Em `src/index.js` há uma implementação de referência mínima só para demonstrar que os testes executam e passam; os testes podem ser aplicados a outra implementação que exponha a mesma API.

### Executar

```bash
npm test
```

### Casos de teste (40)

| Código | Descrição |
|---|---|
| CT01 | cada jogador começa com 4 peças na base |
| CT02 | começa o jogador 0 por padrão |
| CT03 | firstPlayer = 1 faz o jogador 1 começar |
| CT04 | firstPlayer inválido lança RangeError |
| CT05 | jogo começa em andamento, sem vencedor e sem dado lançado |
| CT06 | dado 0 é inválido |
| CT07 | dado 7 é inválido |
| CT08 | dado decimal (2.5) é inválido |
| CT09 | dado não numérico é inválido |
| CT10 | valores-limite 1 e 6 são aceitos |
| CT11 | sem tirar 6, com todas as peças na base, a vez passa |
| CT12 | com 6, as 4 peças da base são jogadas possíveis |
| CT13 | com 6, a peça sai para a casa de saída (progresso 0) |
| CT14 | depois de sair com 6, o mesmo jogador joga de novo |
| CT15 | peça na base não anda com dado diferente de 6 |
| CT16 | jogador 1 sai na casa absoluta 26 |
| CT17 | jogador 0 sai na casa absoluta 0 |
| CT18 | peça avança o valor do dado |
| CT19 | dado diferente de 6 passa a vez |
| CT20 | dado 6 com peça em jogo dá nova jogada |
| CT21 | mover sem lançar o dado lança erro |
| CT22 | lançar o dado duas vezes seguidas lança erro |
| CT23 | índice de peça inválido (4, -1, 1.5) |
| CT24 | movimento ilegal não consome o dado nem altera o estado |
| CT25 | pousar sobre peça adversária em casa comum captura (volta à base) |
| CT26 | casa segura (estrela, abs 8) não permite captura |
| CT27 | casa de saída do adversário (abs 26) é segura |
| CT28 | peças do mesmo jogador não se capturam |
| CT29 | captura só atinge a peça da casa; outras peças do adversário ficam |
| CT30 | conversão de casa absoluta com volta no tabuleiro: J1 progresso 30 → abs 4 |
| CT31 | peça na reta final (progresso ≥ 51) não está no percurso comum e não é capturada |
| CT32 | progresso 50 + 1 entra na reta final (51) |
| CT33 | chegada exata: 54 + 2 = 56 (casa final) |
| CT34 | passar da chegada é ilegal: 54 + 3 |
| CT35 | sem nenhuma jogada legal (só peça perto do fim) a vez passa |
| CT36 | peça que já chegou não se move mais |
| CT37 | quatro peças na chegada dão a vitória |
| CT38 | com três peças na chegada ainda não há vencedor |
| CT39 | vitória do jogador 1 |
| CT40 | após a vitória, novas ações lançam erro |

## Colaboradores

- [Henzo Gabriel Volpe Cardoso] — [@henzovolpe](https://github.com/henzovolpe)] RA:26015432-2