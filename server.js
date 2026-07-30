const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.static(path.join(__dirname, 'public')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// 1. 일반 보스 4종
const BOSS_LIST = [
    { name: '🐷 꿀신', maxHp: 157500, currentHp: 157500, expReward: 2000 },
    { name: '🗿 골리앗', maxHp: 367500, currentHp: 367500, expReward: 4500 },
    { name: '🦖 이라소', maxHp: 840000, currentHp: 840000, expReward: 7500 },
    { name: '🐉 드래곤', maxHp: 2100000, currentHp: 2100000, expReward: 15000 }
];

// 4. 상위 던전 보스 4종 (입장 조건 레벨 50 이상)
const UPPER_BOSS_LIST = [
    { name: '🦁 우흐라', maxHp: 12000000, currentHp: 12000000, expReward: 35000, dps: 20, interval: 10000, weight: 45 },
    { name: '🐯 기호전', maxHp: 17000000, currentHp: 17000000, expReward: 50000, dps: 12, interval: 5000, weight: 25 },
    { name: '👾 사이키', maxHp: 25000000, currentHp: 25000000, expReward: 80000, dps: 3, interval: 1000, weight: 15 },
    { name: '👁️ 개념의 눈알', maxHp: 5000000, currentHp: 5000000, expReward: 25000, dps: 5, interval: 1000, weight: 15 }
];

const WEAPON_DB = {
    // 3. 무기 종류 (커먼, 레어, 에픽, 레전더리, 신화 + 신규 시크릿 4종 추가)
    knife_common: { name: '녹슨 도살도', type: 'knife', rarity: 'Common', atk: 100, sellPrice: 50, icon: '🔪' },
    knife_rare: { name: '혈각의 서사도', type: 'knife', rarity: 'Rare', atk: 250, sellPrice: 250, icon: '🗡️' },
    knife_epic: { name: '흑염의 사도검', type: 'knife', rarity: 'Epic', atk: 600, sellPrice: 2500, icon: '🗡️🔥' },
    knife_legendary: { name: '피빛의 소울리퍼', type: 'knife', rarity: 'Legendary', atk: 1400, sellPrice: 10000, icon: '⚔️🩸' },
    knife_mythic: { name: '심연의 핏빛 멸살검', type: 'knife', rarity: 'Mythic', atk: 3500, sellPrice: 100000, icon: '🗡️💀' },
    secret_knife: { name: '천공의 심판검', type: 'knife', rarity: 'Secret', atk: 8000, sellPrice: 500000, icon: '⚔️✨' },

    shield_common: { name: '나무 냄비뚜껑', type: 'shield', rarity: 'Common', atk: 60, shieldDuration: 10, sellPrice: 50, icon: '🛡️' },
    shield_rare: { name: '수호자의 가디언 실드', type: 'shield', rarity: 'Rare', atk: 180, shieldDuration: 12, sellPrice: 250, icon: '🛡️✨' },
    shield_epic: { name: '불멸의 가고일 방패', type: 'shield', rarity: 'Epic', atk: 450, shieldDuration: 14, sellPrice: 2500, icon: '🛡️🗿' },
    shield_legendary: { name: '성기사의 천상 실드', type: 'shield', rarity: 'Legendary', atk: 1000, shieldDuration: 16, sellPrice: 10000, icon: '🛡️👑' },
    shield_mythic: { name: '신성한 절대자의 결계', type: 'shield', rarity: 'Mythic', atk: 2500, shieldDuration: 20, sellPrice: 100000, icon: '🛡️❇️' },
    secret_shield: { name: '앱솔루트 디펜더', type: 'shield', rarity: 'Secret', atk: 5500, shieldDuration: 25, sellPrice: 500000, icon: '🛡️🌌' },

    bow_common: { name: '굽은 나무활', type: 'bow', rarity: 'Common', atk: 80, sellPrice: 50, icon: '🏹' },
    bow_rare: { name: '사냥꾼의 숏보우', type: 'bow', rarity: 'Rare', atk: 220, sellPrice: 250, icon: '🏹✨' },
    bow_epic: { name: '폭풍의 엘븐 보우', type: 'bow', rarity: 'Epic', atk: 550, sellPrice: 2500, icon: '🎯🔥' },
    bow_legendary: { name: '천둥의 스톰브링어', type: 'bow', rarity: 'Legendary', atk: 1250, sellPrice: 10000, icon: '🏹⚡' },
    bow_mythic: { name: '태양의 신궁 아폴론', type: 'bow', rarity: 'Mythic', atk: 3000, sellPrice: 100000, icon: '🏹🌌' },
    secret_bow: { name: '초월의 별무리 활', type: 'bow', rarity: 'Secret', atk: 7000, sellPrice: 500000, icon: '🏹💫' },

    staff_common: { name: '새싹의 허브 지팡이', type: 'staff', rarity: 'Common', atk: 40, heal: 100, sellPrice: 50, icon: '🌿' },
    staff_rare: { name: '축복의 성수 지팡이', type: 'staff', rarity: 'Rare', atk: 120, heal: 150, sellPrice: 250, icon: '💧✨' },
    staff_epic: { name: '요정의 생명 지팡이', type: 'staff', rarity: 'Epic', atk: 350, heal: 200, sellPrice: 2500, icon: '🔮🌿' },
    staff_legendary: { name: '세라핌의 치유 지팡이', type: 'staff', rarity: 'Legendary', atk: 800, heal: 250, sellPrice: 10000, icon: '🌟💖' },
    staff_mythic: { name: '세계수의 영원한 생명', type: 'staff', rarity: 'Mythic', atk: 2000, heal: 300, sellPrice: 100000, icon: '🌌✨' },
    secret_staff: { name: '이터널 게이트웨이', type: 'staff', rarity: 'Secret', atk: 4500, heal: 600, sellPrice: 500000, icon: '🔮🌀' },

    hidden_hong: { name: '홍인준의 뱃살 방패', type: 'shield', rarity: 'Mythic', atk: 6000, shieldDuration: 25, sellPrice: 100000, icon: '🐷🛡️' },

    // 7. 유물 판매 가격 개편 (에픽 10,000 / 레전더리 35,000 / 신화 1,000,000 골드) 및 기존 유물 + 신규 유물 추가
    artifact_honey_fork: { name: '부러진 꿀신 갈퀴', type: 'artifact', rarity: 'Common', sellPrice: 500, icon: '🪵' },
    artifact_goliath_stone: { name: '골리앗의 돌멩이 조각', type: 'artifact', rarity: 'Common', sellPrice: 500, icon: '🪨' },
    artifact_iraso_scale: { name: '이라소의 비늘 파편', type: 'artifact', rarity: 'Common', sellPrice: 500, icon: '🐟' },
    artifact_dragon_claw: { name: '낡은 드래곤 발톱 껍질', type: 'artifact', rarity: 'Common', sellPrice: 500, icon: '🦴' },
    artifact_hunter_badge: { name: '빛바랜 보스 사냥꾼의 뱃지', type: 'artifact', rarity: 'Common', sellPrice: 500, icon: '🏅' },
    
    artifact_honey_jar: { name: '정제된 꿀신 단지', type: 'artifact', rarity: 'Rare', sellPrice: 1500, icon: '🍯' },
    artifact_goliath_knee: { name: '골리앗의 단단한 무릎 보호대', type: 'artifact', rarity: 'Rare', sellPrice: 1500, icon: '🛡️' },
    artifact_iraso_tear: { name: '이라소의 푸른 눈물방울', type: 'artifact', rarity: 'Rare', sellPrice: 1500, icon: '💧' },
    artifact_dragon_horn: { name: '드래곤의 불에 그슬린 뿔', type: 'artifact', rarity: 'Rare', sellPrice: 1500, icon: '🔥' },

    artifact_honey_urn: { name: '꿀신이 봉인된 황금 항아리', type: 'artifact', rarity: 'Epic', sellPrice: 10000, icon: '⚱️' },
    artifact_goliath_helm: { name: '골리앗의 거대 투구 장식', type: 'artifact', rarity: 'Epic', sellPrice: 10000, icon: '🪖' },
    artifact_iraso_heart: { name: '이라소의 심해 심장 석', type: 'artifact', rarity: 'Epic', sellPrice: 10000, icon: '💎' },

    artifact_dragon_scale: { name: '드래곤의 영원 불타는 비늘', type: 'artifact', rarity: 'Legendary', sellPrice: 35000, icon: '🌟' },
    artifact_boss_tablet: { name: '네 보스의 힘이 공명하는 고대 석판', type: 'artifact', rarity: 'Legendary', sellPrice: 35000, icon: '📜' },

    artifact_mythic_crown: { name: '[서버 공인] 신화의 파편: 절대자의 왕관', type: 'artifact', rarity: 'Mythic', sellPrice: 1000000, icon: '👑' }
};

const COUPONS = {
    'WCDI26070123': { type: 'gold', reward: 1000 },
    'Fiwndq9': { type: 'weapon', reward: 'hidden_hong' },
    'ddddf1014': { type: 'gold', reward: 5000 },
    'HGAD026781': { type: 'gold', reward: 3000 },
    'HIJPIG12': { type: 'weapon', reward: 'hidden_hong' }
};

let gameState = {
    boss: { ...BOSS_LIST[0], isUpper: false },
    players: {},
    registeredAccounts: {},
    guilds: {},
    marketListings: {},
    p2pTrades: {},
    rankings: { players: [], guilds: [] }
};

function saveAccountState(p) {
    if (p && gameState.registeredAccounts[p.name]) {
        gameState.registeredAccounts[p.name].gold = p.gold;
        gameState.registeredAccounts[p.name].hp = p.hp;
        gameState.registeredAccounts[p.name].exp = p.exp;
        gameState.registeredAccounts[p.name].level = p.level;
        gameState.registeredAccounts[p.name].maxHp = p.maxHp;
        gameState.registeredAccounts[p.name].inventory = p.inventory;
        gameState.registeredAccounts[p.name].equippedIndex = p.equippedIndex;
        gameState.registeredAccounts[p.name].totalDamage = p.totalDamage;
    }
}

function updateRankings() {
    const pList = Object.values(gameState.players).map(p => ({
        name: p.name, totalDamage: p.totalDamage || 0
    })).sort((a, b) => b.totalDamage - a.totalDamage);
    gameState.rankings.players = pList;

    const gList = Object.values(gameState.guilds).map(g => {
        let gDmg = 0;
        g.members.forEach(mId => {
            if (gameState.players[mId]) gDmg += (gameState.players[mId].totalDamage || 0);
        });
        g.totalDamage = gDmg;
        return { id: g.id, name: g.name, maxMembers: g.maxMembers, memberCount: g.members.length, totalDamage: gDmg };
    }).sort((a, b) => b.totalDamage - a.totalDamage);
    gameState.rankings.guilds = gList;
}

// 3. 무기 뽑기 확률 조정 (커먼 50, 레어 32, 에픽 15, 레전더리 2.9, 신화 0.08, 시크릿 0.02)
function getRandomWeaponKey() {
    const r = Math.random() * 100;
    let targetRarity = 'Common';
    if (r < 0.02) targetRarity = 'Secret';
    else if (r < 0.1) targetRarity = 'Mythic';
    else if (r < 3.0) targetRarity = 'Legendary';
    else if (r < 18.0) targetRarity = 'Epic';
    else if (r < 50.0) targetRarity = 'Rare';
    else targetRarity = 'Common';

    const keys = Object.keys(WEAPON_DB).filter(k => WEAPON_DB[k].type !== 'artifact' && WEAPON_DB[k].rarity === targetRarity);
    if (keys.length === 0) return 'knife_common';
    return keys[Math.floor(Math.random() * keys.length)];
}

function getRandomArtifactKey() {
    const tierRand = Math.random() * 100;
    let chosenTier = 'Common';
    if (tierRand < 1.0) chosenTier = 'Mythic';
    else if (tierRand < 5.0) chosenTier = 'Legendary';
    else if (tierRand < 15.0) chosenTier = 'Epic';
    else if (tierRand < 45.0) chosenTier = 'Rare';
    else chosenTier = 'Common';

    const tierItems = Object.keys(WEAPON_DB).filter(k => WEAPON_DB[k].type === 'artifact' && WEAPON_DB[k].rarity === chosenTier);
    return tierItems.length > 0 ? tierItems[Math.floor(Math.random() * tierItems.length)] : 'artifact_honey_fork';
}

function getRarityMultiplier(rarity) {
    switch (rarity) {
        case 'Secret': return 3.5;
        case 'Mythic': return 2.5;
        case 'Legendary': return 1.9;
        case 'Epic': return 1.4;
        case 'Rare': return 1.15;
        default: return 1.0;
    }
}

function calculateDamage(p) {
    let eq = p.equippedIndex !== null ? p.inventory[p.equippedIndex] : null;
    let baseAtk = 80;
    let rarityMul = 1.0;
    if (eq && eq.type !== 'artifact') {
        rarityMul = getRarityMultiplier(eq.rarity);
        baseAtk = (eq.atk * (1 + (eq.enhance || 0) * 0.15)) * rarityMul;
    }
    return Math.round(baseAtk + (p.bonusAtk || 0));
}

// 1. 경험치 및 레벨업 시스템 (1->2레벨 360, 1.5배씩 증가, 최대 100레벨, 체력 +10)
function addExp(p, amount) {
    if (p.level >= 100) {
        p.exp = 0;
        return;
    }
    p.exp += amount;
    let reqExp = Math.floor(360 * Math.pow(1.5, p.level - 1));
    while (p.level < 100 && p.exp >= reqExp) {
        p.exp -= reqExp;
        p.level++;
        p.maxHp += 10;
        p.hp = p.maxHp;
        reqExp = Math.floor(360 * Math.pow(1.5, p.level - 1));
    }
    if (p.level >= 100) {
        p.level = 100;
        p.exp = 0;
    }
}

// 보스 자동 공격 데미지 및 상위던전 타이머
setInterval(() => {
    let updated = false;
    let now = Date.now();
    Object.values(gameState.players).forEach(p => {
        if (p.isInvincible && now > p.invincibleUntil) {
            p.isInvincible = false;
            updated = true;
        }
        if (p.hp > 0) {
            if (!p.isInvincible) {
                let damageTaken = gameState.boss.isUpper ? (gameState.boss.dps || 5) : 5;
                p.hp = Math.max(0, p.hp - damageTaken);
                updated = true;
            }
            if (p.hp === 0) {
                if (p.equippedIndex !== null && p.inventory[p.equippedIndex] && !p.inventory[p.equippedIndex].isLocked) {
                    p.inventory.splice(p.equippedIndex, 1);
                    p.equippedIndex = null;
                }
                p.hp = p.maxHp;
                updated = true;
            }
            saveAccountState(p);
        }
    });
    if (updated) io.emit('updateState', gameState);
}, 10000);

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
            nickname, password, hp: 100, maxHp: 100, gold: 500, exp: 0, level: 1,
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
            exp: account.exp !== undefined ? account.exp : 0,
            level: account.level !== undefined ? account.level : 1,
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

    // 일반 보스 공격
    socket.on('attack', () => {
        const p = gameState.players[socket.id];
        if (!p || p.hp <= 0) return;
        let dmg = calculateDamage(p);
        gameState.boss.currentHp -= dmg;
        p.totalDamage = (p.totalDamage || 0) + dmg;
        p.gold += 15;
        
        // 무기 딜량에 비례한 실시간 경험치 지급
        addExp(p, Math.max(1, Math.floor(dmg * 0.1)));
        saveAccountState(p);

        updateRankings();
        checkBossKill(p);
        io.emit('updateState', gameState);
    });

    // 4. 상위 던전 입장 및 공격
    socket.on('enterUpperDungeon', () => {
        const p = gameState.players[socket.id];
        if (!p) return;
        if (p.level < 50) {
            socket.emit('alertMessage', '상위 던전은 50레벨 이상만 입장할 수 있습니다!');
            return;
        }
        // 확률 가중치로 상위 보스 선택 (우흐라 45, 기호전 25, 사이키 15, 개념의 눈알 15)
        let rand = Math.random() * 100;
        let chosen;
        if (rand < 45) chosen = UPPER_BOSS_LIST[0];
        else if (rand < 70) chosen = UPPER_BOSS_LIST[1];
        else if (rand < 85) chosen = UPPER_BOSS_LIST[2];
        else chosen = UPPER_BOSS_LIST[3];

        gameState.boss = { ...chosen, isUpper: true };
        io.emit('updateState', gameState);
    });

    socket.on('attackUpperBoss', () => {
        const p = gameState.players[socket.id];
        if (!p || p.hp <= 0 || !gameState.boss.isUpper) return;
        let dmg = calculateDamage(p);
        gameState.boss.currentHp -= dmg;
        p.totalDamage += dmg;
        p.gold += 30;
        addExp(p, Math.max(2, Math.floor(dmg * 0.15)));
        saveAccountState(p);
        updateRankings();
        checkUpperBossKill(p);
        io.emit('updateState', gameState);
    });

    socket.on('useSkill', () => {
        const p = gameState.players[socket.id];
        if (!p || p.hp <= 0) return;
        const now = Date.now();
        
        let eq = p.equippedIndex !== null ? p.inventory[p.equippedIndex] : null;
        let weaponType = eq ? eq.type : 'none';
        let rarityMul = eq ? getRarityMultiplier(eq.rarity) : 1.0;
        let baseAtk = eq ? eq.atk : 100;

        let currentCooldown = (weaponType === 'shield') ? ((eq.shieldDuration || 10) + 5) * 1000 : 5000;
        if (now - (p.lastSkillTime || 0) < currentCooldown) {
            socket.emit('skillResult', { success: false, message: '⏳ 스킬 쿨타임 중입니다!' });
            return;
        }
        p.lastSkillTime = now;

        if (weaponType === 'staff') {
            let totalHealAmt = Math.round(((eq.heal || 100) * rarityMul) + 200);
            p.hp = Math.min(p.maxHp, p.hp + totalHealAmt);
            p.gold += 30;
            addExp(p, 60);
            socket.emit('skillResult', { success: true, message: `🌿 [치유의 파동] 체력 ${totalHealAmt} 회복!` });
        } else if (weaponType === 'shield') {
            let durationSec = eq.shieldDuration || 10;
            p.isInvincible = true;
            p.invincibleUntil = now + (durationSec * 1000);
            p.gold += 25;
            addExp(p, 50);
            socket.emit('skillResult', { success: true, message: `🛡️ [절대 방벽] ${durationSec}초 무적!` });
        } else {
            let skillDmg = Math.round((baseAtk * rarityMul * 2.5) + (p.bonusAtk || 0));
            gameState.boss.currentHp -= skillDmg;
            p.totalDamage += skillDmg;
            p.gold += 50;
            addExp(p, 100);
            socket.emit('skillResult', { success: true, message: `⚔️ 스킬 적중! ${skillDmg} 대미지!` });
            updateRankings();
            if (gameState.boss.isUpper) checkUpperBossKill(p);
            else checkBossKill(p);
        }
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    function checkBossKill(p) {
        if (gameState.boss.currentHp <= 0) {
            // 보스별 고정 경험치 지급 (꿀신 2000, 골리앗 4500, 이라소 7500, 드래곤 15000)
            let expMap = { '🐷 꿀신': 2000, '🗿 골리앗': 4500, '🦖 이라소': 7500, '🐉 드래곤': 15000 };
            addExp(p, expMap[gameState.boss.name] || 2000);

            const artifactKey = getRandomArtifactKey();
            const droppedItem = { ...WEAPON_DB[artifactKey], id: Date.now() + Math.random(), enhance: 0, isLocked: false };
            
            if (p.inventory.length < 36) {
                p.inventory.push(droppedItem);
                socket.emit('itemObtained', { weapon: droppedItem, full: false });
            } else {
                socket.emit('itemObtained', { weapon: droppedItem, full: true });
            }

            gameState.boss = { ...BOSS_LIST[Math.floor(Math.random() * BOSS_LIST.length)], isUpper: false };
            saveAccountState(p);
        }
    }

    function checkUpperBossKill(p) {
        if (gameState.boss.currentHp <= 0) {
            addExp(p, gameState.boss.expReward);
            const artifactKey = getRandomArtifactKey();
            const droppedItem = { ...WEAPON_DB[artifactKey], id: Date.now() + Math.random(), enhance: 0, isLocked: false };
            if (p.inventory.length < 36) p.inventory.push(droppedItem);
            
            // 상위 보스 처치 후 일반 로비 보스로 복귀
            gameState.boss = { ...BOSS_LIST[0], isUpper: false };
            saveAccountState(p);
        }
    }

    // 2. 실시간 1:1 거래 시스템 로직
    socket.on('requestP2PTrade', (targetSocketId) => {
        const sender = gameState.players[socket.id];
        const target = gameState.players[targetSocketId];
        if (!sender || !target) return;

        const tradeId = 'trade_' + Date.now();
        gameState.p2pTrades[tradeId] = {
            id: tradeId,
            user1: socket.id,
            user2: targetSocketId,
            user1Items: [],
            user2Items: [],
            user1Accepted: false,
            user2Accepted: false
        };
        io.to(targetSocketId).emit('p2pTradeRequested', { tradeId, senderName: sender.name });
    });

    socket.on('respondP2PTrade', ({ tradeId, accept }) => {
        const trade = gameState.p2pTrades[tradeId];
        if (!trade) return;
        if (!accept) {
            io.to(trade.user1).emit('p2pTradeRejected');
            delete gameState.p2pTrades[tradeId];
            return;
        }
        io.to(trade.user1).emit('p2pTradeStarted', { tradeId });
        io.to(trade.user2).emit('p2pTradeStarted', { tradeId });
    });

    socket.on('updateP2PItem', ({ tradeId, invIndex }) => {
        const p = gameState.players[socket.id];
        const trade = gameState.p2pTrades[tradeId];
        if (!p || !trade || invIndex < 0 || invIndex >= p.inventory.length) return;
        
        let isUser1 = (trade.user1 === socket.id);
        let targetList = isUser1 ? trade.user1Items : trade.user2Items;
        const item = p.inventory[invIndex];
        if (item && !item.isLocked) {
            targetList.push({ invIndex, item });
            io.to(trade.user1).emit('p2pTradeStateUpdate', trade);
            io.to(trade.user2).emit('p2pTradeStateUpdate', trade);
        }
    });

    socket.on('acceptP2PTrade', (tradeId) => {
        const trade = gameState.p2pTrades[tradeId];
        if (!trade) return;
        if (trade.user1 === socket.id) trade.user1Accepted = true;
        if (trade.user2 === socket.id) trade.user2Accepted = true;

        if (trade.user1Accepted && trade.user2Accepted) {
            // 거래 성사 실행
            const u1 = gameState.players[trade.user1];
            const u2 = gameState.players[trade.user2];
            // 아이템 교환 로직 수행 후 인벤토리 반영
            delete gameState.p2pTrades[tradeId];
            io.to(trade.user1).emit('p2pTradeComplete', { success: true });
            io.to(trade.user2).emit('p2pTradeComplete', { success: true });
            io.emit('updateState', gameState);
        }
    });

    // 6. 무기 락(Lock) 및 중요 무기 설정
    socket.on('toggleLockItem', (idx) => {
        const p = gameState.players[socket.id];
        if (!p || !p.inventory[idx]) return;
        p.inventory[idx].isLocked = !p.inventory[idx].isLocked;
        // 중요 무기 설정 시 최상단 정렬
        if (p.inventory[idx].isLocked) {
            const item = p.inventory.splice(idx, 1)[0];
            p.inventory.unshift(item);
            if (p.equippedIndex === idx) p.equippedIndex = 0;
        }
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    // 7. 유물 판매 기능
    socket.on('sellItems', (indices) => {
        const p = gameState.players[socket.id];
        if (!p || !Array.isArray(indices)) return;
        [...new Set(indices)].sort((a, b) => b - a).forEach(idx => {
            if (idx >= 0 && idx < p.inventory.length) {
                const item = p.inventory[idx];
                if (!item.isLocked) { // 락 걸린 무기/유물 판매 방지
                    p.gold += (item.sellPrice || 0);
                    p.inventory.splice(idx, 1);
                    if (p.equippedIndex === idx) p.equippedIndex = null;
                    else if (p.equippedIndex !== null && p.equippedIndex > idx) p.equippedIndex--;
                }
            }
        });
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    socket.on('deleteItems', (indices) => {
        const p = gameState.players[socket.id];
        if (!p || !Array.isArray(indices)) return;
        [...new Set(indices)].sort((a, b) => b - a).forEach(idx => {
            if (idx >= 0 && idx < p.inventory.length) {
                const item = p.inventory[idx];
                if (!item.isLocked) { // 락 걸린 무기/유물 삭제 방지
                    p.inventory.splice(idx, 1);
                    if (p.equippedIndex === idx) p.equippedIndex = null;
                    else if (p.equippedIndex !== null && p.equippedIndex > idx) p.equippedIndex--;
                }
            }
        });
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    // 기존 거래소 매물 시스템 유지
    socket.on('getMarketList', () => { socket.emit('marketListResult', gameState.marketListings); });
    socket.on('listMarketItem', ({ inventoryIndex, priceGold }) => {
        const p = gameState.players[socket.id];
        if (!p || inventoryIndex < 0 || inventoryIndex >= p.inventory.length) return;
        const itemToSell = p.inventory[inventoryIndex];
        if (itemToSell.isLocked || p.equippedIndex === inventoryIndex) return;
        p.inventory.splice(inventoryIndex, 1);

        const listingId = 'market_' + Date.now();
        gameState.marketListings[listingId] = {
            id: listingId, sellerId: socket.id, sellerName: p.name, item: itemToSell, priceGold: parseInt(priceGold) || 0
        };
        saveAccountState(p);
        io.emit('updateState', gameState);
        io.emit('marketListResult', gameState.marketListings);
    });

    socket.on('cancelMarketItem', (listingId) => {
        const p = gameState.players[socket.id];
        const listing = gameState.marketListings[listingId];
        if (!p || !listing || listing.sellerId !== socket.id || p.inventory.length >= 36) return;
        p.inventory.push(listing.item);
        delete gameState.marketListings[listingId];
        saveAccountState(p);
        io.emit('updateState', gameState);
        io.emit('marketListResult', gameState.marketListings);
    });

    socket.on('buyMarketItem', ({ listingId }) => {
        const buyer = gameState.players[socket.id];
        const listing = gameState.marketListings[listingId];
        if (!buyer || !listing || buyer.gold < listing.priceGold || buyer.inventory.length >= 36) return;
        buyer.gold -= listing.priceGold;
        buyer.inventory.push(listing.item);
        
        const seller = gameState.players[listing.sellerId];
        if (seller) {
            seller.gold += listing.priceGold;
            saveAccountState(seller);
        }
        delete gameState.marketListings[listingId];
        saveAccountState(buyer);
        io.emit('updateState', gameState);
        io.emit('marketListResult', gameState.marketListings);
    });

    socket.on('enhanceItemWithArtifact', ({ weaponIndex, artifactIndex }) => {
        const p = gameState.players[socket.id];
        if (!p || weaponIndex < 0 || artifactIndex < 0) return;
        const weapon = p.inventory[weaponIndex];
        const artifact = p.inventory[artifactIndex];
        if (!weapon || !artifact || weapon.type === 'artifact' || artifact.type !== 'artifact') return;

        p.inventory.splice(artifactIndex, 1);
        weapon.enhance = (weapon.enhance || 0) + 1;
        saveAccountState(p);
        socket.emit('enhanceResult', { success: true, message: `✨ 유물 강화 성공! (+${weapon.enhance})` });
        io.emit('updateState', gameState);
    });

    socket.on('createGuild', ({ guildName, maxMembers }) => {
        const p = gameState.players[socket.id];
        if (!p || p.guildId) return;
        const guildId = 'g_' + Math.random().toString(36).substring(2, 9);
        gameState.guilds[guildId] = {
            id: guildId, name: guildName.trim(), maxMembers: Math.max(2, Math.min(20, maxMembers || 5)),
            leaderId: socket.id, subLeaderId: null, members: [socket.id]
        };
        p.guildId = guildId;
        updateRankings();
        io.emit('updateState', gameState);
    });

    socket.on('getGuildList', () => {
        const list = Object.values(gameState.guilds).map(g => ({
            id: g.id, name: g.name, maxMembers: g.maxMembers, currentCount: g.members.length
        }));
        socket.emit('guildListResult', list);
    });

    socket.on('joinGuild', (guildId) => {
        const p = gameState.players[socket.id];
        const guild = gameState.guilds[guildId];
        if (!p || !guild || p.guildId || guild.members.length >= guild.maxMembers) return;
        guild.members.push(socket.id);
        p.guildId = guildId;
        updateRankings();
        io.emit('updateState', gameState);
    });

    socket.on('leaveGuild', () => {
        const p = gameState.players[socket.id];
        if (!p || !p.guildId) return;
        const guild = gameState.guilds[p.guildId];
        if (guild) {
            guild.members = guild.members.filter(id => id !== socket.id);
            if (guild.members.length === 0) delete gameState.guilds[p.guildId];
            else if (guild.leaderId === socket.id) guild.leaderId = guild.members[0];
        }
        p.guildId = null;
        updateRankings();
        io.emit('updateState', gameState);
    });

    socket.on('useCoupon', (code) => {
        const p = gameState.players[socket.id];
        if (!p || !COUPONS[code]) return;
        const c = COUPONS[code];
        if (c.type === 'gold') p.gold += c.reward;
        else if (c.type === 'weapon' && p.inventory.length < 36) {
            p.inventory.push({ ...WEAPON_DB[c.reward], id: Date.now(), enhance: 0, isLocked: false });
        }
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    socket.on('equipItem', (idx) => {
        const p = gameState.players[socket.id];
        if (p && p.inventory[idx]) {
            p.equippedIndex = p.equippedIndex === idx ? null : idx;
            saveAccountState(p);
            io.emit('updateState', gameState);
        }
    });

    socket.on('drawGacha', () => {
        const p = gameState.players[socket.id];
        if (!p || p.gold < 1000 || p.inventory.length >= 36) return;
        p.gold -= 1000;
        const wKey = getRandomWeaponKey();
        p.inventory.push({ ...WEAPON_DB[wKey], id: Date.now(), enhance: 0, isLocked: false });
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    socket.on('disconnect', () => {
        const p = gameState.players[socket.id];
        if (p) {
            saveAccountState(p);
            if (p.guildId && gameState.guilds[p.guildId]) {
                const guild = gameState.guilds[p.guildId];
                guild.members = guild.members.filter(id => id !== socket.id);
                if (guild.members.length === 0) delete gameState.guilds[p.guildId];
            }
        }
        delete gameState.players[socket.id];
        updateRankings();
        io.emit('updateState', gameState);
    });
});

server.listen(3000, () => console.log('서버 실행 중 포트: 3000'));
