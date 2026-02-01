import { state, gameVars, getLevelExpRequirement, awardEnemyKillRewards,

  keys, particles, enemies,

  flyingEnemies, projectiles, hearts, rockets, canvas, ctx,

  gravity, jumpPower, moveSpeed, enemySpeed,

  groundHeight, reachDistance, playerBaseHP,

  largeEnemyHP, normalEnemyHP, groundSpawnInterval,

  minFlyingSpawn, maxFlyingSpawn, soundJump, 

  soundHit, soundDeath, soundEnemyDie, soundHeal, soundLevelUp, bgMusic, menuMusic,

  audioState, playSound, playMenuMusic, playGameMusic, stopAllMusic, setSoundEnabled, setMusicEnabled,

} from './globals.js';

import { renderSkillsUI, openUpgradeMenu } from './skills.js';

import { Player, PlayerProjectile } from './player.js';

import { Enemy, BlueEnemy, FlyingEnemy, Projectile, Heart, Rocket, Particle, RocketParticle, spawnParticles } from './enemies.js';

import { drawVisualTopLeft } from './visuals.js';

import { ENEMY_WAVES } from './waves.js';

const startMenu = document.getElementById("startMenu");
const startBtn = document.getElementById("startBtn");
const menuSoundToggle = document.getElementById("menuSoundToggle");
const menuMusicToggle = document.getElementById("menuMusicToggle");
const skillsUI = document.getElementById("skillsUI");

let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  if (state.menuActive) {
    playMenuMusic();
  } else {
    playGameMusic();
  }
}

document.addEventListener('keydown', unlockAudio, { once: true });
document.addEventListener('pointerdown', unlockAudio, { once: true });

function setToggleVisual(button, enabled) {
  button.classList.toggle('off', !enabled);
  button.setAttribute('aria-pressed', String(enabled));
}

function syncMenuAudioButtons() {
  if (!menuSoundToggle || !menuMusicToggle) return;
  setToggleVisual(menuSoundToggle, audioState.soundEnabled);
  setToggleVisual(menuMusicToggle, audioState.musicEnabled);
}

function startGame() {
  if (!state.menuActive) return;
  state.menuActive = false;
  if (startMenu) startMenu.classList.add('hidden');
  if (skillsUI) skillsUI.classList.remove('hidden');
  stopAllMusic();
  playGameMusic();
  Object.keys(keys).forEach(key => delete keys[key]);
}

if (startMenu) startMenu.classList.toggle('hidden', !state.menuActive);
if (skillsUI) skillsUI.classList.toggle('hidden', state.menuActive);
syncMenuAudioButtons();

if (startBtn) startBtn.addEventListener('click', startGame);
if (menuSoundToggle) {
  menuSoundToggle.addEventListener('click', () => {
    setSoundEnabled(!audioState.soundEnabled);
    syncMenuAudioButtons();
  });
}
if (menuMusicToggle) {
  menuMusicToggle.addEventListener('click', () => {
    setMusicEnabled(!audioState.musicEnabled);
    syncMenuAudioButtons();
  });
}



// ==== GAME PARAMS ====

// Game time counters (frames / seconds)
let gameTime = 0;
let gameElapsed = 0;

// Timers for non-enemy spawns (frames)
let heartTimer = 0;

// Enemy wave spawn state
const waveStates = ENEMY_WAVES.map(() => ({
  spawned: 0,
  nextSpawnFrame: 0,
  active: false,
}));
let nextWaveIndex = 0;



function getSpawnIntervalFrames(enemyType) {

  if (enemyType === 'enemy_flying') {

    return Math.floor(Math.random() * (maxFlyingSpawn - minFlyingSpawn + 1)) + minFlyingSpawn;

  }

  if (enemyType === 'enemy_blue') return groundSpawnInterval * 2;

  return groundSpawnInterval;

}



function spawnGroundEnemy(typeKey, sideOverride) {

  const side = sideOverride ?? (Math.random() < 0.5 ? -30 : canvas.width + 30);

  const dir = side < 0 ? 1 : -1;

  enemies.push(new Enemy(side, dir, typeKey));

}



function spawnBlueEnemy(sideOverride) {

  const side = sideOverride ?? (Math.random() < 0.5 ? -30 : canvas.width + 30);

  const dir = side < 0 ? 1 : -1;

  enemies.push(new BlueEnemy(side, dir));

}



function spawnGroundEnemyPair(typeKey) {

  spawnGroundEnemy(typeKey, -30);

  spawnGroundEnemy(typeKey, canvas.width + 30);

}



function spawnBlueEnemyPair() {

  spawnBlueEnemy(-30);

  spawnBlueEnemy(canvas.width + 30);

}



function spawnFlyingEnemiesPair() {

  flyingEnemies.push(new FlyingEnemy(-30, 1, player));

  flyingEnemies.push(new FlyingEnemy(canvas.width + 30, -1, player));

}



function spawnWaveEnemy(enemyType, remaining) {

  switch (enemyType) {

    case 'enemy':

      if (remaining >= 2) {

        spawnGroundEnemyPair('normal');

        return 2;

      }

      spawnGroundEnemy('normal');

      return 1;

    case 'enemy_fast':

      if (remaining >= 2) {

        spawnGroundEnemyPair('fast');

        return 2;

      }

      spawnGroundEnemy('fast');

      return 1;

    case 'enemy_large':

      if (remaining >= 2) {

        spawnGroundEnemyPair('large');

        return 2;

      }

      spawnGroundEnemy('large');

      return 1;

    case 'enemy_blue':

      if (remaining >= 2) {

        spawnBlueEnemyPair();

        return 2;

      }

      spawnBlueEnemy();

      return 1;

    case 'enemy_flying':

      if (remaining >= 2) {

        spawnFlyingEnemiesPair();

        return 2;

      }

      if (remaining === 1) {

        const side = Math.random() < 0.5 ? -30 : canvas.width + 30;

        const dir = side < 0 ? 1 : -1;

        flyingEnemies.push(new FlyingEnemy(side, dir, player));

        return 1;

      }

      return 0;

    default:

      return 0;

  }

}



canvas.width = window.innerWidth;

canvas.height = window.innerHeight;

const overlay = document.getElementById("gameOverScreen");

const finalScoreElem = document.getElementById("finalScore");

const restartBtn = document.getElementById("restartBtn");

const pauseMenu = document.getElementById("pauseMenu");

const continueBtn = document.getElementById("continueBtn");

let gameOverShown = false;



function showGameOver() {

  stopAllMusic();
  playSound(soundDeath);

  state.paused = false;

  pauseMenu.classList.remove('visible');

  finalScoreElem.textContent = gameVars.score;

  overlay.style.visibility = 'visible';
  gameOverShown = true;

}

restartBtn.addEventListener('click', () => location.reload());

continueBtn.addEventListener('click', () => setPaused(false));



function setPaused(paused) {

  state.paused = paused;

  pauseMenu.classList.toggle('visible', paused);

  if (paused) {

    Object.keys(keys).forEach(key => delete keys[key]);

  }

}



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
  if (state.menuActive) return;

  ctx.fillStyle='white';

  ctx.font='bold 32px Arial';

  ctx.fillText('Score:'+gameVars.score,20,40);
  ctx.fillText('Exp:'+gameVars.exp,20,80);

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



  ctx.fillText('Level:'+(gameVars.level+1),20,120);

  // HP

  ctx.font = '32px Arial';

ctx.textAlign = 'left';

for(let i = 0; i < player.maxHP; i++) {

  ctx.fillStyle = 'white'; // Можно не менять

  // Красное, если HP есть

  // Синее, если HP нет (можно заменить на 🩵 — голубое сердце)

  let emoji = (i < player.hp) ? '❤️' : '💙'; // или '🩵'

  ctx.fillText(emoji, 20 + i * 34, 160);

}



  if(gameVars.comboDisplay>0){

    ctx.save();

    ctx.globalAlpha=Math.min(1,gameVars.comboDisplay/30);

    ctx.fillStyle='yellow';

    ctx.font='bold 48px Arial';

    ctx.fillText('COMBO x'+gameVars.combo,canvas.width/2-100,120);

    ctx.restore();

  }

  // EXP bar
  const expNeeded = getLevelExpRequirement(gameVars.level);
  const expPrevLevel = gameVars.nextLevelExp - expNeeded;
  const expProgress = Math.max(0, gameVars.exp - expPrevLevel);
  const expRatio = expNeeded > 0 ? Math.min(1, expProgress / expNeeded) : 0;
  const barX = 20;
  const barY = 200;
  const barW = 280;
  const barH = 18;

  ctx.save();
  ctx.fillStyle = '#0b0f1f';
  ctx.strokeStyle = '#3ef5ff';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#3ef5ff';
  ctx.shadowBlur = 10;
  ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#33e8ff';
  ctx.fillRect(barX, barY, Math.floor(barW * expRatio), barH);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(`EXP ${expProgress}/${expNeeded}`, barX + 6, barY + 14);
  ctx.restore();

}





let timeElapsed = 0; // в кадрах

let player = new Player();

setTimeout(renderSkillsUI, 0);






function gameLoop(){

  let now = performance.now();

  let delta = (now - lastFrameTime) / 1000; // Дельта в секундах

  lastFrameTime = now;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  drawBackground();

  drawGround();



  if (!state.menuActive && !state.upgradeMenuActive && !state.gameOver && !state.paused) {
    realElapsed += delta;
    gameElapsed += delta;

    // --- Основная логика игры ---

    particles.forEach(p=>{p.update();p.draw();});

    particles.splice(0, particles.length, ...particles.filter(p=>p.life>0));



    while (nextWaveIndex < ENEMY_WAVES.length && gameElapsed >= ENEMY_WAVES[nextWaveIndex].time) {
      waveStates[nextWaveIndex].active = true;
      waveStates[nextWaveIndex].nextSpawnFrame = gameTime;
      nextWaveIndex++;
    }
    ENEMY_WAVES.forEach((wave, i) => {
      const waveState = waveStates[i];
      if (!waveState.active) return;
      if (waveState.spawned >= wave.count) {
        waveState.active = false;
        return;
      }
      if (gameTime >= waveState.nextSpawnFrame) {
        const remaining = wave.count - waveState.spawned;
        const spawnedNow = spawnWaveEnemy(wave.enemy, remaining);
        waveState.spawned += spawnedNow;
        waveState.nextSpawnFrame = gameTime + getSpawnIntervalFrames(wave.enemy);
      }
    });

    flyingEnemies.forEach(f=>{
      f.update(); f.draw();
      const dx=player.x-f.x, dy=player.y-f.y;
      if(f.alive && Math.hypot(dx,dy)<player.radius+f.size/2){
        if (player.vy > 0 && player.y < f.y) {
          f.alive = false;
          player.vy = jumpPower / 2;
          spawnParticles(f);
          playSound(soundEnemyDie);
          awardEnemyKillRewards();
        } else {
          if (player.invincible === 0) {
            if (player.hasShield && player.shieldActive) {
              player.shieldActive = false;
              player.shieldCooldown = 300;
            } else {
              player.hp--;
              player.damageFlash = 20;
              player.invincible = 30;
              playSound(soundHit);
            }
          }
          f.alive = false;
          spawnParticles(f);
          playSound(soundEnemyDie);
          if (player.hp <= 0) {
            state.gameOver = true;
            showGameOver();
          }
        }
      }
    });
    flyingEnemies.splice(0, flyingEnemies.length, ...flyingEnemies.filter(f => f.alive));

    enemies.forEach(e=>{

      e.update(); e.draw();

      const dx=player.x-(e.x+e.width/2), dy=player.y-(e.y-e.height/2), dist=Math.hypot(dx,dy);

      if(e.alive&&dist<player.radius+e.width/2){

        if(player.vy>0&&player.y<e.y){

          e.hp--; player.vy=jumpPower/1.5;

          if(e.hp<=0){e.alive=false; spawnParticles(e); playSound(soundEnemyDie); awardEnemyKillRewards();

    } else if(e.type==='large') e.color='#cc66ff';

        } else {

          if(player.invincible===0){

            // Щит!

            if(player.hasShield && player.shieldActive){

              player.shieldActive = false; player.shieldCooldown = 300;

            } else {

              player.hp--; player.damageFlash=20; player.invincible=30; playSound(soundHit);

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

    if(gameVars.exp >= gameVars.nextLevelExp) {

      gameVars.level++;

      openUpgradeMenu(player);

    }

  } else {

    // Отрисуем всё «замороженным» + меню прокачки/паузы

    particles.forEach(p=>p.draw());

    flyingEnemies.forEach(f=>f.draw());

    enemies.forEach(e=>e.draw());

    hearts.forEach(h=>h.draw());

    projectiles.forEach(p=>p.draw());

    player.draw();

  }

  if (state.gameOver && !gameOverShown) {
    showGameOver();
  }

  drawUI();



  requestAnimationFrame(gameLoop);

}



document.addEventListener('keydown', e=>{

  if (state.menuActive) {

    if (!e.repeat && (e.key === 'Enter' || e.key === ' ')) {

      startGame();

    }

    unlockAudio();

    return;

  }

  if (e.key === 'Escape' && !e.repeat) {

    if (!state.gameOver && !state.upgradeMenuActive) {

      setPaused(!state.paused);

    }

    unlockAudio();

    return;

  }

  keys[e.key]=true; unlockAudio();

});

document.addEventListener('keyup', e=>{

  if (state.menuActive) return;

  keys[e.key]=false;

});



// Запуск игры!

let lastFrameTime = performance.now();

let realElapsed = 0; // Секунды!

gameLoop();



export { showGameOver };






