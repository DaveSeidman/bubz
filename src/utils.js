export const handConnections = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4], // Thumb
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8], // Index finger
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12], // Middle finger
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16], // Ring finger
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20], // Pinky
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
  hands.forEach((hand) => {
    // if thumb and finger 1 are touching
    if (distance(hand[4], hand[8]) < touchingThreshold) {
      loops.push({
        color: 'rgba(34, 77, 34, .5)',
        points:
          [
            { x: hand[2].x, y: hand[2].y },
            { x: hand[3].x, y: hand[3].y },
            { x: hand[4].x, y: hand[4].y },
            { x: hand[8].x, y: hand[8].y },
            { x: hand[7].x, y: hand[7].y },
            { x: hand[6].x, y: hand[6].y },
            { x: hand[5].x, y: hand[5].y },
          ],
      });
    }
    // if thumb and finger 2 are touching
    if (distance(hand[4], hand[12]) < touchingThreshold) {
      loops.push({
        color: 'rgba(44, 77, 34, .5)',
        points:
          [
            { x: hand[2].x, y: hand[2].y },
            { x: hand[3].x, y: hand[3].y },
            { x: hand[4].x, y: hand[4].y },
            { x: hand[12].x, y: hand[12].y },
            { x: hand[11].x, y: hand[11].y },
            { x: hand[10].x, y: hand[10].y },
            { x: hand[9].x, y: hand[9].y },
          ],
      });
    }
    // if thumb and finger 3 are touching
    if (distance(hand[4], hand[16]) < touchingThreshold) {
      loops.push({
        color: 'rgba(72, 77, 34, .5)',
        points:
          [
            { x: hand[2].x, y: hand[2].y },
            { x: hand[3].x, y: hand[3].y },
            { x: hand[4].x, y: hand[4].y },
            { x: hand[16].x, y: hand[16].y },
            { x: hand[15].x, y: hand[15].y },
            { x: hand[14].x, y: hand[14].y },
            { x: hand[13].x, y: hand[13].y },
          ],
      });
    }
    // if thumb and finger 4 are touching
    if (distance(hand[4], hand[20]) < touchingThreshold) {
      loops.push({
        color: 'rgba(77, 60, 34, .5)',
        points:
          [
            // thumb base to tip
            { x: hand[2].x, y: hand[2].y },
            { x: hand[3].x, y: hand[3].y },
            { x: hand[4].x, y: hand[4].y },
            // finger 4 tip to base
            { x: hand[20].x, y: hand[20].y },
            { x: hand[19].x, y: hand[19].y },
            { x: hand[18].x, y: hand[18].y },
            { x: hand[17].x, y: hand[17].y },
          ],
      });
    }
  });

  if (hands.length === 2) {
    // left thumb and right thumb touching
    if (distance(hands[0][4], hands[1][4]) < touchingThreshold
      // and left finger 1 and right finger 1 are touching
      && distance(hands[0][8], hands[1][8]) < touchingThreshold) {
      loops.push({
        color: '#FF44FF',
        points: [
          // left thumb base to tip
          { x: hands[0][2].x, y: hands[0][2].y },
          { x: hands[0][3].x, y: hands[0][3].y },
          { x: hands[0][4].x, y: hands[0][4].y },
          // right thumb tip to base
          { x: hands[1][4].x, y: hands[1][4].y },
          { x: hands[1][3].x, y: hands[1][3].y },
          { x: hands[1][2].x, y: hands[1][2].y },
          // right finger 1 base to tip
          { x: hands[1][5].x, y: hands[1][5].y },
          { x: hands[1][6].x, y: hands[1][6].y },
          { x: hands[1][7].x, y: hands[1][7].y },
          { x: hands[1][8].x, y: hands[1][8].y },
          // left finger 1 tip to base
          { x: hands[0][8].x, y: hands[0][8].y },
          { x: hands[0][7].x, y: hands[0][7].y },
          { x: hands[0][6].x, y: hands[0][6].y },
          { x: hands[0][5].x, y: hands[0][5].y },
        ],
      });
    }

    // left thumb and right finger 1 touching
    if (distance(hands[0][4], hands[1][8]) < touchingThreshold
      // and left finger 1 and right thumb are touching
      && distance(hands[0][8], hands[1][4]) < touchingThreshold) {
      loops.push({
        color: '#0044FF',
        points: [
          // left thumb base to tip
          { x: hands[0][2].x, y: hands[0][2].y },
          { x: hands[0][3].x, y: hands[0][3].y },
          { x: hands[0][4].x, y: hands[0][4].y },
          // right finger 1 tip to base
          { x: hands[1][8].x, y: hands[1][8].y },
          { x: hands[1][7].x, y: hands[1][7].y },
          { x: hands[1][6].x, y: hands[1][6].y },
          { x: hands[1][5].x, y: hands[1][5].y },
          // right thumb base to tip
          { x: hands[1][2].x, y: hands[1][2].y },
          { x: hands[1][3].x, y: hands[1][3].y },
          { x: hands[1][4].x, y: hands[1][4].y },
          // left finger 1 tip to base
          { x: hands[0][8].x, y: hands[0][8].y },
          { x: hands[0][7].x, y: hands[0][7].y },
          { x: hands[0][6].x, y: hands[0][6].y },
          { x: hands[0][5].x, y: hands[0][5].y },
        ],
      });
    }
  }

  const sizedLoops = loops.filter((loop) => polygonArea(loop.points) >= minArea);

  sizedLoops.forEach((loop) => {
    loop.center = pointsCenter(loop.points);
  });

  return sizedLoops;
};
