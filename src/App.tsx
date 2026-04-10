import React, { useRef } from 'react';
import { useTetrisGame, STAGE_WIDTH } from './hooks/useTetrisGame';
import './styles/Tetris.css';

const App: React.FC = () => {
  const {
    stage,
    player,
    nextPiece,
    score,
    rows,
    level,
    gameOver,
    gameStarted,
    holdPiece,
    hold,
    startGame,
    movePlayer,
    dropPlayer,
    playerRotate,
    hardDrop,
    getGhostPos,
    setDropTime,
    dropTime,
  } = useTetrisGame();

  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (gameOver) return;

    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'p', 'P', 'c', 'C', 'Shift'].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === 'ArrowLeft') {
      movePlayer(-1);
    } else if (e.key === 'ArrowRight') {
      movePlayer(1);
    } else if (e.key === 'ArrowDown') {
      dropPlayer();
    } else if (e.key === 'ArrowUp') {
      playerRotate(stage, 1);
    } else if (e.key === ' ') {
      hardDrop();
    } else if (e.key === 'c' || e.key === 'C' || e.key === 'Shift') {
      hold();
    } else if (e.key === 'p' || e.key === 'P') {
      if (dropTime) {
        setDropTime(null);
      } else {
        setDropTime(1000 / (level + 1) + 200);
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (gameOver) return;

    if (e.key === 'ArrowDown') {
      setDropTime(1000 / (level + 1) + 200);
    }
  };

  const ghostPos = getGhostPos();

  // Combine stage with current player and ghost
  const displayStage = stage.map((row) => row.map((cell) => [...cell]));

  // Draw Ghost
  player.tetrimino.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        const stageY = y + ghostPos.y;
        const stageX = x + ghostPos.x;
        if (displayStage[stageY] && displayStage[stageY][stageX]) {
          displayStage[stageY][stageX] = [value, 'ghost', player.tetrimino.color];
        }
      }
    });
  });

  // Draw Player
  player.tetrimino.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        const stageY = y + player.pos.y;
        const stageX = x + player.pos.x;
        if (displayStage[stageY] && displayStage[stageY][stageX]) {
          displayStage[stageY][stageX] = [value, 'player', player.tetrimino.color];
        }
      }
    });
  });

  return (
    <div
      className="tetris-wrapper"
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      ref={wrapperRef}
      onClick={() => wrapperRef.current?.focus()}
    >
      <div className="tetris-container">
        <div className="stage">
          {displayStage.map((row, y) =>
            row.map((cell, x) => (
              <div key={`${y}-${x}`} className="cell">
                {cell[1] !== 'clear' && (
                  <div
                    className={`cell-inner ${
                      cell[1] === 'ghost' ? 'cell-ghost' : 'cell-filled'
                    }`}
                    style={{
                      backgroundColor: cell[1] === 'ghost' ? 'transparent' : (cell[2] as string),
                      boxShadow: cell[1] === 'ghost' ? 'none' : `0 0 10px ${(cell[2] as string)}`,
                    }}
                  />
                )}
              </div>
            ))
          )}
        </div>

        <div className="info-panel">
          <div className="next-piece-box">
            <div className="stat-label">Hold</div>
            <div 
              className="next-piece-grid"
              style={{
                gridTemplateRows: `repeat(${holdPiece ? holdPiece.shape.length : 4}, 20px)`,
                gridTemplateColumns: `repeat(${holdPiece ? holdPiece.shape[0].length : 4}, 20px)`,
                minHeight: '80px',
                minWidth: '80px',
                display: 'grid',
                justifyContent: 'center',
                alignContent: 'center'
              }}
            >
              {holdPiece ? (
                holdPiece.shape.map((row, y) =>
                  row.map((value, x) => (
                    <div key={`hold-${y}-${x}`} className="next-cell">
                      {value !== 0 && (
                        <div
                          className="cell-inner cell-filled"
                          style={{
                            backgroundColor: holdPiece.color,
                            boxShadow: `0 0 5px ${holdPiece.color}`,
                            width: '100%',
                            height: '100%',
                          }}
                        />
                      )}
                    </div>
                  ))
                )
              ) : (
                <div style={{ gridColumn: 'span 4', color: '#444', fontSize: '0.6rem', textAlign: 'center' }}>[ EMPTY ]</div>
              )}
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-label">Score</div>
            <div className="stat-value">{score}</div>
          </div>
          <div className="stat-box" style={{ borderLeftColor: '#f0f000' }}>
            <div className="stat-label">Rows</div>
            <div className="stat-value">{rows}</div>
          </div>
          <div className="stat-box" style={{ borderLeftColor: '#00f000' }}>
            <div className="stat-label">Level</div>
            <div className="stat-value">{level}</div>
          </div>

          <div className="next-piece-box">
            <div className="stat-label">Next</div>
            <div 
              className="next-piece-grid"
              style={{
                gridTemplateRows: `repeat(${nextPiece.shape.length}, 20px)`,
                gridTemplateColumns: `repeat(${nextPiece.shape[0].length}, 20px)`
              }}
            >
              {nextPiece.shape.map((row, y) =>
                row.map((value, x) => (
                  <div key={`next-${y}-${x}`} className="next-cell">
                    {value !== 0 && (
                      <div
                        className="cell-inner cell-filled"
                        style={{
                          backgroundColor: nextPiece.color,
                          boxShadow: `0 0 5px ${nextPiece.color}`,
                          width: '100%',
                          height: '100%',
                        }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {!dropTime && !gameOver && score > 0 && (
            <div className="stat-value" style={{ color: '#ff0', textAlign: 'center' }}>PAUSED</div>
          )}

          <div className="controls-hint">
            ARROWS: Move & Rotate<br />
            SPACE: Hard Drop<br />
            DOWN: Soft Drop<br />
            C / SHIFT: Hold<br />
            P: Pause
          </div>
        </div>

        {gameOver && (
          <div className="game-over-overlay">
            <div className="game-over-text">GAME OVER</div>
            <div className="final-score">Final Score: {score}</div>
            <button className="start-button" onClick={startGame}>
              Retry
            </button>
          </div>
        )}

        {!gameStarted && (
          <div className="game-over-overlay" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <button className="start-button" onClick={startGame}>
              Start Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
