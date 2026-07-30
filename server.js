const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.static(path.join(__dirname, 'public')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

const BOSS_LIST = [
    { name: '🐷 꿀신', maxHp: 157500, currentHp: 157500, type: 'normal', expReward: 2000 },
    { name: '🗿 골리앗', maxHp: 367500, currentHp: 367500, type: 'normal', expReward: 4500 },
    { name: '🦖 이라소', maxHp: 840000, currentHp: 840000, type: 'normal', expReward: 7500 },
    { name: '🐉 드래곤', maxHp: 2100000, currentHp: 2100000, type: 'normal', expReward: 15000 }
];

const DUNGEON_BOSS_LIST = [
    { name: '🦁 우흐라', maxHp: 12000000, currentHp: 12000000, type: 'dungeon', atkInterval: 10000, damage: 20, weight: 45 },
    { name: '🐯 기호전', maxHp: 17000000, currentHp: 17000000, type: 'dungeon', atkInterval: 5000, damage: 12, weight: 25 },
    { name: '👾 사이키', maxHp: 25000000, currentHp: 25000000, type: 'dungeon', atkInterval: 1000, damage: 3, weight: 15 },
    { name: '👁 개념의 눈알', maxHp: 5000000, currentHp: 5000000, type: 'dungeon', atkInterval: 1000, damage: 5, weight: 15 }
];

const WEAPON_DB = {
    knife_common: { name: '녹슨 도살도', type: 'knife', rarity: 'Common', atk: 100, sellPrice: 50, icon: '🔪' },
    knife_rare: { name: '혈각의 서사도', type: 'knife', rarity: 'Rare', atk: 250, sellPrice: 250, icon: '🗡️' },
    knife_epic: { name: '흑염의 사도검', type: 'knife', rarity: 'Epic', atk: 600, sellPrice: 2500, icon: '🗡️🔥' },
    knife_legendary: { name: '피빛의 소울리퍼', type: 'knife', rarity: 'Legendary', atk: 1400, sellPrice: 10000, icon: '⚔️🩸' },
    knife_mythic: { name: '심연의 핏빛 멸살검', type: 'knife', rarity: 'Mythic', atk: 3500, sellPrice: 100000, icon: '🗡️💀' },
    knife_secret: { name: '🌌 차원 절단기 시크릿 블레이드', type: 'knife', rarity: 'Secret', atk: 8000, sellPrice: 500000, icon: '✨🔪' },

    shield_common: { name: '나무 냄비뚜껑', type: 'shield', rarity: 'Common', atk: 60, shieldDuration: 10, sellPrice: 50, icon: '🛡️' },
    shield_rare: { name: '수호자의 가디언 실드', type: 'shield', rarity: 'Rare', atk: 180, shieldDuration: 12, sellPrice: 250, icon: '🛡️✨' },
    shield_epic: { name: '불멸의 가고일 방패', type: 'shield', rarity: 'Epic', atk: 450, shieldDuration: 14, sellPrice: 2500, icon: '🛡️🗿' },
    shield_legendary: { name: '성기사의 천상 실드', type: 'shield', rarity: 'Legendary', atk: 1000, shieldDuration: 16, sellPrice: 10000, icon: '🛡️👑' },
    shield_mythic: { name: '신성한 절대자의 결계', type: 'shield', rarity: 'Mythic', atk: 2500, shieldDuration: 20, sellPrice: 100000, icon: '🛡️❇️' },
    shield_secret: { name: '🌌 영원불멸의 시크릿 코스믹 불워크', type: 'shield', rarity: 'Secret', atk: 6000, shieldDuration: 30, sellPrice: 500000, icon: '✨🛡️' },

    bow_common: { name: '굽은 나무활', type: 'bow', rarity: 'Common', atk: 80, sellPrice: 50, icon: '🏹' },
    bow_rare: { name: '사냥꾼의 숏보우', type: 'bow', rarity: 'Rare', atk: 220, sellPrice: 250, icon: '🏹✨' },
    bow_epic: { name: '폭풍의 엘븐 보우', type: 'bow', rarity: 'Epic', atk: 550, sellPrice: 2500, icon: '🎯🔥' },
    bow_legendary: { name: '천둥의 스톰브링어', type: 'bow', rarity: 'Legendary', atk: 1250, sellPrice: 10000, icon: '🏹⚡' },
    bow_mythic: { name: '태양의 신궁 아폴론', type: 'bow', rarity: 'Mythic', atk: 3000, sellPrice: 100000, icon: '🏹🌌' },
    bow_secret: { name: '🌌 은하계를 관통하는 시크릿 스타스트라이크', type: 'bow', rarity: 'Secret', atk: 7500, sellPrice: 500000, icon: '✨🏹' },

    staff_common: { name: '새싹의 허브 지팡이', type: 'staff', rarity: 'Common', atk: 40, heal: 100, sellPrice: 50, icon: '🌿' },
    staff_rare: { name: '축복의 성수 지팡이', type: 'staff', rarity: 'Rare', atk: 120, heal: 150, sellPrice: 250, icon: '💧✨' },
    staff_epic: { name: '요정의 생명 지팡이', type: 'staff', rarity: 'Epic', atk: 350, heal: 200, sellPrice: 2500, icon: '🔮🌿' },
    staff_legendary: { name: '세라핌의 치유 지팡이', type: 'staff', rarity: 'Legendary', atk: 800, heal: 250, sellPrice: 10000, icon: '🌟💖' },
    staff_mythic: { name: '세계수의 영원한 생명', type: 'staff', rarity: 'Mythic', atk: 2000, heal: 300, sellPrice: 100000, icon: '🌌✨' },
    staff_secret: { name: '🌌 시공을 치유하는 시크릿 이터널 완드', type: 'staff', rarity: 'Secret', atk: 5000, heal: 800, sellPrice: 500000, icon: '✨🔮' },

    hidden_hong: { name: '홍인준의 뱃살 방패', type: 'shield', rarity: 'Mythic', atk: 6000, shieldDuration: 25, sellPrice: 100000, icon: '🐷🛡️' },
    hidden_jiyu: { name: '지유의 쌈장', type: 'artifact', rarity: 'Mythic', atk: 5000, sellPrice: 100000, icon: '🥘' }
};

const COUPONS = {
    'WCDI26070123': { type: 'gold', reward: 1000 },
    'Fiwndq9': { type: 'weapon', reward: 'hidden_hong' },
    'ddddf1014': { type: 'gold', reward: 5000 },
    'HGAD026781': { type: 'gold', reward: 3000 },
    'HIJPIG12': { type: 'weapon', reward: 'hidden_jiyu' }
};

let gameState = {
    boss: { ...BOSS_LIST[0] },
    dungeonBoss: null,
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
        acc.guildId = p.guildId;
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
    const rand = Math.random() * 100;
    let chosenRarity = 'Common';
    if (rand < 0.02) chosenRarity = 'Secret';
    else if (rand < 0.08 + 0.02) chosenRarity = 'Mythic';
    else if (rand < 2.9 + 0.08 + 0.02) chosenRarity = 'Legendary';
    else if (rand < 15 + 2.9 + 0.08 + 0.02) chosenRarity = 'Epic';
    else if (rand < 32 + 15 + 2.9 + 0.08 + 0.02) chosenRarity = 'Rare';
    else chosenRarity = 'Common';

    const keys = Object.keys(WEAPON_DB).filter(k => {
        if (k === 'hidden_hong' || k === 'hidden_jiyu') return false;
        return WEAPON_DB[k].rarity === chosenRarity;
    });
    return keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : 'knife_common';
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

function addExp(p, amount) {
    if (p.level >= 100) return;
    p.exp += amount;
    let reqExp = p.level * 1500;
    while (p.exp >= reqExp && p.level < 100) {
        p.exp -= reqExp;
        p.level++;
        p.maxHp += 10;
        p.hp = p.maxHp;
        reqExp = p.level * 1500;
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
            nickname, password, hp: 100, maxHp: 100, level: 1, exp: 0, gold: 500,
            inventory: [], equippedIndex: null, totalDamage: 0, bonusAtk: 0, guildId: null
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
            level: account.level || 1,
            exp: account.exp || 0,
            gold: account.gold !== undefined ? account.gold : 500,
            inventory: account.inventory ? [...account.inventory] : [],
            equippedIndex: account.equippedIndex !== undefined ? account.equippedIndex : null,
            totalDamage: account.totalDamage || 0,
            bonusAtk: account.bonusAtk || 0,
            lastSkillTime: 0,
            isInvincible: false,
            invincibleUntil: 0,
            guildId: account.guildId || null
        };

        if (account.guildId && gameState.guilds[account.guildId]) {
            if (!gameState.guilds[account.guildId].members.includes(socket.id)) {
                gameState.guilds[account.guildId].members.push(socket.id);
            }
        }

        socket.emit('loginSuccess', { success: true, player: gameState.players[socket.id] });
        updateRankings();
        io.emit('updateState', gameState);
    });

    socket.on('getMarketList', () => {
        socket.emit('marketListResult', gameState.marketListings);
    });

    socket.on('listMarketItem', ({ inventoryIndex, priceGold, desiredItemType, desiredItemRarity }) => {
        const p = gameState.players[socket.id];
        if (!p || inventoryIndex < 0 || inventoryIndex >= p.inventory.length) return;

        const itemToSell = p.inventory[inventoryIndex];
        if (itemToSell.isImportant) {
            socket.emit('marketResult', { success: false, message: '중요 아이템은 등록할 수 없습니다.' });
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
            id: listingId,
            sellerId: socket.id,
            sellerName: p.name,
            item: itemToSell,
            priceGold: parseInt(priceGold) || 0,
            desiredItemType: desiredItemType || 'none',
            desiredItemRarity: desiredItemRarity || 'any'
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
        io.emit('marketResult', { success: true, message: '📦 매물이 회수되었습니다.' });
        io.emit('updateState', gameState);
        io.emit('marketListResult', gameState.marketListings);
    });

    socket.on('buyMarketItem', ({ listingId, payWithGold, payWithInventoryIndex }) => {
        const buyer = gameState.players[socket.id];
        const listing = gameState.marketListings[listingId];
        if (!buyer || !listing) return;

        const seller = gameState.players[listing.sellerId];

        if (payWithGold) {
            if (buyer.gold < listing.priceGold) {
                socket.emit('marketResult', { success: false, message: '골드가 부족합니다.' });
                return;
            }
            if (buyer.inventory.length >= 36) {
                socket.emit('marketResult', { success: false, message: '인벤토리 공간이 부족합니다.' });
                return;
            }

            buyer.gold -= listing.priceGold;
            buyer.inventory.push(listing.item);

            if (seller) {
                seller.gold += listing.priceGold;
                saveAccountState(seller);
                io.to(seller.id).emit('marketResult', { success: true, message: `💰 판매 완료! ${listing.priceGold.toLocaleString()} 골드 획득!` });
            } else if (gameState.registeredAccounts[listing.sellerName]) {
                gameState.registeredAccounts[listing.sellerName].gold += listing.priceGold;
            }

            delete gameState.marketListings[listingId];
            saveAccountState(buyer);
            socket.emit('marketResult', { success: true, message: '🎉 거래가 완료되었습니다!' });
            io.emit('updateState', gameState);
            io.emit('marketListResult', gameState.marketListings);
        } else if (payWithInventoryIndex !== undefined) {
            if (payWithInventoryIndex < 0 || payWithInventoryIndex >= buyer.inventory.length) return;
            const offeredItem = buyer.inventory[payWithInventoryIndex];
            if (offeredItem.isImportant) {
                socket.emit('marketResult', { success: false, message: '중요 아이템은 지불할 수 없습니다.' });
                return;
            }

            if (listing.desiredItemType !== 'none' && offeredItem.type !== listing.desiredItemType) {
                socket.emit('marketResult', { success: false, message: '원하는 아이템 종류가 아닙니다.' });
                return;
            }
            if (listing.desiredItemRarity !== 'any' && offeredItem.rarity !== listing.desiredItemRarity) {
                socket.emit('marketResult', { success: false, message: '원하는 아이템 등급이 아닙니다.' });
                return;
            }

            buyer.inventory.splice(payWithInventoryIndex, 1);
            if (buyer.equippedIndex !== null && buyer.equippedIndex > payWithInventoryIndex) buyer.equippedIndex--;

            buyer.inventory.push(listing.item);

            if (seller) {
                seller.inventory.push(offeredItem);
                saveAccountState(seller);
                io.to(seller.id).emit('marketResult', { success: true, message: `🤝 물물교환 성사!` });
            } else if (gameState.registeredAccounts[listing.sellerName]) {
                gameState.registeredAccounts[listing.sellerName].inventory.push(offeredItem);
            }

            delete gameState.marketListings[listingId];
            saveAccountState(buyer);
            socket.emit('marketResult', { success: true, message: '🎉 물물교환 완료!' });
            io.emit('updateState', gameState);
            io.emit('marketListResult', gameState.marketListings);
        }
    });

    socket.on('getOnlineUsers', () => {
        const users = Object.values(gameState.players)
            .filter(p => p.id !== socket.id)
            .map(p => ({ id: p.id, name: p.name }));
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
        if (!p1 || !p2) return;

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
        
        for (let idx of indices) {
            if (p.inventory[idx] && p.inventory[idx].isImportant) {
                socket.emit('tradeMsg', { success: false, message: '중요 아이템은 거래창에 올릴 수 없습니다.' });
                return;
            }
        }

        const items = indices.map(idx => p.inventory[idx]).filter(item => item !== undefined);

        if (isP1) {
            trade.indices1 = indices;
            trade.items1 = items;
            trade.ready1 = false;
        } else {
            trade.indices2 = indices;
            trade.items2 = items;
            trade.ready2 = false;
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
                else if (p1.equippedIndex !== null && p1.equippedIndex > idx) p1.equippedIndex--;
                p1.inventory.splice(idx, 1);
            });
            trade.indices2.sort((a, b) => b - a).forEach(idx => {
                if (p2.equippedIndex === idx) p2.equippedIndex = null;
                else if (p2.equippedIndex !== null && p2.equippedIndex > idx) p2.equippedIndex--;
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

        const unique = [...new Set(indices)].sort((a, b) => b - a);
        let earned = 0;
        for (let idx of unique) {
            if (idx >= 0 && idx < p.inventory.length) {
                if (p.inventory[idx].isImportant) continue; // 중요 아이템 판매 방지
                earned += (p.inventory[idx].sellPrice || 0);
                p.inventory.splice(idx, 1);
                if (p.equippedIndex === idx) p.equippedIndex = null;
                else if (p.equippedIndex !== null && p.equippedIndex > idx) p.equippedIndex--;
            }
        }
        p.gold += earned;
        saveAccountState(p);
        socket.emit('sellResult', { success: true, message: `💰 총 ${earned.toLocaleString()} 골드 획득! (중요 아이템 제외)` });
        io.emit('updateState', gameState);
    });

    socket.on('deleteItems', (indices) => {
        const p = gameState.players[socket.id];
        if (!p || !Array.isArray(indices)) return;

        [...new Set(indices)].sort((a, b) => b - a).forEach(idx => {
            if (idx >= 0 && idx < p.inventory.length) {
                if (p.inventory[idx].isImportant) return; // 중요 아이템 삭제 방지
                p.inventory.splice(idx, 1);
                if (p.equippedIndex === idx) p.equippedIndex = null;
                else if (p.equippedIndex !== null && p.equippedIndex > idx) p.equippedIndex--;
            }
        });
        saveAccountState(p);
        socket.emit('deleteResult', { success: true, message: '🗑️ 선택한 아이템이 삭제되었습니다. (중요 아이템 제외)' });
        io.emit('updateState', gameState);
    });

    socket.on('toggleImportant', (idx) => {
        const p = gameState.players[socket.id];
        if (p && p.inventory[idx]) {
            p.inventory[idx].isImportant = !p.inventory[idx].isImportant;
            // 중요 아이템 설정 시 창고 상단으로 정렬
            if (p.inventory[idx].isImportant) {
                const item = p.inventory.splice(idx, 1)[0];
                p.inventory.unshift(item);
                if (p.equippedIndex === 0) {
                    // 장착 인덱스 재조정 필요시 처리
                }
            }
            saveAccountState(p);
            io.emit('updateState', gameState);
        }
    });

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

    socket.on('attack', () => {
        const p = gameState.players[socket.id];
        if (!p || p.hp <= 0) return;
        let dmg = calculateDamage(p);

        if (gameState.dungeonBoss) {
            gameState.dungeonBoss.currentHp -= dmg;
            p.totalDamage += dmg;
            p.gold += 25;
            addExp(p, 500);
            checkDungeonBossKill(p);
        } else {
            gameState.boss.currentHp -= dmg;
            p.totalDamage += dmg;
            p.gold += 15;
            addExp(p, gameState.boss.expReward || 2000);
            checkBossKill(p);
        }

        saveAccountState(p);
        updateRankings();
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
            socket.emit('skillResult', { success: true, message: `[ 스킬 치유의파동 발동! ] 체력 ${totalHealAmt} 회복!` });
        } else if (weaponType === 'shield') {
            let durationSec = eq.shieldDuration || 10;
            p.isInvincible = true;
            p.invincibleUntil = now + (durationSec * 1000);
            p.gold += 25;
            socket.emit('skillResult', { success: true, message: `[ 스킬 절대방벽 발동! ] ${durationSec}초 무적!` });
        } else {
            let skillDmg = Math.round((baseAtk * rarityMul * 2.5) + (p.bonusAtk || 0));
            if (gameState.dungeonBoss) {
                gameState.dungeonBoss.currentHp -= skillDmg;
            } else {
                gameState.boss.currentHp -= skillDmg;
            }
            p.totalDamage += skillDmg;
            p.gold += 50;
            socket.emit('skillResult', { success: true, message: `[ 스킬 강력한일격 발동! ] ${skillDmg} 대미지!` });
            updateRankings();
            if (gameState.dungeonBoss) checkDungeonBossKill(p);
            else checkBossKill(p);
        }
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    function checkBossKill(p) {
        if (gameState.boss.currentHp <= 0) {
            gameState.boss = { ...BOSS_LIST[Math.floor(Math.random() * BOSS_LIST.length)] };
        }
    }

    function checkDungeonBossKill(p) {
        if (gameState.dungeonBoss.currentHp <= 0) {
            socket.emit('skillResult', { success: true, message: `🏆 상위 던전 보스 처치 성공!` });
            gameState.dungeonBoss = null;
        }
    }

    socket.on('enterDungeon', () => {
        const p = gameState.players[socket.id];
        if (!p || p.level < 50) {
            socket.emit('skillResult', { success: false, message: '❌ 50레벨 이상만 상위 던전에 입장할 수 있습니다!' });
            return;
        }
        // 보스 등장 확률 (우흐라 45%, 기호전 25%, 사이키 15%, 개념의 눈알 15%)
        const rand = Math.random() * 100;
        let chosen;
        if (rand < 45) chosen = DUNGEON_BOSS_LIST[0];
        else if (rand < 70) chosen = DUNGEON_BOSS_LIST[1];
        else if (rand < 85) chosen = DUNGEON_BOSS_LIST[2];
        else chosen = DUNGEON_BOSS_LIST[3];

        gameState.dungeonBoss = { ...chosen, currentHp: chosen.maxHp };
        io.emit('updateState', gameState);
    });

    socket.on('exitDungeon', () => {
        gameState.dungeonBoss = null;
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
        socket.emit('guildResult', { success: true, message: `🏰 '${guildName}' 길드가 생성되었습니다!` });
        io.emit('updateState', gameState);
    });

    socket.on('getGuildList', () => {
        const list = Object.values(gameState.guilds).map(g => {
            let membersInfoText = g.members.map(mId => gameState.players[mId]?.name).filter(Boolean).join(', ');
            return {
                id: g.id, name: g.name, maxMembers: g.maxMembers, currentCount: g.members.length,
                infoText: `길드마스터👑: ${Object.values(gameState.players).find(pl => pl.id === g.leaderId)?.name || '미정'}`
            };
        });
        socket.emit('guildListResult', list);
    });

    socket.on('getGuildDetail', () => {
        const p = gameState.players[socket.id];
        if (!p || !p.guildId || !gameState.guilds[p.guildId]) return;
        const g = gameState.guilds[p.guildId];
        const membersData = g.members.map(mId => {
            const memberObj = gameState.players[mId];
            return {
                id: mId,
                name: memberObj ? memberObj.name : '알수없음',
                level: memberObj ? memberObj.level : 1,
                isLeader: g.leaderId === mId,
                isSubLeader: g.subLeaderId === mId
            };
        });
        socket.emit('guildDetailResult', { guild: g, members: membersData, isLeader: g.leaderId === socket.id });
    });

    socket.on('appointSubLeader', (targetSocketId) => {
        const p = gameState.players[socket.id];
        if (!p || !p.guildId) return;
        const guild = gameState.guilds[p.guildId];
        if (!guild || guild.leaderId !== socket.id || !guild.members.includes(targetSocketId)) return;
        guild.subLeaderId = targetSocketId;
        socket.emit('guildResult', { success: true, message: '부마스터가 임명되었습니다.' });
        io.emit('updateState', gameState);
    });

    socket.on('joinGuild', (guildId) => {
        const p = gameState.players[socket.id];
        const guild = gameState.guilds[guildId];
        if (!p || !guild || p.guildId || guild.members.length >= guild.maxMembers) return;
        guild.members.push(socket.id);
        p.guildId = guildId;
        updateRankings();
        socket.emit('guildResult', { success: true, message: `🏰 '${guild.name}' 길드에 가입되었습니다!` });
        io.emit('updateState', gameState);
    });

    socket.on('leaveGuild', () => {
        const p = gameState.players[socket.id];
        if (!p || !p.guildId) return;
        const guild = gameState.guilds[p.guildId];
        if (guild) {
            guild.members = guild.members.filter(id => id !== socket.id);
            if (guild.subLeaderId === socket.id) guild.subLeaderId = null;
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
            const w = { ...WEAPON_DB[c.reward], id: Date.now() + Math.random(), enhance: 0, isImportant: true };
            p.inventory.push(w);
            socket.emit('couponResult', { success: true, message: `[ 무기 ${w.name}이 뽑혔습니다. ]` });
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
            const currentEnhance = item.enhance || 0;
            
            // 구간별 등급 제한 검증
            let maxAllowedEnhance = 60;
            if (currentEnhance >= 60) {
                socket.emit('enhanceResult', { success: false, message: '❌ 이미 최대 강화 수치입니다!' });
                return;
            }

            // 확률 계산 (기본 50%, 10강씩 오를 때마다 5%씩 감소)
            // 1~10: 50%, 11~20: 45%, 21~30: 40%, 31~40: 35%, 41~50: 30%, 51~60: 25%
            let penaltyStep = Math.floor(currentEnhance / 10);
            let successRate = 50 - (penaltyStep * 5);

            const cost = (currentEnhance + 1) * 400;
            if (p.gold < cost) {
                socket.emit('enhanceResult', { success: false, message: '❌ 골드가 부족합니다!' });
                return;
            }

            p.gold -= cost;
            if (Math.random() * 100 < successRate) {
                item.enhance = currentEnhance + 1;
                socket.emit('enhanceResult', { success: true, message: `✨ 강화 성공! (+${item.enhance})` });
            } else {
                socket.emit('enhanceResult', { success: false, message: `💥 강화 실패! (확률 ${successRate}%)` });
            }
            saveAccountState(p);
            io.emit('updateState', gameState);
        }
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
