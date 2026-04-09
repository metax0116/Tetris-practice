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
    tetrimino: TETRIMINOS[0], // dummy
    collided: false,
  });
  const [nextPiece, setNextPiece] = useState(randomTetrimino());
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dropTime, setDropTime] = useState<number | null>(null);

  const resetPlayer = useCallback(() => {
    const newTetrimino = nextPiece;
    setNextPiece(randomTetrimino());
    setPlayer({
      pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
      tetrimino: newTetrimino,
      collided: false,
    });
  }, [nextPiece]);

  const startGame = () => {
    setStage(createStage());
    setDropTime(1000);
    resetPlayer();
    setScore(0);
    setLevel(0);
    setRows(0);
    setGameOver(false);
  };

  const checkCollision = (
    player: { pos: { x: number; y: number }; tetrimino: Tetrimino },
    stage: any[][],
    { x: moveX, y: moveY }: { x: number; y: number }
  ) => {
    for (let y = 0; y < player.tetrimino.shape.length; y += 1) {
      for (let x = 0; x < player.tetrimino.shape[y].length; x += 1) {
        if (player.tetrimino.shape[y][x] !== 0) {
          if (
            !stage[y + player.pos.y + moveY] ||
            !stage[y + player.pos.y + moveY][x + player.pos.x + moveX] ||
            stage[y + player.pos.y + moveY][x + player.pos.x + moveX][1] !== 'clear'
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
      pos: { x: (prev.pos.x += x), y: (prev.pos.y += y) },
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
      if (offset > clonedPlayer.tetrimino.shape[0].length) {
        rotate(clonedPlayer.tetrimino.shape, -dir);
        clonedPlayer.pos.x = pos;
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
      setRows((prev) => prev + rowsCleared);
      if (rows >= (level + 1) * 10) {
        setLevel((prev) => prev + 1);
        setDropTime(1000 / (level + 1) + 200);
      }
    }
    return sweptStage;
  };

  const drop = () => {
    if (rows > (level + 1) * 10) {
      setLevel((prev) => prev + 1);
      setDropTime(1000 / (level + 1) + 200);
    }

    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else {
      if (player.pos.y < 1) {
        setGameOver(true);
        setDropTime(null);
      }
      updatePlayerPos({ x: 0, y: 0, collided: true });
    }
  };

  const dropPlayer = () => {
    setDropTime(null);
    drop();
  };

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
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      updatePlayerPos({ x: dir, y: 0, collided: false });
    }
  };

  useInterval(() => {
    drop();
  }, dropTime);

  useEffect(() => {
    if (player.collided) {
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
      setStage(sweepRows(newStage));
      resetPlayer();
    }
  }, [player.collided, resetPlayer, stage]);

  // Ghost Position
  const getGhostPos = () => {
    let ghostY = 0;
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
