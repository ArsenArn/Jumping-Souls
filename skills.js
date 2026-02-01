import { state, gameVars, playerBaseHP, soundLevelUp, getLevelExpRequirement, playSound } from './globals.js';

const MAX_SKILL_LEVEL = 5;

function levelsFrom(descs) {
  return descs.map(desc => ({ desc }));
}

const SKILLS = [
  {
    id: 'maxhp',
    name: '+1 Max HP',
    icon: '❤️',
    levels: levelsFrom([
      '+1 Max HP (total +1).',
      '+1 Max HP (total +2).',
      '+1 Max HP (total +3).',
      '+1 Max HP (total +4).',
      '+1 Max HP (total +5).',
    ]),
    apply(player, level) {
      player.maxHP = playerBaseHP + level;
      player.hp = Math.min(player.maxHP, (player.hp || playerBaseHP) + 1);
    }
  },
  {
    id: 'rocket',
    name: 'Rocket',
    icon: '🚀',
    levels: levelsFrom([
      '1 rocket per volley every 10 sec.',
      '1 rocket per volley every 9 sec.',
      '2 rockets per volley every 9 sec.',
      '2 rockets per volley every 8 sec.',
      '3 rockets per volley every 8 sec.',
    ]),
    apply(player, level) {
      player.rocketLevel = Math.floor((level + 1) / 2);
      player.rocketCooldownBonus = Math.floor(level / 2);
      if (level === 1) player.rocketCooldown = 0;
    }
  },
  {
    id: 'autofire',
    name: 'Auto Fire',
    icon: '🔫',
    levels: levelsFrom([
      '1 shot in the auto-burst every 6 sec.',
      '2 shots in the auto-burst every 6 sec.',
      '3 shots in the auto-burst every 6 sec.',
      '4 shots in the auto-burst every 6 sec.',
      '5 shots in the auto-burst every 6 sec.',
    ]),
    apply(player, level) {
      player.autoFire = level;
      if (!player.autoFireTimer) player.autoFireTimer = 0;
    }
  },
  {
    id: 'healup',
    name: 'Healing Boost',
    icon: '💊',
    levels: levelsFrom([
      '+1 HP from medkits (total +1).',
      '+1 sec medkit lifetime (total +1 sec).',
      '+1 HP from medkits (total +2).',
      '+1 sec medkit lifetime (total +2 sec).',
      '+1 HP from medkits (total +3).',
    ]),
    apply(player, level) {
      player.healBoost = Math.floor((level + 1) / 2);
      player.healLifetimeBonus = Math.floor(level / 2);
    }
  },
  {
    id: 'speed',
    name: 'Move Speed',
    icon: '💨',
    levels: levelsFrom([
      '+5% speed (total +5%).',
      '+5% speed (total +10%).',
      '+5% speed (total +15%).',
      '+5% speed (total +20%).',
      '+5% speed (total +25%).',
    ]),
    apply(player, level) {
      player.speedBoost = level;
    }
  },
  {
    id: 'jump',
    name: 'Jump Power',
    icon: '🦘',
    levels: levelsFrom([
      '+5% jump height (total +5%).',
      '+5% jump height (total +10%).',
      '+5% jump height (total +15%).',
      '+5% jump height (total +20%).',
      '+5% jump height (total +25%).',
    ]),
    apply(player, level) {
      player.jumpBoost = level;
    }
  },
  {
    id: 'shield',
    name: 'Shield',
    icon: '🛡️',
    levels: levelsFrom([
      'Shield appears every 9 sec (blocks 1 damage).',
      'Shield appears every 8 sec (blocks 1 damage).',
      'Shield appears every 7 sec (blocks 1 damage).',
      'Shield appears every 6 sec (blocks 1 damage).',
      'Shield appears every 5 sec (blocks 1 damage).',
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
        ${level >= MAX_SKILL_LEVEL ? 'Max' : level}
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
  playSound(soundLevelUp);
  const availableUpgrades = SKILLS.filter(skill => (skillLevels[skill.id] || 0) < MAX_SKILL_LEVEL);
  if (availableUpgrades.length === 0) {
    state.upgradeMenuActive = true;
    upgradeMenu.classList.add('visible');
    upgradeCardsElem.innerHTML = '<div style="color:#fff; font-size:28px; margin:40px">All skills are already at max level!</div>';
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
      <div style="margin-top:6px; font-size:16px; opacity:0.7;">Level ${nextLevel}/${MAX_SKILL_LEVEL}</div>
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
      gameVars.nextLevelExp += getLevelExpRequirement(gameVars.level);
    };
    upgradeCardsElem.appendChild(card);
  });
}

export { SKILLS, skillLevels, renderSkillsUI, openUpgradeMenu, getRandomUpgrades };





