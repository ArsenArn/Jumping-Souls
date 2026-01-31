import { state, gameVars,
  keys, particles, enemies,
  flyingEnemies, projectiles, hearts, rockets, canvas, ctx,
  gravity, jumpPower, moveSpeed, enemySpeed,
  groundHeight, reachDistance, playerBaseHP,
  largeEnemyHP, normalEnemyHP, groundSpawnInterval,
  minFlyingSpawn, maxFlyingSpawn, soundJump, 
  soundHit, soundDeath, soundEnemyDie, soundHeal, soundLevelUp, bgMusic,
} from './globals.js';
import { UPGRADE_POOL, skillLevels, renderSkillsUI, openUpgradeMenu, getRandomUpgrades } from './upgrades.js';
import { Player, PlayerProjectile } from './player.js';
import { Enemy, BlueEnemy, FlyingEnemy, Projectile, Heart, Rocket, Particle, RocketParticle, spawnParticles } from './enemies.js';
import { drawVisualTopLeft } from './visuals.js';

function unlockAudio() {
  bgMusic.play().catch(e => console.warn('bgMusic play blocked:', e));
  document.removeEventListener('keydown', unlockAudio);
}
document.addEventListener('keydown', unlockAudio, { once: true });

// ==== ПАРАМЕТРЫ ИГРЫ ====


// Счётчики времени игры и количества больших врагов
let gameTime = 0, largeEnemyCount = 0;
// Таймеры появления разных объектов (в кадрах)
let spawnTimer = 0, heartTimer = 0, flyingSpawnTimer = 0, blueSpawnTimer = 0;
// Текущий интервал между летающими врагами
let flyingSpawnInterval = Math.floor(Math.random() * (maxFlyingSpawn - minFlyingSpawn + 1)) + minFlyingSpawn;

const upgradeMenu = document.getElementById('upgradeMenu');
const upgradeCardsElem = document.getElementById("upgradeCards");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const overlay = document.getElementById("gameOverScreen");
const finalScoreElem = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");

function showGameOver() {
  bgMusic.pause();
  soundDeath.play();
  finalScoreElem.textContent = gameVars.score;
  overlay.style.visibility = 'visible';
}
restartBtn.addEventListener('click', () => location.reload());

function drawGround() {
  const drawn = drawVisualTopLeft(
    ctx,
    'ground',
    0,
    canvas.height - groundHeight,
    canvas.width,
    groundHeight
  );
  if (!drawn) {
    const g=ctx.createLinearGradient(0,canvas.height-groundHeight,0,canvas.height);
    g.addColorStop(0,'#3366ff');
    g.addColorStop(1,'#000066');
    ctx.fillStyle=g;
    ctx.fillRect(0,canvas.height-groundHeight,canvas.width,groundHeight);
  }
}

function drawBackground() {
  const drawn = drawVisualTopLeft(
    ctx,
    'background',
    0,
    0,
    canvas.width,
    canvas.height
  );
  if (!drawn) {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#0b163a');
    g.addColorStop(1, '#1a2554');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawUI() {
  ctx.fillStyle='white';
  ctx.font='bold 32px Arial';
  ctx.fillText('Score:'+gameVars.score,20,40);
  // Время (таймер)
let totalSeconds = Math.floor(realElapsed);
let min = Math.floor(totalSeconds / 60);
let sec = totalSeconds % 60;
let timerStr = min.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0');
ctx.fillStyle = '#3ef5ff';
ctx.font = 'bold 32px Arial';
ctx.textAlign = 'right';
ctx.fillText(timerStr, canvas.width - 32, 40);
ctx.textAlign = 'left';

  ctx.fillText('Level:'+(gameVars.level+1),20,80);
  // HP
  ctx.font = '32px Arial';
ctx.textAlign = 'left';
for(let i = 0; i < player.maxHP; i++) {
  ctx.fillStyle = 'white'; // Можно не менять
  // 🟥 Красное, если HP есть
  // 🟦 Синее, если HP нет (можно заменить на 🩵 — голубое сердце)
  let emoji = (i < player.hp) ? '❤️' : '💙'; // или '🩵'
  ctx.fillText(emoji, 20 + i * 34, 130);
}

  if(gameVars.comboDisplay>0){
    ctx.save();
    ctx.globalAlpha=Math.min(1,gameVars.comboDisplay/30);
    ctx.fillStyle='yellow';
    ctx.font='bold 48px Arial';
    ctx.fillText('COMBO x'+gameVars.combo,canvas.width/2-100,120);
    ctx.restore();
  }
  // До следующей прокачки
  ctx.save();
  ctx.globalAlpha=0.6;
  ctx.font='20px Arial';
  ctx.fillStyle='#3ef5ff';
  ctx.fillText('Experience to level: '+Math.max(0,gameVars.nextLevelScore-gameVars.score),20,170);
  ctx.restore();
}


let timeElapsed = 0; // в кадрах
let player = new Player();
setTimeout(renderSkillsUI, 0);



function gameLoop(){
  let now = performance.now();
  let delta = (now - lastFrameTime) / 1000; // Дельта в секундах
  lastFrameTime = now;
  realElapsed += delta;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBackground();
  drawGround();

  if (!state.upgradeMenuActive && !state.gameOver) {
    // --- Основная логика игры ---
    particles.forEach(p=>{p.update();p.draw();});
    particles.splice(0, particles.length, ...particles.filter(p=>p.life>0));

    flyingSpawnTimer++;
    if(gameTime>900 && flyingSpawnTimer>flyingSpawnInterval){
      flyingSpawnTimer=0;
      flyingSpawnInterval=Math.floor(Math.random()*(maxFlyingSpawn-minFlyingSpawn+1))+minFlyingSpawn;
      flyingEnemies.push(new FlyingEnemy(-30, 1, player));
      flyingEnemies.push(new FlyingEnemy(canvas.width+30, -1, player));
    }
    flyingEnemies.forEach(f=>{
      f.update(); f.draw();
      const dx=player.x-f.x, dy=player.y-f.y;
      if(f.alive && Math.hypot(dx,dy)<player.radius+f.size/2){
        if (player.vy > 0 && player.y < f.y) {
          f.alive = false;
          player.vy = jumpPower / 2;
          spawnParticles(f);
          soundEnemyDie.play();
          gameVars.score++;
        } else {
          if (player.invincible === 0) {
            if (player.hasShield && player.shieldActive) {
              player.shieldActive = false;
              player.shieldCooldown = 300;
            } else {
              player.hp--;
              player.damageFlash = 20;
              player.invincible = 30;
              soundHit.play();
            }
          }
          f.alive = false;
          spawnParticles(f);
          soundEnemyDie.play();
          if (player.hp <= 0) {
            state.gameOver = true;
            showGameOver();
          }
        }
      }
    });
    flyingEnemies.splice(0, flyingEnemies.length, ...flyingEnemies.filter(f => f.alive));

    spawnTimer++;
    if(spawnTimer>groundSpawnInterval){
      spawnTimer=0;
      let side=Math.random()<0.5?-30:canvas.width+30, dir=side<0?1:-1, type='normal';
      if(gameTime>600&&Math.random()<0.2) type='fast';
      if(gameTime>1200&&largeEnemyCount>=10){ type='large'; largeEnemyCount=0; }
      else largeEnemyCount++;
      enemies.push(new Enemy(side,dir,type));
    }
    blueSpawnTimer++;
    if(gameTime>600 && blueSpawnTimer>groundSpawnInterval*2){
      blueSpawnTimer=0;
      let side=Math.random()<0.5?-30:canvas.width+30, dir=side<0?1:-1;
      enemies.push(new BlueEnemy(side,dir));
    }
    enemies.forEach(e=>{
      e.update(); e.draw();
      const dx=player.x-(e.x+e.width/2), dy=player.y-(e.y-e.height/2), dist=Math.hypot(dx,dy);
      if(e.alive&&dist<player.radius+e.width/2){
        if(player.vy>0&&player.y<e.y){
          e.hp--; player.vy=jumpPower/1.5;
          if(e.hp<=0){e.alive=false; spawnParticles(e); soundEnemyDie.play(); gameVars.combo++; gameVars.score+=gameVars.combo; gameVars.comboTimer=180; gameVars.comboDisplay=180;
    } else if(e.type==='large') e.color='#cc66ff';
        } else {
          if(player.invincible===0){
            // Щит!
            if(player.hasShield && player.shieldActive){
              player.shieldActive = false; player.shieldCooldown = 300;
            } else {
              player.hp--; player.damageFlash=20; player.invincible=30; soundHit.play();
            }
          }
          e.alive=false; spawnParticles(e);
          if(player.hp<=0){ state.gameOver=true; showGameOver(); }
        }
      }
    });
    enemies.splice(0, enemies.length, ...enemies.filter(e => e.alive));

    heartTimer++;
    if(heartTimer>300&&player.hp<player.maxHP){
      hearts.push(new Heart(player)); heartTimer=0;
    }
    hearts.forEach(h=>{ h.update(); h.draw(); });
    hearts.splice(0, hearts.length, ...hearts.filter(h => !h.collected));

    projectiles.forEach(p=>{ p.update(); p.draw(); });
    projectiles.splice(0, projectiles.length, ...projectiles.filter(p => p.alive));

    player.update(delta);
    player.draw();

    rockets.forEach(r => { r.update(); r.draw(); });
    rockets.splice(0, rockets.length, ...rockets.filter(r => !r.exploded || r.frame < 60));

    gameTime++;
    if(gameVars.comboTimer>0) gameVars.comboTimer--; else
    if(gameVars.comboDisplay>0) gameVars.comboDisplay--;

    // ПРОКАЧКА — условия для меню
    if(gameVars.score >= gameVars.nextLevelScore) {
      gameVars.level++;
      openUpgradeMenu(player);
    }
  } else {
    // Отрисуем всё «замороженным» + меню прокачки
    particles.forEach(p=>p.draw());
    flyingEnemies.forEach(f=>f.draw());
    enemies.forEach(e=>e.draw());
    hearts.forEach(h=>h.draw());
    projectiles.forEach(p=>p.draw());
    player.draw();
  }
  drawUI();

  requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', e=>{
  keys[e.key]=true; unlockAudio();
});
document.addEventListener('keyup', e=>keys[e.key]=false);

// Запуск игры!
let lastFrameTime = performance.now();
let realElapsed = 0; // Секунды!
gameLoop();

export { upgradeCardsElem, upgradeMenu, showGameOver };
