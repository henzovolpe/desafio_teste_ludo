'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { LudoGame, absolute, BASE, FINISH, SAFE, TRACK } = require('../src');

// Notação de progresso de cada peça:
//  -1 = base | 0 = casa de saída | 0..50 = percurso comum | 51..55 = reta final | 56 = chegada
// Jogador 0 sai na casa absoluta 0; jogador 1 sai na casa absoluta 26 (lado oposto).
const novo = (p0, p1, first = 0) => new LudoGame({ firstPlayer: first, pieces: [p0, p1] });
const B = BASE;

describe('CT01-CT05 Estado inicial', () => {
  test('CT01 cada jogador começa com 4 peças na base', () => {
    const g = new LudoGame();
    assert.deepEqual(g.pieces, [[B, B, B, B], [B, B, B, B]]);
  });
  test('CT02 começa o jogador 0 por padrão', () => assert.equal(new LudoGame().currentPlayer, 0));
  test('CT03 firstPlayer = 1 faz o jogador 1 começar', () => assert.equal(new LudoGame({ firstPlayer: 1 }).currentPlayer, 1));
  test('CT04 firstPlayer inválido lança RangeError', () => {
    assert.throws(() => new LudoGame({ firstPlayer: 2 }), RangeError);
  });
  test('CT05 jogo começa em andamento, sem vencedor e sem dado lançado', () => {
    const g = new LudoGame();
    assert.deepEqual([g.status, g.winner, g.dice], ['playing', null, null]);
  });
});

describe('CT06-CT10 Validação do dado', () => {
  test('CT06 dado 0 é inválido', () => assert.throws(() => new LudoGame().rollDice(0), RangeError));
  test('CT07 dado 7 é inválido', () => assert.throws(() => new LudoGame().rollDice(7), RangeError));
  test('CT08 dado decimal (2.5) é inválido', () => assert.throws(() => new LudoGame().rollDice(2.5), RangeError));
  test('CT09 dado não numérico é inválido', () => assert.throws(() => new LudoGame().rollDice('6'), RangeError));
  test('CT10 valores-limite 1 e 6 são aceitos', () => {
    assert.doesNotThrow(() => new LudoGame().rollDice(1));
    assert.doesNotThrow(() => new LudoGame().rollDice(6));
  });
});

describe('CT11-CT17 Saída da base', () => {
  test('CT11 sem tirar 6, com todas as peças na base, a vez passa', () => {
    const g = new LudoGame();
    const r = g.rollDice(5);
    assert.equal(r.moved, false);
    assert.equal(g.currentPlayer, 1);
    assert.equal(g.dice, null);
  });
  test('CT12 com 6, as 4 peças da base são jogadas possíveis', () => {
    const r = new LudoGame().rollDice(6);
    assert.deepEqual(r.legalMoves, [0, 1, 2, 3]);
  });
  test('CT13 com 6, a peça sai para a casa de saída (progresso 0)', () => {
    const g = new LudoGame(); g.rollDice(6); g.movePiece(2);
    assert.equal(g.pieces[0][2], 0);
  });
  test('CT14 depois de sair com 6, o mesmo jogador joga de novo', () => {
    const g = new LudoGame(); g.rollDice(6);
    const r = g.movePiece(0);
    assert.equal(r.extraTurn, true);
    assert.equal(g.currentPlayer, 0);
  });
  test('CT15 peça na base não anda com dado diferente de 6', () => {
    const g = novo([B, 3, B, B], [B, B, B, B]);
    assert.deepEqual(g.rollDice(4).legalMoves, [1]);
    assert.throws(() => g.movePiece(0), /ilegal/);
  });
  test('CT16 jogador 1 sai na casa absoluta 26', () => {
    const g = new LudoGame({ firstPlayer: 1 }); g.rollDice(6); g.movePiece(0);
    assert.equal(absolute(1, g.pieces[1][0]), 26);
  });
  test('CT17 jogador 0 sai na casa absoluta 0', () => {
    assert.equal(absolute(0, 0), 0);
  });
});

describe('CT18-CT24 Movimento e turnos', () => {
  test('CT18 peça avança o valor do dado', () => {
    const g = novo([10, B, B, B], [B, B, B, B]); g.rollDice(3); g.movePiece(0);
    assert.equal(g.pieces[0][0], 13);
  });
  test('CT19 dado diferente de 6 passa a vez', () => {
    const g = novo([10, B, B, B], [B, B, B, B]); g.rollDice(3);
    const r = g.movePiece(0);
    assert.equal(r.extraTurn, false);
    assert.equal(g.currentPlayer, 1);
  });
  test('CT20 dado 6 com peça em jogo dá nova jogada', () => {
    const g = novo([10, B, B, B], [B, B, B, B]); g.rollDice(6);
    assert.equal(g.movePiece(0).extraTurn, true);
    assert.equal(g.currentPlayer, 0);
    assert.equal(g.pieces[0][0], 16);
  });
  test('CT21 mover sem lançar o dado lança erro', () => {
    assert.throws(() => new LudoGame().movePiece(0), /dado/);
  });
  test('CT22 lançar o dado duas vezes seguidas lança erro', () => {
    const g = novo([10, B, B, B], [B, B, B, B]); g.rollDice(2);
    assert.throws(() => g.rollDice(3), /já lançado/);
  });
  test('CT23 índice de peça inválido (4, -1, 1.5)', () => {
    const g = novo([10, B, B, B], [B, B, B, B]); g.rollDice(2);
    [4, -1, 1.5].forEach((i) => assert.throws(() => g.movePiece(i), /ilegal/));
  });
  test('CT24 movimento ilegal não consome o dado nem altera o estado', () => {
    const g = novo([10, B, B, B], [B, B, B, B]); g.rollDice(2);
    assert.throws(() => g.movePiece(1));
    assert.equal(g.dice, 2);
    assert.equal(g.pieces[0][0], 10);
  });
});

describe('CT25-CT31 Captura e casas seguras', () => {
  // progresso p do jogador 1 está na casa absoluta (26 + p) % 52
  test('CT25 pousar sobre peça adversária em casa comum captura (volta à base)', () => {
    // J0 em 4 tira 3 -> progresso 7 (abs 7); J1 progresso 33 -> abs (26+33)%52 = 7
    const g = novo([4, B, B, B], [33, B, B, B]); g.rollDice(3);
    const r = g.movePiece(0);
    assert.equal(r.captured, true);
    assert.equal(g.pieces[1][0], B);
  });
  test('CT26 casa segura (estrela, abs 8) não permite captura', () => {
    // J0 em 5 + 3 = 8 (segura); J1 progresso 34 -> abs 8
    const g = novo([5, B, B, B], [34, B, B, B]); g.rollDice(3);
    const r = g.movePiece(0);
    assert.equal(r.captured, false);
    assert.equal(g.pieces[1][0], 34);
  });
  test('CT27 casa de saída do adversário (abs 26) é segura', () => {
    assert.ok(SAFE.includes(26));
    const g = novo([20, B, B, B], [0, B, B, B]); g.rollDice(6);
    assert.equal(g.movePiece(0).captured, false);
    assert.equal(g.pieces[1][0], 0);
  });
  test('CT28 peças do mesmo jogador não se capturam', () => {
    const g = novo([4, 7, B, B], [B, B, B, B]); g.rollDice(3);
    const r = g.movePiece(0);
    assert.equal(r.captured, false);
    assert.equal(g.pieces[0][1], 7);
  });
  test('CT29 captura só atinge a peça da casa; outras peças do adversário ficam', () => {
    const g = novo([4, B, B, B], [33, 40, B, B]); g.rollDice(3); g.movePiece(0);
    assert.deepEqual(g.pieces[1], [B, 40, B, B]);
  });
  test('CT30 conversão de casa absoluta com volta no tabuleiro: J1 progresso 30 → abs 4', () => {
    assert.equal(absolute(1, 30), (26 + 30) % TRACK);
    assert.equal(absolute(1, 30), 4);
  });
  test('CT31 peça na reta final (progresso ≥ 51) não está no percurso comum e não é capturada', () => {
    assert.equal(absolute(0, 51), null);
    const g = novo([4, B, B, B], [52, B, B, B]); g.rollDice(3);
    assert.equal(g.movePiece(0).captured, false);
    assert.equal(g.pieces[1][0], 52);
  });
});

describe('CT32-CT36 Reta final e chegada', () => {
  test('CT32 progresso 50 + 1 entra na reta final (51)', () => {
    const g = novo([50, B, B, B], [B, B, B, B]); g.rollDice(1); g.movePiece(0);
    assert.equal(g.pieces[0][0], 51);
  });
  test('CT33 chegada exata: 54 + 2 = 56 (casa final)', () => {
    const g = novo([54, B, B, B], [B, B, B, B]); g.rollDice(2); g.movePiece(0);
    assert.equal(g.pieces[0][0], FINISH);
  });
  test('CT34 passar da chegada é ilegal: 54 + 3', () => {
    const g = novo([54, 10, B, B], [B, B, B, B]);
    assert.deepEqual(g.rollDice(3).legalMoves, [1]);
    assert.throws(() => g.movePiece(0), /ilegal/);
  });
  test('CT35 sem nenhuma jogada legal (só peça perto do fim) a vez passa', () => {
    const g = novo([55, B, B, B], [B, B, B, B]);
    const r = g.rollDice(4);
    assert.equal(r.moved, false);
    assert.equal(g.currentPlayer, 1);
  });
  test('CT36 peça que já chegou não se move mais', () => {
    const g = novo([FINISH, B, B, B], [B, B, B, B]);
    assert.equal(g.rollDice(1).moved, false);
  });
});

describe('CT37-CT40 Vitória', () => {
  test('CT37 quatro peças na chegada dão a vitória', () => {
    const g = novo([FINISH, FINISH, FINISH, 55], [B, B, B, B]); g.rollDice(1); g.movePiece(3);
    assert.equal(g.status, 'won');
    assert.equal(g.winner, 0);
  });
  test('CT38 com três peças na chegada ainda não há vencedor', () => {
    const g = novo([FINISH, FINISH, 54, 55], [B, B, B, B]); g.rollDice(1); g.movePiece(3);
    assert.equal(g.status, 'playing');
    assert.equal(g.winner, null);
  });
  test('CT39 vitória do jogador 1', () => {
    const g = novo([B, B, B, B], [FINISH, FINISH, FINISH, 53], 1); g.rollDice(3); g.movePiece(3);
    assert.equal(g.winner, 1);
  });
  test('CT40 após a vitória, novas ações lançam erro', () => {
    const g = novo([FINISH, FINISH, FINISH, 55], [B, B, B, B]); g.rollDice(1); g.movePiece(3);
    assert.throws(() => g.rollDice(2), /encerrado/);
    assert.throws(() => g.movePiece(0), /encerrado/);
  });
});
