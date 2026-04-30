import { useAppState } from './store/useAppState';
import Sidebar from './components/Sidebar';
import PositionCard from './components/PositionCard';
import GameReplay from './components/GameReplay';
import './App.css';

export default function App() {
  const {
    loading, error,
    labels, games, index,
    selectedLabel, selectedGame,
    labelPositions,
    positionsPerRow, setPositionsPerRow,
    selectLabel, selectGame, closeReplay,
  } = useAppState();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading games…</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-screen">Error: {error}</div>;
  }

  const replayGame = selectedGame && index?.gameMoves[selectedGame];
  const replayBoardSize = replayGame ? (replayGame[0]?.boardSize ?? 19) : 19;

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">Story of Stone</span>
        {selectedLabel && (
          <div className="cols-control">
            <span>Columns:</span>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                className={`col-btn${positionsPerRow === n ? ' active' : ''}`}
                onClick={() => setPositionsPerRow(n)}
              >{n}</button>
            ))}
          </div>
        )}
      </header>

      <div className="app-body">
        <Sidebar
          labels={labels}
          selectedLabel={selectedLabel}
          onSelectLabel={selectLabel}
        />

        <main className="main-content">
          {!selectedLabel && !selectedGame && (
            <div className="empty-state">
              <div className="empty-icon">⚫</div>
              <p>Select a game to replay or a label to browse positions</p>
            </div>
          )}

          {selectedLabel && index && (
            <>
              <div className="content-heading">
                Label: <strong>{selectedLabel}</strong>
                <span className="count-badge">{labelPositions.length}</span>
              </div>
              <div
                className="positions-grid"
                style={{ gridTemplateColumns: `repeat(${positionsPerRow}, 1fr)` }}
              >
                {labelPositions.map(comment => (
                  <PositionCard
                    key={comment.id}
                    comment={comment}
                    allGameMoves={index.gameMoves[comment.file] ?? []}
                    boardSize={comment.boardSize}
                    onClick={() => selectGame(comment.file)}
                  />
                ))}
              </div>
            </>
          )}

          {selectedGame && !replayGame && (
            <div className="empty-state"><p>No moves found for this game.</p></div>
          )}
        </main>
      </div>

      {replayGame && (
        <GameReplay
          filename={selectedGame}
          gameMoves={replayGame}
          boardSize={replayBoardSize}
          onClose={closeReplay}
        />
      )}
    </div>
  );
}
