'use strict';

const TRACK = 52;          // casas do percurso comum
const BASE = -1;           // peça na base
const LAST_TRACK = 50;     // progresso da última casa do percurso comum (51 casas: 0..50)
const FINISH = 56;         // 51..55 = reta final; 56 = chegada
const START = [0, 26];     // casa de saída absoluta de cada jogador
const SAFE = [0, 8, 13, 21, 26, 34, 39, 47]; // casas seguras (saídas e estrelas)

const absolute = (player, progress) =>
  progress >= 0 && progress <= LAST_TRACK ? (START[player] + progress) % TRACK : null;

class LudoGame {
  constructor({ firstPlayer = 0, pieces } = {}) {
    if (firstPlayer !== 0 && firstPlayer !== 1) throw new RangeError('Jogador inválido');
    this.pieces = pieces ? pieces.map((p) => [...p]) : [Array(4).fill(BASE), Array(4).fill(BASE)];
    this.currentPlayer = firstPlayer;
    this.dice = null;
    this.status = 'playing';
    this.winner = null;
  }

  _target(player, i, dice) {
    const p = this.pieces[player][i];
    if (p === BASE) return dice === 6 ? 0 : null;
    if (p === FINISH) return null;
    return p + dice <= FINISH ? p + dice : null;
  }

  legalMoves(player, dice) {
    const out = [];
    for (let i = 0; i < 4; i++) if (this._target(player, i, dice) !== null) out.push(i);
    return out;
  }

  rollDice(value) {
    if (this.status !== 'playing') throw new Error('Jogo encerrado');
    if (this.dice !== null) throw new Error('Dado já lançado; mova uma peça');
    if (!Number.isInteger(value) || value < 1 || value > 6) throw new RangeError('Dado deve ser de 1 a 6');
    this.dice = value;
    const moves = this.legalMoves(this.currentPlayer, value);
    if (moves.length === 0) {
      this.dice = null;
      this.currentPlayer = 1 - this.currentPlayer;
      return { moved: false, legalMoves: [] };
    }
    return { moved: null, legalMoves: moves };
  }

  movePiece(i) {
    if (this.status !== 'playing') throw new Error('Jogo encerrado');
    if (this.dice === null) throw new Error('Lance o dado primeiro');
    const player = this.currentPlayer;
    const dice = this.dice;
    const target = Number.isInteger(i) && i >= 0 && i < 4 ? this._target(player, i, dice) : null;
    if (target === null) throw new Error('Movimento ilegal');
    this.pieces[player][i] = target;
    let captured = false;
    const abs = absolute(player, target);
    if (abs !== null && !SAFE.includes(abs)) {
      const opp = 1 - player;
      this.pieces[opp] = this.pieces[opp].map((q) => {
        if (absolute(opp, q) === abs) { captured = true; return BASE; }
        return q;
      });
    }
    this.dice = null;
    if (this.pieces[player].every((q) => q === FINISH)) {
      this.status = 'won';
      this.winner = player;
      return { captured, extraTurn: false };
    }
    const extraTurn = dice === 6;
    if (!extraTurn) this.currentPlayer = 1 - player;
    return { captured, extraTurn };
  }
}

module.exports = { LudoGame, absolute, BASE, FINISH, SAFE, TRACK };
