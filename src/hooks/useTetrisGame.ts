import { useState, useCallback, useEffect } from 'react';
import { TETRIMINOS, randomTetrimino, Tetrimino, Shape } from '../utils/tetriminoes';
import { useInterval } from './useInterval';

export const STAGE_WIDTH = 12;
export const STAGE_HEIGHT = 22;

export const createStage = () =>
  Array.from(Array(STAGE_HEIGHT), () =>
    new Array(STAGE_WIDTH).fill([0, 'clear'])
  );

export const useTetrisGame = () => {
  const [stage, setStage] = useState(createStage());
  const [player, setPlayer] = useState({
    pos: { x: 0, y: 0 },
    tetrimino: TETRIMINOS['0'], // dummy
    collided: false,
  });
  const [nextPiece, setNextPiece] = useState(randomTetrimino());
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [dropTime, setDropTime] = useState<number | null>(null);
  const [holdPiece, setHoldPiece] = useState<Tetrimino | null>(null);
  const [canHold, setCanHold] = useState(true);

  const resetPlayer = useCallback(() => {
    if (gameOver) return;
    const newTetrimino = nextPiece;
    setNextPiece(randomTetrimino());
    setPlayer({
      pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
      tetrimino: newTetrimino,
      collided: false,
    });
    setCanHold(true);
    // Reset drop speed to current level's normal speed
    setDropTime(1000 / (level + 1) + 200);
  }, [nextPiece, level, gameOver]);

  const startGame = () => {
    setStage(createStage());
    setScore(0);
    setLevel(0);
    setRows(0);
    setGameOver(false);
    setGameStarted(true);
    setHoldPiece(null);
    setCanHold(true);
    
    // Initial piece setup
    const firstPiece = randomTetrimino();
    setNextPiece(randomTetrimino());
    setPlayer({
      pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
      tetrimino: firstPiece,
      collided: false,
    });
    setDropTime(1200); // Normal starting speed
  };

  const checkCollision = (
    player: { pos: { x: number; y: number }; tetrimino: Tetrimino },
    stage: any[][],
    { x: moveX, y: moveY }: { x: number; y: number }
  ) => {
    for (let y = 0; y < player.tetrimino.shape.length; y += 1) {
      for (let x = 0; x < player.tetrimino.shape[y].length; x += 1) {
        if (player.tetrimino.shape[y][x] !== 0) {
          const nextY = y + player.pos.y + moveY;
          const nextX = x + player.pos.x + moveX;

          if (
            nextY < 0 ||
            nextY >= STAGE_HEIGHT ||
            nextX < 0 ||
            nextX >= STAGE_WIDTH ||
            (stage[nextY] && stage[nextY][nextX] && stage[nextY][nextX][1] === 'merged')
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const updatePlayerPos = ({ x, y, collided }: { x: number; y: number; collided: boolean }) => {
    setPlayer((prev) => ({
      ...prev,
      pos: { x: prev.pos.x + x, y: prev.pos.y + y },
      collided,
    }));
  };

  const rotate = (matrix: Shape, dir: number) => {
    const rotated = matrix.map((_, index) =>
      matrix.map((col) => col[index])
    );
    if (dir > 0) return rotated.map((row) => row.reverse());
    return rotated.reverse();
  };

  const playerRotate = (stage: any[][], dir: number) => {
    const clonedPlayer = JSON.parse(JSON.stringify(player));
    clonedPlayer.tetrimino.shape = rotate(clonedPlayer.tetrimino.shape, dir);

    const pos = clonedPlayer.pos.x;
    let offset = 1;
    while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
      clonedPlayer.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (Math.abs(offset) > clonedPlayer.tetrimino.shape[0].length) {
        return;
      }
    }
    setPlayer(clonedPlayer);
  };

  const sweepRows = (newStage: any[][]) => {
    let rowsCleared = 0;
    const sweptStage = newStage.reduce((acc: any[][], row) => {
      if (row.findIndex((cell) => cell[0] === 0) === -1) {
        rowsCleared += 1;
        acc.unshift(new Array(STAGE_WIDTH).fill([0, 'clear']));
        return acc;
      }
      acc.push(row);
      return acc;
    }, []);

    if (rowsCleared > 0) {
      setScore((prev) => prev + [40, 100, 300, 1200][rowsCleared - 1] * (level + 1));
      setRows((prev) => {
        const nextRows = prev + rowsCleared;
        if (nextRows >= (level + 1) * 10) {
          setLevel((l) => l + 1);
        }
        return nextRows;
      });
    }
    return sweptStage;
  };

  const drop = () => {
    if (gameOver) return;
    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else {
      updatePlayerPos({ x: 0, y: 0, collided: true });
    }
  };

  const dropPlayer = () => {
    if (gameOver) return;
    // Balanced soft drop speed
    setDropTime(60);
  };

  const hold = useCallback(() => {
    if (!canHold || gameOver) return;

    const currentPiece = player.tetrimino;

    if (!holdPiece) {
      // First time holding
      setHoldPiece(currentPiece);
      resetPlayer();
    } else {
      // Swapping with held piece
      const temp = holdPiece;
      setHoldPiece(currentPiece);
      setPlayer({
        pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
        tetrimino: temp,
        collided: false,
      });
    }

    setCanHold(false);
  }, [canHold, gameOver, holdPiece, player.tetrimino, resetPlayer]);

  const hardDrop = () => {
    let potY = 0;
    while (!checkCollision(player, stage, { x: 0, y: potY + 1 })) {
      potY += 1;
    }
    setPlayer((prev) => ({
      ...prev,
      pos: { x: prev.pos.x, y: prev.pos.y + potY },
      collided: true,
    }));
  };

  const movePlayer = (dir: number) => {
    if (gameOver) return;
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      updatePlayerPos({ x: dir, y: 0, collided: false });
    }
  };

  useInterval(() => {
    drop();
  }, dropTime);

  useEffect(() => {
    if (player.collided && !gameOver) {
      const newStage = stage.map((row) =>
        row.map((cell) => (cell[1] === 'clear' ? [0, 'clear'] : cell))
      );
      player.tetrimino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            newStage[y + player.pos.y][x + player.pos.x] = [
              value,
              'merged',
              player.tetrimino.color,
            ];
          }
        });
      });
      
      const sweptStage = sweepRows(newStage);
      
      // Check for Game Over immediately after piece is merged
      // If the next piece would collide at the start position
      const nextSpawnPos = { x: STAGE_WIDTH / 2 - 2, y: 0 };
      if (checkCollision({ pos: nextSpawnPos, tetrimino: nextPiece }, sweptStage, { x: 0, y: 0 })) {
        setGameOver(true);
        setDropTime(null);
        setStage(sweptStage);
      } else {
        setStage(sweptStage);
        resetPlayer();
      }
    }
  }, [player.collided, resetPlayer, stage, nextPiece, gameOver]);

  // Ghost Position
  const getGhostPos = () => {
    let ghostY = 0;
    if (player.tetrimino.shape.length === 1 && player.tetrimino.shape[0][0] === 0) {
      return { x: player.pos.x, y: player.pos.y };
    }
    while (!checkCollision(player, stage, { x: 0, y: ghostY + 1 })) {
      ghostY += 1;
    }
    return { x: player.pos.x, y: player.pos.y + ghostY };
  };

  return {
    stage,
    setStage,
    player,
    setPlayer,
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
  };
};
