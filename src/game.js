export const BOARD_SIZE = 14;
export const INITIAL_DIRECTION = "right";
export const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const OPPOSITES = {
  up: "down",
  down: "up",
  left: "right",
  right: "left"
};

export function createInitialSnake() {
  return [
    { x: 4, y: 7 },
    { x: 3, y: 7 },
    { x: 2, y: 7 }
  ];
}

export function serializePoint(point) {
  return `${point.x},${point.y}`;
}

export function isInsideBoard(point, boardSize = BOARD_SIZE) {
  return (
    point.x >= 0 &&
    point.y >= 0 &&
    point.x < boardSize &&
    point.y < boardSize
  );
}

export function getNextHead(head, direction) {
  const vector = DIRECTIONS[direction];
  return {
    x: head.x + vector.x,
    y: head.y + vector.y
  };
}

export function hasSelfCollision(snake) {
  const [head, ...body] = snake;
  const headKey = serializePoint(head);
  return body.some((segment) => serializePoint(segment) === headKey);
}

export function isValidDirectionChange(currentDirection, nextDirection) {
  if (!DIRECTIONS[nextDirection]) {
    return false;
  }

  return OPPOSITES[currentDirection] !== nextDirection;
}

export function listOpenCells(snake, boardSize = BOARD_SIZE) {
  const occupied = new Set(snake.map(serializePoint));
  const cells = [];

  for (let y = 0; y < boardSize; y += 1) {
    for (let x = 0; x < boardSize; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        cells.push({ x, y });
      }
    }
  }

  return cells;
}

export function placeFood(snake, random = Math.random, boardSize = BOARD_SIZE) {
  const openCells = listOpenCells(snake, boardSize);

  if (openCells.length === 0) {
    return null;
  }

  const index = Math.min(
    openCells.length - 1,
    Math.floor(random() * openCells.length)
  );

  return openCells[index];
}

export function createInitialState(random = Math.random, boardSize = BOARD_SIZE) {
  const snake = createInitialSnake();

  return {
    boardSize,
    snake,
    direction: INITIAL_DIRECTION,
    queuedDirection: INITIAL_DIRECTION,
    food: placeFood(snake, random, boardSize),
    score: 0,
    isGameOver: false,
    isPaused: false
  };
}

export function queueDirection(state, nextDirection) {
  if (!isValidDirectionChange(state.direction, nextDirection)) {
    return state;
  }

  return {
    ...state,
    queuedDirection: nextDirection
  };
}

export function togglePause(state) {
  if (state.isGameOver) {
    return state;
  }

  return {
    ...state,
    isPaused: !state.isPaused
  };
}

export function tickGame(state, random = Math.random) {
  if (state.isGameOver || state.isPaused) {
    return state;
  }

  const direction = state.queuedDirection;
  const nextHead = getNextHead(state.snake[0], direction);

  if (!isInsideBoard(nextHead, state.boardSize)) {
    return {
      ...state,
      direction,
      isGameOver: true
    };
  }

  const ateFood =
    state.food &&
    nextHead.x === state.food.x &&
    nextHead.y === state.food.y;

  const grownSnake = [nextHead, ...state.snake];
  const nextSnake = ateFood ? grownSnake : grownSnake.slice(0, -1);

  if (hasSelfCollision(nextSnake)) {
    return {
      ...state,
      direction,
      snake: nextSnake,
      isGameOver: true
    };
  }

  return {
    ...state,
    direction,
    snake: nextSnake,
    food: ateFood ? placeFood(nextSnake, random, state.boardSize) : state.food,
    score: ateFood ? state.score + 1 : state.score
  };
}
