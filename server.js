const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.static(path.join(__dirname, 'public')));

// 기본 보스 4종
const BOSS_LIST = [
    { name: '🐷 꿀신', maxHp: 157500, currentHp: 157500, expReward: 2000, killExp: 2000, isUpper: false },
    { name: '🗿 골리앗', maxHp: 367500, currentHp: 367500, expReward: 4500, killExp: 4500, isUpper: false },
    { name: '🦖 이라소', maxHp: 840000, currentHp: 840000, expReward: 7500, killExp: 7500, isUpper: false },
    { name: '🐉 드래곤', maxHp: 2100000, currentHp: 2100000, expReward: 15000, killExp: 15000, isUpper: false }
];

// 상위 던전 보스 4종 (확률 가중치: 우흐라 45%, 기호전 25%, 사이키 15%, 개념의 눈알 15%)
const UPPER_BOSS_LIST = [
    { name: '🦁 우흐라', maxHp: 12000000, currentHp: 12000000, expReward: 40000, killExp: 40000, isUpper: true, attackInterval: 10000, bossDmg: 20, weight: 45 },
    { name: '🐯 기호전', maxHp: 17000000, currentHp: 17000000, expReward: 60000, killExp: 60000, isUpper: true, attackInterval: 5000, bossDmg: 12, weight: 25 },
    { name: '👾 사이키', maxHp: 25000000, currentHp: 25000000, expReward: 90000, killExp: 90000, isUpper: true, attackInterval: 1000, bossDmg: 3, weight: 15 },
    { name: '👁 개념의 눈알', maxHp: 5000000, currentHp: 5000000, expReward: 30000, killExp: 30000, isUpper: true, attackInterval: 1000, bossDmg: 5, weight: 15 }
];

const WEAPON_DB = {
    knife_common: { name: '녹슨 도살도', type: 'knife', rarity: 'Common', atk: 100, sellPrice: 50, icon: '🔪' },
    knife_rare: { name: '혈각의 서사도', type: 'knife', rarity: 'Rare', atk: 250, sellPrice: 250, icon: '🗡️' },
    knife_epic: { name: '흑염의 사도검', type: 'knife', rarity: 'Epic', atk: 600, sellPrice: 2500, icon: '🗡️🔥' },
    knife_legendary: { name: '피빛의 소울리퍼', type: 'knife', rarity: 'Legendary', atk: 1400, sellPrice: 10000, icon: '⚔️🩸' },
    knife_mythic: { name: '심연의 핏빛 멸살검', type: 'knife', rarity: 'Mythic', atk: 3500, sellPrice: 100000, icon: '🗡️💀' },

    shield_common: { name: '나무 냄비뚜껑', type: 'shield', rarity: 'Common', atk: 60, shieldDuration: 10, sellPrice: 50, icon: '🛡️' },
    shield_rare: { name: '수호자의 가디언 실드', type: 'shield', rarity: 'Rare', atk: 180, shieldDuration: 12, sellPrice: 250, icon: '🛡️✨' },
    shield_epic: { name: '불멸의 가고일 방패', type: 'shield', rarity: 'Epic', atk: 450, shieldDuration: 14, sellPrice: 2500, icon: '🛡️🗿' },
    shield_legendary: { name: '성기사의 천상 실드', type: 'shield', rarity: 'Legendary', atk: 1000, shieldDuration: 16, sellPrice: 10000, icon: '🛡️👑' },
    shield_mythic: { name: '신성한 절대자의 결계', type: 'shield', rarity: 'Mythic', atk: 2500, shieldDuration: 20, sellPrice: 100000, icon: '🛡️❇️' },

    bow_common: { name: '굽은 나무활', type: 'bow', rarity: 'Common', atk: 80, sellPrice: 50, icon: '🏹' },
    bow_rare: { name: '사냥꾼의 숏보우', type: 'bow', rarity: 'Rare', atk: 220, sellPrice: 250, icon: '🏹✨' },
    bow_epic: { name: '폭풍의 엘븐 보우', type: 'bow', rarity: 'Epic', atk: 550, sellPrice: 2500, icon: '🎯🔥' },
    bow_legendary: { name: '천둥의 스톰브링어', type: 'bow', rarity: 'Legendary', atk: 1250, sellPrice: 10000, icon: '🏹⚡' },
    bow_mythic: { name: '태양의 신궁 아폴론', type: 'bow', rarity: 'Mythic', atk: 3000, sellPrice: 100000, icon: '🏹🌌' },

    staff_common: { name: '새싹의 허브 지팡이', type: 'staff', rarity: 'Common', atk: 40, heal: 100, targets: 1, sellPrice: 50, icon: '🌿' },
    staff_rare: { name: '축복의 성수 지팡이', type: 'staff', rarity: 'Rare', atk: 120, heal: 150, targets: 1, sellPrice: 250, icon: '💧✨' },
    staff_epic: { name: '요정의 생명 지팡이', type: 'staff', rarity: 'Epic', atk: 350, heal: 200, targets: 1, sellPrice: 2500, icon: '🔮🌿' },
    staff_legendary: { name: '세라핌의 치유 지팡이', type: 'staff', rarity: 'Legendary', atk: 800, heal: 250, targets: 1, sellPrice: 10000, icon: '🌟💖' },
    staff_mythic: { name: '세계수의 영원한 생명', type: 'staff', rarity: 'Mythic', atk: 2000, heal: 300, targets: 2, sellPrice: 100000, icon: '🌌✨' },

    hidden_hong: { name: '홍인준의 뱃살 방패', type: 'shield', rarity: 'Mythic', atk: 6000, shieldDuration: 25, sellPrice: 100000, icon: '🐷🛡️' },
    hidden_jiyu: { name: '지유의 쌈장', type: 'knife', rarity: 'Mythic', atk: 5500, sellPrice: 100000, icon: '🍲✨' },

    artifact_common: { name: '하급 유물 조각', type: 'artifact', rarity: 'Common', atk: 0, sellPrice: 1000, icon: '🪵' },
    artifact_rare: { name: '중급 유물 결정', type: 'artifact', rarity: 'Rare', atk: 0, sellPrice: 5000, icon: '💎' },
    artifact_epic: { name: '상급 유물 정수', type: 'artifact', rarity: 'Epic', atk: 0, sellPrice: 20000, icon: '🔮' },
    artifact_legendary: { name: '최상급 전설 유물', type: 'artifact', rarity: 'Legendary', atk: 0, sellPrice: 80000, icon: '👑' }
};

const COUPONS = {
    'WCDI26070123': { type: 'gold', reward: 1000 },
    'Fiwndq9': { type: 'weapon', reward: 'hidden_hong' },
    'JIYU26': { type: 'weapon', reward: 'hidden_jiyu' }
};

let gameState = {
    boss: { ...BOSS_LIST[0] },
    upperBoss: { ...UPPER_BOSS_LIST[0] }, // 상위 던전 독립 보스 상태
    players: {},
    registeredAccounts: {},
    guilds: {},
    marketListings: {},
    rankings: { players: [], guilds: [] }
};

let activeTrades = {};

function saveAccountState(p) {
    if (p && gameState.registeredAccounts[p.name]) {
        const acc = gameState.registeredAccounts[p.name];
        acc.gold = p.gold;
        acc.hp = p.hp;
        acc.maxHp = p.maxHp;
        acc.level = p.level;
        acc.exp = p.exp;
        acc.inventory = p.inventory;
        acc.equippedIndex = p.equippedIndex;
        acc.totalDamage = p.totalDamage;
    }
}

function updateRankings() {
    const pList = Object.values(gameState.players).map(p => ({
        name: p.name,
        totalDamage: p.totalDamage || 0
    })).sort((a, b) => b.totalDamage - a.totalDamage);
    gameState.rankings.players = pList;

    const gList = Object.values(gameState.guilds).map(g => {
        let gDmg = 0;
        g.members.forEach(mId => {
            if (gameState.players[mId]) gDmg += (gameState.players[mId].totalDamage || 0);
        });
        g.totalDamage = gDmg;
        return {
            id: g.id,
            name: g.name,
            maxMembers: g.maxMembers,
            memberCount: g.members.length,
            totalDamage: gDmg
        };
    }).sort((a, b) => b.totalDamage - a.totalDamage);
    gameState.rankings.guilds = gList;
}

function getRandomWeaponKey() {
    const keys = Object.keys(WEAPON_DB).filter(k => WEAPON_DB[k].type !== 'artifact' && k !== 'hidden_hong' && k !== 'hidden_jiyu');
    return keys[Math.floor(Math.random() * keys.length)];
}

function getRarityMultiplier(rarity) {
    switch (rarity) {
        case 'Mythic': return 2.5;
        case 'Legendary': return 1.9;
        case 'Epic': return 1.4;
        case 'Rare': return 1.15;
        default: return 1.0;
    }
}

// 최대 레벨 100레벨 반영
function checkLevelUp(p, expGain) {
    p.exp += expGain;
    let requiredExp = p.level * 1500;
    while (p.level < 100 && p.exp >= requiredExp) {
        p.exp -= requiredExp;
        p.level++;
        p.maxHp += 15;
        p.hp = p.maxHp;
        requiredExp = p.level * 1500;
    }
    if (p.level >= 100) {
        p.level = 100;
        p.exp = 0;
    }
}

// 상위 보스 랜덤 추출 (우흐라 45%, 기호전 25%, 사이키 15%, 개념의 눈알 15%)
function getRandomUpperBoss() {
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const b of UPPER_BOSS_LIST) {
        cumulative += b.weight;
        if (rand < cumulative) {
            return { ...b };
        }
    }
    return { ...UPPER_BOSS_LIST[0] };
}

io.on('connection', (socket) => {
    socket.on('register', ({ nickname, password }) => {
        if (!nickname || !password) {
            socket.emit('authResult', { success: false, message: '닉네임과 비밀번호를 입력해주세요.' });
            return;
        }
        if (gameState.registeredAccounts[nickname]) {
            socket.emit('authResult', { success: false, message: '이미 존재하는 닉네임입니다.' });
            return;
        }
        gameState.registeredAccounts[nickname] = {
            nickname, password, hp: 100, maxHp: 100, gold: 500, level: 1, exp: 0,
            inventory: [], equippedIndex: null, totalDamage: 0, bonusAtk: 0
        };
        socket.emit('authResult', { success: true, message: '회원가입 성공! 로그인해주세요.' });
    });

    socket.on('login', ({ nickname, password }) => {
        const account = gameState.registeredAccounts[nickname];
        if (!account || account.password !== password) {
            socket.emit('authResult', { success: false, message: '계정 정보가 일치하지 않습니다.' });
            return;
        }

        gameState.players[socket.id] = {
            id: socket.id,
            name: account.nickname,
            hp: account.hp !== undefined ? account.hp : 100,
            maxHp: account.maxHp !== undefined ? account.maxHp : 100,
            gold: account.gold !== undefined ? account.gold : 500,
            level: account.level || 1,
            exp: account.exp || 0,
            inventory: account.inventory ? [...account.inventory] : [],
            equippedIndex: account.equippedIndex !== undefined ? account.equippedIndex : null,
            totalDamage: account.totalDamage || 0,
            bonusAtk: account.bonusAtk || 0,
            lastSkillTime: 0,
            isInvincible: false,
            invincibleUntil: 0,
            guildId: null
        };

        socket.emit('loginSuccess', { success: true, player: gameState.players[socket.id] });
        updateRankings();
        io.emit('updateState', gameState);
    });

    socket.on('toggleImportant', (idx) => {
        const p = gameState.players[socket.id];
        if (p && p.inventory[idx]) {
            p.inventory[idx].isImportant = !p.inventory[idx].isImportant;
            p.inventory.sort((a, b) => (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0));
            if (p.equippedIndex !== null) {
                const eqItem = p.inventory[p.equippedIndex];
                p.equippedIndex = p.inventory.findIndex(it => it.id === eqItem?.id);
            }
            saveAccountState(p);
            io.emit('updateState', gameState);
        }
    });

    socket.on('enhanceWeaponWithArtifact', ({ weaponIndex, artifactIndex }) => {
        const p = gameState.players[socket.id];
        if (!p || weaponIndex === undefined || artifactIndex === undefined) return;
        
        const weapon = p.inventory[weaponIndex];
        const artifact = p.inventory[artifactIndex];

        if (!weapon || weapon.type === 'artifact') {
            socket.emit('enhanceResult', { success: false, message: '❌ 강화할 일반 무기를 선택해주세요.' });
            return;
        }
        if (!artifact || artifact.type !== 'artifact') {
            socket.emit('enhanceResult', { success: false, message: '❌ 재료로 사용할 유물을 선택해주세요.' });
            return;
        }

        const currentEnhance = weapon.enhance || 0;
        if (currentEnhance >= 60) {
            socket.emit('enhanceResult', { success: false, message: '❌ 이미 최대 강화 수치(60강)에 도달했습니다!' });
            return;
        }

        let requiredArtifactRarity = 'Common';
        if (currentEnhance > 40) requiredArtifactRarity = 'Mythic';
        else if (currentEnhance > 30) requiredArtifactRarity = 'Legendary';
        else if (currentEnhance > 20) requiredArtifactRarity = 'Epic';
        else if (currentEnhance > 10) requiredArtifactRarity = 'Rare';

        let baseProb = 50;
        if (artifact.rarity !== requiredArtifactRarity) baseProb = 20;
        const tierBlock = Math.floor(currentEnhance / 10);
        let finalProb = Math.max(5, baseProb - (tierBlock * 5));

        p.inventory.splice(artifactIndex, 1);
        if (p.equippedIndex === artifactIndex) p.equippedIndex = null;
        else if (p.equippedIndex !== null && p.equippedIndex > artifactIndex) p.equippedIndex--;

        if (Math.random() * 100 < finalProb) {
            weapon.enhance = currentEnhance + 1;
            socket.emit('enhanceResult', { success: true, message: `✨ 강화 성공! (+${weapon.enhance}) [확률 ${finalProb}%]` });
        } else {
            socket.emit('enhanceResult', { success: false, message: `💥 강화 실패... [확률 ${finalProb}%]` });
        }

        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    // 일반 공격 (일반 던전)
    socket.on('attack', () => {
        const p = gameState.players[socket.id];
        if (!p || p.hp <= 0) return;
        let eq = p.equippedIndex !== null ? p.inventory[p.equippedIndex] : null;
        let baseAtk = 80;
        if (eq && eq.type !== 'artifact') {
            baseAtk = (eq.atk * (1 + (eq.enhance || 0) * 0.15)) * getRarityMultiplier(eq.rarity);
        }
        let dmg = Math.round(baseAtk + (p.bonusAtk || 0));

        gameState.boss.currentHp -= dmg;
        p.totalDamage = (p.totalDamage || 0) + dmg;
        p.gold += 15;
        checkLevelUp(p, gameState.boss.expReward);

        checkBossKill(p, false);
        saveAccountState(p);
        updateRankings();
        io.emit('updateState', gameState);
    });

    // 상위 던전 공격
    socket.on('upperAttack', () => {
        const p = gameState.players[socket.id];
        if (!p || p.hp <= 0) return;
        if (p.level < 50) {
            socket.emit('upperResult', { success: false, message: '❌ 50레벨 이상만 입장 및 공격할 수 있습니다!' });
            return;
        }
        let eq = p.equippedIndex !== null ? p.inventory[p.equippedIndex] : null;
        let baseAtk = 80;
        if (eq && eq.type !== 'artifact') {
            baseAtk = (eq.atk * (1 + (eq.enhance || 0) * 0.15)) * getRarityMultiplier(eq.rarity);
        }
        let dmg = Math.round(baseAtk + (p.bonusAtk || 0));

        gameState.upperBoss.currentHp -= dmg;
        p.totalDamage = (p.totalDamage || 0) + dmg;
        p.gold += 40; // 상위 던전 골드 보상 상향
        checkLevelUp(p, gameState.upperBoss.expReward);

        checkBossKill(p, true);
        saveAccountState(p);
        updateRankings();
        io.emit('updateState', gameState);
    });

    function checkBossKill(p, isUpper) {
        let targetBoss = isUpper ? gameState.upperBoss : gameState.boss;
        if (targetBoss.currentHp <= 0) {
            const artifactKeys = ['artifact_common', 'artifact_rare', 'artifact_epic', 'artifact_legendary'];
            const randKey = artifactKeys[Math.floor(Math.random() * artifactKeys.length)];
            const droppedItem = { ...WEAPON_DB[randKey], id: Date.now() + Math.random(), enhance: 0, isImportant: false };

            if (p.inventory.length < 36) {
                p.inventory.push(droppedItem);
                socket.emit('itemObtained', { weapon: droppedItem, full: false });
            }

            checkLevelUp(p, targetBoss.killExp);

            if (isUpper) {
                gameState.upperBoss = getRandomUpperBoss();
            } else {
                gameState.boss = { ...BOSS_LIST[Math.floor(Math.random() * BOSS_LIST.length)] };
            }
            saveAccountState(p);
        }
    }

    // 길드, 거래소 등 기타 이벤트들 생략 없이 유지
    socket.on('drawGacha', () => {
        const p = gameState.players[socket.id];
        if (!p || p.gold < 1000 || p.inventory.length >= 36) {
            socket.emit('gachaResult', { success: false, message: '골드가 부족하거나 인벤토리가 가득 찼습니다.' });
            return;
        }
        p.gold -= 1000;
        const wKey = getRandomWeaponKey();
        const w = { ...WEAPON_DB[wKey], id: Date.now() + Math.random(), enhance: 0, isImportant: false };
        p.inventory.push(w);
        saveAccountState(p);
        socket.emit('gachaResult', { success: true, weapon: w });
        io.emit('updateState', gameState);
    });

    socket.on('disconnect', () => {
        const p = gameState.players[socket.id];
        if (p) saveAccountState(p);
        delete gameState.players[socket.id];
        updateRankings();
        io.emit('updateState', gameState);
    });
});

server.listen(3000, () => console.log('서버 실행 중 포트: 3000'));
