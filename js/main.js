(function () {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  // 棋盘尺寸：10 列 20 行
  const COLS = 10;
  const ROWS = 20;
  const BLOCK_SIZE = 30; // 每个方块像素大小

  canvas.width = COLS * BLOCK_SIZE;
  canvas.height = ROWS * BLOCK_SIZE;

  // 颜色：索引 0 为空
  const COLORS = [
    '#000000',    // 0 空
    '#00ffff',    // 1 I
    '#0000ff',    // 2 J
    '#ffa500',    // 3 L
    '#ffff00',    // 4 O
    '#00ff00',    // 5 S
    '#800080',    // 6 T
    '#ff0000'     // 7 Z
  ];

  // 7 种俄罗斯方块形状（矩阵）
  const SHAPES = {
    1: [ // I
      [1, 1, 1, 1]
    ],
    2: [ // J
      [1, 0, 0],
      [1, 1, 1]
    ],
    3: [ // L
      [0, 0, 1],
      [1, 1, 1]
    ],
    4: [ // O
      [1, 1],
      [1, 1]
    ],
    5: [ // S
      [0, 1, 1],
      [1, 1, 0]
    ],
    6: [ // T
      [0, 1, 0],
      [1, 1, 1]
    ],
    7: [ // Z
      [1, 1, 0],
      [0, 1, 1]
    ]
  };

  let board;
  let currentPiece;
  let score = 0;
  let lines = 0;
  let gameOver = false;

  let dropInterval = 800;  // 下落间隔（毫秒）
  let lastTime = 0;
  let dropCounter = 0;

  function createBoard() {
    const matrix = [];
    for (let y = 0; y < ROWS; y++) {
      matrix.push(new Array(COLS).fill(0));
    }
    return matrix;
  }

  function resetGame() {
    board = createBoard();
    score = 0;
    lines = 0;
    gameOver = false;
    spawnPiece();
  }

  function randomPieceType() {
    return 1 + Math.floor(Math.random() * 7); // 1..7
  }

  function spawnPiece() {
    const type = randomPieceType();
    const shape = SHAPES[type].map(row => row.slice());
    const piece = {
      type,
      matrix: shape,
      x: 0,
      y: 0
    };

    // 初始放在顶部中间
    piece.x = Math.floor((COLS - piece.matrix[0].length) / 2);
    piece.y = 0;

    currentPiece = piece;

    if (collide(board, currentPiece)) {
      // 一出生就碰撞，游戏结束
      gameOver = true;
    }
  }

  function collide(board, piece) {
    const m = piece.matrix;
    for (let y = 0; y < m.length; y++) {
      for (let x = 0; x < m[y].length; x++) {
        if (m[y][x] !== 0) {
          const bx = piece.x + x;
          const by = piece.y + y;
          if (
            by < 0 ||
            by >= ROWS ||
            bx < 0 ||
            bx >= COLS ||
            board[by][bx] !== 0
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  function merge(board, piece) {
    const m = piece.matrix;
    for (let y = 0; y < m.length; y++) {
      for (let x = 0; x < m[y].length; x++) {
        if (m[y][x] !== 0) {
          const bx = piece.x + x;
          const by = piece.y + y;
          if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) {
            board[by][bx] = piece.type;
          }
        }
      }
    }
  }

  function rotateMatrix(matrix) {
    const N = matrix.length;
    const M = matrix[0].length;
    const result = [];
    for (let x = 0; x < M; x++) {
      const row = [];
      for (let y = N - 1; y >= 0; y--) {
        row.push(matrix[y][x]);
      }
      result.push(row);
    }
    return result;
  }

  function rotatePiece() {
    const oldMatrix = currentPiece.matrix;
    const rotated = rotateMatrix(oldMatrix);
    const oldX = currentPiece.x;

    currentPiece.matrix = rotated;

    // 简单的左右调整，防止旋转后冲出边界
    if (collide(board, currentPiece)) {
      currentPiece.x = oldX - 1;
      if (collide(board, currentPiece)) {
        currentPiece.x = oldX + 1;
        if (collide(board, currentPiece)) {
          // 旋转失败，恢复
          currentPiece.x = oldX;
          currentPiece.matrix = oldMatrix;
        }
      }
    }
  }

  function clearLines() {
    let cleared = 0;

    outer: for (let y = ROWS - 1; y >= 0; y--) {
      for (let x = 0; x < COLS; x++) {
        if (board[y][x] === 0) {
          continue outer;
        }
      }
      // 这一行满了
      const row = board.splice(y, 1)[0];
      row.fill(0);
      board.unshift(row);
      cleared++;
      y++; // 这一行重新检查
    }

    if (cleared > 0) {
      lines += cleared;
      // 简单计分规则：n 行一次 = n^2 * 100
      score += cleared * cleared * 100;
      // 可选：随消行数减小下落间隔
      dropInterval = Math.max(150, 800 - lines * 20);
    }
  }

  function playerMove(dir) {
    if (gameOver) return;
    currentPiece.x += dir;
    if (collide(board, currentPiece)) {
      currentPiece.x -= dir;
    }
  }

  function playerDrop() {
    if (gameOver) return;
    currentPiece.y++;
    if (collide(board, currentPiece)) {
      currentPiece.y--;
      merge(board, currentPiece);
      clearLines();
      spawnPiece();
    }
    dropCounter = 0;
  }

  function hardDrop() {
    if (gameOver) return;
    while (!collide(board, { ...currentPiece, y: currentPiece.y + 1 })) {
      currentPiece.y++;
    }
    merge(board, currentPiece);
    clearLines();
    spawnPiece();
    dropCounter = 0;
  }

  function drawCell(x, y, type) {
    if (type === 0) return;
    ctx.fillStyle = COLORS[type];
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = '#111';
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  }

  function drawBoard() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 棋盘
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        drawCell(x, y, board[y][x]);
      }
    }

    // 当前方块
    const m = currentPiece.matrix;
    for (let y = 0; y < m.length; y++) {
      for (let x = 0; x < m[y].length; x++) {
        if (m[y][x] !== 0) {
          drawCell(currentPiece.x + x, currentPiece.y + y, currentPiece.type);
        }
      }
    }

    // 分数
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('Lines: ' + lines, 10, 40);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, canvas.height / 2 - 40, canvas.width, 80);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px sans-serif';
      const msg = 'Game Over';
      const msg2 = '按 Enter 重新开始';
      const w1 = ctx.measureText(msg).width;
      const w2 = ctx.measureText(msg2).width;
      ctx.fillText(msg, (canvas.width - w1) / 2, canvas.height / 2 - 5);
      ctx.font = '16px sans-serif';
      ctx.fillText(msg2, (canvas.width - w2) / 2, canvas.height / 2 + 25);
    }
  }

  function update(time = 0) {
    const delta = time - lastTime;
    lastTime = time;

    if (!gameOver) {
      dropCounter += delta;
      if (dropCounter > dropInterval) {
        playerDrop();
      }
    }

    drawBoard();
    requestAnimationFrame(update);
  }

  function bindInput() {
    document.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft') {
        playerMove(-1);
      } else if (e.code === 'ArrowRight') {
        playerMove(1);
      } else if (e.code === 'ArrowDown') {
        playerDrop();
      } else if (e.code === 'ArrowUp') {
        rotatePiece();
      } else if (e.code === 'Space') {
        hardDrop();
      } else if (e.code === 'Enter' && gameOver) {
        resetGame();
      }
    });
  }

  function main() {
    resetGame();
    bindInput();
    requestAnimationFrame(update);
  }

  main();
})();

