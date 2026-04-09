export type Shape = (number | string)[][];

export interface Tetrimino {
  shape: Shape;
  color: string;
}

export const TETRIMINOS: { [key: string]: Tetrimino } = {
  I: {
    shape: [
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
    ],
    color: '#00f0f0', // Cyan
  },
  J: {
    shape: [
      [0, 'J', 0],
      [0, 'J', 0],
      ['J', 'J', 0],
    ],
    color: '#0000f0', // Blue
  },
  L: {
    shape: [
      [0, 'L', 0],
      [0, 'L', 0],
      [0, 'L', 'L'],
    ],
    color: '#f0a000', // Orange
  },
  O: {
    shape: [
      ['O', 'O'],
      ['O', 'O'],
    ],
    color: '#f0f000', // Yellow
  },
  S: {
    shape: [
      [0, 'S', 'S'],
      ['S', 'S', 0],
      [0, 0, 0],
    ],
    color: '#00f000', // Green
  },
  T: {
    shape: [
      [0, 'T', 0],
      ['T', 'T', 'T'],
      [0, 0, 0],
    ],
    color: '#a000f0', // Purple
  },
  Z: {
    shape: [
      ['Z', 'Z', 0],
      [0, 'Z', 'Z'],
      [0, 0, 0],
    ],
    color: '#f00000', // Red
  },
};

export const randomTetrimino = () => {
  const keys = Object.keys(TETRIMINOS);
  const key = keys[Math.floor(Math.random() * keys.length)];
  return TETRIMINOS[key];
};
