// ===== GAME STATE =====
const game = {};

const heroData = HERO_DATA;
const skills = SKILLS_DATA;

// ===== STAGE CONTROL =====
let currentStage = 0;
let currentEnemyIndexInStage = 0;
let currentEnemyData = null;

// ===== DOM ELEMENTS =====
const heroPVElem = document.getElementById('hero-hp');
const heroMaxPVElem = document.getElementById('hero-max-hp');
const heroPAElem = document.getElementById('hero-ap');
const heroMaxPAElem = document.getElementById('hero-max-ap');
const enemyPVElem = document.getElementById('enemy-hp');
const enemyMaxPVElem = document.getElementById('enemy-max-hp');
const logContent = document.getElementById('log-content');
const heroPVBar = document.querySelector('.hero-hp');
const heroPABar = document.querySelector('.hero-ap');
const enemyPVBar = document.querySelector('.enemy-hp');
const restartBtn = document.getElementById('restart-btn');
const enemyVisual = document.querySelector('.enemy-visual');
const heroVisual = document.querySelector('.hero-visual');
const enemyNameLabel = document.getElementById('enemy-name-label');
const enemySprite = document.querySelector('.enemy-sprite');
const heroPFElem = document.getElementById('hero-pf');
const heroPDElem = document.getElementById('hero-pd');
const actionsGrid = document.getElementById('actions-grid');

// ===== RENDER SKILL BUTTONS =====
function renderSkillButtons() {
    actionsGrid.innerHTML = '';

    heroData.skills.forEach(skillId => {
        const skill = SKILLS_DATA[skillId];
        if (!skill) return;

        // Calcular custo/efeito para exibição
        const apCost = skill.apChange !== 0 ? `${skill.apChange > 0 ? '+' : ''}${skill.apChange} PA` : null;

        let effectText = null;
        let effectClass = 'neutral';
        if (skill.pdChange > 0) {
            effectText = `+${skill.pdChange} PD`;
            effectClass = 'positive';
        } else if (skill.effect < 0) {
            const totalDmg = Math.abs(skill.effect) * heroData.PF;
            effectText = `-${totalDmg} PV`;
            effectClass = 'negative';
        } else if (skill.effect > 0) {
            effectText = `+${skill.effect} PV`;
            effectClass = 'positive';
        }

        const metaItems = [
            apCost ? `<div class="btn-cost">${apCost}</div>` : '',
            effectText ? `<div class="btn-effect ${effectClass}">${effectText}</div>` : ''
        ].join('');

        const btn = document.createElement('button');
        btn.className = 'action-btn';
        btn.dataset.action = skillId;
        btn.dataset.effect = skill.effect;
        btn.innerHTML = `
            <div class="btn-title">${skill.name}</div>
            ${metaItems ? `<div class="btn-meta-row">${metaItems}</div>` : ''}`;
        btn.addEventListener('click', () => {
            btn.blur();
            heroAction(skillId);
        });
        actionsGrid.appendChild(btn);
    });
}

// ===== UPDATE SKILL BUTTONS =====
function updateSkillButtons() {
    actionsGrid.querySelectorAll('.action-btn').forEach(btn => {
        const skillId = parseInt(btn.dataset.action, 10);
        const skill = SKILLS_DATA[skillId];
        const effectElem = btn.querySelector('.btn-effect');

        if (skill.pdChange > 0) {
            effectElem.textContent = `+${skill.pdChange} PD`;
        } else if (skill.effect < 0) {
            const totalDmg = Math.abs(skill.effect) * heroData.PF;
            effectElem.textContent = `-${totalDmg} PV`;
        } else if (skill.effect > 0) {
            effectElem.textContent = `+${skill.effect} PV`;
        }
    });
}

// ===== INICIALIZAÇÃO =====
function initGame() {
    // Carregar dados do stage e inimigo atual
    const stage = STAGE_DATA[currentStage];
    const enemyIndexInStage = currentEnemyIndexInStage;
    const enemyArrayIndex = stage.enemies[enemyIndexInStage];
    currentEnemyData = ENEMIES_DATA[enemyArrayIndex];
    
    // Inicializar herói apenas na primeira batalha
    if (game.heroPV === undefined) {
        game.heroPV = heroData.maxPV;
        game.heroMaxPV = heroData.maxPV;
        game.heroPA = heroData.initialPA;
        game.heroMaxPA = heroData.maxPA;
    }
    // PD é levado entre batalhas; inicializa apenas se nunca definido
    if (game.heroPD === undefined || isNaN(game.heroPD)) {
        game.heroPD = heroData.initialPD;
    }

    game.enemyPV = currentEnemyData.maxPV;
    game.enemyMaxPV = currentEnemyData.maxPV;
    game.isHeroTurn = true;
    game.isGameOver = false;
    game.defenseActive = false;
    game.gameResult = null;
    
    // Remover efeito de dissolução
    const heroSprite = document.querySelector('.hero-sprite');
    const enemySpriteDom = document.querySelector('.enemy-sprite');
    heroSprite.classList.remove('dissolve');
    enemySpriteDom.classList.remove('dissolve');
    enemySpriteDom.classList.remove('spawn');
    
    // Atualizar nome e sprite do inimigo com contador
    const totalEnemiesInStage = stage.enemies.length;
    const currentEnemyNumber = enemyIndexInStage + 1;
    enemyNameLabel.textContent = `${currentEnemyData.name.toUpperCase()} ${currentEnemyNumber}/${totalEnemiesInStage}`;
    enemySprite.textContent = currentEnemyData.sprite;
    enemySpriteDom.style.opacity = '1';
    
    // Aplicar animação de surgimento
    enemySpriteDom.classList.add('spawn');
    setTimeout(() => {
        enemySpriteDom.classList.remove('spawn');
    }, 800);
    
    logContent.textContent = `Batalha contra ${currentEnemyData.name}!`;
    
    // Atualizar PF do herói
    heroPFElem.textContent = `PF: ${heroData.PF}`;
    
    // Atualizar valores dos botões de skill
    updateSkillButtons();
    
    updateUI();
}

// ===== UPDATE UI =====
function updateUI() {
    heroPVElem.textContent = game.heroPV;
    heroMaxPVElem.textContent = game.heroMaxPV;
    heroPAElem.textContent = game.heroPA;
    heroMaxPAElem.textContent = game.heroMaxPA;
    enemyPVElem.textContent = game.enemyPV;
    enemyMaxPVElem.textContent = game.enemyMaxPV;
    heroPDElem.textContent = `PD: ${game.heroPD}`;
    
    const heroPVPercent = (game.heroPV / game.heroMaxPV) * 100;
    const heroPAPercent = (game.heroPA / game.heroMaxPA) * 100;
    const enemyPVPercent = (game.enemyPV / game.enemyMaxPV) * 100;
    
    heroPVBar.style.width = heroPVPercent + '%';
    heroPABar.style.width = heroPAPercent + '%';
    enemyPVBar.style.width = enemyPVPercent + '%';
    
    updateActionButtons();
}

function updateActionButtons() {
    actionsGrid.querySelectorAll('.action-btn').forEach(btn => {
        const skill = skills[parseInt(btn.dataset.action, 10)];
        const cost = skill.apChange < 0 ? Math.abs(skill.apChange) : 0;
        btn.disabled = !game.isHeroTurn || game.isGameOver || (skill.apChange < 0 && game.heroPA < cost);
    });
}

// ===== LOG SYSTEM =====

function addLog(message) {
    logContent.textContent = message;
}

// ===== DAMAGE CALCULATOR =====
function calculateDamage(actionNumber) {
    const damages = {
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 0, // Cura
        6: 0   // Defesa
    };
    return damages[actionNumber];
}

// ===== HERO ACTION =====
function heroAction(actionNumber) {
    if (!game.isHeroTurn || game.isGameOver) return;
    
    const actionNumber_int = parseInt(actionNumber, 10);
    const skill = skills[actionNumber_int];
    if (!skill) return;
    
    if (skill.apChange < 0 && game.heroPA < Math.abs(skill.apChange)) {
        addLog('Sem PA!');
        return;
    }
    
    game.heroPA = Math.min(game.heroMaxPA, Math.max(0, game.heroPA + skill.apChange));

    // Acumula PD se a skill aumentar
    if (skill.pdChange > 0) {
        game.heroPD = (game.heroPD || 0) + skill.pdChange;
        addLog(`${heroData.name} usou ${skill.name} (${heroData.name}: +${skill.pdChange} PD)`);
        game.isHeroTurn = false;
        updateUI();
        setTimeout(() => { if (!game.isGameOver) enemyTurn(); }, 1000);
        return;
    }

    if (skill.effect < 0) {
        const damage = Math.abs(skill.effect) * heroData.PF;
        game.enemyPV = Math.max(0, game.enemyPV - damage);
        addLog(`${heroData.name} usou ${skill.name} (${currentEnemyData.name}: -${damage} PV)`);
        playHeroSlashAnimation();
        playEnemyHitAnimation();

        if (game.enemyPV <= 0) {
            // Aplicar animação de dissolução ao inimigo
            const enemySpriteDom = document.querySelector('.enemy-sprite');
            enemySpriteDom.classList.add('dissolve');
            
            game.isHeroTurn = false;
            updateUI();
            setTimeout(() => {
                loadNextEnemy();
            }, 300);
            return;
        }
    } else if (skill.effect > 0) {
        const healAmount = Math.min(skill.effect, game.heroMaxPV - game.heroPV);
        game.heroPV = Math.min(game.heroMaxPV, game.heroPV + skill.effect);
        addLog(`${heroData.name} usou ${skill.name} (${heroData.name}: +${healAmount} PV)`);
    } else {
        const apLabel = skill.apChange > 0 ? `+${skill.apChange}` : `${skill.apChange}`;
        addLog(`${heroData.name} usou ${skill.name} (${heroData.name}: ${apLabel} PA)`);
    }
    
    game.isHeroTurn = false;
    updateUI();
    
    // Próximo turno do inimigo (500ms animação + 1000ms delay)
    setTimeout(() => {
        if (!game.isGameOver) {
            enemyTurn();
        }
    }, 1500);
}

// ===== ENEMY TURN =====
function enemyTurn() {
    if (game.isGameOver) return;
    
    // Animação de charge do inimigo
    const enemySprite = document.querySelector('.enemy-sprite');
    enemySprite.classList.add('charge-attack');
    setTimeout(() => {
        enemySprite.classList.remove('charge-attack');
    }, 600);
    
    // Calcular faixa de PV do inimigo
    const pvPercent = (game.enemyPV / game.enemyMaxPV) * 100;
    let skillIndex = 0;
    
    if (pvPercent >= 81) skillIndex = 0;      // 100 a 81%
    else if (pvPercent >= 61) skillIndex = 1; // 80 a 61%
    else if (pvPercent >= 41) skillIndex = 2; // 60 a 41%
    else if (pvPercent >= 21) skillIndex = 3; // 40 a 21%
    else skillIndex = 4;                      // 20 a 0%
    
    // Obter índice do skill e dados do skill (referência direta ao SKILLS_DATA)
    const skillDataIndex = currentEnemyData.skills[skillIndex];
    const skill = SKILLS_DATA[skillDataIndex];
    
    // DANO FINAL = EFEITO - PD
    const rawDamage = Math.abs(skill.effect) * currentEnemyData.PF;
    const pd = Math.max(0, game.heroPD || 0);
    const absorbed = Math.min(pd, rawDamage);
    game.heroPD = pd - absorbed;
    const finalDamage = rawDamage - absorbed;

    if (absorbed > 0) {
        const dmgText = finalDamage > 0 ? `-${finalDamage} PV, ` : '';
        addLog(`${currentEnemyData.name} usou ${skill.name} (${heroData.name}: ${dmgText}${absorbed} bloqueado)`);
    } else {
        addLog(`${currentEnemyData.name} usou ${skill.name} (${heroData.name}: -${finalDamage} PV)`);
    }

    game.heroPV = Math.max(0, game.heroPV - finalDamage);
    playEnemySlashAnimation();
    
    // Animação de tremor do herói quando sofre dano
    const heroSprite = document.querySelector('.hero-sprite');
    heroSprite.classList.add('take-damage');
    setTimeout(() => {
        heroSprite.classList.remove('take-damage');
    }, 500);
    
    if (game.heroPV <= 0) {
        updateUI();
        setTimeout(() => {
            endGame('defeat');
        }, 300);
    } else {
        setTimeout(() => {
            game.isHeroTurn = true;
            updateUI();
        }, 1000);
    }
}

// ===== END GAME =====
function loadNextEnemy() {
    const stage = STAGE_DATA[currentStage];
    currentEnemyIndexInStage++;
    
    if (currentEnemyIndexInStage < stage.enemies.length) {
        // Há mais inimigos neste stage
        addLog(`${currentEnemyData.name} foi derrotado!`);
        // Aguarda: animação de dissolução (1.2s)
        setTimeout(() => {
            initGame();
        }, 1200);
    } else {
        // Stage completo
        endGame('victory');
    }
}

function endGame(result) {
    game.isGameOver = true;
    game.gameResult = result;
    
    if (result === 'victory') {
        addLog('VITÓRIA! STAGE COMPLETO!');
        // Animar dissolução do inimigo
        const enemySprite = document.querySelector('.enemy-sprite');
        enemySprite.classList.add('dissolve');
    } else {
        addLog('VOCE FOI DERROTADO.');
        // Animar dissolução do herói
        const heroSprite = document.querySelector('.hero-sprite');
        heroSprite.classList.add('dissolve');
    }
    
    updateUI();
    disableAllActions();
}

function disableAllActions() {
    actionsGrid.querySelectorAll('.action-btn').forEach(btn => {
        btn.disabled = true;
    });
}

// ===== ANIMATIONS =====
function playEnemyHitAnimation() {
    enemyVisual.classList.add('take-damage');
    setTimeout(() => {
        enemyVisual.classList.remove('take-damage');
    }, 300);
}

function playEnemySlashAnimation() {
    const slash = document.createElement('div');
    slash.className = 'slash-effect';
    slash.textContent = '🗡️';

    const rect = heroVisual.getBoundingClientRect();
    slash.style.left = (rect.left + rect.width / 2 - 37) + 'px';
    slash.style.top = (rect.top + rect.height / 2 - 37) + 'px';

    document.body.appendChild(slash);

    setTimeout(() => {
        slash.remove();
    }, 500);
}

function playHeroSlashAnimation() {
    const slash = document.createElement('div');
    slash.className = 'slash-effect';
    slash.textContent = '🗡️';
    
    const rect = enemyVisual.getBoundingClientRect();
    slash.style.left = (rect.left + rect.width / 2 - 37) + 'px';
    slash.style.top = (rect.top + rect.height / 2 - 37) + 'px';
    
    document.body.appendChild(slash);
    
    setTimeout(() => {
        slash.remove();
    }, 500);
}

// ===== EVENT LISTENERS =====
restartBtn.addEventListener('click', () => {
    restartBtn.blur();
    currentStage = 0;
    currentEnemyIndexInStage = 0;
    // Resetar estado do herói para novo jogo
    game.heroPV = undefined;
    game.heroPA = undefined;
    initGame();
});

// ===== START GAME =====
renderSkillButtons();
initGame();
