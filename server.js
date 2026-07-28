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
    { name: '🐷 꿀신', maxHp: 12000, currentHp: 12000 },
    { name: '🗿 골리앗', maxHp: 17000, currentHp: 17000 },
    { name: '🦖 이라소', maxHp: 50000, currentHp: 50000 },
    { name: '🐉 드래곤', maxHp: 100000, currentHp: 100000 }
];

const WEAPON_DB = {
    // 🔪 단검류
    knife_common: { name: '녹슨 도살도', type: 'knife', rarity: 'Common', atk: 15, sellPrice: 50, icon: '🔪' },
    knife_rare: { name: '혈각의 서사도', type: 'knife', rarity: 'Rare', atk: 45, sellPrice: 250, icon: '🗡️' },
    knife_epic: { name: '흑염의 사도검', type: 'knife', rarity: 'Epic', atk: 120, sellPrice: 2500, icon: '🗡️🔥' },
    knife_legendary: { name: '피빛의 소울리퍼', type: 'knife', rarity: 'Legendary', atk: 380, sellPrice: 10000, icon: '⚔️🩸' },
    knife_mythic: { name: '심연의 핏빛 멸살검', type: 'knife', rarity: 'Mythic', atk: 1500, sellPrice: 100000, icon: '🗡️💀' },

    // 🛡️ 방패류
    shield_common: { name: '나무 냄비뚜껑', type: 'shield', rarity: 'Common', atk: 8, sellPrice: 50, icon: '🛡️' },
    shield_rare: { name: '수호자의 가디언 실드', type: 'shield', rarity: 'Rare', atk: 25, sellPrice: 250, icon: '🛡️✨' },
    shield_epic: { name: '불멸의 가고일 방패', type: 'shield', rarity: 'Epic', atk: 70, sellPrice: 2500, icon: '🛡️🗿' },
    shield_legendary: { name: '성기사의 천상 실드', type: 'shield', rarity: 'Legendary', atk: 220, sellPrice: 10000, icon: '🛡️👑' },
    shield_mythic: { name: '신성한 절대자의 결계', type: 'shield', rarity: 'Mythic', atk: 900, sellPrice: 100000, icon: '🛡️❇️' },

    // 🏹 활류
    bow_common: { name: '굽은 나무활', type: 'bow', rarity: 'Common', atk: 12, sellPrice: 50, icon: '🏹' },
    bow_rare: { name: '사냥꾼의 숏보우', type: 'bow', rarity: 'Rare', atk: 38, sellPrice: 250, icon: '🏹✨' },
    bow_epic: { name: '폭풍의 엘븐 보우', type: 'bow', rarity: 'Epic', atk: 105, sellPrice: 2500, icon: '🎯🔥' },
    bow_legendary: { name: '천둥의 스톰브링어', type: 'bow', rarity: 'Legendary', atk: 330, sellPrice: 10000, icon: '🏹⚡' },
    bow_mythic: { name: '태양의 신궁 아폴론', type: 'bow', rarity: 'Mythic', atk: 1350, sellPrice: 100000, icon: '🏹🌌' },

    // 🌿 힐/지팡이류
    staff_common: { name: '새싹의 허브 지팡이', type: 'staff', rarity: 'Common', atk: 5, sellPrice: 50, icon: '🌿' },
    staff_rare: { name: '축복의 성수 지팡이', type: 'staff', rarity: 'Rare', atk: 18, sellPrice: 250, icon: '💧✨' },
    staff_epic: { name: '요정의 생명 지팡이', type: 'staff', rarity: 'Epic', atk: 50, sellPrice: 2500, icon: '🔮🌿' },
    staff_legendary: { name: '세라핌의 치유 지팡이', type: 'staff', rarity: 'Legendary', atk: 160, sellPrice: 10000, icon: '🌟💖' },
    staff_mythic: { name: '세계수의 영원한 생명', type: 'staff', rarity: 'Mythic', atk: 700, sellPrice: 100000, icon: '🌌✨' },

    // 🎁 히든 장비 (홍인준 뱃살 방패 - 공격력 2000)
    hidden_hong: { name: '홍인준의 뱃살 방패', type: 'shield', rarity: 'Mythic', atk: 2000, sellPrice: 100000, icon: '🐷🛡️' }
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
    players: {}
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
    else rarity = 'Common';

    return `${selectedType}_${rarity.toLowerCase()}`;
}

// 🌟 등급별 추가 대미지 배율 함수
function getRarityMultiplier(rarity) {
    switch (rarity) {
        case 'Mythic': return 3.0;     // 신화: 데미지 3배 폭풍 상향
        case 'Legendary': return 2.0;  // 전설: 데미지 2배
        case 'Epic': return 1.5;       // 에픽: 데미지 1.5배
        case 'Rare': return 1.2;       // 레어: 데미지 1.2배
        default: return 1.0;           // 일반: 기본
    }
}

// 📐 실제 데미지 계산 공통 함수
function calculateDamage(p, isSkill = false) {
    let eq = p.equippedIndex !== null ? p.inventory[p.equippedIndex] : null;
    let baseAtk = 10;
    let rarityMul = 1.0;

    if (eq) {
        rarityMul = getRarityMultiplier(eq.rarity);
        // 장비 기본 공격력 + 강화 보정(+40%씩 증가) * 등급 배율
        baseAtk = (eq.atk * (1 + (eq.enhance || 0) * 0.4)) * rarityMul;
    }

    if (isSkill) {
        // 필살기: (장비공격력 * 3) + 보너스 공격력 + 고정 500
        return Math.round((baseAtk * 3) + (p.bonusAtk || 0) + 500);
    } else {
        // 일반 공격: 장비공격력 + 보너스 공격력
        return Math.round(baseAtk + (p.bonusAtk || 0));
    }
}

// ⏰ 10초마다 보스가 모든 플레이어 체력을 5씩 깎음 (사망 시 장착 무기 삭제)
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
    if (updated) {
        io.emit('updateState', gameState);
    }
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
        lastSkillTime: 0
    };
    io.emit('updateState', gameState);

    socket.on('setNickname', (newName) => {
        const p = gameState.players[socket.id];
        if (p && newName && typeof newName === 'string') {
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

        let dmg = calculateDamage(p, false);

        gameState.boss.currentHp -= dmg;
        p.totalDamage = (p.totalDamage || 0) + dmg;
        p.gold += 15;

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

        let skillDmg = calculateDamage(p, true);

        gameState.boss.currentHp -= skillDmg;
        p.totalDamage = (p.totalDamage || 0) + skillDmg;
        p.gold += 50;

        socket.emit('skillResult', { success: true, message: `⚡ 필살기 적중! ${skillDmg} 대미지!` });

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
            const cost = (currentLevel + 1) * 500;

            if (p.gold >= cost) {
                p.gold -= cost;
                let successChance = Math.max(15, 100 - (currentLevel * 7.5)); 
                const roll = Math.random() * 100;

                if (roll <= successChance) {
                    item.enhance = currentLevel + 1;
                    socket.emit('enhanceResult', { success: true, message: `✨ 강화 성공! (+${item.enhance})` });
                } else {
                    socket.emit('enhanceResult', { success: false, message: `💥 강화 실패... 골드만 소모되었습니다.` });
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
        delete gameState.players[socket.id];
        io.emit('updateState', gameState);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`서버 가동 포트: ${PORT}`));
