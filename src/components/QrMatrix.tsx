import React from 'react';

interface QrMatrixProps {
  value: string;
  size?: number;
}

export const QrMatrix: React.FC<QrMatrixProps> = ({ value, size = 160 }) => {
  const grid = 21;
  let seed = 0;
  for (let i = 0; i < value.length; i++) {
    seed = (seed * 31 + value.charCodeAt(i)) >>> 0;
  }

  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) =>
      r >= br && r < br + 7 && c >= bc && c < bc + 7;
    if (!inBox(0, 0) && !inBox(0, grid - 7) && !inBox(grid - 7, 0)) return null;

    const lr = r >= grid - 7 ? r - (grid - 7) : r;
    const lc = c >= grid - 7 ? c - (grid - 7) : c;
    const border = lr === 0 || lr === 6 || lc === 0 || lc === 6;
    const inner = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
    return border || inner;
  };

  const cells: React.ReactElement[] = [];
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const finder = isFinder(r, c);
      let dark = false;
      if (finder !== null) {
        dark = finder;
      } else {
        const bit = ((seed ^ (r * 73856093) ^ (c * 19349663)) >>> ((r + c) % 16)) & 1;
        dark = bit === 1;
      }
      if (dark) {
        cells.push(
          <rect
            key={`${r}-${c}`}
            x={c}
            y={r}
            width={1}
            height={1}
            fill="#1e1b4b"
          />
        );
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${grid} ${grid}`}
      className="rounded-xl bg-white p-2 border border-slate-200 shadow-sm"
      role="img"
      aria-label={`রেফারেল কিউআর কোড: ${value}`}
    >
      <rect width={grid} height={grid} fill="#ffffff" />
      {cells}
    </svg>
  );
};
