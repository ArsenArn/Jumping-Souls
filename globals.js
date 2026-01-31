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
  level: 0,           // уровень прокачки игрока
  nextLevelScore: 20, // очков до первой прокачки
  // сюда можно добавить новые параметры при необходимости
};


const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ==== ЗВУК И МУЗЫКА из локальной папки audio ====
// Фоновая музыка. Можно изменить файл или громкость по своему вкусу.
const bgMusic = new Audio('audio/bg.mp3');
bgMusic.loop = true;        // Зацикливаем воспроизведение
bgMusic.volume = 0.5;       // Громкость фоновой музыки
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
  // сюда можно добавить еще любые флаги!
};


export { state, gameVars,
  keys, particles, enemies,
  flyingEnemies, projectiles, hearts, rockets, canvas, ctx,
  gravity, jumpPower, moveSpeed, enemySpeed,
  groundHeight, reachDistance, playerBaseHP,
  largeEnemyHP, normalEnemyHP, groundSpawnInterval,
  minFlyingSpawn, maxFlyingSpawn, soundJump, 
  soundHit, soundDeath, soundEnemyDie, soundHeal, soundLevelUp, bgMusic,
};
