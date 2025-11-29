(function () {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // 游戏状态
  let isGameOver = false;
  let score = 0;          // 以帧数近似计时得分
  let player = null;      // 玩家方块
  let lastTime = 0;

  // 初始化玩家
  function createPlayer() {
    return {
      x: WIDTH / 2 - 20,
      y: HEIGHT / 2,
      size: 40,
      vy: 0,          // 竖直速度
    };
  }

  // 重置游戏
  function resetGame() {
    isGameOver = false;
    score = 0;
    player = createPlayer();
  }

  // 处理“跳跃”
  function jump() {
    if (isGameOver) {
      resetGame();
      return;
    }
    player.vy = -6;   // 向上一个速度
  }

  // 绑定输入（PC + 手机）
  function bindInput() {
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        jump();
      }
    });

    window.addEventListener('touchstart', (e) => {
      e.preventDefault(); // 防止手机浏览器滚动
      jump();
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        jump();
      }
    });
  }

  // 更新游戏逻辑
  function update(deltaTime) {
    if (isGameOver) return;

    const dt = deltaTime / 16.67; // 简单归一化到每帧约 60fps 的比例

    // 重力加速度
    const gravity = 0.35;
    player.vy += gravity * dt;
    player.y += player.vy * dt;

    // 碰撞检测：底部
    if (player.y + player.size > HEIGHT) {
      player.y = HEIGHT - player.size;
      isGameOver = true;
    }

    // 确保不会飞到屏幕上方外面
    if (player.y < 0) {
      player.y = 0;
      player.vy = 0;
    }

    // 计分：活得越久分数越高
    score += dt;
  }

  // 渲染画面
  function render() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // 背景
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // 玩家方块
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(player.x, player.y, player.size, player.size);

    // 分数
    ctx.fillStyle = '#f5f5f5';
    ctx.font = '24px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 20, 40);

    // 游戏结束提示
    if (isGameOver) {
      ctx.font = '28px sans-serif';
      const msg = 'Game Over';
      const msg2 = '点击任意位置重新开始';
      const w = ctx.measureText(msg).width;
      const w2 = ctx.measureText(msg2).width;

      ctx.fillText(msg, (WIDTH - w) / 2, HEIGHT / 2 - 20);
      ctx.font = '18px sans-serif';
      ctx.fillText(msg2, (WIDTH - w2) / 2, HEIGHT / 2 + 20);
    }
  }

  // 游戏主循环
  function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    render();

    requestAnimationFrame(gameLoop);
  }

  // 入口
  function main() {
    resetGame();
    bindInput();
    requestAnimationFrame(gameLoop);
  }

  main();
})();
