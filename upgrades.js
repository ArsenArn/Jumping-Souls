let skillLevels = {}; // Пример: { maxhp: 2, autofire: 1 }
import { state, gameVars,
  keys, particles, enemies,
  flyingEnemies, projectiles, hearts, rockets, canvas, ctx,
  gravity, jumpPower, moveSpeed, enemySpeed,
  groundHeight, reachDistance, playerBaseHP,
  largeEnemyHP, normalEnemyHP, groundSpawnInterval,
  minFlyingSpawn, maxFlyingSpawn, soundJump, 
  soundHit, soundDeath, soundEnemyDie, soundHeal, soundLevelUp, bgMusic,
} from './globals.js';
import { upgradeCardsElem, upgradeMenu } from './game.js';


// ==== ПРОКАЧКИ ====
const UPGRADE_POOL = [
  {
    id: 'maxhp',
    name: '+1 к максимальному HP',
    icon: '❤️',
    desc: 'Увеличивает максимальное здоровье на 1.',
    apply(player) {
  player.maxHP = (player.maxHP||playerBaseHP) + 1;
  player.hp = Math.min(player.maxHP, (player.hp||playerBaseHP) + 1);
}
  },
  {
  id: 'rocket',
  name: 'Ракета',
  icon: '🚀',
  desc: 'Раз в 10 секунд с неба падает ракета, нанося урон в области. Каждый уровень +1 ракета.',
  apply(player) {
  player.rocketLevel = (player.rocketLevel || 0) + 1;
  if (player.rocketLevel === 1) player.rocketCooldown = 0; // или 600, если хочешь задержку
}
},
  {
    id: 'autofire',
    name: 'Автострельба',
    icon: '🔫',
    desc: 'Игрок раз в 3 секунды стреляет снарядами во врагов. Каждая прокачка +1 снаряд.',
    apply(player) {
      player.autoFire = (player.autoFire||0) + 1;
      if (!player.autoFireTimer) player.autoFireTimer = 0;
    }
  },
  {
    id: 'healup',
    name: 'Усиление лечения',
    icon: '💊',
    desc: 'Лечение от аптечек +1 HP за каждый уровень прокачки.',
    apply(player) {
      player.healBoost = (player.healBoost||0)+1;
    }
  },
  {
  id: 'speed',
  name: 'Скорость передвижения',
  icon: '💨',
  desc: 'Передвижение быстрее на 5% за уровень прокачки.',
  apply(player) {
    player.speedBoost = (player.speedBoost || 0) + 1;
  }
},
{
  id: 'jump',
  name: 'Сила прыжка',
  icon: '🦘',
  desc: 'Прыжок выше на 5% за уровень прокачки.',
  apply(player) {
    player.jumpBoost = (player.jumpBoost || 0) + 1;
  }
},
  {
    id: 'shield',
    name: 'Щит',
    icon: '🛡️',
    desc: 'Раз в 9 сек появляется щит, который блокирует 1 урон. За каждый уровень -1 секунда на востановление',
    apply(player) {
      player.hasShield = true;
      player.shieldLevel = (player.shieldLevel||0) + 1;
      if (!player.shieldCooldown) player.shieldCooldown = 0;
      if (!player.shieldActive) player.shieldActive = false;
    }
  }
];
  // --- Система хранения апгрейдов и уровней ---


// Для отображения иконок и уровней
function renderSkillsUI() {
  const ui = document.getElementById('skillsUI');
  ui.innerHTML = '';
  Object.keys(skillLevels).forEach(skillId => {
    const upg = UPGRADE_POOL.find(u => u.id === skillId);
    if (!upg) return;
    // создаём блок с иконкой и уровнем
    const el = document.createElement('div');
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'center';
    el.style.fontFamily = 'Arial, sans-serif';
    const level = skillLevels[skillId];
el.innerHTML = `
  <div style="font-size: 38px; line-height: 1">${upg.icon}</div>
  <div style="margin-top: 2px; font-size: 20px; font-weight: bold; color: #3ef5ff;">
    ${level >= 5 ? 'Макс' : level}
  </div>
`;

    ui.appendChild(el);
  });
}

function getRandomUpgrades(pool, count) {
  const arr = pool.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

function openUpgradeMenu(player) {
  soundLevelUp.play();
  // Только скиллы, где уровень меньше 5!
  const availableUpgrades = UPGRADE_POOL.filter(upg => (skillLevels[upg.id] || 0) < 5);
  if (availableUpgrades.length === 0) {
    state.upgradeMenuActive = true;
    upgradeMenu.classList.add('visible');
    upgradeCardsElem.innerHTML = '<div style="color:#fff; font-size:28px; margin:40px">Все навыки уже прокачаны до максимума!</div>';
    return;
  }
  state.upgradeMenuActive = true;
  upgradeMenu.classList.add('visible');
  const upgrades = getRandomUpgrades(availableUpgrades, 3);
  upgradeCardsElem.innerHTML = '';
  upgrades.forEach(upg => {
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.innerHTML = `<div class=\"upgrade-icon\">${upg.icon}</div><div style=\"font-weight:bold\">${upg.name}</div><div style=\"margin-top:12px; font-size:18px; opacity:0.7;\">${upg.desc}</div>`;
    card.onclick = () => {
  // Проверяем, не превышен ли лимит
  if ((skillLevels[upg.id] || 0) < 5) {
    skillLevels[upg.id] = (skillLevels[upg.id] || 0) + 1;
    upg.apply(player);
    renderSkillsUI();
  }
  upgradeMenu.classList.remove('visible');
  state.upgradeMenuActive = false;
  gameVars.nextLevelScore += 20;
};
    upgradeCardsElem.appendChild(card);
  });
}

export { UPGRADE_POOL, skillLevels, renderSkillsUI, openUpgradeMenu, getRandomUpgrades };