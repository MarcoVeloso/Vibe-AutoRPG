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
const turnTimerBar = document.getElementById('turn-timer-bar');

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
            selectSkill(skillId);
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
    game.isActionLocked = false;
    
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
    startTurn();
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
        const canUseSkill = game.isHeroTurn && !game.isGameOver && !game.isActionLocked && !(skill.apChange < 0 && game.heroPA < cost);
        btn.disabled = !canUseSkill;
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

// ===== TURN CONTROL =====
const TURN_DURATION = 5000;
// Pausa entre ações para que as animações de um turno terminem antes do próximo
const ACTION_DELAY = 1000;
let turnTimeout = null;

function startTimerBar() {
    turnTimerBar.style.transition = 'none';
    turnTimerBar.style.width = '100%';
    // Força reflow para reiniciar a transição
    void turnTimerBar.offsetWidth;
    turnTimerBar.style.transition = `width ${TURN_DURATION}ms linear`;
    turnTimerBar.style.width = '0%';
}

function stopTimerBar() {
    turnTimerBar.style.transition = 'none';
    turnTimerBar.style.width = '0%';
}

function canAfford(skill) {
    return !(skill.apChange < 0 && game.heroPA < Math.abs(skill.apChange));
}

function clearSelection() {
    actionsGrid.querySelectorAll('.action-btn').forEach(btn => btn.classList.remove('selected'));
}

function highlightSelection(skillId) {
    actionsGrid.querySelectorAll('.action-btn').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.action, 10) === skillId);
    });
}

// Seleciona a skill do botão clicado; permitido em qualquer turno.
// Se a skill já estiver selecionada e for o turno do herói, executa imediatamente.
function selectSkill(skillId) {
    if (game.isGameOver || !game.isHeroTurn || game.isActionLocked) return;
    const skill = skills[skillId];
    if (!skill || !canAfford(skill)) return;

    if (game.isHeroTurn && game.selectedSkill === skillId) {
        // Clicar novamente na skill já selecionada: executa na hora, zera o tempo
        if (turnTimeout) clearTimeout(turnTimeout);
        stopTimerBar();
        executeHeroTurn();
        return;
    }

    game.selectedSkill = skillId;
    highlightSelection(skillId);
}

// Inicia um turno (herói: 5s com barra de tempo aguardando seleção; inimigo: age imediatamente)
function startTurn() {
    if (game.isGameOver) return;
    if (turnTimeout) clearTimeout(turnTimeout);

    if (game.isHeroTurn) {
        game.isActionLocked = false;
    }

    updateUI();

    if (game.isHeroTurn) {
        startTimerBar();
        // Mantém a seleção do jogador se ainda for válida; senão, seleção padrão
        if (game.selectedSkill == null || !canAfford(skills[game.selectedSkill])) {
            const defaultSkill = heroData.skills.find(id => canAfford(skills[id]));
            game.selectedSkill = defaultSkill != null ? defaultSkill : null;
        }
        if (game.selectedSkill != null) highlightSelection(game.selectedSkill);
        turnTimeout = setTimeout(executeHeroTurn, TURN_DURATION);
    } else {
        // Inimigo age imediatamente, sem contagem de tempo
        enemyTurn();
    }
}

// Alterna o turno e reinicia o ciclo após uma breve pausa (turnos consecutivos)
function endTurn() {
    if (game.isGameOver) return;
    game.isHeroTurn = !game.isHeroTurn;
    if (turnTimeout) clearTimeout(turnTimeout);
    turnTimeout = setTimeout(startTurn, ACTION_DELAY);
}

// ===== HERO TURN EXECUTION =====
function executeHeroTurn() {
    if (game.isGameOver) return;
    clearSelection();
    game.isActionLocked = true;
    updateUI();

    let skillId = game.selectedSkill;
    let skill = skills[skillId];
    // Fallback: se nada selecionado ou sem PA, usa a primeira skill do herói
    if (!skill || !canAfford(skill)) {
        skillId = heroData.skills[0];
        skill = skills[skillId];
    }

    game.heroPA = Math.min(game.heroMaxPA, Math.max(0, game.heroPA + skill.apChange));

    // Acumula PD se a skill aumentar
    if (skill.pdChange > 0) {
        game.heroPD = (game.heroPD || 0) + skill.pdChange;
        addLog(`${heroData.name} usou ${skill.name} (${heroData.name} +${skill.pdChange} PD)`);
        playSkillAnimation(skill.anim, heroVisual);
        updateUI();
        endTurn();
        return;
    }

    if (skill.effect < 0) {
        const damage = Math.abs(skill.effect) * heroData.PF;
        game.enemyPV = Math.max(0, game.enemyPV - damage);
        addLog(`${heroData.name} usou ${skill.name} (${currentEnemyData.name} -${damage} PV)`);
        playSkillAnimation(skill.anim, enemyVisual);
        playEnemyHitAnimation();

        if (game.enemyPV <= 0) {
            // Aplicar animação de dissolução ao inimigo
            const enemySpriteDom = document.querySelector('.enemy-sprite');
            enemySpriteDom.classList.add('dissolve');
            updateUI();
            if (turnTimeout) clearTimeout(turnTimeout);
            stopTimerBar();
            setTimeout(() => {
                loadNextEnemy();
            }, 300);
            return;
        }
    } else if (skill.effect > 0) {
        const healAmount = Math.min(skill.effect, game.heroMaxPV - game.heroPV);
        game.heroPV = Math.min(game.heroMaxPV, game.heroPV + skill.effect);
        addLog(`${heroData.name} usou ${skill.name} (${heroData.name} +${healAmount} PV)`);
        playSkillAnimation(skill.anim, heroVisual);
    } else {
        const apLabel = skill.apChange > 0 ? `+${skill.apChange}` : `${skill.apChange}`;
        addLog(`${heroData.name} usou ${skill.name} (${heroData.name} ${apLabel} PA)`);
        playSkillAnimation(skill.anim, heroVisual);
    }

    updateUI();
    endTurn();
}

// ===== ENEMY TURN =====
function enemyTurn() {
    if (game.isGameOver) return;

    clearSelection();
    updateActionButtons();
    
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
        addLog(`${currentEnemyData.name} usou ${skill.name} (${heroData.name} ${dmgText}${absorbed} bloqueado)`);
    } else {
        addLog(`${currentEnemyData.name} usou ${skill.name} (${heroData.name} -${finalDamage} PV)`);
    }

    game.heroPV = Math.max(0, game.heroPV - finalDamage);
    playSkillAnimation(skill.anim, heroVisual);
    
    // Animação de tremor do herói quando sofre dano
    const heroSprite = document.querySelector('.hero-sprite');
    heroSprite.classList.add('take-damage');
    setTimeout(() => {
        heroSprite.classList.remove('take-damage');
    }, 500);
    
    if (game.heroPV <= 0) {
        if (turnTimeout) clearTimeout(turnTimeout);
        stopTimerBar();
        setTimeout(() => {
            endGame('defeat');
        }, 300);
    } else {
        endTurn();
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

function playSkillAnimation(animKey, targetVisual) {
    const animData = ANIM_SKILLS_DATA[animKey];
    if (!animData) return;

    const count    = animData.count    || 1;
    const spread   = animData.spread   || 0;
    const duration = animData.duration || 500;

    const rect = targetVisual.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < count; i++) {
        const delay = i * (duration / count / 2);
        const ox = spread ? (Math.random() - 0.5) * spread * 2 : 0;
        const oy = spread ? (Math.random() - 0.5) * spread * 2 : 0;

        const el = document.createElement('div');
        el.className = 'effect-anim';
        el.textContent = animData.sprite;
        el.style.left = (cx + ox) + 'px';
        el.style.top  = (cy + oy) + 'px';
        el.style.animationDelay = delay + 'ms';
        el.style.animation = `${animData.animation} ${duration}ms ease-out ${delay}ms forwards`;
        el.style.opacity = '0';

        document.body.appendChild(el);
        setTimeout(() => { el.remove(); }, duration + delay + 100);
    }
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
