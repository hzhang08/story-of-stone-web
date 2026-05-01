import { useState, useEffect, useCallback } from 'react';
import GoBoard from './GoBoard';
import { winrateData, topMovesData } from '../data/katago';

function buildBoardAtMove(gameMoves, targetMove) {
  const stones = {};
  let lastMove = null;

  for (const move of gameMoves) {
    const isSetup = move.position.every(s => s.isSetup);
    if (!isSetup && move.moveNumber > targetMove) break;
    for (const s of move.position) {
      stones[`${s.x},${s.y}`] = { x: s.x, y: s.y, color: s.color };
    }
    if (move.moveNumber === targetMove && !isSetup) {
      const last = move.position[move.position.length - 1];
      if (last) lastMove = { x: last.x, y: last.y, color: last.color };
    }
  }
  return { stones: Object.values(stones), lastMove };
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 600);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)');
    const handler = e => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export default function GameReplay({ filename, gameMoves, boardSize, onClose }) {
  const maxMove = gameMoves.reduce((m, gm) => Math.max(m, gm.moveNumber), 0);
  const [currentMove, setCurrentMove] = useState(maxMove);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [mobileTab, setMobileTab] = useState('board'); // 'board' | 'analysis'
  const isMobile = useIsMobile();

  const fileWinrates = winrateData[filename] ?? {};
  const fileTopMoves = topMovesData[filename] ?? {};

  const winrateEntries = Object.entries(fileWinrates)
    .map(([m, v]) => ({ move: parseInt(m), ...v }))
    .sort((a, b) => a.move - b.move);

  const currentTopMoves = showAnalysis ? (fileTopMoves[currentMove] ?? []) : [];

  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowRight') setCurrentMove(m => Math.min(m + 1, maxMove));
    if (e.key === 'ArrowLeft') setCurrentMove(m => Math.max(m - 1, 0));
    if (e.key === 'Escape') onClose();
  }, [maxMove, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const { stones, lastMove } = buildBoardAtMove(gameMoves, currentMove);
  const currentComment = gameMoves.find(m => m.moveNumber === currentMove)?.comment ?? '';
  const winrateNow = fileWinrates[currentMove];

  // Board size: on mobile use full viewport width minus padding; on desktop fit in modal.
  const SIDEBAR = 260, H_PAD = 32, V_PAD = 32, HEADER = 50, CONTROLS = 130;
  const modalW = Math.min(window.innerWidth * 0.9, 1200);
  const modalH = window.innerHeight * 0.92;
  const boardPixels = isMobile
    ? window.innerWidth - 32
    : Math.max(200, Math.min(modalW - SIDEBAR - H_PAD, modalH - HEADER - CONTROLS - V_PAD));

  const boardPanel = (
    <div className="replay-board-col">
      <GoBoard
        boardSize={boardSize}
        stones={stones}
        lastMove={lastMove}
        size={boardPixels}
        topMoves={currentTopMoves}
      />
      <div className="replay-controls">
        <button onClick={() => setCurrentMove(0)}>⏮</button>
        <button onClick={() => setCurrentMove(m => Math.max(m - 1, 0))}>◀</button>
        <button onClick={() => setCurrentMove(m => Math.min(m + 1, maxMove))}>▶</button>
        <button onClick={() => setCurrentMove(maxMove)}>⏭</button>
        <span className="move-counter">Move {currentMove} / {maxMove}</span>
      </div>
      <input
        type="range" min={0} max={maxMove} value={currentMove}
        onChange={e => setCurrentMove(+e.target.value)}
        className={`move-slider${isMobile ? ' move-slider--mobile' : ''}`}
      />
      {currentComment && (
        <div className="replay-comment">{currentComment.split('_')[0]}</div>
      )}
    </div>
  );

  const analysisPanel = (
    <div className="replay-sidebar">
      {!isMobile && (
        <div className="analysis-toggle">
          <label>
            <input type="checkbox" checked={showAnalysis} onChange={e => setShowAnalysis(e.target.checked)} />
            {' '}KataGo analysis
          </label>
        </div>
      )}
      {winrateNow && (
        <div className="winrate-box">
          <div className="winrate-label">Black winrate</div>
          <div className="winrate-bar-wrap">
            <div className="winrate-bar-black" style={{ width: `${(winrateNow.w * 100).toFixed(1)}%` }} />
            <div className="winrate-bar-white" style={{ width: `${((1 - winrateNow.w) * 100).toFixed(1)}%` }} />
          </div>
          <div className="winrate-numbers">
            <span>B {(winrateNow.w * 100).toFixed(1)}%</span>
            <span>Score lead: {winrateNow.s > 0 ? '+' : ''}{winrateNow.s.toFixed(1)}</span>
            <span>W {((1 - winrateNow.w) * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}
      {winrateEntries.length > 0 && (
        <div className="winrate-chart">
          <WinrateChart entries={winrateEntries} currentMove={currentMove} maxMove={maxMove} isMobile={isMobile} />
        </div>
      )}
    </div>
  );

  return (
    <div className="replay-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`replay-modal${isMobile ? ' replay-modal--mobile' : ''}`}>
        <div className="replay-header">
          <h2>{filename.replace('.sgf', '')}</h2>
          {isMobile && (
            <button
              className="mobile-tab-toggle"
              onClick={() => {
                const next = mobileTab === 'board' ? 'analysis' : 'board';
                setMobileTab(next);
                if (next === 'analysis') setShowAnalysis(true);
              }}
            >
              {mobileTab === 'board' ? '📊 Analysis' : '⬛ Board'}
            </button>
          )}
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="replay-body">
          {isMobile ? (
            mobileTab === 'board' ? boardPanel : analysisPanel
          ) : (
            <>
              {boardPanel}
              {analysisPanel}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function WinrateChart({ entries, currentMove, maxMove, isMobile }) {
  const W = isMobile ? Math.min(window.innerWidth - 64, 340) : 240;
  const H = 120;
  if (entries.length < 2) return null;

  const pts = entries.map(e => ({
    x: (e.move / maxMove) * W,
    y: H - e.w * H,
  }));

  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const curX = (currentMove / maxMove) * W;

  return (
    <svg width={W} height={H} style={{ display: 'block', background: '#1a1a1a', borderRadius: 4 }}>
      <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#444" strokeWidth={1} strokeDasharray="3,3" />
      <path d={path} fill="none" stroke="#4285f4" strokeWidth={1.5} />
      <line x1={curX} y1={0} x2={curX} y2={H} stroke="#f4b942" strokeWidth={1} />
    </svg>
  );
}
