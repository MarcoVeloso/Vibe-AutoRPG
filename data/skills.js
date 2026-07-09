const SKILLS_DATA = {
    1: { name: 'Ataque Básico', effect: -1, apChange:  0, pdChange: 0, anim: 'HIT'    },
    2: { name: 'Escudo Básico', effect:  0, apChange:  1, pdChange: 1, anim: 'SHIELD' },
    3: { name: 'Ataque Duplo',  effect: -2, apChange: -2, pdChange: 0, anim: '2-HIT'  },
    4: { name: 'Magia de Fogo', effect: -3, apChange: -4, pdChange: 0, anim: 'FIRE'   },
    5: { name: 'Determinação',  effect:  1, apChange: -3, pdChange: 0, anim: 'RISE'   },
    6: { name: 'Cura',          effect:  2, apChange: -3, pdChange: 0, anim: 'SPARK'  },
    7: { name: 'Concentração',  effect:  0, apChange:  2, pdChange: 0, anim: 'SPARK'  },
    8: { name: 'Golpe Pesado',  effect: -3, apChange: -4, pdChange: 0, anim: 'SLASH'  },
};


const ANIM_SKILLS_DATA = {
    "SLASH":  { sprite: '🗡️', animation: 'slash-animation',  count: 1, spread:  0, duration:  500 },
    "HIT":    { sprite: '💥', animation: 'hit-animation',    count: 1, spread:  0, duration:  500 },
    "2-HIT":  { sprite: '💥', animation: 'hit-animation',    count: 2, spread: 20, duration:  800 },
    "SHIELD": { sprite: '🛡️', animation: 'shield-animation', count: 1, spread:  0, duration:  800 },
    "SPARK":  { sprite: '✨', animation: 'rain-animation',   count: 3, spread: 10, duration:  800 },
    "RAIN":   { sprite: '💧', animation: 'rain-animation',   count: 9, spread: 20, duration:  800 },
    "FIRE":   { sprite: '🔥', animation: 'fire-animation',   count: 1, spread: 10, duration:  800 },
    "RISE":   { sprite: '🔺', animation: 'rise-animation',   count: 8, spread: 24, duration: 1000 },
};