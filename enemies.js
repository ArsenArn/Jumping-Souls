import { state, gameVars,
  keys, particles, enemies,
  flyingEnemies, projectiles, hearts, rockets, canvas, ctx,
  gravity, jumpPower, moveSpeed, enemySpeed,
  groundHeight, reachDistance, playerBaseHP,
  largeEnemyHP, normalEnemyHP, groundSpawnInterval,
  minFlyingSpawn, maxFlyingSpawn, soundJump, 
  soundHit, soundDeath, soundEnemyDie, soundHeal, soundLevelUp, bgMusic,
} from './globals.js';
import { showGameOver } from './game.js';
import { drawVisualCentered, drawVisualTopLeft } from './visuals.js';

const enemySizeScale = 1.4;

class Enemy {
  constructor(x, dir, type='normal') {
    this.x = x;
    this.y = canvas.height - groundHeight;
    this.type = type;
    this.hp = (type==='large') ? largeEnemyHP : normalEnemyHP;
    this.width = (type==='large') ? 50 * enemySizeScale : 30 * enemySizeScale;
    this.height= (type==='large') ? 50 * enemySizeScale : 30 * enemySizeScale;
    this.speed = dir * (type==='fast'?enemySpeed*2:type==='large'?enemySpeed*0.5:enemySpeed);
    this.alive = true;
    this.color = (type==='fast')?'#ffff00':(type==='large')?'#9933ff':'#ff4444';
  }
  update() {
    if (this.alive && !state.upgradeMenuActive) {
      this.x += this.speed;
      if (this.x + this.width < 0 || this.x > canvas.width) {
        this.alive = false;
      }
    }
  }
  draw() {
    if(!this.alive) return;
    const visualKey = this.type === 'fast'
      ? 'enemy_fast'
      : this.type === 'large'
        ? 'enemy_large'
        : 'enemy';
    const drawn = drawVisualTopLeft(
      ctx,
      visualKey,
      this.x,
      this.y - this.height,
      this.width,
      this.height
    );
    if (!drawn) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y - this.height, this.width, this.height);
    }
  }
}

// === Новый тип врага: прыгающий синий квадрат ===
class BlueEnemy {
  constructor(x, dir) {
    this.x = x;
    this.y = canvas.height - groundHeight;
    this.dir = dir;
    this.width = 30 * enemySizeScale;
    this.height = 30 * enemySizeScale;
    this.color = '#4444ff';
    this.hp = normalEnemyHP;
    this.alive = true;
    this.vx = 0;
    this.vy = 0;
    this.onGround = true;
    this.jumpTimer = 0;
    this.jumpCooldown = 120; // кадры
  }
  update() {
    if (!this.alive || state.upgradeMenuActive) return;

    if (this.onGround) {
      this.jumpTimer++;
      if (this.jumpTimer >= this.jumpCooldown) {
        this.jumpTimer = 0;
        const jumpHeight = canvas.height * 0.25;
        this.vy = -Math.sqrt(2 * gravity * jumpHeight);
        this.vx = this.dir * (canvas.width / 6) / this.jumpCooldown;
        this.onGround = false;
      }
    } else {
      this.vy += gravity;
      this.x += this.vx;
      this.y += this.vy;
      if (this.y >= canvas.height - groundHeight) {
        this.y = canvas.height - groundHeight;
        this.vy = 0;
        this.vx = 0;
        this.onGround = true;
      }
    }
    if (this.x + this.width < -40 || this.x > canvas.width + 40) {
      this.alive = false;
    }
  }
  draw() {
    if (!this.alive) return;
    const drawn = drawVisualTopLeft(
      ctx,
      'enemy_blue',
      this.x,
      this.y - this.height,
      this.width,
      this.height
    );
    if (!drawn) {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y - this.height, this.width, this.height);
    }
  }
}

class FlyingEnemy {
  constructor(x, dir, player) {
    this.x = x;
    this.y = canvas.height - groundHeight - 150;
    this.size = 30 * enemySizeScale;
    this.direction = dir;
    this.stopped = false;
    this.alive = true;
    this.color = '#ff8800';
    this.shotTimer = 0;
    this.player = player;
    const minX = Math.max(this.size/2, this.player.x - reachDistance);
    const maxX = Math.min(canvas.width - this.size/2, this.player.x + reachDistance);
    this.stopX = Math.random() * (maxX - minX) + minX;
  }
  update() {
    if(!this.stopped && !state.upgradeMenuActive) {
      this.x += this.direction;
      if((this.direction>0 && this.x>=this.stopX)||(this.direction<0 && this.x<=this.stopX)) this.stopped = true;
    }
    // Если улетел за край — удаляем
    if (this.x + this.size < 0 || this.x - this.size > canvas.width) {
    this.alive = false;
}
    this.shotTimer++;
    if(this.stopped && this.shotTimer > 360 && !state.upgradeMenuActive) {
      this.shotTimer = 0;
      projectiles.push(new Projectile(this.x, this.y, this.player.x, this.player.y, this.player));
      // После выстрела выбираем новую точку и немного перемещаемся
      const offset = (Math.random()*2 - 1) * canvas.width/6;
      let newX = this.x + offset;
      newX = Math.max(this.size/2, Math.min(canvas.width - this.size/2, newX));
      this.stopX = newX;
      this.direction = (this.stopX > this.x) ? 1 : -1;
      this.stopped = false;
    }
  }
  draw() {
    if(!this.alive) return;
    const drawn = drawVisualCentered(
      ctx,
      'enemy_flying',
      this.x,
      this.y,
      this.size,
      this.size
    );
    if (!drawn) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.size/2);
      ctx.lineTo(this.x - this.size/2, this.y + this.size/2);
      ctx.lineTo(this.x + this.size/2, this.y + this.size/2);
      ctx.closePath();
      ctx.fill();
    }
  }
}

class Projectile {
  constructor(x,y,tx,ty, player) {
    this.x = x; this.y = y;
    this.size = 10;
    const dx = tx - x, dy = ty - y;
    const d = Math.hypot(dx, dy);
    this.vx = dx/d * 4;
    this.vy = dy/d * 4;
    this.alive = true;
    this.color = '#ff8800';
    this.player = player;
  }
  update() {
  this.x += this.vx;
  this.y += this.vy;
  const dx = this.player.x - this.x, dy = this.player.y - this.y;
  if(Math.hypot(dx, dy) < this.player.radius + this.size/2 && this.player.invincible===0) {
    // === Если есть щит — блокируем, иначе обычный урон ===
    if(this.player.hasShield && this.player.shieldActive) {
      this.player.shieldActive = false;
      this.player.shieldCooldown = this.player.getShieldCooldown();
    } else {
      this.player.hp--;
      this.player.damageFlash = 20;
      this.player.invincible = 30;
      soundHit.play();
      if(this.player.hp <= 0) {
        state.gameOver = true;
        showGameOver();
      }
    }
    this.alive = false;
  }
  if(this.x<0||this.x>canvas.width||this.y<0||this.y>canvas.height) this.alive = false;
}
  draw() {
    if(!this.alive) return;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.size/2);
    ctx.lineTo(this.x - this.size/2, this.y + this.size/2);
    ctx.lineTo(this.x + this.size/2, this.y + this.size/2);
    ctx.closePath();
    ctx.fill();
  }
}

class Particle {
  constructor(x,y,color) {
    this.x=x; this.y=y;
    this.size=Math.random()*6+4;
    this.vx=(Math.random()-0.5)*4;
    this.vy=-Math.random()*4;
    this.color=color; this.life=60;
  }
  update() {
    this.vy += gravity; this.x += this.vx; this.y += this.vy; this.life--;
  }
  draw() {
    if(this.life<=0) return;
    ctx.save();
    ctx.globalAlpha = this.life/60;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x,this.y,this.size,this.size);
    ctx.restore();
  }
}
  
class RocketParticle {
  constructor(x, y, angle, speed, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 34 + Math.random()*18; // Чуть живут
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += gravity * 0.4; // немного притяжения
    this.life--;
  }
  draw() {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / 50);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
    ctx.fillStyle = "#ff2222";
    ctx.fill();
    ctx.restore();
  }
}

class Heart {
  constructor(player) {
    this.x=Math.random()*(canvas.width-30)+15;
    this.y=canvas.height-groundHeight-20;
    this.radius=15; this.collected=false; this.pulse=0;
    this.player = player;
  }
  update() {
    this.pulse+=0.1;
    const dx=this.player.x-this.x, dy=this.player.y-this.y;
    if(Math.hypot(dx,dy)<this.player.radius+this.radius) {
      this.collected=true; soundHeal.play();
      let healAmount = 1 + (this.player.healBoost||0);
      if(this.player.hp < this.player.maxHP) this.player.hp = Math.min(this.player.maxHP, this.player.hp + healAmount);
    }
  }
  draw() {
    if(this.collected) return;
    const scale=1+0.1*Math.sin(this.pulse);
   ctx.save();
ctx.font = `${this.radius * 2}px Arial`;
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.globalAlpha = 1;
ctx.fillText('❤️', this.x, this.y);
ctx.restore();
  }
}
  class Rocket {
  constructor(targetX, angle) {
    this.x = targetX + Math.tan(angle) * -200;
    this.y = -40;
    this.targetX = targetX;
    this.angle = angle;
    this.speed = 5; // медленнее!
    this.exploded = false;
    this.radius = 40;
    this.blastRadius = canvas.width / 5;
    this.explodeY = canvas.height - groundHeight - 8;
    this.frame = 0;
  }
  update() {
  if (!this.exploded) {
    // Падение ракеты
    this.x += Math.tan(this.angle) * this.speed;
    this.y += this.speed;
  }
  if (this.y >= this.explodeY && !this.exploded) {
    this.exploded = true;
    // Разлетающиеся шарики и урон — всё как у тебя!
    const cx = this.x, cy = this.explodeY;
    const count = 20;
    const blastRadius = this.blastRadius;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random()*2;
      const r = 12 + Math.random()*8;
      particles.push(new RocketParticle(
        cx + Math.cos(angle) * blastRadius * 0.3,
        cy + Math.sin(angle) * blastRadius * 0.3,
        angle,
        speed,
        r
      ));
    }
    // Урон врагам:
    enemies.forEach(e => {
      if (e.alive) {
        let ex = e.x + e.width / 2;
        let ey = e.y - e.height / 2;
        let dist = Math.hypot(this.x - ex, this.explodeY - ey);
        if (dist <= this.blastRadius) {
          e.hp--;
          if (e.hp <= 0) {
            e.alive = false;
            spawnParticles(e);
            soundEnemyDie.play();
            gameVars.combo++;
            gameVars.score += gameVars.combo;
            gameVars.comboTimer = 180;
            gameVars.comboDisplay = 180;
          }
        }
      }
    });
  }
  // <<< ВОТ ЭТА СТРОКА ВСЕГДА ДОЛЖНА БЫТЬ В update >>>
  if (this.exploded) this.frame++;
}

  draw() {
  if (!this.exploded) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(2.356);
    ctx.font = '42px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚀', 0, 0);
    ctx.restore();
  }
  // После взрыва не рисуем ничего!
}
}

function spawnParticles(e) {
  const cx=e.x+((e.width||e.size)/2), cy=e.y-((e.height||e.size)/2);
  for(let i=0;i<20;i++) particles.push(new Particle(cx,cy,e.color));
}

export { Enemy, BlueEnemy, FlyingEnemy, Projectile, Heart, Rocket, Particle, RocketParticle, spawnParticles };
