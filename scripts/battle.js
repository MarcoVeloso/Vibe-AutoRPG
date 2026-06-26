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
const actionButtons = document.querySelectorAll('.action-btn');
const restartBtn = document.getElementById('restart-btn');
const enemyVisual = document.querySelector('.enemy-visual');
const enemyNameLabel = document.getElementById('enemy-name-label');
const enemySprite = document.querySelector('.enemy-sprite');
const heroPFElem = document.getElementById('hero-pf');

// ===== UPDATE SKILL BUTTONS =====
function updateSkillButtons() {
    actionButtons.forEach(btn => {
        const baseEffect = parseInt(btn.dataset.effect, 10);
        const effectElem = btn.querySelector('.btn-effect');
        
        if (baseEffect !== 0) {
            const totalEffect = baseEffect < 0 ? baseEffect * heroData.PF : baseEffect;
            const sign = totalEffect < 0 ? '' : '+';
            effectElem.textContent = `${sign}${totalEffect} PV`;
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
    
    // Resetar log apenas na primeira batalha
    if (currentEnemyIndexInStage === 0) {
        logContent.textContent = '--- INÍCIO ---';
    }
    
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
    
    const heroPVPercent = (game.heroPV / game.heroMaxPV) * 100;
    const heroPAPercent = (game.heroPA / game.heroMaxPA) * 100;
    const enemyPVPercent = (game.enemyPV / game.enemyMaxPV) * 100;
    
    heroPVBar.style.width = heroPVPercent + '%';
    heroPABar.style.width = heroPAPercent + '%';
    enemyPVBar.style.width = enemyPVPercent + '%';
    
    updateActionButtons();
}

function updateActionButtons() {
    actionButtons.forEach(btn => {
        const skill = skills[parseInt(btn.dataset.action, 10)];
        const cost = skill.apChange < 0 ? Math.abs(skill.apChange) : 0;
        btn.disabled = !game.isHeroTurn || game.isGameOver || (skill.apChange < 0 && game.heroPA < cost);
    });
}

// ===== LOG SYSTEM =====

function addLog(message) {

    logContent.textContent += message + '\n';
    
    // Keep log scrolled to bottom
    const logElement = document.querySelector('.action-log');
    logElement.scrollTop = logElement.scrollHeight;
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
    
    // Reseta defesa de turno anterior
    game.defenseActive = false;
    
    game.heroPA = Math.min(game.heroMaxPA, Math.max(0, game.heroPA + skill.apChange));
    
    if (skill.effect < 0) {
        const damage = Math.abs(skill.effect) * heroData.PF;
        game.enemyPV = Math.max(0, game.enemyPV - damage);
        addLog(`${skill.name} -${damage}PV`);
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
        addLog(`${skill.name} +${healAmount}PV`);
    } else {
        const apLabel = skill.apChange > 0 ? `+${skill.apChange} PA` : `${skill.apChange} PA`;
        addLog(`${skill.name} ${apLabel}`);
    }
    
    game.isHeroTurn = false;
    updateUI();
    
    // Próximo turno do inimigo
    setTimeout(() => {
        if (!game.isGameOver) {
            enemyTurn();
        }
    }, 1000);
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
    
    const damage = currentEnemyData.attackDamage;
    let actualDamage = damage;
    
    // Se herói tem defesa, reduz dano
    if (game.defenseActive) {
        actualDamage = Math.max(1, Math.floor(damage / 2));
        addLog(`Bloqueado! -${actualDamage}PV`);
        game.defenseActive = false;
    } else {
        addLog(`Inimigo -${damage}PV`);
    }
    
    game.heroPV = Math.max(0, game.heroPV - actualDamage);
    
    // Animação de tremor do herói quando sofre dano
    const heroSprite = document.querySelector('.hero-sprite');
    heroSprite.classList.add('take-damage');
    setTimeout(() => {
        heroSprite.classList.remove('take-damage');
    }, 500);
    
    if (game.heroPV <= 0) {
        setTimeout(() => {
            endGame('defeat');
        }, 300);
    } else {
        game.isHeroTurn = true;
        updateUI();
    }
}

// ===== END GAME =====
function loadNextEnemy() {
    const stage = STAGE_DATA[currentStage];
    currentEnemyIndexInStage++;
    
    if (currentEnemyIndexInStage < stage.enemies.length) {
        // Há mais inimigos neste stage
        addLog(`${currentEnemyData.name} derrotado! Próximo inimigo aparece...`);
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
        addLog('DERROTA!');
        // Animar dissolução do herói
        const heroSprite = document.querySelector('.hero-sprite');
        heroSprite.classList.add('dissolve');
    }
    
    updateUI();
    disableAllActions();
}

function disableAllActions() {
    actionButtons.forEach(btn => {
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
actionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        heroAction(action);
    });
});

restartBtn.addEventListener('click', () => {
    currentStage = 0;
    currentEnemyIndexInStage = 0;
    // Resetar estado do herói para novo jogo
    game.heroPV = undefined;
    game.heroPA = undefined;
    initGame();
});

// ===== START GAME =====
initGame();
