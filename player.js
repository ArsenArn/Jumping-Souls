import { state, gameVars,
  keys, particles, enemies,
  flyingEnemies, projectiles, hearts, rockets, canvas, ctx,
  gravity, jumpPower, moveSpeed, enemySpeed,
  groundHeight, reachDistance, playerBaseHP,
  largeEnemyHP, normalEnemyHP, groundSpawnInterval,
  minFlyingSpawn, maxFlyingSpawn, soundJump, 
  soundHit, soundDeath, soundEnemyDie, soundHeal, soundLevelUp, bgMusic,
} from './globals.js';
import { Rocket, spawnParticles } from './enemies.js';


class Player {
  constructor() {
    this.x = canvas.width/2;
    this.y = canvas.height - groundHeight - 20;
    this.radius = 20;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
    this.hp = playerBaseHP;
    this.maxHP = playerBaseHP;
    this.damageFlash = 0;
    this.invincible = 0;
    this.autoFire = 0;
    this.autoFireTimer = 0;
    this.autoFireDelayTimer = 0;
    this.healBoost = 0;
    this.hasShield = false;
    this.shieldCooldown = 0;
    this.shieldActive = false;
    this.shieldLevel = 0;
    this.rocketLevel = 0;
    this.rocketCooldown = 0;  // Таймер для запуска серии
    this.rocketBurst = 0;     // Сколько ракет осталось в очереди
    this.rocketTargets = [];  // Места падения очереди ракет
    this.rocketDelay = 0;     // Таймер между пусками

  }
  update(delta) {
    if (state.upgradeMenuActive || state.gameOver) return;
    
    // Вычисляем множители
let speedMul = 1 + 0.05 * (this.speedBoost || 0);
let jumpMul = 1 + 0.05 * (this.jumpBoost || 0);

if (keys.ArrowLeft || keys.a || keys.A || keys['ф'] || keys['Ф'] ) {
  this.vx = -moveSpeed * speedMul;
} else if (keys.ArrowRight || keys.d || keys.D || keys['в'] || keys['В'] ) {
  this.vx = moveSpeed * speedMul;
} else {
  this.vx = 0;
}

if ((keys.ArrowUp || keys.w || keys.W || keys['ц'] || keys['Ц'] || keys[' '] ) && this.onGround) {
  this.vy = jumpPower * jumpMul;
  this.onGround = false;
  soundJump.play();
}

    this.vy += gravity;
    this.x += this.vx;

// --- НЕ ДАЕМ ВЫЛЕТАТЬ ЗА ПОЛЕ ---
if (this.x - this.radius < 0) this.x = this.radius;
if (this.x + this.radius > canvas.width) this.x = canvas.width - this.radius;

    this.y += this.vy;
    if (this.y + this.radius > canvas.height - groundHeight) {
  this.y = canvas.height - groundHeight - this.radius;
  this.vy = 0;
  this.onGround = true;

  // Сбросить комбо, если оно было
  if (gameVars.combo > 0) {
    gameVars.combo = 0;
    gameVars.comboTimer = 0;
    gameVars.comboDisplay = 0;
  }
}
    if (this.damageFlash > 0) this.damageFlash--;
    if (this.invincible > 0) this.invincible--;
    if (this.autoFire > 0) {
  this.autoFireTimer += delta;
  if (this.autoFireTimer >= this.getAutoFireCooldown()) {
    this.autoFireTimer = 0;
    // Фильтруем только врагов, которые на экране
    let candidates = enemies.filter(e =>
      e.alive &&
      e.x + e.width > 0 &&
      e.x < canvas.width
    );
    if (candidates.length > 0) {
      this.autoFireBurst = this.autoFire;
      this.autoFireDelayTimer = 0;
      this.lastAutoFireTargets = [];
      for (let i = 0; i < this.autoFire; i++) {
        let notUsed = candidates.filter(e => !this.lastAutoFireTargets.includes(e));
        let target = notUsed.length > 0 ?
          notUsed[Math.floor(Math.random() * notUsed.length)] :
          candidates[Math.floor(Math.random() * candidates.length)];
        this.lastAutoFireTargets.push(target);
      }
    }
  }

  if (this.autoFireBurst && this.lastAutoFireTargets) {
    this.autoFireDelayTimer += delta;
    if (this.autoFireDelayTimer >= 0.2) { // 0.2 секунды между выстрелами
      this.autoFireDelayTimer = 0;
      let target = this.lastAutoFireTargets.shift();
      if (target) projectiles.push(new PlayerProjectile(this.x, this.y, target));
      this.autoFireBurst--;
      if (this.autoFireBurst === 0) {
        this.lastAutoFireTargets = null;
      }
    }
  }
}
if (this.hasShield) {
  this.shieldCooldown -= delta;
  if (this.shieldCooldown <= 0 && !this.shieldActive) {
    this.shieldActive = true;
    this.shieldCooldown = this.getShieldCooldown();
  }
}
if (this.rocketLevel > 0 && !state.gameOver && !state.upgradeMenuActive) {
  this.rocketCooldown -= delta;
  if (this.rocketCooldown <= 0 && this.rocketBurst === 0) {
    this.rocketBurst = this.rocketLevel;
    this.rocketDelay = 0;
    this.rocketTargets = [];
    for (let i = 0; i < this.rocketLevel; i++) {
      let targetX = Math.random() * (canvas.width - 80) + 40;
      let angle = (Math.random() - 0.5) * 0.4;
      this.rocketTargets.push({ x: targetX, angle: angle });
    }
    this.rocketCooldown = 10; // 10 секунд между залпами (теперь секунды, не кадры!)
  }
  if (this.rocketBurst > 0 && this.rocketTargets.length > 0) {
    this.rocketDelay += delta;
    if (this.rocketDelay >= 0.2) { // каждые 0.2 секунды пуск
      this.rocketDelay = 0;
      let target = this.rocketTargets.shift();
      if (target) {
        rockets.push(new Rocket(target.x, target.angle));
        this.rocketBurst--;
      }
    }
  }
}

  }
  getAutoFireCooldown() {
  return 3.0; // 3 секунды
}
getShieldCooldown() {
  let shieldLevel = this.shieldLevel || 1;
  return Math.max(10 - shieldLevel, 5); // минимум 5 секунд
}

  draw() {
    if (this.invincible > 0 && Math.floor(this.invincible/5) % 2 === 0) return;
    ctx.save();
    ctx.shadowColor = this.damageFlash>0 ? '#ff0000' : '#00ff00';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    ctx.fillStyle = this.damageFlash>0 ? '#ff0000' : '#00ff00';
    ctx.fill();
    if (this.hasShield && this.shieldActive) {
      ctx.save();
      ctx.globalAlpha = 0.38 + 0.3*Math.sin(Date.now()/140);
      ctx.strokeStyle = '#33ccff';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius+14, 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
}

class PlayerProjectile {
  constructor(x, y, target) {
    this.x = x; this.y = y;
    this.size = 14;
    const dx = target.x+target.width/2 - x, dy = target.y-target.height/2 - y;
    const d = Math.hypot(dx, dy);
    this.vx = dx/d * 8;
    this.vy = dy/d * 8;
    this.target = target;
    this.alive = true;
    this.color = '#36eaff';
  }
  update() {
  this.x += this.vx;
  this.y += this.vy;
  // Проверяем столкновение с любым врагом (живым и на экране)
  let hitEnemy = enemies.find(e =>
    e.alive &&
    e.x + e.width > 0 &&
    e.x < canvas.width &&
    Math.hypot(
      (e.x + e.width / 2) - this.x,
      (e.y - e.height / 2) - this.y
    ) < this.size / 2 + Math.max(e.width, e.height) / 2
  );
  if (hitEnemy) {
    hitEnemy.hp--;
    if (hitEnemy.hp <= 0) {
      hitEnemy.alive = false;
      spawnParticles(hitEnemy);
      soundEnemyDie.play();
      gameVars.combo++;
      gameVars.score += gameVars.combo;
      gameVars.comboTimer = 180;
      gameVars.comboDisplay = 180;
    }
    this.alive = false;
  }
  if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.alive = false;
}

  draw() {
    if(!this.alive) return;
    ctx.save();
    ctx.globalAlpha=0.7;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size/2, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

export { Player, PlayerProjectile };
