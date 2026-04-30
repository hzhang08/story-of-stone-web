import GoBoard from './GoBoard';

// Reconstructs board state by replaying all moves up to this comment's moveNumber
function buildBoardState(comment, allGameMoves) {
  const stones = {}; // "x,y" -> stone
  let lastMove = null;

  for (const move of allGameMoves) {
    if (!move.isSetup && move.moveNumber > comment.moveNumber) break;
    for (const s of move.position) {
      stones[`${s.x},${s.y}`] = { x: s.x, y: s.y, color: s.color };
    }
    if (move.moveNumber === comment.moveNumber && !move.isSetup) {
      const last = move.position[move.position.length - 1];
      if (last) lastMove = { x: last.x, y: last.y, color: last.color };
    }
  }

  return { stones: Object.values(stones), lastMove };
}

export default function PositionCard({ comment, allGameMoves, boardSize, onClick }) {
  const { stones, lastMove } = buildBoardState(comment, allGameMoves);

  return (
    <div className="position-card" onClick={onClick} title={comment.comment || undefined}>
      <GoBoard boardSize={boardSize} stones={stones} lastMove={lastMove} size={180} />
      <div className="position-card-meta">
        <span className="position-card-file">{comment.file.replace('.sgf', '')}</span>
        <span className="position-card-move">Move {comment.moveNumber}</span>
      </div>
      {comment.comment && (
        <div className="position-card-comment">{comment.comment.split('_')[0]}</div>
      )}
    </div>
  );
}
