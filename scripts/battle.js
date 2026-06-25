// ===== GAME STATE =====
const game = {};

const heroData = HERO_DATA;
const enemyData = ENEMIES_DATA[0];
const skills = SKILLS_DATA;

// ===== DOM ELEMENTS =====
const heroPVElem = document.getElementById('hero-hp');
const heroPAElem = document.getElementById('hero-ap');
const enemyPVElem = document.getElementById('enemy-hp');
const logContent = document.getElementById('log-content');
const heroPVBar = document.querySelector('.hero-hp');
const heroPABar = document.querySelector('.hero-ap');
const enemyPVBar = document.querySelector('.enemy-hp');
const actionButtons = document.querySelectorAll('.action-btn');
const restartBtn = document.getElementById('restart-btn');
const enemyVisual = document.querySelector('.enemy-visual');

// ===== INICIALIZAÇÃO =====
function initGame() {
    game.heroPV = heroData.initialPV;
    game.heroMaxPV = heroData.maxPV;
    game.heroPA = heroData.initialPA;
    game.heroMaxPA = heroData.maxPA;
    game.enemyPV = enemyData.initialPV;
    game.enemyMaxPV = enemyData.maxPV;
    game.isHeroTurn = false;
    game.isGameOver = false;
    game.defenseActive = false;
    game.gameResult = null;
    
    // Remover efeito de dissolução
    const heroSprite = document.querySelector('.hero-sprite');
    const enemySprite = document.querySelector('.enemy-sprite');
    heroSprite.classList.remove('dissolve');
    enemySprite.classList.remove('dissolve');
    
    // Resetar log
    logContent.textContent = '--- INÍCIO ---';
    
    updateUI();
    
    // Começa com turno do inimigo
    setTimeout(() => {
        enemyTurn();
    }, 800);
}

// ===== UPDATE UI =====
function updateUI() {
    heroPVElem.textContent = game.heroPV;
    heroPAElem.textContent = game.heroPA;
    enemyPVElem.textContent = game.enemyPV;
    
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
        const damage = Math.abs(skill.effect);
        game.enemyPV = Math.max(0, game.enemyPV - damage);
        addLog(`${skill.name} -${damage}PV`);
        playHeroSlashAnimation();
        showFloatingText(damage, enemyVisual, true);
        playEnemyHitAnimation();

        if (game.enemyPV <= 0) {
            setTimeout(() => {
                endGame('victory');
            }, 300);
        }
    } else if (skill.effect > 0) {
        const healAmount = Math.min(skill.effect, game.heroMaxPV - game.heroPV);
        game.heroPV = Math.min(game.heroMaxPV, game.heroPV + skill.effect);
        addLog(`${skill.name} +${healAmount}PV`);
        showFloatingText(healAmount, document.querySelector('.hero-visual'), false);
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
    
    const damage = enemyData.attackDamage;
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
    
    showFloatingText(actualDamage, document.querySelector('.hero-visual'), true);
    
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
function endGame(result) {
    game.isGameOver = true;
    game.gameResult = result;
    
    if (result === 'victory') {
        addLog('VITÓRIA!');
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
function showFloatingText(amount, element, isDamage) {
    const indicator = document.createElement('div');
    
    if (isDamage) {
        indicator.className = 'damage-indicator';
        indicator.textContent = `-${amount}`;
        indicator.style.color = '#ff4444';
    } else {
        indicator.className = 'heal-indicator';
        indicator.textContent = `+${amount}`;
        indicator.style.color = '#00ff00';
    }
    
    const rect = element.getBoundingClientRect();
    indicator.style.left = (rect.left + rect.width / 2 - 15) + 'px';
    indicator.style.top = (rect.top - 20) + 'px';
    
    document.body.appendChild(indicator);
    
    setTimeout(() => {
        indicator.remove();
    }, 600);
}

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
    initGame();
});

// ===== START GAME =====
initGame();
