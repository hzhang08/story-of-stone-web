import { useEffect, useRef } from 'react';

const BOARD_COLOR = '#f2d08f';
const LINE_COLOR = '#222';
const STAR_POINTS = {
  19: [[3,3],[3,9],[3,15],[9,3],[9,9],[9,15],[15,3],[15,9],[15,15]],
  13: [[3,3],[3,9],[9,3],[9,9],[6,6]],
  9:  [[2,2],[2,6],[6,2],[6,6],[4,4]],
};

function getStarPoints(size) {
  return STAR_POINTS[size] ?? STAR_POINTS[19];
}

// stones: [{ x, y, color, isLastMove? }]
export default function GoBoard({ boardSize = 19, stones = [], lastMove = null, size = 300, topMoves = [] }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const pad = size / (boardSize + 1);
    const spacing = (size - 2 * pad) / (boardSize - 1);

    function gridX(col) { return pad + col * spacing; }
    function gridY(row) { return pad + row * spacing; }

    // Board background
    ctx.fillStyle = BOARD_COLOR;
    ctx.fillRect(0, 0, size, size);

    // Grid lines
    ctx.strokeStyle = LINE_COLOR;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < boardSize; i++) {
      ctx.beginPath();
      ctx.moveTo(gridX(i), gridY(0));
      ctx.lineTo(gridX(i), gridY(boardSize - 1));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gridX(0), gridY(i));
      ctx.lineTo(gridX(boardSize - 1), gridY(i));
      ctx.stroke();
    }

    // Star points
    for (const [x, y] of getStarPoints(boardSize)) {
      ctx.beginPath();
      ctx.arc(gridX(x), gridY(y), Math.max(2, spacing * 0.1), 0, 2 * Math.PI);
      ctx.fillStyle = LINE_COLOR;
      ctx.fill();
    }

    // Top move suggestions (faint markers)
    for (const tm of topMoves) {
      const coord = gtpToXY(tm.c, boardSize);
      if (!coord) continue;
      const cx = gridX(coord.x);
      const cy = gridY(coord.y);
      const r = spacing * 0.38;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.fillStyle = tm.rank === 1 ? 'rgba(66,133,244,0.75)' : 'rgba(66,133,244,0.35)';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(8, spacing * 0.28)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tm.rank, cx, cy);
    }

    // Stones
    const stoneR = spacing * 0.45;
    for (const s of stones) {
      const cx = gridX(s.x);
      const cy = gridY(s.y);

      // Stone gradient for 3D look
      const grad = ctx.createRadialGradient(cx - stoneR * 0.3, cy - stoneR * 0.3, stoneR * 0.1, cx, cy, stoneR);
      if (s.color === 'black') {
        grad.addColorStop(0, '#555');
        grad.addColorStop(1, '#000');
      } else {
        grad.addColorStop(0, '#fff');
        grad.addColorStop(1, '#ccc');
      }
      ctx.beginPath();
      ctx.arc(cx, cy, stoneR, 0, 2 * Math.PI);
      ctx.fillStyle = grad;
      ctx.fill();
      if (s.color === 'white') {
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // Last move marker
    if (lastMove) {
      const cx = gridX(lastMove.x);
      const cy = gridY(lastMove.y);
      ctx.beginPath();
      ctx.arc(cx, cy, stoneR * 0.45, 0, 2 * Math.PI);
      ctx.strokeStyle = lastMove.color === 'black' ? '#fff' : '#333';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [boardSize, stones, lastMove, size, topMoves]);

  return <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 2 }} />;
}

// Convert GTP coordinate (e.g. "Q16") to { x, y } 0-indexed
function gtpToXY(coord, boardSize) {
  if (!coord || coord === 'pass') return null;
  const col = coord.charCodeAt(0) - 65; // A=0
  const adjustedCol = col >= 8 ? col - 1 : col; // skip 'I'
  const row = boardSize - parseInt(coord.slice(1), 10);
  if (adjustedCol < 0 || adjustedCol >= boardSize || row < 0 || row >= boardSize) return null;
  return { x: adjustedCol, y: row };
}
