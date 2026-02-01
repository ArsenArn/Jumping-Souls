// globals.js
let keys = {}; // Состояние клавиш
let particles = []; 
let enemies = []; 
let flyingEnemies = []; 
let projectiles = []; 
let hearts = [];
let rockets = [];
// Переменные, описывающие текущее состояние игры.
// Здесь можно поменять только начальные значения, например
// сколько очков нужно до первой прокачки.
let gameVars = {
  combo: 0,           // текущий множитель комбо
  comboTimer: 0,      // время до сброса комбо
  comboDisplay: 0,    // таймер отображения надписи COMBO
  score: 0,           // набранные очки
  exp: 0,             // опыт (для прокачки)
  expPerEnemy: 1,     // опыт за победу над одним врагом
  level: 0,           // уровень прокачки игрока
  levelExpRequirements: [10, 11, 12, 12, 13, 14, 15, 15, 16, 17, 18, 18, 19, 20, 21, 21, 22, 23, 24, 24, 25, 26, 27, 27, 28, 29, 30, 30, 31, 32], // список опыта на каждый уровень
  nextLevelExp: 0,    // опыта до следующего уровня
  // сюда можно добавить новые параметры при необходимости
};

function getLevelExpRequirement(level) {
  const list = gameVars.levelExpRequirements;
  if (!Array.isArray(list) || list.length === 0) return 20;
  return list[level] ?? list[list.length - 1] ?? 20;
}

function awardEnemyKillRewards() {
  gameVars.combo++;
  gameVars.score += gameVars.combo;
  gameVars.comboTimer = 180;
  gameVars.comboDisplay = 180;
  gameVars.exp += gameVars.expPerEnemy;
}

function resetCombo() {
  if (gameVars.combo > 0) {
    gameVars.combo = 0;
    gameVars.comboTimer = 0;
    gameVars.comboDisplay = 0;
  }
}

gameVars.nextLevelExp = getLevelExpRequirement(0);


const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ==== ЗВУК И МУЗЫКА из локальной папки audio ====
// Фоновая музыка. Можно изменить файл или громкость по своему вкусу.
const bgMusic = new Audio('audio/bg.mp3');
bgMusic.loop = true;        // Зацикливаем воспроизведение
bgMusic.volume = 0.5;       // Громкость фоновой музыки
// Музыка меню
const menuMusic = new Audio('audio/menu.mp3');
menuMusic.loop = true;
menuMusic.volume = 0.5;
// Звуки действий игрока и событий игры
const soundJump = new Audio('audio/jump.mp3');      // прыжок
const soundHit  = new Audio('audio/hit.mp3');       // удар по игроку
const soundDeath= new Audio('audio/gameover.mp3');  // конец игры
const soundEnemyDie = new Audio('audio/enemy_die.mp3'); // уничтожение врага
const soundHeal = new Audio('audio/heal.mp3');      // подбор аптечки
const soundLevelUp = new Audio('audio/levelup.mp3'); // повышение уровня

// === Глобальные параметры игры ===
// Сила притяжения. Чем больше число, тем быстрее объекты падают.
const gravity = 0.25;
// Начальная скорость прыжка игрока (отрицательное значение направлено вверх).
const jumpPower = -12;
// Базовая скорость передвижения игрока.
const moveSpeed = 3;
// Базовая скорость наземных врагов.
const enemySpeed = 1;
// Высота «земли» от нижнего края канваса.
const groundHeight = 60;
// На каком расстоянии летающие враги останавливаются от игрока.
const reachDistance = 288;
// Количество очков здоровья у игрока при старте игры.
const playerBaseHP = 5;
// Здоровье крупного врага.
const largeEnemyHP = 2;
// Здоровье обычного врага.
const normalEnemyHP = 1;
// Интервал (в кадрах) появления наземных врагов.
const groundSpawnInterval = 90;
// Минимальный интервал (в кадрах) между появлением летающих врагов.
const minFlyingSpawn = 240;
// Максимальный интервал (в кадрах) между появлением летающих врагов.
const maxFlyingSpawn = 360;

let state = {
  gameOver: false,
  upgradeMenuActive: false,
  paused: false,
  menuActive: true,
  characterSelectActive: false,
  selectedCharacter: 1,
  // сюда можно добавить еще любые флаги!
};

let audioState = {
  soundEnabled: true,
  musicEnabled: true,
};

function playSound(sound) {
  if (!audioState.soundEnabled) return;
  try { sound.currentTime = 0; } catch (e) {}
  sound.play().catch(() => {});
}

function stopAllMusic() {
  bgMusic.pause();
  menuMusic.pause();
}

function playMenuMusic() {
  if (!audioState.musicEnabled) return;
  menuMusic.play().catch(() => {});
}

function playGameMusic() {
  if (!audioState.musicEnabled) return;
  bgMusic.play().catch(() => {});
}

function setSoundEnabled(enabled) {
  audioState.soundEnabled = enabled;
}

function setMusicEnabled(enabled) {
  audioState.musicEnabled = enabled;
  if (!enabled) {
    stopAllMusic();
    return;
  }
  if (state.menuActive) {
    playMenuMusic();
  } else {
    playGameMusic();
  }
}


export { state, gameVars, getLevelExpRequirement, awardEnemyKillRewards, resetCombo,
  keys, particles, enemies,
  flyingEnemies, projectiles, hearts, rockets, canvas, ctx,
  gravity, jumpPower, moveSpeed, enemySpeed,
  groundHeight, reachDistance, playerBaseHP,
  largeEnemyHP, normalEnemyHP, groundSpawnInterval,
  minFlyingSpawn, maxFlyingSpawn, soundJump, 
  soundHit, soundDeath, soundEnemyDie, soundHeal, soundLevelUp, bgMusic, menuMusic,
  audioState, playSound, playMenuMusic, playGameMusic, stopAllMusic, setSoundEnabled, setMusicEnabled,
};




