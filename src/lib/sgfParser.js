// SGF parser ported from Swift SGFIndex.swift
// Supports B, W, AB, AW, SZ, C properties

function parseBoardSize(content) {
  const m = content.match(/SZ\[(\d+)\]/);
  if (!m) return 19;
  const sz = parseInt(m[1], 10);
  return (sz >= 9 && sz <= 19) ? sz : 19;
}

function parsePosition(node, boardSize) {
  const stones = [];
  // Match AB[xx][xx]..., AW[xx][xx]..., B[xx], W[xx]
  const propRe = /(AB|AW|B|W)\[([a-s]{2})\](?:\[([a-s]{2})\])*/g;
  let m;
  while ((m = propRe.exec(node)) !== null) {
    const prop = m[1];
    const color = prop.endsWith('B') ? 'black' : 'white';
    const isSetup = prop.startsWith('A');

    // Extract all coordinate pairs from this property occurrence
    const full = node.slice(m.index, propRe.lastIndex);
    const coordRe = /\[([a-s]{2})\]/g;
    let cm;
    while ((cm = coordRe.exec(full)) !== null) {
      const x = cm[1].charCodeAt(0) - 97;
      const y = cm[1].charCodeAt(1) - 97;
      if (x >= 0 && x < boardSize && y >= 0 && y < boardSize) {
        stones.push({ x, y, color, isSetup });
      }
    }
  }
  return stones;
}

function extractLabels(comment) {
  const parts = comment.split('_');
  if (parts.length <= 1) return [];
  return parts.slice(1);
}

export function parseSGF(content, filename) {
  const boardSize = parseBoardSize(content);
  if (boardSize < 9 || boardSize > 19) throw new Error('Invalid board size');

  const nodeRe = /;[^;]*/g;
  const nodes = content.match(nodeRe);
  if (!nodes || nodes.length === 0) throw new Error('No SGF nodes found');

  const moves = []; // { moveNumber, comment, stones (delta), isSetup }
  let moveNumber = 0;

  for (const node of nodes) {
    const stones = parsePosition(node, boardSize);
    if (stones.length === 0) continue;

    const hasSetup = stones.some(s => s.isSetup);
    if (!hasSetup) moveNumber++;

    const commentMatch = node.match(/C\[([^\]]*)\]/);
    const comment = commentMatch ? commentMatch[1] : '';

    moves.push({ moveNumber: hasSetup ? 0 : moveNumber, comment, stones, isSetup: hasSetup });
  }

  return { boardSize, filename, moves };
}

// Build the full SGFIndex from parsed games
// Returns { labels: { labelName: [SGFComment] }, gameMoves: { filename: [SGFComment] } }
// An SGFComment has: { id, file, moveNumber, comment, position (all stones up to this move), boardSize }
export function buildIndex(parsedGames) {
  const labels = {};
  const gameMoves = {};

  for (const game of parsedGames) {
    const { boardSize, filename, moves } = game;
    const allStones = []; // accumulated board state
    const gameComments = [];

    for (const move of moves) {
      for (const s of move.stones) allStones.push(s);

      const comment = {
        id: `${filename}:${move.moveNumber}:${Math.random().toString(36).slice(2)}`,
        file: filename,
        moveNumber: move.moveNumber,
        comment: move.comment,
        position: move.stones.slice(), // delta stones for this move
        boardSize,
      };
      gameComments.push(comment);

      if (move.comment) {
        for (const label of extractLabels(move.comment)) {
          if (!labels[label]) labels[label] = [];
          labels[label].push(comment);
        }
      }
    }

    gameMoves[filename] = gameComments;
  }

  return { labels, gameMoves };
}

// Given an array of SGFComment moves for a game, reconstruct board state at move N
export function boardStateAt(gameMoves, upToMoveNumber) {
  const stones = {}; // key: "x,y" -> { x, y, color }
  for (const move of gameMoves) {
    if (!move.isSetup && move.moveNumber > upToMoveNumber) break;
    for (const s of move.position) {
      if (s.isSetup) {
        stones[`${s.x},${s.y}`] = { x: s.x, y: s.y, color: s.color };
      } else {
        stones[`${s.x},${s.y}`] = { x: s.x, y: s.y, color: s.color };
      }
    }
  }
  return Object.values(stones);
}
