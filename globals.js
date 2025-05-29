// globals.js
let keys = {}; // Состояние клавиш
let particles = []; 
let enemies = []; 
let flyingEnemies = []; 
let projectiles = []; 
let hearts = [];
let rockets = [];
let gameVars = {
  combo: 0,
  comboTimer: 0,
  comboDisplay: 0,
  score: 0,
  level: 0,
  nextLevelScore: 20,
  // ... можно добавить level, nextLevelScore и т.п.
};


const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ==== ЗВУК И МУЗЫКА из локальной папки audio ====
const bgMusic = new Audio('audio/bg.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5;
const soundJump = new Audio('audio/jump.mp3');
const soundHit  = new Audio('audio/hit.mp3');
const soundDeath= new Audio('audio/gameover.mp3');
const soundEnemyDie = new Audio('audio/enemy_die.mp3');
const soundHeal = new Audio('audio/heal.mp3');
const soundLevelUp = new Audio('audio/levelup.mp3');

// Глобальные параметры игры
const gravity = 0.25;
const jumpPower = -12;
const moveSpeed = 3;
const enemySpeed = 1;
const groundHeight = 60;
const reachDistance = 288;
const playerBaseHP = 5;
const largeEnemyHP = 2;
const normalEnemyHP = 1;
const groundSpawnInterval = 90;
const minFlyingSpawn = 240;
const maxFlyingSpawn = 360;

let state = {
  gameOver: false,
  upgradeMenuActive: false,
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
