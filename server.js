const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.static(path.join(__dirname, 'public')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// 💡 보스 처치 시 지급되는 경험치 대폭 상향 반영
const BOSS_LIST = [
    { name: '🐷 꿀신', maxHp: 157500, currentHp: 157500, expReward: 2000 },
    { name: '🗿 골리앗', maxHp: 367500, currentHp: 367500, expReward: 4500 },
    { name: '🦖 이라소', maxHp: 840000, currentHp: 840000, expReward: 7500 },
    { name: '🐉 드래곤', maxHp: 2100000, currentHp: 2100000, expReward: 15000 }
];

const UPPER_BOSS_LIST = [
    { name: '🦁 우흐라', maxHp: 12000000, currentHp: 12000000, expReward: 80000, dps: 20, interval: 10 },
    { name: '🐯 기호전', maxHp: 17000000, currentHp: 17000000, expReward: 130000, dps: 12, interval: 5 },
    { name: '👾 사이키', maxHp: 25000000, currentHp: 25000000, expReward: 200000, dps: 3, interval: 1 },
    { name: '👁️ 개념의 눈알', maxHp: 50000000, currentHp: 50000000, expReward: 400000, dps: 5, interval: 1 }
];

const WEAPON_DB = {
    knife_common: { name: '녹슨 도살도', type: 'knife', rarity: 'Common', atk: 100, sellPrice: 50, icon: '🔪' },
    shield_common: { name: '나무 냄비뚜껑', type: 'shield', rarity: 'Common', atk: 60, shieldDuration: 10, sellPrice: 50, icon: '🛡️' },
    bow_common: { name: '굽은 나무활', type: 'bow', rarity: 'Common', atk: 80, sellPrice: 50, icon: '🏹' },
    staff_common: { name: '새싹의 허브 지팡이', type: 'staff', rarity: 'Common', atk: 40, heal: 100, sellPrice: 50, icon: '🌿' },

    knife_rare: { name: '혈각의 서사도', type: 'knife', rarity: 'Rare', atk: 250, sellPrice: 250, icon: '🗡️' },
    shield_rare: { name: '수호자의 가디언 실드', type: 'shield', rarity: 'Rare', atk: 180, shieldDuration: 12, sellPrice: 250, icon: '🛡️✨' },
    bow_rare: { name: '사냥꾼의 숏보우', type: 'bow', rarity: 'Rare', atk: 220, sellPrice: 250, icon: '🏹✨' },
    staff_rare: { name: '축복의 성수 지팡이', type: 'staff', rarity: 'Rare', atk: 120, heal: 150, sellPrice: 250, icon: '💧✨' },

    knife_epic: { name: '흑염의 사도검', type: 'knife', rarity: 'Epic', atk: 600, sellPrice: 2500, icon: '🗡️🔥' },
    shield_epic: { name: '불멸의 가고일 방패', type: 'shield', rarity: 'Epic', atk: 450, shieldDuration: 14, sellPrice: 2500, icon: '🛡️🗿' },
    bow_epic: { name: '폭풍의 엘븐 보우', type: 'bow', rarity: 'Epic', atk: 550, sellPrice: 2500, icon: '🎯🔥' },
    staff_epic: { name: '요정의 생명 지팡이', type: 'staff', rarity: 'Epic', atk: 350, heal: 200, sellPrice: 2500, icon: '🔮🌿' },

    knife_legendary: { name: '피빛의 소울리퍼', type: 'knife', rarity: 'Legendary', atk: 1400, sellPrice: 10000, icon: '⚔️🩸' },
    shield_legendary: { name: '성기사의 천상 실드', type: 'shield', rarity: 'Legendary', atk: 1000, shieldDuration: 16, sellPrice: 10000, icon: '🛡️👑' },
    bow_legendary: { name: '천둥의 스톰브링어', type: 'bow', rarity: 'Legendary', atk: 1250, sellPrice: 10000, icon: '🏹⚡' },
    staff_legendary: { name: '세라핌의 치유 지팡이', type: 'staff', rarity: 'Legendary', atk: 800, heal: 250, sellPrice: 10000, icon: '🌟💖' },

    knife_mythic: { name: '심연의 핏빛 멸살검', type: 'knife', rarity: 'Mythic', atk: 3500, sellPrice: 100000, icon: '🗡️💀' },
    shield_mythic: { name: '신성한 절대자의 결계', type: 'shield', rarity: 'Mythic', atk: 2500, shieldDuration: 20, sellPrice: 100000, icon: '🛡️❇️' },
    bow_mythic: { name: '태양의 신궁 아폴론', type: 'bow', rarity: 'Mythic', atk: 3000, sellPrice: 100000, icon: '🏹🌌' },
    staff_mythic: { name: '세계수의 영원한 생명', type: 'staff', rarity: 'Mythic', atk: 2000, heal: 300, sellPrice: 100000, icon: '🌌✨' },

    secret_weapon_1: { name: '🌌 차원을 찢는 공허의 단검', type: 'knife', rarity: 'Secret', atk: 8888, sellPrice: 1000000, icon: '🔪🌀' },
    secret_weapon_2: { name: '🛡️ 만상을 거부하는 방패', type: 'shield', rarity: 'Secret', atk: 6666, shieldDuration: 30, sellPrice: 1000000, icon: '🛡️💠' },
    secret_weapon_3: { name: '🏹 우주를 관통하는 천공궁', type: 'bow', rarity: 'Secret', atk: 7777, sellPrice: 1000000, icon: '🏹🌠' },
    secret_weapon_4: { name: '🌿 신들이 버린 태초의 생명봉', type: 'staff', rarity: 'Secret', atk: 5555, heal: 1000, sellPrice: 1000000, icon: '🌿✨' },
    secret_weapon_5: { name: '👑 지배자의 무한한 홀', type: 'staff', rarity: 'Secret', atk: 9999, heal: 1200, sellPrice: 1500000, icon: '👑💫' },

    artifact_honey_fork: { name: '부러진 꿀신 갈퀴', type: 'artifact', rarity: 'Common', atk: 0, sellPrice: 1200, icon: '🪵' },
    artifact_goliath_stone: { name: '골리앗의 돌멩이 조각', type: 'artifact', rarity: 'Common', atk: 0, sellPrice: 1200, icon: '🪨' },
    artifact_iraso_scale: { name: '이라소의 비늘 파편', type: 'artifact', rarity: 'Common', atk: 0, sellPrice: 1200, icon: '🐟' },
    artifact_dragon_claw: { name: '낡은 드래곤 발톱 껍질', type: 'artifact', rarity: 'Common', atk: 0, sellPrice: 1200, icon: '🦴' },
    artifact_hunter_badge: { name: '빛바랜 보스 사냥꾼의 뱃지', type: 'artifact', rarity: 'Common', atk: 0, sellPrice: 1500, icon: '🏅' },
    artifact_honey_jar: { name: '정제된 꿀신 단지', type: 'artifact', rarity: 'Rare', atk: 0, sellPrice: 6000, icon: '🍯' },
    artifact_goliath_knee: { name: '골리앗의 단단한 무릎 보호대', type: 'artifact', rarity: 'Rare', atk: 0, sellPrice: 6000, icon: '🛡️' },
    artifact_iraso_tear: { name: '이라소의 푸른 눈물방울', type: 'artifact', rarity: 'Rare', atk: 0, sellPrice: 6000, icon: '💧' },
    artifact_dragon_horn: { name: '드래곤의 불에 그슬린 뿔', type: 'artifact', rarity: 'Rare', atk: 0, sellPrice: 6000, icon: '🔥' },
    artifact_uhra_tooth: { name: '우흐라의 부러진 송곳니', type: 'artifact', rarity: 'Rare', atk: 0, sellPrice: 7500, icon: '🦷' },
    artifact_honey_urn: { name: '꿀신이 봉인된 황금 항아리', type: 'artifact', rarity: 'Epic', atk: 0, sellPrice: 25000, icon: '⚱️' },
    artifact_goliath_helm: { name: '골리앗의 거대 투구 장식', type: 'artifact', rarity: 'Epic', atk: 0, sellPrice: 25000, icon: '🪖' },
    artifact_iraso_heart: { name: '이라소의 심해 심장 석', type: 'artifact', rarity: 'Epic', atk: 0, sellPrice: 25000, icon: '💎' },
    artifact_gihoseon_scroll: { name: '기호전의 봉인된 주술 서판', type: 'artifact', rarity: 'Epic', atk: 0, sellPrice: 30000, icon: '📜' },
    artifact_dragon_scale: { name: '드래곤의 영원 불타는 비늘', type: 'artifact', rarity: 'Legendary', atk: 0, sellPrice: 100000, icon: '🌟' },
    artifact_psyche_orb: { name: '사이키의 뒤틀린 영혼 구슬', type: 'artifact', rarity: 'Legendary', atk: 0, sellPrice: 120000, icon: '🔮' },
    artifact_boss_tablet: { name: '네 보스의 힘이 공명하는 고대 석판', type: 'artifact', rarity: 'Legendary', atk: 0, sellPrice: 100000, icon: '🗿' },
    artifact_mythic_crown: { name: '[서버 공인] 신화의 파편: 절대자의 왕관', type: 'artifact', rarity: 'Mythic', atk: 0, sellPrice: 400000, icon: '👑' },
    artifact_concept_eye: { name: '개념의 눈알이 남긴 절대자의 시선', type: 'artifact', rarity: 'Secret', atk: 0, sellPrice: 1500000, icon: '👁️✨' }
};

const COUPONS = {
    'WCDI26070123': { type: 'gold', reward: 1000 },
    'Fiwndq9': { type: 'weapon', reward: 'secret_weapon_1' },
    'ddddf1014': { type: 'gold', reward: 5000 },
    'HGAD026781': { type: 'gold', reward: 3000 }
};

let gameState = {
    boss: { ...BOSS_LIST[0], isUpper: false },
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
        return { id: g.id, name: g.name, maxMembers: g.maxMembers, memberCount: g.members.length, totalDamage: gDmg };
    }).sort((a, b) => b.totalDamage - a.totalDamage);
    gameState.rankings.guilds = gList;
}

// 💡 1레벨 경험치 360, 레벨업마다 1.5배 공식, 최대 100레벨 적용
function getRequiredExp(level) {
    if (level >= 100) return 999999999;
    return Math.round(360 * Math.pow(1.5, level - 1));
}

function addExp(p, amount) {
    if (p.level >= 100) return;
    p.exp += amount;
    while (p.level < 100 && p.exp >= getRequiredExp(p.level)) {
        p.exp -= getRequiredExp(p.level);
        p.level++;
        p.maxHp += 10; // 💡 레벨업 시 체력 +10 증가
        p.hp = p.maxHp;
    }
}

function getRandomGachaWeaponKey() {
    const rand = Math.random() * 100;
    let chosenRarity = 'Common';
    if (rand < 0.02) chosenRarity = 'Secret';
    else if (rand < 0.08 + 0.02) chosenRarity = 'Mythic';
    else if (rand < 2.9 + 0.08 + 0.02) chosenRarity = 'Legendary';
    else if (rand < 15 + 2.9 + 0.08 + 0.02) chosenRarity = 'Epic';
    else if (rand < 32 + 15 + 2.9 + 0.08 + 0.02) chosenRarity = 'Rare';
    else chosenRarity = 'Common';

    const keys = Object.keys(WEAPON_DB).filter(k => WEAPON_DB[k].type !== 'artifact' && WEAPON_DB[k].rarity === chosenRarity);
    return keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : 'knife_common';
}

function getRandomArtifactKey() {
    const tierRand = Math.random() * 100;
    let chosenTier = 'Common';
    if (tierRand < 0.5) chosenTier = 'Secret';
    else if (tierRand < 1.5) chosenTier = 'Mythic';
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
    let eq = p.equippedIndex !== null && p.inventory[p.equippedIndex] ? p.inventory[p.equippedIndex] : null;
    let baseAtk = 80;
    let rarityMul = 1.0;
    if (eq && eq.type !== 'artifact') {
        rarityMul = getRarityMultiplier(eq.rarity);
        baseAtk = (eq.atk * (1 + (eq.enhance || 0) * 0.15)) * rarityMul;
    }
    return Math.round(baseAtk + (p.bonusAtk || 0));
}

function spawnNextUpperBoss() {
    const rand = Math.random() * 100;
    let index = 0;
    if (rand < 45) index = 0;
    else if (rand < 70) index = 1;
    else if (rand < 85) index = 2;
    else index = 3;
    gameState.boss = { ...UPPER_BOSS_LIST[index], isUpper: true };
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
            if (gameState.boss.isUpper && p.hp > 0) {
                const b = gameState.boss;
                if (!p.lastUpperHit || now - p.lastUpperHit >= b.interval * 1000) {
                    p.hp = Math.max(0, p.hp - b.dps);
                    p.lastUpperHit = now;
                    updated = true;
                }
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
}, 5000);

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
            nickname, password, hp: 100, maxHp: 100, level: 1, exp: 0, gold: 500,
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
            level: account.level !== undefined ? account.level : 1,
            exp: account.exp !== undefined ? account.exp : 0,
            gold: account.gold !== undefined ? account.gold : 500,
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

    socket.on('toggleLockItem', (index) => {
        const p = gameState.players[socket.id];
        if (!p || index < 0 || index >= p.inventory.length) return;
        const item = p.inventory[index];
        item.isLocked = !item.isLocked;

        p.inventory.sort((a, b) => (b.isLocked ? 1 : 0) - (a.isLocked ? 1 : 0));
        if (p.equippedIndex !== null) {
            p.equippedIndex = p.inventory.findIndex(it => it.id === item.id);
        }

        saveAccountState(p);
        socket.emit('lockResult', { success: true, message: item.isLocked ? '🔒 무기가 중요(LOCK) 설정되었습니다.' : '🔓 중요 설정이 해제되었습니다.' });
        io.emit('updateState', gameState);
    });

    socket.on('getMarketList', () => {
        socket.emit('marketListResult', gameState.marketListings);
    });

    socket.on('listMarketItem', ({ inventoryIndex, priceGold, desiredItemType, desiredItemRarity }) => {
        const p = gameState.players[socket.id];
        if (!p || inventoryIndex < 0 || inventoryIndex >= p.inventory.length) return;

        const itemToSell = p.inventory[inventoryIndex];
        if (itemToSell.isLocked) {
            socket.emit('marketResult', { success: false, message: '중요(LOCK) 설정된 무기는 등록할 수 없습니다.' });
            return;
        }
        if (p.equippedIndex === inventoryIndex) {
            socket.emit('marketResult', { success: false, message: '장착 중인 아이템은 등록할 수 없습니다.' });
            return;
        }

        p.inventory.splice(inventoryIndex, 1);
        if (p.equippedIndex !== null && p.equippedIndex > inventoryIndex) p.equippedIndex--;

        const listingId = 'market_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        gameState.marketListings[listingId] = {
            id: listingId, sellerId: socket.id, sellerName: p.name,
            item: itemToSell, priceGold: parseInt(priceGold) || 0,
            desiredItemType: desiredItemType || 'none', desiredItemRarity: desiredItemRarity || 'any'
        };

        saveAccountState(p);
        socket.emit('marketResult', { success: true, message: '🛒 거래소에 매물이 등록되었습니다.' });
        io.emit('updateState', gameState);
        io.emit('marketListResult', gameState.marketListings);
    });

    socket.on('cancelMarketItem', (listingId) => {
        const p = gameState.players[socket.id];
        const listing = gameState.marketListings[listingId];
        if (!p || !listing || listing.sellerId !== socket.id) return;
        if (p.inventory.length >= 36) {
            socket.emit('marketResult', { success: false, message: '인벤토리가 가득 찼습니다.' });
            return;
        }
        p.inventory.push(listing.item);
        delete gameState.marketListings[listingId];
        saveAccountState(p);
        socket.emit('marketResult', { success: true, message: '📦 매물이 회수되었습니다.' });
        io.emit('updateState', gameState);
        io.emit('marketListResult', gameState.marketListings);
    });

    socket.on('buyMarketItem', ({ listingId, payWithGold }) => {
        const buyer = gameState.players[socket.id];
        const listing = gameState.marketListings[listingId];
        if (!buyer || !listing) return;
        const seller = gameState.players[listing.sellerId];

        if (payWithGold) {
            if (buyer.gold < listing.priceGold || buyer.inventory.length >= 36) {
                socket.emit('marketResult', { success: false, message: '골드가 부족하거나 인벤토리가 가득 찼습니다.' });
                return;
            }
            buyer.gold -= listing.priceGold;
            buyer.inventory.push(listing.item);

            if (seller) {
                seller.gold += listing.priceGold;
                saveAccountState(seller);
                io.to(seller.id).emit('marketResult', { success: true, message: `💰 등록하신 매물이 판매되었습니다!` });
            } else if (gameState.registeredAccounts[listing.sellerName]) {
                gameState.registeredAccounts[listing.sellerName].gold += listing.priceGold;
            }

            delete gameState.marketListings[listingId];
            saveAccountState(buyer);
            socket.emit('marketResult', { success: true, message: '🎉 거래가 완료되었습니다!' });
            io.emit('updateState', gameState);
            io.emit('marketListResult', gameState.marketListings);
        }
    });

    socket.on('getOnlineUsers', () => {
        const users = Object.values(gameState.players).filter(p => p.id !== socket.id).map(p => ({ id: p.id, name: p.name }));
        socket.emit('onlineUsersResult', users);
    });

    socket.on('requestTrade', (targetId) => {
        const sender = gameState.players[socket.id];
        if (!sender) return;
        io.to(targetId).emit('tradeRequested', { fromId: socket.id, fromName: sender.name });
    });

    socket.on('acceptTrade', (fromId) => {
        const p1 = gameState.players[fromId];
        const p2 = gameState.players[socket.id];
        if (!p1 || !p2) {
            socket.emit('tradeMsg', { success: false, message: '상대방이 접속 중이 아닙니다.' });
            return;
        }

        const tradeId = 'trade_' + Date.now();
        activeTrades[tradeId] = {
            p1Id: p1.id, p2Id: p2.id, items1: [], items2: [], indices1: [], indices2: [], ready1: false, ready2: false
        };

        io.to(p1.id).emit('tradeStart', { tradeId, partnerName: p2.name });
        io.to(p2.id).emit('tradeStart', { tradeId, partnerName: p1.name });
    });

    socket.on('updateTradeOffer', ({ tradeId, offeredIndices }) => {
        const trade = activeTrades[tradeId];
        if (!trade) return;
        const p = gameState.players[socket.id];
        if (!p) return;

        const isP1 = (socket.id === trade.p1Id);
        const indices = [...new Set(offeredIndices)].sort((a, b) => b - a);
        const items = indices.map(idx => p.inventory[idx]).filter(item => item !== undefined);

        if (isP1) {
            trade.indices1 = indices; trade.items1 = items; trade.ready1 = false;
        } else {
            trade.indices2 = indices; trade.items2 = items; trade.ready2 = false;
        }

        io.to(trade.p1Id).emit('tradeStateUpdate', trade);
        io.to(trade.p2Id).emit('tradeStateUpdate', trade);
    });

    socket.on('setTradeReady', ({ tradeId, ready }) => {
        const trade = activeTrades[tradeId];
        if (!trade) return;
        const isP1 = (socket.id === trade.p1Id);
        if (isP1) trade.ready1 = ready;
        else trade.ready2 = ready;

        io.to(trade.p1Id).emit('tradeStateUpdate', trade);
        io.to(trade.p2Id).emit('tradeStateUpdate', trade);

        if (trade.ready1 && trade.ready2) {
            const p1 = gameState.players[trade.p1Id];
            const p2 = gameState.players[trade.p2Id];
            if (!p1 || !p2) return;

            trade.indices1.sort((a, b) => b - a).forEach(idx => {
                if (p1.equippedIndex === idx) p1.equippedIndex = null;
                p1.inventory.splice(idx, 1);
            });
            trade.indices2.sort((a, b) => b - a).forEach(idx => {
                if (p2.equippedIndex === idx) p2.equippedIndex = null;
                p2.inventory.splice(idx, 1);
            });

            trade.items2.forEach(item => p1.inventory.push(item));
            trade.items1.forEach(item => p2.inventory.push(item));

            saveAccountState(p1);
            saveAccountState(p2);

            io.to(trade.p1Id).emit('tradeComplete', { success: true, message: '🤝 1:1 거래가 완료되었습니다!' });
            io.to(trade.p2Id).emit('tradeComplete', { success: true, message: '🤝 1:1 거래가 완료되었습니다!' });
            delete activeTrades[tradeId];
            io.emit('updateState', gameState);
        }
    });

    socket.on('cancelTrade', (tradeId) => {
        const trade = activeTrades[tradeId];
        if (!trade) return;
        io.to(trade.p1Id).emit('tradeCancelled', { success: false, message: '거래가 취소되었습니다.' });
        io.to(trade.p2Id).emit('tradeCancelled', { success: false, message: '거래가 취소되었습니다.' });
        delete activeTrades[tradeId];
    });

    socket.on('sellItems', (indices) => {
        const p = gameState.players[socket.id];
        if (!p || !Array.isArray(indices)) return;

        const uniqueIndices = [...new Set(indices)].sort((a, b) => b - a);
        let totalEarnedGold = 0;

        uniqueIndices.forEach(idx => {
            if (idx >= 0 && idx < p.inventory.length) {
                const item = p.inventory[idx];
                if (item.isLocked) return;
                totalEarnedGold += (item.sellPrice || 0);
                p.inventory.splice(idx, 1);
                if (p.equippedIndex === idx) p.equippedIndex = null;
                else if (p.equippedIndex !== null && p.equippedIndex > idx) p.equippedIndex--;
            }
        });

        p.gold += totalEarnedGold;
        saveAccountState(p);
        socket.emit('sellResult', { success: true, message: `💰 총 ${totalEarnedGold.toLocaleString()} 골드 획득!` });
        io.emit('updateState', gameState);
    });

    socket.on('deleteItems', (indices) => {
        const p = gameState.players[socket.id];
        if (!p || !Array.isArray(indices)) return;

        [...new Set(indices)].sort((a, b) => b - a).forEach(idx => {
            if (idx >= 0 && idx < p.inventory.length) {
                if (p.inventory[idx].isLocked) return;
                p.inventory.splice(idx, 1);
                if (p.equippedIndex === idx) p.equippedIndex = null;
                else if (p.equippedIndex !== null && p.equippedIndex > idx) p.equippedIndex--;
            }
        });

        saveAccountState(p);
        socket.emit('deleteResult', { success: true, message: `🗑️ 선택한 아이템이 삭제되었습니다.` });
        io.emit('updateState', gameState);
    });

    socket.on('drawGacha', () => {
        const p = gameState.players[socket.id];
        if (!p || p.gold < 1000 || p.inventory.length >= 36) return;
        p.gold -= 1000;
        const wKey = getRandomGachaWeaponKey();
        const w = { ...WEAPON_DB[wKey], id: Date.now() + Math.random(), enhance: 0, isLocked: false };
        p.inventory.push(w);
        saveAccountState(p);
        socket.emit('gachaResult', { success: true, weapon: w });
        io.emit('updateState', gameState);
    });

    socket.on('attack', () => {
        const p = gameState.players[socket.id];
        if (!p || p.hp <= 0) return;
        let dmg = calculateDamage(p);
        gameState.boss.currentHp -= dmg;
        p.totalDamage = (p.totalDamage || 0) + dmg;
        p.gold += 15;

        // 💡 보스 기본 타격 시 소량의 경험치 지급 (원하시면 조정 가능)
        addExp(p, 5);

        checkBossKill(p);
        updateRankings();
        io.emit('updateState', gameState);
    });

    socket.on('useSkill', () => {
        const p = gameState.players[socket.id];
        if (!p || p.hp <= 0) return;
        const now = Date.now();
        
        let eq = p.equippedIndex !== null && p.inventory[p.equippedIndex] ? p.inventory[p.equippedIndex] : null;
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
            socket.emit('skillResult', { success: true, message: `🌿 [치유] 체력 ${totalHealAmt} 회복!` });
        } else if (weaponType === 'shield') {
            let durationSec = eq.shieldDuration || 10;
            p.isInvincible = true;
            p.invincibleUntil = now + (durationSec * 1000);
            p.gold += 25;
            socket.emit('skillResult', { success: true, message: `🛡️ [절대 방벽] ${durationSec}초 무적!` });
        } else {
            let skillDmg = Math.round((baseAtk * rarityMul * 2.5) + (p.bonusAtk || 0));
            gameState.boss.currentHp -= skillDmg;
            p.totalDamage += skillDmg;
            p.gold += 50;
            socket.emit('skillResult', { success: true, message: `⚔️ 스킬 적중! ${skillDmg} 대미지!` });
            checkBossKill(p);
            updateRankings();
        }
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    socket.on('enterUpperDungeon', () => {
        const p = gameState.players[socket.id];
        if (!p) return;
        if (p.level < 50) {
            socket.emit('dungeonResult', { success: false, message: '❌ 상위 던전은 50레벨 이상만 입장할 수 있습니다!' });
            return;
        }
        spawnNextUpperBoss();
        socket.emit('dungeonResult', { success: true, message: '🔥 상위 레이드 던전에 입장했습니다!' });
        io.emit('updateState', gameState);
    });

    socket.on('returnNormalDungeon', () => {
        gameState.boss = { ...BOSS_LIST[0], isUpper: false };
        io.emit('updateState', gameState);
    });

    function checkBossKill(p) {
        if (gameState.boss.currentHp <= 0) {
            const expReward = gameState.boss.expReward || 2000;
            addExp(p, expReward);

            const artifactKey = getRandomArtifactKey();
            const droppedItem = { ...WEAPON_DB[artifactKey], id: Date.now() + Math.random(), enhance: 0, isLocked: false };
            
            if (p.inventory.length < 36) {
                p.inventory.push(droppedItem);
                socket.emit('itemObtained', { weapon: droppedItem, full: false });
            } else {
                socket.emit('itemObtained', { weapon: droppedItem, full: true });
            }

            if (gameState.boss.isUpper) {
                spawnNextUpperBoss();
            } else {
                const nextIdx = (BOSS_LIST.findIndex(b => b.name === gameState.boss.name) + 1) % BOSS_LIST.length;
                gameState.boss = { ...BOSS_LIST[nextIdx], isUpper: false };
            }
            saveAccountState(p);
        }
    }

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
        socket.emit('guildResult', { success: true, message: `🏰 '${guildName}' 길드가 생성되었습니다!` });
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
        socket.emit('guildResult', { success: true, message: `🏰 길드 가입 완료!` });
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
        socket.emit('guildResult', { success: true, message: '길드를 탈퇴했습니다.' });
        io.emit('updateState', gameState);
    });

    socket.on('useCoupon', (code) => {
        const p = gameState.players[socket.id];
        if (!p || !COUPONS[code]) return;
        const c = COUPONS[code];
        if (c.type === 'gold') {
            p.gold += c.reward;
            socket.emit('couponResult', { success: true, message: `💰 ${c.reward} 골드 획득!` });
        } else if (c.type === 'weapon' && p.inventory.length < 36) {
            const w = { ...WEAPON_DB[c.reward], id: Date.now() + Math.random(), enhance: 0, isLocked: false };
            p.inventory.push(w);
            socket.emit('couponResult', { success: true, message: `🎉 [${w.name}] 획득!` });
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

    socket.on('enhanceItem', (idx) => {
        const p = gameState.players[socket.id];
        if (p && p.inventory[idx]) {
            const item = p.inventory[idx];
            if (item.type === 'artifact') {
                socket.emit('enhanceResult', { success: false, message: '❌ 유물은 강화할 수 없습니다!' });
                return;
            }
            const cost = ((item.enhance || 0) + 1) * 400;
            if (p.gold >= cost) {
                p.gold -= cost;
                item.enhance = (item.enhance || 0) + 1;
                saveAccountState(p);
                socket.emit('enhanceResult', { success: true, message: '✨ 강화 성공!' });
                io.emit('updateState', gameState);
            } else {
                socket.emit('enhanceResult', { success: false, message: '❌ 골드가 부족합니다!' });
            }
        }
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
        Object.keys(activeTrades).forEach(tradeId => {
            const trade = activeTrades[tradeId];
            if (trade.p1Id === socket.id || trade.p2Id === socket.id) {
                const partnerId = (trade.p1Id === socket.id) ? trade.p2Id : trade.p1Id;
                io.to(partnerId).emit('tradeCancelled', { success: false, message: '상대방이 연결을 끊었습니다.' });
                delete activeTrades[tradeId];
            }
        });
        delete gameState.players[socket.id];
        updateRankings();
        io.emit('updateState', gameState);
    });
});

server.listen(3000, () => console.log('서버 실행 중 포트: 3000'));
