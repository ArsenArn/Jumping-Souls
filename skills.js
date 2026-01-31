import { state, gameVars, playerBaseHP, soundLevelUp } from './globals.js';

const MAX_SKILL_LEVEL = 5;

function levelsFrom(descs) {
  return descs.map(desc => ({ desc }));
}

const SKILLS = [
  {
    id: 'maxhp',
    name: '+1 к максимальному HP',
    icon: '❤️',
    levels: levelsFrom([
      '+1 к максимальному HP (итого +1).',
      '+1 к максимальному HP (итого +2).',
      '+1 к максимальному HP (итого +3).',
      '+1 к максимальному HP (итого +4).',
      '+1 к максимальному HP (итого +5).',
    ]),
    apply(player, level) {
      player.maxHP = playerBaseHP + level;
      player.hp = Math.min(player.maxHP, (player.hp || playerBaseHP) + 1);
    }
  },
  {
    id: 'rocket',
    name: 'Ракета',
    icon: '🚀',
    levels: levelsFrom([
      '1 ракета в залпе каждые 10 сек.',
      '2 ракеты в залпе каждые 10 сек.',
      '3 ракеты в залпе каждые 10 сек.',
      '4 ракеты в залпе каждые 10 сек.',
      '5 ракет в залпе каждые 10 сек.',
    ]),
    apply(player, level) {
      player.rocketLevel = level;
      if (level === 1) player.rocketCooldown = 0;
    }
  },
  {
    id: 'autofire',
    name: 'Автострельба',
    icon: '🔫',
    levels: levelsFrom([
      '1 снаряд в авто-очереди каждые 3 сек.',
      '2 снаряда в авто-очереди каждые 3 сек.',
      '3 снаряда в авто-очереди каждые 3 сек.',
      '4 снаряда в авто-очереди каждые 3 сек.',
      '5 снарядов в авто-очереди каждые 3 сек.',
    ]),
    apply(player, level) {
      player.autoFire = level;
      if (!player.autoFireTimer) player.autoFireTimer = 0;
    }
  },
  {
    id: 'healup',
    name: 'Усиление лечения',
    icon: '💊',
    levels: levelsFrom([
      '+1 HP от аптечек (итого +1).',
      '+1 HP от аптечек (итого +2).',
      '+1 HP от аптечек (итого +3).',
      '+1 HP от аптечек (итого +4).',
      '+1 HP от аптечек (итого +5).',
    ]),
    apply(player, level) {
      player.healBoost = level;
    }
  },
  {
    id: 'speed',
    name: 'Скорость передвижения',
    icon: '💨',
    levels: levelsFrom([
      '+5% к скорости (итого +5%).',
      '+5% к скорости (итого +10%).',
      '+5% к скорости (итого +15%).',
      '+5% к скорости (итого +20%).',
      '+5% к скорости (итого +25%).',
    ]),
    apply(player, level) {
      player.speedBoost = level;
    }
  },
  {
    id: 'jump',
    name: 'Сила прыжка',
    icon: '🦘',
    levels: levelsFrom([
      '+5% к высоте прыжка (итого +5%).',
      '+5% к высоте прыжка (итого +10%).',
      '+5% к высоте прыжка (итого +15%).',
      '+5% к высоте прыжка (итого +20%).',
      '+5% к высоте прыжка (итого +25%).',
    ]),
    apply(player, level) {
      player.jumpBoost = level;
    }
  },
  {
    id: 'shield',
    name: 'Щит',
    icon: '🛡️',
    levels: levelsFrom([
      'Щит появляется каждые 9 сек (блок 1 урон).',
      'Щит появляется каждые 8 сек (блок 1 урон).',
      'Щит появляется каждые 7 сек (блок 1 урон).',
      'Щит появляется каждые 6 сек (блок 1 урон).',
      'Щит появляется каждые 5 сек (блок 1 урон).',
    ]),
    apply(player, level) {
      player.hasShield = true;
      player.shieldLevel = level;
      if (!player.shieldCooldown) player.shieldCooldown = 0;
      if (!player.shieldActive) player.shieldActive = false;
    }
  }
];

let skillLevels = {}; // Пример: { maxhp: 2, autofire: 1 }

const upgradeMenu = document.getElementById('upgradeMenu');
const upgradeCardsElem = document.getElementById('upgradeCards');

function getSkillById(skillId) {
  return SKILLS.find(s => s.id === skillId);
}

function getSkillLevelDesc(skill, level) {
  if (!skill || !skill.levels || !skill.levels[level - 1]) return '';
  return skill.levels[level - 1].desc || '';
}

function renderSkillsUI() {
  const ui = document.getElementById('skillsUI');
  ui.innerHTML = '';
  Object.keys(skillLevels).forEach(skillId => {
    const skill = getSkillById(skillId);
    if (!skill) return;
    const el = document.createElement('div');
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.alignItems = 'center';
    el.style.fontFamily = 'Arial, sans-serif';
    const level = skillLevels[skillId];
    el.innerHTML = `
      <div style="font-size: 38px; line-height: 1">${skill.icon}</div>
      <div style="margin-top: 2px; font-size: 20px; font-weight: bold; color: #3ef5ff;">
        ${level >= MAX_SKILL_LEVEL ? 'Макс' : level}
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
  const availableUpgrades = SKILLS.filter(skill => (skillLevels[skill.id] || 0) < MAX_SKILL_LEVEL);
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
  upgrades.forEach(skill => {
    const currentLevel = skillLevels[skill.id] || 0;
    const nextLevel = currentLevel + 1;
    const levelDesc = getSkillLevelDesc(skill, nextLevel);
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.innerHTML = `
      <div class="upgrade-icon">${skill.icon}</div>
      <div style="font-weight:bold">${skill.name}</div>
      <div style="margin-top:6px; font-size:16px; opacity:0.7;">Уровень ${nextLevel}/${MAX_SKILL_LEVEL}</div>
      <div style="margin-top:10px; font-size:18px; opacity:0.7;">${levelDesc}</div>
    `;
    card.onclick = () => {
      if ((skillLevels[skill.id] || 0) < MAX_SKILL_LEVEL) {
        skillLevels[skill.id] = nextLevel;
        skill.apply(player, nextLevel);
        renderSkillsUI();
      }
      upgradeMenu.classList.remove('visible');
      state.upgradeMenuActive = false;
      gameVars.nextLevelScore += 20;
    };
    upgradeCardsElem.appendChild(card);
  });
}

export { SKILLS, skillLevels, renderSkillsUI, openUpgradeMenu, getRandomUpgrades };
