// ===== GAME STATE =====
const game = {
    heroHP: 10,
    heroMaxHP: 10,
    heroAP: 0,
    heroMaxAP: 5,
    enemyHP: 5,
    enemyMaxHP: 5,
    isHeroTurn: false,
    isGameOver: false,
    defenseActive: false,
    gameResult: null
};

const skills = {
    1: { name: 'Ataque Normal', effect: -1, apChange: 0 },
    2: { name: 'Ataque Forte', effect: -2, apChange: -1 },
    3: { name: 'Golpe Pesado', effect: -3, apChange: -2 },
    4: { name: 'Golpe Final', effect: -4, apChange: -3 },
    5: { name: 'Cura', effect: 2, apChange: -1 },
    6: { name: 'Concentração', effect: 0, apChange: +1 }
};

// ===== DOM ELEMENTS =====
const heroHPElem = document.getElementById('hero-hp');
const heroAPElem = document.getElementById('hero-ap');
const enemyHPElem = document.getElementById('enemy-hp');
const logContent = document.getElementById('log-content');
const heroHPBar = document.querySelector('.hero-hp');
const heroAPBar = document.querySelector('.hero-ap');
const enemyHPBar = document.querySelector('.enemy-hp');
const actionButtons = document.querySelectorAll('.action-btn');
const restartBtn = document.getElementById('restart-btn');
const enemyVisual = document.querySelector('.enemy-visual');

// ===== INICIALIZAÇÃO =====
function initGame() {
    game.heroHP = 10;
    game.heroMaxHP = 10;
    game.heroAP = 0;
    game.enemyHP = 5;
    game.enemyMaxHP = 5;
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
    heroHPElem.textContent = game.heroHP;
    heroAPElem.textContent = game.heroAP;
    enemyHPElem.textContent = game.enemyHP;
    
    const heroHPPercent = (game.heroHP / game.heroMaxHP) * 100;
    const heroAPPercent = (game.heroAP / game.heroMaxAP) * 100;
    const enemyHPPercent = (game.enemyHP / game.enemyMaxHP) * 100;
    
    heroHPBar.style.width = heroHPPercent + '%';
    heroAPBar.style.width = heroAPPercent + '%';
    enemyHPBar.style.width = enemyHPPercent + '%';
    
    updateActionButtons();
}

function updateActionButtons() {
    actionButtons.forEach(btn => {
        const skill = skills[parseInt(btn.dataset.action, 10)];
        const cost = skill.apChange < 0 ? Math.abs(skill.apChange) : 0;
        btn.disabled = !game.isHeroTurn || game.isGameOver || (skill.apChange < 0 && game.heroAP < cost);
    });
}

// ===== LOG SYSTEM =====

function addLog(message) {
    const timestamp = new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    logContent.textContent += '\n' + message;
    
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
    
    if (skill.apChange < 0 && game.heroAP < Math.abs(skill.apChange)) {
        addLog('Sem AP!');
        return;
    }
    
    // Reseta defesa de turno anterior
    game.defenseActive = false;
    
    game.heroAP = Math.min(game.heroMaxAP, Math.max(0, game.heroAP + skill.apChange));
    
    if (skill.effect < 0) {
        const damage = Math.abs(skill.effect);
        game.enemyHP = Math.max(0, game.enemyHP - damage);
        addLog(`${skill.name} -${damage}HP`);
        playHeroSlashAnimation();
        showFloatingText(damage, enemyVisual, true);
        playEnemyHitAnimation();

        if (game.enemyHP <= 0) {
            setTimeout(() => {
                endGame('victory');
            }, 300);
        }
    } else if (skill.effect > 0) {
        const healAmount = Math.min(skill.effect, game.heroMaxHP - game.heroHP);
        game.heroHP = Math.min(game.heroMaxHP, game.heroHP + skill.effect);
        addLog(`${skill.name} +${healAmount}HP`);
        showFloatingText(healAmount, document.querySelector('.hero-visual'), false);
    } else {
        const apLabel = skill.apChange > 0 ? `+${skill.apChange} AP` : `${skill.apChange} AP`;
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
    
    // Inimigo sempre causa 2 de dano fixo
    const damage = 2;
    let actualDamage = damage;
    
    // Se herói tem defesa, reduz dano
    if (game.defenseActive) {
        actualDamage = Math.max(1, Math.floor(damage / 2));
        addLog(`Bloqueado! -${actualDamage}HP`);
        game.defenseActive = false;
    } else {
        addLog(`Inimigo -${damage}HP`);
    }
    
    game.heroHP = Math.max(0, game.heroHP - actualDamage);
    
    // Animação de tremor do herói quando sofre dano
    const heroSprite = document.querySelector('.hero-sprite');
    heroSprite.classList.add('take-damage');
    setTimeout(() => {
        heroSprite.classList.remove('take-damage');
    }, 500);
    
    showFloatingText(actualDamage, document.querySelector('.hero-visual'), true);
    
    if (game.heroHP <= 0) {
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
