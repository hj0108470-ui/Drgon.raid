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
    { name: '🐷 꿀신', maxHp: 157500, currentHp: 157500, expReward: 2000 },
    { name: '🗿 골리앗', maxHp: 367500, currentHp: 367500, expReward: 4500 },
    { name: '🦖 이라소', maxHp: 840000, currentHp: 840000, expReward: 7500 },
    { name: '🐉 드래곤', maxHp: 2100000, currentHp: 2100000, expReward: 15000 }
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
    players: {},
    registeredAccounts: {},
    guilds: {},
    marketListings: {},
    trades: {},
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
    if (p.level >= 75) {
        p.exp = 0;
        return;
    }
    p.exp += amount;
    let reqExp = p.level * 1500 + 500;
    while (p.level < 75 && p.exp >= reqExp) {
        p.exp -= reqExp;
        p.level++;
        p.maxHp += 10;
        p.hp = p.maxHp;
        reqExp = p.level * 1500 + 500;
    }
    if (p.level >= 75) {
        p.level = 75;
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

    socket.on('attack', () => {
        const p = gameState.players[socket.id];
        if (!p || p.hp <= 0) return;
        let dmg = calculateDamage(p);
        gameState.boss.currentHp -= dmg;
        p.totalDamage = (p.totalDamage || 0) + dmg;
        p.gold += 15;
        addExp(p, 30);
        saveAccountState(p);

        updateRankings();
        checkBossKill(p);
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
            socket.emit('skillResultPop', { success: false, message: '⏳ 스킬 쿨타임 중입니다!' });
            return;
        }
        p.lastSkillTime = now;

        let skillResultData = { success: true, message: '', type: weaponType };

        if (weaponType === 'staff') {
            let totalHealAmt = Math.round(((eq.heal || 100) * rarityMul) + 200);
            p.hp = Math.min(p.maxHp, p.hp + totalHealAmt);
            p.gold += 30;
            addExp(p, 60);
            skillResultData.message = `🌿 [치유의 파동] 체력 ${totalHealAmt} 회복!`;
            skillResultData.val = totalHealAmt;
        } else if (weaponType === 'shield') {
            let durationSec = eq.shieldDuration || 10;
            p.isInvincible = true;
            p.invincibleUntil = now + (durationSec * 1000);
            p.gold += 25;
            addExp(p, 50);
            skillResultData.message = `🛡️ [절대 방벽] ${durationSec}초 무적 개시!`;
            skillResultData.val = durationSec;
        } else {
            let skillDmg = Math.round((baseAtk * rarityMul * 2.5) + (p.bonusAtk || 0));
            gameState.boss.currentHp -= skillDmg;
            p.totalDamage += skillDmg;
            p.gold += 50;
            addExp(p, 100);
            skillResultData.message = `⚔️ 필살기 적중! ${skillDmg.toLocaleString()} 대미지 작렬!`;
            skillResultData.val = skillDmg;
            updateRankings();
            checkBossKill(p);
        }
        saveAccountState(p);
        socket.emit('skillResultPop', skillResultData);
        io.emit('updateState', gameState);
    });

    function checkBossKill(p) {
        if (gameState.boss.currentHp <= 0) {
            addExp(p, gameState.boss.expReward);

            const artifactKey = getRandomArtifactKey();
            const droppedItem = { ...WEAPON_DB[artifactKey], id: Date.now() + Math.random(), enhance: 0 };
            
            if (p.inventory.length < 36) {
                p.inventory.push(droppedItem);
                socket.emit('itemObtained', { weapon: droppedItem, full: false });
            } else {
                socket.emit('itemObtained', { weapon: droppedItem, full: true });
            }

            gameState.boss = { ...BOSS_LIST[Math.floor(Math.random() * BOSS_LIST.length)] };
            saveAccountState(p);
        }
    }

    // ⚖️ 1대1 실시간 거래 시스템
    socket.on('requestTrade', (targetName) => {
        const sender = gameState.players[socket.id];
        if (!sender) return;
        let targetSocketId = null;
        for (let [sId, pObj] of Object.entries(gameState.players)) {
            if (pObj.name === targetName) {
                targetSocketId = sId;
                break;
            }
        }
        if (!targetSocketId || targetSocketId === socket.id) {
            socket.emit('tradeAlert', { success: false, message: '상대를 찾을 수 없거나 자기 자신과는 거래할 수 없습니다.' });
            return;
        }
        io.to(targetSocketId).emit('tradeRequestReceived', { senderId: socket.id, senderName: sender.name });
        socket.emit('tradeAlert', { success: true, message: `${targetName}님께 1대1 거래를 요청했습니다.` });
    });

    socket.on('acceptTrade', (senderId) => {
        const acceptor = gameState.players[socket.id];
        const sender = gameState.players[senderId];
        if (!acceptor || !sender) return;

        const tradeId = 'trade_' + Date.now();
        gameState.trades[tradeId] = {
            id: tradeId,
            p1: senderId,
            p2: socket.id,
            p1Offer: { items: [], gold: 0, locked: false },
            p2Offer: { items: [], gold: 0, locked: false }
        };

        io.to(senderId).emit('tradeStarted', { tradeId, partnerName: acceptor.name });
        io.to(socket.id).emit('tradeStarted', { tradeId, partnerName: sender.name });
    });

    socket.on('updateTradeOffer', ({ tradeId, offerItems, offerGold }) => {
        const trade = gameState.trades[tradeId];
        const p = gameState.players[socket.id];
        if (!trade || !p) return;

        if (trade.p1 === socket.id) {
            if (trade.p1Offer.locked) return;
            trade.p1Offer.items = offerItems;
            trade.p1Offer.gold = parseInt(offerGold) || 0;
        } else if (trade.p2 === socket.id) {
            if (trade.p2Offer.locked) return;
            trade.p2Offer.items = offerItems;
            trade.p2Offer.gold = parseInt(offerGold) || 0;
        }

        io.to(trade.p1).emit('tradeStateUpdate', trade);
        io.to(trade.p2).emit('tradeStateUpdate', trade);
    });

    socket.on('lockTradeOffer', (tradeId) => {
        const trade = gameState.trades[tradeId];
        if (!trade) return;

        if (trade.p1 === socket.id) trade.p1Offer.locked = true;
        else if (trade.p2 === socket.id) trade.p2Offer.locked = true;

        io.to(trade.p1).emit('tradeStateUpdate', trade);
        io.to(trade.p2).emit('tradeStateUpdate', trade);

        if (trade.p1Offer.locked && trade.p2Offer.locked) {
            // 거래 최종 확정 및 교환 처리
            const p1 = gameState.players[trade.p1];
            const p2 = gameState.players[trade.p2];

            if (p1 && p2) {
                // 검증: 아이템 소유 여부 및 골드 보유량 체크
                let p1Items = trade.p1Offer.items.map(idx => p1.inventory[idx]);
                let p2Items = trade.p2Offer.items.map(idx => p2.inventory[idx]);

                if (p1.gold < trade.p1Offer.gold || p2.gold < trade.p2Offer.gold || p1Items.includes(undefined) || p2Items.includes(undefined)) {
                    io.to(trade.p1).emit('tradeComplete', { success: false, message: '보유 자산이나 아이템이 부족하여 거래가 취소되었습니다.' });
                    io.to(trade.p2).emit('tradeComplete', { success: false, message: '보유 자산이나 아이템이 부족하여 거래가 취소되었습니다.' });
                    delete gameState.trades[tradeId];
                    return;
                }

                // 골드 교환
                p1.gold -= trade.p1Offer.gold;
                p1.gold += trade.p2Offer.gold;
                p2.gold -= trade.p2Offer.gold;
                p2.gold += trade.p1Offer.gold;

                // 아이템 교환 (인덱스 내림차순 정렬하여 splice 오류 방지)
                let p1Indices = [...trade.p1Offer.items].sort((a, b) => b - a);
                let p2Indices = [...trade.p2Offer.items].sort((a, b) => b - a);

                let extractedP1Items = p1Indices.map(idx => p1.inventory.splice(idx, 1)[0]);
                let extractedP2Items = p2Indices.map(idx => p2.inventory.splice(idx, 1)[0]);

                p1.inventory.push(...extractedP2Items);
                p2.inventory.push(...extractedP1Items);

                p1.equippedIndex = null;
                p2.equippedIndex = null;

                saveAccountState(p1);
                saveAccountState(p2);

                io.to(trade.p1).emit('tradeComplete', { success: true, message: '🤝 1대1 거래가 성공적으로 완료되었습니다!' });
                io.to(trade.p2).emit('tradeComplete', { success: true, message: '🤝 1대1 거래가 성공적으로 완료되었습니다!' });
            }
            delete gameState.trades[tradeId];
            io.emit('updateState', gameState);
        }
    });

    socket.on('cancelTrade', (tradeId) => {
        const trade = gameState.trades[tradeId];
        if (!trade) return;
        io.to(trade.p1).emit('tradeComplete', { success: false, message: '상대방이 거래를 취소했습니다.' });
        io.to(trade.p2).emit('tradeComplete', { success: false, message: '상대방이 거래를 취소했습니다.' });
        delete gameState.trades[tradeId];
    });

    socket.on('getMarketList', () => { socket.emit('marketListResult', gameState.marketListings); });
    socket.on('listMarketItem', ({ inventoryIndex, priceGold }) => {
        const p = gameState.players[socket.id];
        if (!p || inventoryIndex < 0 || inventoryIndex >= p.inventory.length) return;
        const itemToSell = p.inventory[inventoryIndex];
        if (p.equippedIndex === inventoryIndex) return;
        p.inventory.splice(inventoryIndex, 1);
        if (p.equippedIndex !== null && p.equippedIndex > inventoryIndex) p.equippedIndex--;

        const listingId = 'market_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        gameState.marketListings[listingId] = {
            id: listingId, sellerId: socket.id, sellerName: p.name, item: itemToSell,
            priceGold: parseInt(priceGold) || 0, desiredItemType: 'none', desiredItemRarity: 'any'
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

    socket.on('buyMarketItem', ({ listingId, payWithGold }) => {
        const buyer = gameState.players[socket.id];
        const listing = gameState.marketListings[listingId];
        if (!buyer || !listing) return;
        const seller = gameState.players[listing.sellerId];

        if (payWithGold) {
            if (buyer.gold < listing.priceGold || buyer.inventory.length >= 36) return;
            buyer.gold -= listing.priceGold;
            buyer.inventory.push(listing.item);
            if (seller) {
                seller.gold += listing.priceGold;
                saveAccountState(seller);
            } else if (gameState.registeredAccounts[listing.sellerName]) {
                gameState.registeredAccounts[listing.sellerName].gold += listing.priceGold;
            }
            delete gameState.marketListings[listingId];
            saveAccountState(buyer);
            io.emit('updateState', gameState);
            io.emit('marketListResult', gameState.marketListings);
        }
    });

    socket.on('enhanceItemWithArtifact', ({ weaponIndex, artifactIndex }) => {
        const p = gameState.players[socket.id];
        if (!p || weaponIndex < 0 || artifactIndex < 0) return;
        const weapon = p.inventory[weaponIndex];
        const artifact = p.inventory[artifactIndex];
        if (!weapon || !artifact || weapon.type === 'artifact' || artifact.type !== 'artifact' || weaponIndex === artifactIndex) return;

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

    socket.on('getGuildDetail', () => {
        const p = gameState.players[socket.id];
        if (!p || !p.guildId || !gameState.guilds[p.guildId]) return;
        const g = gameState.guilds[p.guildId];
        const memberDetails = g.members.map(mId => {
            const memberObj = gameState.players[mId];
            return {
                socketId: mId, name: memberObj ? memberObj.name : '알수없음', level: memberObj ? memberObj.level : 1,
                isLeader: (g.leaderId === mId), isSubLeader: (g.subLeaderId === mId)
            };
        });
        socket.emit('guildDetailResult', { guildName: g.name, isLeader: (g.leaderId === socket.id), members: memberDetails });
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
        if (!p || p.gold < 1000 || p.inventory.length >= 36) {
            socket.emit('gachaResultPop', { success: false, message: '골드가 부족하거나 인벤토리가 가득 찼습니다!' });
            return;
        }
        p.gold -= 1000;
        const wKey = getRandomWeaponKey();
        const wonItem = { ...WEAPON_DB[wKey], id: Date.now(), enhance: 0 };
        p.inventory.push(wonItem);
        saveAccountState(p);
        socket.emit('gachaResultPop', { success: true, item: wonItem });
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
                else if (guild.leaderId === socket.id) guild.leaderId = guild.members[0];
            }
        }
        // 진행 중인 1대1 거래 취소 처리
        for (let [tId, tObj] of Object.entries(gameState.trades)) {
            if (tObj.p1 === socket.id || tObj.p2 === socket.id) {
                const otherId = (tObj.p1 === socket.id) ? tObj.p2 : tObj.p1;
                io.to(otherId).emit('tradeComplete', { success: false, message: '상대방의 연결이 끊어져 거래가 취소되었습니다.' });
                delete gameState.trades[tId];
            }
        }
        delete gameState.players[socket.id];
        updateRankings();
        io.emit('updateState', gameState);
    });
});

server.listen(3000, () => console.log('서버 실행 중 포트: 3000'));
