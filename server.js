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
    { name: '🐷 꿀신', maxHp: 1200000, currentHp: 1200000 },
    { name: '🗿 골리앗', maxHp: 1700000, currentHp: 1700000 },
    { name: '🦖 이라소', maxHp: 5000000, currentHp: 5000000 },
    { name: '🐉 드래곤', maxHp: 10000000, currentHp: 10000000 }
];

// ✨ 무기 DB (지팡이 회복량 및 등급별 스킬명/효과 포함)
const WEAPON_DB = {
    // 1. 검
    knife_common: { name: '녹슨 도살도', type: 'knife', rarity: 'Common', atk: 15, sellPrice: 50, icon: '🔪', skillName: '찌르기' },
    knife_rare: { name: '혈각의 서사도', type: 'knife', rarity: 'Rare', atk: 45, sellPrice: 250, icon: '🗡️', skillName: '연속 참격' },
    knife_epic: { name: '흑염의 사도검', type: 'knife', rarity: 'Epic', atk: 120, sellPrice: 2500, icon: '🗡️🔥', skillName: '흑염의 처형검' },
    knife_legendary: { name: '피빛의 소울리퍼', type: 'knife', rarity: 'Legendary', atk: 380, sellPrice: 10000, icon: '⚔️🩸', skillName: '소울 리퍼의 낫질' },
    knife_mythic: { name: '심연의 핏빛 멸살검', type: 'knife', rarity: 'Mythic', atk: 1500, sellPrice: 100000, icon: '🗡️💀', skillName: '심연의 핏빛 멸살검' },

    // 2. 활
    bow_common: { name: '부러진 나무활', type: 'bow', rarity: 'Common', atk: 14, sellPrice: 50, icon: '🏹', skillName: '조준 발사' },
    bow_rare: { name: '정밀한 사냥꾼의 활', type: 'bow', rarity: 'Rare', atk: 42, sellPrice: 250, icon: '🏹✨', skillName: '속사' },
    bow_epic: { name: '폭풍의 질풍궁', type: 'bow', rarity: 'Epic', atk: 115, sellPrice: 2500, icon: '🏹🌪️', skillName: '폭풍의 낙화궁' },
    bow_legendary: { name: '태양의 엘븐 롱보우', type: 'bow', rarity: 'Legendary', atk: 360, sellPrice: 10000, icon: '🏹☀️', skillName: '태양의 일점사' },
    bow_mythic: { name: '천공을 꿰뚫는 스나이퍼', type: 'bow', rarity: 'Mythic', atk: 1450, sellPrice: 100000, icon: '🏹💫', skillName: '천공의 스나이퍼' },

    // 3. 방패
    shield_common: { name: '나무 냄비뚜껑', type: 'shield', rarity: 'Common', atk: 8, sellPrice: 50, icon: '🛡️', skillName: '가드' },
    shield_rare: { name: '수호자의 가디언 실드', type: 'shield', rarity: 'Rare', atk: 25, sellPrice: 250, icon: '🛡️✨', skillName: '철벽 방어' },
    shield_epic: { name: '불멸의 가고일 방패', type: 'shield', rarity: 'Epic', atk: 70, sellPrice: 2500, icon: '🛡️🗿', skillName: '불멸의 가고일 가드' },
    shield_legendary: { name: '성기사의 천상 실드', type: 'shield', rarity: 'Legendary', atk: 220, sellPrice: 10000, icon: '🛡️👑', skillName: '성기사의 천상 결계' },
    shield_mythic: { name: '신성한 절대자의 결계', type: 'shield', rarity: 'Mythic', atk: 900, sellPrice: 100000, icon: '🛡️❇️', skillName: '절대자의 무적 방패' },

    // 4. 지팡이 (회복량 커먼 10, 레어 20, 에픽 30, 레전더리 40, 신화 50)
    staff_common: { name: '빛 바랜 나뭇가지', type: 'staff', rarity: 'Common', atk: 10, sellPrice: 50, icon: '🪄', heal: 10, skillName: '작은 치유 (+10)' },
    staff_rare: { name: '견습 메딕의 지팡이', type: 'staff', rarity: 'Rare', atk: 32, sellPrice: 250, icon: '🪄💖', heal: 20, skillName: '정령의 숨결 (+20)' },
    staff_epic: { name: '정령의 생명 지팡이', type: 'staff', rarity: 'Epic', atk: 90, sellPrice: 2500, icon: '🪄🌿', heal: 30, skillName: '대자연의 생명 부활진 (+30)' },
    staff_legendary: { name: '대현자의 홀', type: 'staff', rarity: 'Legendary', atk: 280, sellPrice: 10000, icon: '🪄🔮', heal: 40, skillName: '대현자의 마력 폭풍 (+40)' },
    staff_mythic: { name: '태초의 세라핌 스태프', type: 'staff', rarity: 'Mythic', atk: 1100, sellPrice: 100000, icon: '🪄✨', heal: 50, skillName: '태초의 세라핌 강림 (+50)' },

    hidden_hong: { name: '홍인준의 뱃살 방패', type: 'shield_special', rarity: 'Mythic', atk: 1600, sellPrice: 100000, icon: '🐷🛡️', skillName: '뱃살 철벽' }
};

const COUPONS = {
    'WCDI26070123': { type: 'gold', reward: 1000 },
    'Fiwndq9': { type: 'weapon', reward: 'hidden_hong' }
};

let gameState = {
    boss: { ...BOSS_LIST[0] },
    players: {},
    fieldDrops: [] // 필드에 드랍된 무기 목록
};

function getRandomWeaponKey() {
    const randRarity = Math.random();
    let rarity = 'Common';
    if (randRarity < 0.001) rarity = 'Mythic';
    else if (randRarity < 0.020) rarity = 'Legendary';
    else if (randRarity < 0.100) rarity = 'Epic';
    else if (randRarity < 0.300) rarity = 'Rare';
    else rarity = 'Common';

    const types = ['knife', 'bow', 'shield', 'staff'];
    const chosenType = types[Math.floor(Math.random() * types.length)];
    return `${chosenType}_${rarity.toLowerCase()}`;
}

// ⏰ 10초마다 보스 반격 (사망 시 장착 무기 필드 드랍 발동)
setInterval(() => {
    let updated = false;
    Object.entries(gameState.players).forEach(([id, p]) => {
        if (p.hp > 0) {
            p.hp = Math.max(0, p.hp - 5);
            updated = true;

            // 체력이 0이 되어 사망한 경우!
            if (p.hp === 0 && p.equippedIndex !== null) {
                const droppedWeapon = p.inventory.splice(p.equippedIndex, 1)[0];
                p.equippedIndex = null;
                // 필드에 드랍 추가
                gameState.fieldDrops.push({
                    id: Date.now() + Math.random(),
                    weapon: droppedWeapon,
                    droppedBy: p.name
                });
                io.to(id).emit('notify', `💀 사망하여 장착 중인 [${droppedWeapon.name}]이(가) 필드에 드랍되었습니다!`);
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
        usedCoupons: []
    };
    io.emit('updateState', gameState);

    socket.on('setNickname', (newName) => {
        const p = gameState.players[socket.id];
        if (p && newName && typeof newName === 'string') {
            p.name = newName.trim().substring(0, 12);
            io.emit('updateState', gameState);
        }
    });

    socket.on('attack', () => {
        const p = gameState.players[socket.id];
        if (!p) return;
        if (p.hp <= 0) p.hp = p.maxHp; // 부활

        let eq = p.equippedIndex !== null ? p.inventory[p.equippedIndex] : null;
        let baseAtk = eq ? (eq.atk * (1 + (eq.enhance || 0) * 0.4)) : 10;
        let dmg = Math.round(baseAtk + (p.bonusAtk || 0));

        // 지팡이 계열일 경우 공격 시 체력 회복 효과 적용
        if (eq && eq.type === 'staff' && eq.heal) {
            p.hp = Math.min(p.maxHp, p.hp + eq.heal);
        }

        gameState.boss.currentHp -= dmg;
        p.totalDamage = (p.totalDamage || 0) + dmg;
        p.gold += 15;

        let effectData = { type: eq ? eq.type : 'normal', skillName: eq ? eq.skillName : '일반 공격', dmg };

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

        socket.emit('attackEffect', effectData);
        io.emit('updateState', gameState);
    });

    // 필드 드랍 아이템 줍기
    socket.on('pickupDrop', (dropId) => {
        const p = gameState.players[socket.id];
        if (!p || p.inventory.length >= 36) {
            socket.emit('notify', '🎒 인벤토리가 가득 찼습니다!');
            return;
        }
        const idx = gameState.fieldDrops.findIndex(d => d.id === dropId);
        if (idx !== -1) {
            const drop = gameState.fieldDrops.splice(idx, 1)[0];
            p.inventory.push(drop.weapon);
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
        
        if (action === 'giveSpecificWeapon') {
            const t = gameState.players[payload.targetId];
            if (t && t.inventory.length < 36) {
                const key = `${payload.weaponType}_${payload.rarity}`;
                if (WEAPON_DB[key]) {
                    t.inventory.push({ ...WEAPON_DB[key], id: Date.now() + Math.random(), enhance: 0 });
                }
            }
        }

        if (action === 'kickPlayer') {
            const targetSocket = io.sockets.sockets.get(payload.targetId);
            if (targetSocket) {
                targetSocket.emit('kicked');
                targetSocket.disconnect(true);
            }
        }

        if (action === 'adminRemoveItem') {
            const t = gameState.players[payload.targetId];
            if (t && t.inventory[payload.itemIndex] !== undefined) {
                t.inventory.splice(payload.itemIndex, 1);
                if (t.equippedIndex === payload.itemIndex) t.equippedIndex = null;
                else if (t.equippedIndex > payload.itemIndex) t.equippedIndex--;
            }
        }

        io.emit('updateState', gameState);
    });

    socket.on('disconnect', () => {
        delete gameState.players[socket.id];
        io.emit('updateState', gameState);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`서버 가동 포트: ${PORT}`));
