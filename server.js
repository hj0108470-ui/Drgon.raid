const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const BOSS_LIST = [
    { name: '🐷 꿀신', maxHp: 15000, currentHp: 15000 },
    { name: '🗿 골리앗', maxHp: 35000, currentHp: 35000 },
    { name: '🦖 이라소', maxHp: 80000, currentHp: 80000 },
    { name: '🐉 드래곤', maxHp: 200000, currentHp: 200000 }
];

const WEAPON_DB = {
    knife_common: { name: '녹슨 도살도', type: 'knife', rarity: 'Common', atk: 10, sellPrice: 50, icon: '🔪' },
    knife_rare: { name: '혈각의 서사도', type: 'knife', rarity: 'Rare', atk: 25, sellPrice: 250, icon: '🗡️' },
    knife_epic: { name: '흑염의 사도검', type: 'knife', rarity: 'Epic', atk: 60, sellPrice: 2500, icon: '🗡️🔥' },
    knife_legendary: { name: '피빛의 소울리퍼', type: 'knife', rarity: 'Legendary', atk: 140, sellPrice: 10000, icon: '⚔️🩸' },
    knife_mythic: { name: '심연의 핏빛 멸살검', type: 'knife', rarity: 'Mythic', atk: 350, sellPrice: 100000, icon: '🗡️💀' },

    shield_common: { name: '나무 냄비뚜껑', type: 'shield', rarity: 'Common', atk: 6, sellPrice: 50, icon: '🛡️' },
    shield_rare: { name: '수호자의 가디언 실드', type: 'shield', rarity: 'Rare', atk: 18, sellPrice: 250, icon: '🛡️✨' },
    shield_epic: { name: '불멸의 가고일 방패', type: 'shield', rarity: 'Epic', atk: 45, sellPrice: 2500, icon: '🛡️🗿' },
    shield_legendary: { name: '성기사의 천상 실드', type: 'shield', rarity: 'Legendary', atk: 100, sellPrice: 10000, icon: '🛡️👑' },
    shield_mythic: { name: '신성한 절대자의 결계', type: 'shield', rarity: 'Mythic', atk: 250, sellPrice: 100000, icon: '🛡️❇️' },

    bow_common: { name: '굽은 나무활', type: 'bow', rarity: 'Common', atk: 8, sellPrice: 50, icon: '🏹' },
    bow_rare: { name: '사냥꾼의 숏보우', type: 'bow', rarity: 'Rare', atk: 22, sellPrice: 250, icon: '🏹✨' },
    bow_epic: { name: '폭풍의 엘븐 보우', type: 'bow', rarity: 'Epic', atk: 55, sellPrice: 2500, icon: '🎯🔥' },
    bow_legendary: { name: '천둥의 스톰브링어', type: 'bow', rarity: 'Legendary', atk: 125, sellPrice: 10000, icon: '🏹⚡' },
    bow_mythic: { name: '태양의 신궁 아폴론', type: 'bow', rarity: 'Mythic', atk: 300, sellPrice: 100000, icon: '🏹🌌' },

    staff_common: { name: '새싹의 허브 지팡이', type: 'staff', rarity: 'Common', atk: 4, sellPrice: 50, icon: '🌿' },
    staff_rare: { name: '축복의 성수 지팡이', type: 'staff', rarity: 'Rare', atk: 12, sellPrice: 250, icon: '💧✨' },
    staff_epic: { name: '요정의 생명 지팡이', type: 'staff', rarity: 'Epic', atk: 35, sellPrice: 2500, icon: '🔮🌿' },
    staff_legendary: { name: '세라핌의 치유 지팡이', type: 'staff', rarity: 'Legendary', atk: 80, sellPrice: 10000, icon: '🌟💖' },
    staff_mythic: { name: '세계수의 영원한 생명', type: 'staff', rarity: 'Mythic', atk: 200, sellPrice: 100000, icon: '🌌✨' },

    hidden_hong: { name: '홍인준의 뱃살 방패', type: 'shield', rarity: 'Mythic', atk: 600, sellPrice: 100000, icon: '🐷🛡️' }
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
    parties: {}
};

function getRandomWeaponKey() {
    const types = ['knife', 'shield', 'bow', 'staff'];
    const selectedType = types[Math.floor(Math.random() * types.length)];
    const rand = Math.random();
    let rarity = 'Common';
    if (rand < 0.001) rarity = 'Mythic';
    else if (rand < 0.020) rarity = 'Legendary';
    else if (rand < 0.100) rarity = 'Epic';
    else if (rand < 0.300) rarity = 'Rare';
    return `${selectedType}_${rarity.toLowerCase()}`;
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
    let baseAtk = 8;
    let rarityMul = 1.0;
    if (eq) {
        rarityMul = getRarityMultiplier(eq.rarity);
        baseAtk = (eq.atk * (1 + (eq.enhance || 0) * 0.15)) * rarityMul;
    }
    return Math.round(baseAtk + (p.bonusAtk || 0));
}

setInterval(() => {
    let updated = false;
    Object.values(gameState.players).forEach(p => {
        if (p.hp > 0) {
            p.hp = Math.max(0, p.hp - 5);
            updated = true;
            if (p.hp === 0) {
                if (p.equippedIndex !== null && p.inventory[p.equippedIndex]) {
                    p.inventory.splice(p.equippedIndex, 1);
                    p.equippedIndex = null;
                }
            }
        }
    });
    if (updated) io.emit('updateState', gameState);
}, 10000);

io.on('connection', (socket) => {
    gameState.players[socket.id] = {
        id: socket.id,
        name: `용사_${socket.id.substring(0, 4)}`,
        hp: 100,
        maxHp: 100,
        gold: 500,
        totalDamage: 0,
        inventory: [],
        equippedIndex: null,
        usedCoupons: [],
        lastSkillTime: 0,
        partyId: null
    };
    io.emit('updateState', gameState);

    socket.on('setNickname', (newName) => {
        const p = gameState.players[socket.id];
        if (p && newName) {
            p.name = newName.trim().substring(0, 12);
            io.emit('updateState', gameState);
        }
    });

    socket.on('drawGacha', () => {
        const p = gameState.players[socket.id];
        if (!p || p.gold < 1000 || p.inventory.length >= 36) return;
        p.gold -= 1000;
        const wKey = getRandomWeaponKey();
        const w = { ...WEAPON_DB[wKey], id: Date.now() + Math.random(), enhance: 0 };
        p.inventory.push(w);
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
        checkBossKill(p);
        io.emit('updateState', gameState);
    });

    socket.on('useSkill', () => {
        const p = gameState.players[socket.id];
        if (!p || p.hp <= 0) return;
        const now = Date.now();
        if (now - (p.lastSkillTime || 0) < 5000) {
            socket.emit('skillResult', { success: false, message: '⏳ 스킬 쿨타임 중입니다!' });
            return;
        }
        p.lastSkillTime = now;

        let eq = p.equippedIndex !== null ? p.inventory[p.equippedIndex] : null;
        let weaponType = eq ? eq.type : 'none';
        let rarityMul = eq ? getRarityMultiplier(eq.rarity) : 1.0;
        let baseAtk = eq ? eq.atk : 10;

        if (weaponType === 'staff') {
            let target = p;
            let lowestRatio = p.hp / p.maxHp;
            Object.values(gameState.players).forEach(other => {
                if (other.hp > 0 && (other.hp / other.maxHp) < lowestRatio) {
                    lowestRatio = other.hp / other.maxHp;
                    target = other;
                }
            });
            let healAmt = Math.round((baseAtk * 2 * rarityMul) + 150);
            target.hp = Math.min(target.maxHp, target.hp + healAmt);
            p.gold += 30;
            socket.emit('skillResult', { success: true, message: `🌿 [세계수의 축복] 발동! [${target.name}] 체력 ${healAmt} 회복!` });
        } else if (weaponType === 'shield') {
            let healAmt = Math.round((baseAtk * 1.5 * rarityMul) + 100);
            p.hp = Math.min(p.maxHp, p.hp + healAmt);
            p.gold += 25;
            socket.emit('skillResult', { success: true, message: `🛡️ [절대 방벽] 발동! 내 체력 ${healAmt} 회복!` });
        } else if (weaponType === 'bow') {
            let skillDmg = Math.round((baseAtk * rarityMul * 2.2) + (p.bonusAtk || 0));
            gameState.boss.currentHp -= skillDmg;
            p.totalDamage += skillDmg;
            p.gold += 45;
            socket.emit('skillResult', { success: true, message: `🏹 [스톰 래피드] 적중! ${skillDmg} 대미지!` });
            checkBossKill(p);
        } else {
            let skillDmg = Math.round((baseAtk * rarityMul * 2.5) + (p.bonusAtk || 0));
            gameState.boss.currentHp -= skillDmg;
            p.totalDamage += skillDmg;
            p.gold += 50;
            socket.emit('skillResult', { success: true, message: `🗡️ [그림자 멸살검] 적중! ${skillDmg} 대미지!` });
            checkBossKill(p);
        }
        io.emit('updateState', gameState);
    });

    function checkBossKill(p) {
        if (gameState.boss.currentHp <= 0) {
            const wKey = getRandomWeaponKey();
            const w = { ...WEAPON_DB[wKey], id: Date.now() + Math.random(), enhance: 0 };
            if (p.inventory.length < 36) {
                p.inventory.push(w);
                socket.emit('itemObtained', { weapon: w, full: false });
            } else {
                socket.emit('itemObtained', { weapon: w, full: true });
            }
            gameState.boss = { ...BOSS_LIST[Math.floor(Math.random() * BOSS_LIST.length)] };
        }
    }

    // 파티 생성 (이름 지정)
    socket.on('createParty', (partyName) => {
        const p = gameState.players[socket.id];
        if (!p || p.partyId) return;
        const cleanName = (partyName || '무명의 파티').trim().substring(0, 15);
        const partyId = 'party_' + Date.now();
        gameState.parties[partyId] = { name: cleanName, leader: socket.id, members: [socket.id] };
        p.partyId = partyId;
        socket.emit('partyResult', { success: true, message: `🎉 [${cleanName}] 파티를 생성했습니다!` });
        io.emit('updateState', gameState);
    });

    // 파티 목록 요청
    socket.on('getPartyList', () => {
        const list = Object.keys(gameState.parties).map(id => ({
            id: id,
            name: gameState.parties[id].name,
            count: gameState.parties[id].members.length
        }));
        socket.emit('partyListResult', list);
    });

    // 파티 참여
    socket.on('joinParty', (partyId) => {
        const p = gameState.players[socket.id];
        if (!p || p.partyId || !gameState.parties[partyId]) return;
        const party = gameState.parties[partyId];
        if (party.members.length >= 4) {
            socket.emit('skillResult', { success: false, message: '⚠️ 파티 정원이 가득 찼습니다 (최대 4인).' });
            return;
        }
        party.members.push(socket.id);
        p.partyId = partyId;
        socket.emit('partyResult', { success: true, message: `✨ [${party.name}] 파티에 참여했습니다!` });
        io.emit('updateState', gameState);
    });

    // 파티 탈퇴
    socket.on('leaveParty', () => {
        const p = gameState.players[socket.id];
        if (!p || !p.partyId) return;
        const partyId = p.partyId;
        const party = gameState.parties[partyId];
        if (party) {
            party.members = party.members.filter(id => id !== socket.id);
            if (party.members.length === 0) {
                delete gameState.parties[partyId];
            } else if (party.leader === socket.id) {
                party.leader = party.members[0];
            }
        }
        p.partyId = null;
        socket.emit('partyResult', { success: true, message: '👋 파티를 탈퇴했습니다.' });
        io.emit('updateState', gameState);
    });

    socket.on('useCoupon', (code) => {
        const p = gameState.players[socket.id];
        if (!p || p.usedCoupons.includes(code) || !COUPONS[code]) return;
        p.usedCoupons.push(code);
        const c = COUPONS[code];
        if (c.type === 'gold') {
            p.gold += c.reward;
            socket.emit('couponResult', { success: true, message: `💰 ${c.reward} 골드 획득!` });
        } else if (c.type === 'weapon' && p.inventory.length < 36) {
            const w = { ...WEAPON_DB[c.reward], id: Date.now() + Math.random(), enhance: 0 };
            p.inventory.push(w);
            socket.emit('couponResult', { success: true, message: `🎉 [${w.name}] 획득!` });
        }
        io.emit('updateState', gameState);
    });

    socket.on('equipItem', (idx) => {
        const p = gameState.players[socket.id];
        if (p && p.inventory[idx]) {
            p.equippedIndex = p.equippedIndex === idx ? null : idx;
            io.emit('updateState', gameState);
        }
    });

    socket.on('sellItem', (idx) => {
        const p = gameState.players[socket.id];
        if (p && p.inventory[idx]) {
            const sold = p.inventory.splice(idx, 1)[0];
            p.gold += sold.sellPrice;
            if (p.equippedIndex === idx) p.equippedIndex = null;
            else if (p.equippedIndex > idx) p.equippedIndex--;
            io.emit('updateState', gameState);
        }
    });

    socket.on('enhanceItem', (idx) => {
        const p = gameState.players[socket.id];
        if (p && p.inventory[idx]) {
            const item = p.inventory[idx];
            const currentLevel = item.enhance || 0;
            const cost = (currentLevel + 1) * 400;

            if (p.gold >= cost) {
                p.gold -= cost;
                let successChance = Math.max(20, 100 - (currentLevel * 6)); 
                const roll = Math.random() * 100;
                if (roll <= successChance) {
                    item.enhance = currentLevel + 1;
                    socket.emit('enhanceResult', { success: true, message: `✨ 강화 성공! (+${item.enhance})` });
                } else {
                    socket.emit('enhanceResult', { success: false, message: `💥 강화 실패... 골드가 소모되었습니다.` });
                }
                io.emit('updateState', gameState);
            }
        }
    });

    socket.on('adminAction', (data) => {
        const { action, payload } = data;
        if (action === 'spawnBoss') {
            const map = { 'pig': 0, 'goliath': 1, 'iraso': 2, 'dragon': 3 };
            if (map[payload] !== undefined) gameState.boss = { ...BOSS_LIST[map[payload]] };
        }
        if (action === 'killBoss') gameState.boss.currentHp = 0;
        if (action === 'giveGold') { const t = gameState.players[payload.targetId]; if(t) t.gold += payload.amount; }
        if (action === 'giveMythic') { const t = gameState.players[payload.targetId]; if(t && t.inventory.length < 36) t.inventory.push({ ...WEAPON_DB.knife_mythic, id: Date.now(), enhance: 0 }); }
        if (action === 'boostAtk') { const t = gameState.players[payload.targetId]; if(t) t.bonusAtk = (t.bonusAtk || 0) + payload.amount; }
        if (action === 'setRankScore') { const t = gameState.players[payload.targetId]; if(t) t.totalDamage = payload.score; }
        io.emit('updateState', gameState);
    });

    socket.on('disconnect', () => {
        const p = gameState.players[socket.id];
        if (p && p.partyId && gameState.parties[p.partyId]) {
            const party = gameState.parties[p.partyId];
            party.members = party.members.filter(id => id !== socket.id);
            if (party.members.length === 0) delete gameState.parties[p.partyId];
        }
        delete gameState.players[socket.id];
        io.emit('updateState', gameState);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`서버 가동 포트: ${PORT}`));
