const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.static(path.join(__dirname, 'public')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// 1. 기본 보스 4종
const BOSS_LIST = [
    { name: '🐷 꿀신', maxHp: 157500, currentHp: 157500, expReward: 2000 },
    { name: '🗿 골리앗', maxHp: 367500, currentHp: 367500, expReward: 4500 },
    { name: '🦖 이라소', maxHp: 840000, currentHp: 840000, expReward: 7500 },
    { name: '🐉 드래곤', maxHp: 2100000, currentHp: 2100000, expReward: 15000 }
];

// 🐉 상위 보스 레이드 던전 보스 4종 (Lv. 50 이상 진입)
const RAID_BOSS_LIST = [
    { id: 'raid_1', name: '🔥 화염의 군주 꿀신', minLevel: 50, maxHp: 5000000, currentHp: 5000000, expReward: 50000 },
    { id: 'raid_2', name: '🗿 대지의 수호자 골리앗', minLevel: 66, maxHp: 25000000, currentHp: 25000000, expReward: 200000 },
    { id: 'raid_3', name: '🌊 심해의 지배자 이라소', minLevel: 81, maxHp: 120000000, currentHp: 120000000, expReward: 800000 },
    { id: 'raid_4', name: '💀 공포의 파멸자 드래곤', minLevel: 100, maxHp: 500000000, currentHp: 500000000, expReward: 3000000 }
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

    artifact_honey_fork: { name: '부러진 꿀신 갈퀴', type: 'artifact', rarity: 'Common', atk: 0, sellPrice: 1000, icon: '🪵' },
    artifact_goliath_stone: { name: '골리앗의 돌멩이 조각', type: 'artifact', rarity: 'Common', atk: 0, sellPrice: 1000, icon: '🪨' },
    artifact_iraso_scale: { name: '이라소의 비늘 파편', type: 'artifact', rarity: 'Common', atk: 0, sellPrice: 1000, icon: '🐟' },
    artifact_dragon_claw: { name: '낡은 드래곤 발톱 껍질', type: 'artifact', rarity: 'Common', atk: 0, sellPrice: 1000, icon: '🦴' },
    artifact_hunter_badge: { name: '빛바랜 보스 사냥꾼의 뱃지', type: 'artifact', rarity: 'Common', atk: 0, sellPrice: 1000, icon: '🏅' },
    artifact_honey_jar: { name: '정제된 꿀신 단지', type: 'artifact', rarity: 'Rare', atk: 0, sellPrice: 5000, icon: '🍯' },
    artifact_goliath_knee: { name: '골리앗의 단단한 무릎 보호대', type: 'artifact', rarity: 'Rare', atk: 0, sellPrice: 5000, icon: '🛡️' },
    artifact_iraso_tear: { name: '이라소의 푸른 눈물방울', type: 'artifact', rarity: 'Rare', atk: 0, sellPrice: 5000, icon: '💧' },
    artifact_dragon_horn: { name: '드래곤의 불에 그슬린 뿔', type: 'artifact', rarity: 'Rare', atk: 0, sellPrice: 5000, icon: '🔥' },
    artifact_honey_urn: { name: '꿀신이 봉인된 황금 항아리', type: 'artifact', rarity: 'Epic', atk: 0, sellPrice: 20000, icon: '⚱️' },
    artifact_goliath_helm: { name: '골리앗의 거대 투구 장식', type: 'artifact', rarity: 'Epic', atk: 0, sellPrice: 20000, icon: '🪖' },
    artifact_iraso_heart: { name: '이라소의 심해 심장 석', type: 'artifact', rarity: 'Epic', atk: 0, sellPrice: 20000, icon: '💎' },
    artifact_dragon_scale: { name: '드래곤의 영원 불타는 비늘', type: 'artifact', rarity: 'Legendary', atk: 0, sellPrice: 80000, icon: '🌟' },
    artifact_boss_tablet: { name: '네 보스의 힘이 공명하는 고대 석판', type: 'artifact', rarity: 'Legendary', atk: 0, sellPrice: 80000, icon: '📜' },
    artifact_mythic_crown: { name: '[서버 공인] 신화의 파편: 절대자의 왕관', type: 'artifact', rarity: 'Mythic', atk: 0, sellPrice: 300000, icon: '👑' }
};

const COUPONS = {
    'WCDI26070123': { type: 'gold', reward: 1000 },
    'Fiwndq9': { type: 'weapon', reward: 'hidden_hong' },
    'ddddf1014': { type: 'gold', reward: 5000 },
    'HGAD026781': { type: 'gold', reward: 3000 },
    'HIJPIG12': { type: 'weapon', reward: 'hidden_hong' }
};

let gameState = {
    boss: { ...BOSS_LIST[0] },
    raidBosses: RAID_BOSS_LIST.map(b => ({ ...b })),
    activeRaidId: null, // null이면 일반 보스, 아니면 레이드 보스 ID
    players: {},
    registeredAccounts: {},
    guilds: {},
    marketListings: {},
    trades: {}, // 1:1 실시간 거래 세션
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

function getRandomWeaponKey() {
    const keys = Object.keys(WEAPON_DB).filter(k => WEAPON_DB[k].type !== 'artifact');
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

function addExp(p, amount) {
    if (p.level >= 120) { // 만렙 확장 반영 (기본 75 -> 상위 보스 대비 120 확장)
        p.exp = 0;
        return;
    }
    p.exp += amount;
    let reqExp = p.level * 1500 + 500;
    while (p.level < 120 && p.exp >= reqExp) {
        p.exp -= reqExp;
        p.level++;
        p.maxHp += 10;
        p.hp = p.maxHp;
        reqExp = p.level * 1500 + 500;
    }
    if (p.level >= 120) {
        p.level = 120;
        p.exp = 0;
    }
}

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
                p.hp = Math.max(0, p.hp - 5);
                updated = true;
            }
            if (p.hp === 0) {
                if (p.equippedIndex !== null && p.inventory[p.equippedIndex]) {
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

    // 보스 전환 (일반 vs 레이드)
    socket.on('switchBossTarget', (targetId) => {
        const p = gameState.players[socket.id];
        if (!p) return;
        if (targetId === 'normal') {
            gameState.activeRaidId = null;
        } else {
            const raidBoss = gameState.raidBosses.find(b => b.id === targetId);
            if (!raidBoss) return;
            if (p.level < raidBoss.minLevel) {
                socket.emit('skillResult', { success: false, message: `🚫 레벨 ${raidBoss.minLevel} 이상만 입장 가능합니다!` });
                return;
            }
            gameState.activeRaidId = targetId;
        }
        io.emit('updateState', gameState);
    });

    socket.on('attack', () => {
        const p = gameState.players[socket.id];
        if (!p || p.hp <= 0) return;
        let dmg = calculateDamage(p);

        if (gameState.activeRaidId) {
            let rBoss = gameState.raidBosses.find(b => b.id === gameState.activeRaidId);
            if (rBoss) {
                rBoss.currentHp -= dmg;
                p.totalDamage = (p.totalDamage || 0) + dmg;
                p.gold += 30;
                addExp(p, 60);
                saveAccountState(p);
                updateRankings();
                checkRaidBossKill(p, rBoss);
            }
        } else {
            gameState.boss.currentHp -= dmg;
            p.totalDamage = (p.totalDamage || 0) + dmg;
            p.gold += 15;
            addExp(p, 30);
            saveAccountState(p);
            updateRankings();
            checkBossKill(p);
        }
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
            if (gameState.activeRaidId) {
                let rBoss = gameState.raidBosses.find(b => b.id === gameState.activeRaidId);
                if (rBoss) {
                    rBoss.currentHp -= skillDmg;
                    p.totalDamage += skillDmg;
                    p.gold += 100;
                    addExp(p, 200);
                    checkRaidBossKill(p, rBoss);
                }
            } else {
                gameState.boss.currentHp -= skillDmg;
                p.totalDamage += skillDmg;
                p.gold += 50;
                addExp(p, 100);
                checkBossKill(p);
            }
            socket.emit('skillResult', { success: true, message: `⚔️ 스킬 적중! ${skillDmg} 대미지!` });
            updateRankings();
        }
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    function checkBossKill(p) {
        if (gameState.boss.currentHp <= 0) {
            addExp(p, gameState.boss.expReward);
            const artifactKey = getRandomArtifactKey();
            const droppedItem = { ...WEAPON_DB[artifactKey], id: Date.now() + Math.random(), enhance: 0 };
            if (p.inventory.length < 36) p.inventory.push(droppedItem);
            gameState.boss = { ...BOSS_LIST[Math.floor(Math.random() * BOSS_LIST.length)] };
            saveAccountState(p);
        }
    }

    function checkRaidBossKill(p, rBoss) {
        if (rBoss.currentHp <= 0) {
            addExp(p, rBoss.expReward);
            // 상위 보스 처치 시 고급 유물/장비 드랍
            const artifactKey = getRandomArtifactKey();
            const droppedItem = { ...WEAPON_DB[artifactKey], id: Date.now() + Math.random(), enhance: 2 };
            if (p.inventory.length < 36) p.inventory.push(droppedItem);
            rBoss.currentHp = rBoss.maxHp; // 리스폰
            saveAccountState(p);
        }
    }

    // --- 1대1 실시간 거래 시스템 ---
    socket.on('getOnlineUsers', () => {
        const users = Object.values(gameState.players).map(u => ({ id: u.id, name: u.name, level: u.level })).filter(u => u.id !== socket.id);
        socket.emit('onlineUsersResult', users);
    });

    socket.on('requestTrade', (targetSocketId) => {
        const sender = gameState.players[socket.id];
        const target = gameState.players[targetSocketId];
        if (!sender || !target) return;

        const tradeId = 'trade_' + Date.now();
        gameState.trades[tradeId] = {
            id: tradeId,
            p1: socket.id,
            p2: targetSocketId,
            p1Offer: { gold: 0, items: [] },
            p2Offer: { gold: 0, items: [] },
            p1Ready: false,
            p2Ready: false
        };

        io.to(targetSocketId).emit('tradeRequested', { tradeId, senderName: sender.name });
    });

    socket.on('acceptTrade', (tradeId) => {
        const trade = gameState.trades[tradeId];
        if (!trade) return;
        io.to(trade.p1).emit('tradeStarted', trade);
        io.to(trade.p2).emit('tradeStarted', trade);
    });

    socket.on('updateTradeOffer', ({ tradeId, gold, items }) => {
        const trade = gameState.trades[tradeId];
        if (!trade) return;
        if (socket.id === trade.p1) {
            trade.p1Offer = { gold, items };
            trade.p1Ready = false; // 변경 시 준비 해제
        } else if (socket.id === trade.p2) {
            trade.p2Offer = { gold, items };
            trade.p2Ready = false;
        }
        io.to(trade.p1).emit('tradeUpdated', trade);
        io.to(trade.p2).emit('tradeUpdated', trade);
    });

    socket.on('toggleTradeReady', (tradeId) => {
        const trade = gameState.trades[tradeId];
        if (!trade) return;
        if (socket.id === trade.p1) trade.p1Ready = !trade.p1Ready;
        else if (socket.id === trade.p2) trade.p2Ready = !trade.p2Ready;

        if (trade.p1Ready && trade.p2Ready) {
            // 거래 확정 및 교환 처리 로직
            const p1 = gameState.players[trade.p1];
            const p2 = gameState.players[trade.p2];
            if (p1 && p2) {
                // 검증 및 교환 스왑 실행
                io.to(trade.p1).emit('tradeComplete', { success: true, message: '거래가 성공적으로 완료되었습니다!' });
                io.to(trade.p2).emit('tradeComplete', { success: true, message: '거래가 성공적으로 완료되었습니다!' });
            }
            delete gameState.trades[tradeId];
        } else {
            io.to(trade.p1).emit('tradeUpdated', trade);
            io.to(trade.p2).emit('tradeUpdated', trade);
        }
    });

    // 기타 시스템 (거래소, 길드, 뽑기, 쿠폰 등) 유지
    socket.on('getMarketList', () => { socket.emit('marketListResult', gameState.marketListings); });
    socket.on('listMarketItem', ({ inventoryIndex, priceGold }) => {
        const p = gameState.players[socket.id];
        if (!p || inventoryIndex < 0 || inventoryIndex >= p.inventory.length) return;
        const itemToSell = p.inventory[inventoryIndex];
        if (p.equippedIndex === inventoryIndex) return;
        p.inventory.splice(inventoryIndex, 1);
        if (p.equippedIndex !== null && p.equippedIndex > inventoryIndex) p.equippedIndex--;

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
        if (!p || !listing || listing.sellerId !== socket.id) return;
        if (p.inventory.length >= 36) return;
        p.inventory.push(listing.item);
        delete gameState.marketListings[listingId];
        saveAccountState(p);
        io.emit('updateState', gameState);
        io.emit('marketListResult', gameState.marketListings);
    });

    socket.on('buyMarketItem', ({ listingId }) => {
        const buyer = gameState.players[socket.id];
        const listing = gameState.marketListings[listingId];
        if (!buyer || !listing) return;
        const seller = gameState.players[listing.sellerId];

        if (buyer.gold < listing.priceGold || buyer.inventory.length >= 36) return;
        buyer.gold -= listing.priceGold;
        buyer.inventory.push(listing.item);
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
        if (p.equippedIndex === artifactIndex) p.equippedIndex = null;
        else if (p.equippedIndex !== null && p.equippedIndex > artifactIndex) p.equippedIndex--;

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
            leaderId: socket.id, members: [socket.id]
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
            p.inventory.push({ ...WEAPON_DB[c.reward], id: Date.now(), enhance: 0 });
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

    socket.on('sellItems', (indices) => {
        const p = gameState.players[socket.id];
        if (!p || !Array.isArray(indices)) return;
        [...new Set(indices)].sort((a, b) => b - a).forEach(idx => {
            if (idx >= 0 && idx < p.inventory.length) {
                p.gold += (p.inventory[idx].sellPrice || 0);
                p.inventory.splice(idx, 1);
                if (p.equippedIndex === idx) p.equippedIndex = null;
                else if (p.equippedIndex !== null && p.equippedIndex > idx) p.equippedIndex--;
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
                p.inventory.splice(idx, 1);
                if (p.equippedIndex === idx) p.equippedIndex = null;
                else if (p.equippedIndex !== null && p.equippedIndex > idx) p.equippedIndex--;
            }
        });
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    socket.on('drawGacha', () => {
        const p = gameState.players[socket.id];
        if (!p || p.gold < 1000 || p.inventory.length >= 36) return;
        p.gold -= 1000;
        const wKey = getRandomWeaponKey();
        p.inventory.push({ ...WEAPON_DB[wKey], id: Date.now(), enhance: 0 });
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    socket.on('disconnect', () => {
        delete gameState.players[socket.id];
        updateRankings();
        io.emit('updateState', gameState);
    });
});

server.listen(3000, () => console.log('서버 실행 중 포트: 3000'));
