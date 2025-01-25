export const jointConnections = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];

// array of pairs of fingertips that when touching, the loop describes their shape
const pairsAndLoops = [
  // left thumb and left fingers
  { pairs: [[4, 8]], loop: [2, 3, 4, 8, 7, 6, 5] },
  { pairs: [[4, 12]], loop: [2, 3, 4, 12, 11, 10, 9] },
  { pairs: [[4, 16]], loop: [2, 3, 4, 16, 15, 14, 13] },
  { pairs: [[4, 20]], loop: [2, 3, 4, 20, 19, 18, 17] },
  // right thumb and right fingers
  { pairs: [[25, 29]], loop: [23, 24, 25, 29, 28, 27, 26] },
  { pairs: [[25, 33]], loop: [23, 24, 25, 33, 32, 31, 30] },
  { pairs: [[25, 37]], loop: [23, 24, 25, 37, 36, 35, 34] },
  { pairs: [[25, 41]], loop: [23, 24, 25, 41, 40, 39, 38] },
  // thumbs and pointers
  { pairs: [[4, 25], [8, 29]], loop: [2, 3, 4, 25, 24, 23, 26, 27, 28, 29, 8, 7, 6, 5] },
  { pairs: [[4, 29], [8, 25]], loop: [2, 3, 4, 29, 28, 27, 26, 23, 24, 25, 8, 7, 6, 5] },
  // pointers and middles
  { pairs: [[8, 29], [12, 33]], loop: [5, 6, 7, 29, 28, 27, 26, 30, 31, 32, 33, 11, 10, 9] },
  { pairs: [[8, 33], [12, 29]], loop: [5, 6, 7, 33, 32, 31, 30, 26, 27, 27, 29, 11, 10, 9] },

  // middles and rings
  { pairs: [[12, 33], [16, 37]], loop: [9, 10, 11, 33, 32, 31, 30, 34, 35, 36, 37, 15, 14, 13] },
  { pairs: [[12, 37], [16, 33]], loop: [9, 10, 11, 37, 36, 35, 34, 30, 31, 32, 33, 15, 14, 13] },

  // rings and pinkies
  { pairs: [[16, 37], [20, 41]], loop: [13, 14, 15, 37, 36, 35, 34, 38, 39, 40, 41, 19, 18, 17] },
  { pairs: [[16, 41], [20, 37]], loop: [13, 14, 15, 41, 40, 39, 38, 34, 35, 36, 37, 19, 18, 17] },

  // cross-hand loops (e.g., left thumb to right fingers)
  { pairs: [[4, 33]], loop: [2, 3, 4, 33, 32, 31, 30, 9] },
  { pairs: [[4, 37]], loop: [2, 3, 4, 37, 36, 35, 34, 13] },
  { pairs: [[25, 12]], loop: [23, 24, 25, 12, 11, 10, 9, 30] },
  { pairs: [[25, 16]], loop: [23, 24, 25, 16, 15, 14, 13, 34] },
];

export const getColors = (colorAmount) => {
  const colors = Array.from({ length: colorAmount }, (_, i) => {
    const hue = (i * (360 / colorAmount)) % 360;
    return `hsl(${hue}, 100%, 50%)`;
  });
  return colors;
};

export const distance = (point1, point2) => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.hypot(dx, dy);
};

// TODO: switch to array.reduce
const pointsCenter = (points) => {
  let x = 0;
  let y = 0;
  points.forEach((point) => {
    x += point.x;
    y += point.y;
  });
  x /= points.length;
  y /= points.length;
  return { x, y };
};

const polygonArea = (points) => Math.abs(points.reduce((sum, { x, y }, i, arr) => {
  const next = arr[(i + 1) % arr.length];
  return sum + (x * next.y - y * next.x);
}, 0) / 2);

export const findLoops = ({ hands, touchingThreshold, minArea }) => {
  const loops = [];
  const flatHands = hands.flat();
  pairsAndLoops.forEach(({ pairs, loop }) => {
    const allPairsTouching = pairs.every((pair) => (flatHands[pair[0]] && flatHands[pair[1]]) && distance(flatHands[pair[0]], flatHands[pair[1]]) < touchingThreshold);
    if (allPairsTouching) {
      loops.push(loop);
    }
  });

  // attach point data to point indices
  loops.forEach((loop) => {
    loop.points = [];
    loop.forEach((i) => {
      loop.points.push({ x: flatHands[i].x, y: flatHands[i].y });
    });
  });

  const sizedLoops = loops.filter((loop) => polygonArea(loop.points) >= minArea);

  sizedLoops.forEach((loop) => {
    loop.center = pointsCenter(loop.points);
  });

  return sizedLoops;
};

function pointInPolygon({ point, polygon }) {
  let inside = false;
  for (let i = 0; i < (polygon.length - 1); i += 1) {
    const p1x = polygon[i].x;
    const p1y = polygon[i].y;
    const p2x = polygon[i + 1].x;
    const p2y = polygon[i + 1].y;
    if ((p1y < point.y && p2y >= point.y) || (p2y < point.y && p1y >= point.y)) { // this edge is crossing the horizontal ray of testpoint
      if ((p1x + (point.y - p1y) / (p2y - p1y) * (p2x - p1x)) < point.x) { // checking special cases (holes, self-crossings, self-overlapping, horizontal edges, etc.)
        inside = !inside;
      }
    }
  }
  return inside;
}

export const randomPointInPolygon = (polygon) => {
  const bounds = polygon.reduce((acc, point) => ({
    minX: Math.min(acc.minX, point.x),
    minY: Math.min(acc.minY, point.y),
    maxX: Math.max(acc.maxX, point.x),
    maxY: Math.max(acc.maxY, point.y),
  }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

  let point = {
    x: bounds.minX + (Math.random() * (bounds.maxX - bounds.minX)),
    y: bounds.minY + (Math.random() * (bounds.maxY - bounds.minY)),
  };

  while (!pointInPolygon({ point, polygon })) {
    point = {
      x: bounds.minX + (Math.random() * (bounds.maxX - bounds.minX)),
      y: bounds.minY + (Math.random() * (bounds.maxY - bounds.minY)),
    };
  }

  return point;
};
