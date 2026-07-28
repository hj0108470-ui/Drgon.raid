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
    knife_common: { name: '녹슨 도살도', type: 'knife', rarity: 'Common', atk: 15, sellPrice: 50, icon: '🔪' },
    knife_rare: { name: '혈각의 서사도', type: 'knife', rarity: 'Rare', atk: 45, sellPrice: 250, icon: '🗡️' },
    knife_epic: { name: '흑염의 사도검', type: 'knife', rarity: 'Epic', atk: 120, sellPrice: 2500, icon: '🗡️🔥' },
    knife_legendary: { name: '피빛의 소울리퍼', type: 'knife', rarity: 'Legendary', atk: 380, sellPrice: 10000, icon: '⚔️🩸' },
    knife_mythic: { name: '심연의 핏빛 멸살검', type: 'knife', rarity: 'Mythic', atk: 1500, sellPrice: 100000, icon: '🗡️💀' },

    shield_common: { name: '나무 냄비뚜껑', type: 'shield', rarity: 'Common', atk: 8, sellPrice: 50, icon: '🛡️' },
    shield_rare: { name: '수호자의 가디언 실드', type: 'shield', rarity: 'Rare', atk: 25, sellPrice: 250, icon: '🛡️✨' },
    shield_epic: { name: '불멸의 가고일 방패', type: 'shield', rarity: 'Epic', atk: 70, sellPrice: 2500, icon: '🛡️🗿' },
    shield_legendary: { name: '성기사의 천상 실드', type: 'shield', rarity: 'Legendary', atk: 220, sellPrice: 10000, icon: '🛡️👑' },
    shield_mythic: { name: '신성한 절대자의 결계', type: 'shield', rarity: 'Mythic', atk: 900, sellPrice: 100000, icon: '🛡️❇️' },

    hidden_hong: { name: '홍인준의 뱃살 방패', type: 'shield_special', rarity: 'Mythic', atk: 1600, sellPrice: 100000, icon: '🐷🛡️' }
};

const COUPONS = {
    'WCDI26070123': { type: 'gold', reward: 1000 },
    'Fiwndq9': { type: 'weapon', reward: 'hidden_hong' }
};

let gameState = {
    boss: { ...BOSS_LIST[0] },
    players: {}
};

function getRandomWeaponKey() {
    const rand = Math.random();
    let rarity = 'Common';
    if (rand < 0.001) rarity = 'Mythic';
    else if (rand < 0.020) rarity = 'Legendary';
    else if (rand < 0.100) rarity = 'Epic';
    else if (rand < 0.300) rarity = 'Rare';
    else rarity = 'Common';

    const types = ['knife', 'shield'];
    return `${types[Math.floor(Math.random() * types.length)]}_${rarity.toLowerCase()}`;
}

// ⏰ 10초마다 보스가 모든 플레이어를 5씩 공격!
setInterval(() => {
    let updated = false;
    Object.values(gameState.players).forEach(p => {
        if (p.hp > 0) {
            p.hp = Math.max(0, p.hp - 5);
            updated = true;
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
        totalDamage: 0, // 랭킹용 누적 데미지
        inventory: [],
        equippedIndex: null,
        usedCoupons: []
    };
    io.emit('updateState', gameState);

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
        let eq = p.equippedIndex !== null ? p.inventory[p.equippedIndex] : null;
        let baseAtk = eq ? (eq.atk * (1 + (eq.enhance || 0) * 0.4)) : 10;
        
        // ⚔️ 조작된 추가 공격력이 있다면 반영 (없으면 기본 공격력)
        let dmg = Math.round(baseAtk + (p.bonusAtk || 0));

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
            const cost = (item.enhance + 1) * 500;
            if (p.gold >= cost) {
                p.gold -= cost;
                item.enhance = (item.enhance || 0) + 1;
                io.emit('updateState', gameState);
            }
        }
    });

    // 👑 GM 관제 센터 조작 기능 (공격력 조작, 랭킹 조작 등 포함)
    socket.on('adminAction', (data) => {
        const { action, payload } = data;
        if (action === 'spawnBoss') {
            const map = { 'pig': 0, 'goliath': 1, 'iraso': 2, 'dragon': 3 };
            if (map[payload] !== undefined) gameState.boss = { ...BOSS_LIST[map[payload]] };
        }
        if (action === 'killBoss') gameState.boss.currentHp = 0;
        if (action === 'giveGold') { const t = gameState.players[payload.targetId]; if(t) t.gold += payload.amount; }
        if (action === 'giveMythic') { const t = gameState.players[payload.targetId]; if(t && t.inventory.length < 36) t.inventory.push({ ...WEAPON_DB.knife_mythic, id: Date.now(), enhance: 0 }); }
        
        // ⚡ 공격력 조작 기능 추가
        if (action === 'boostAtk') { 
            const t = gameState.players[payload.targetId]; 
            if(t) {
                t.bonusAtk = (t.bonusAtk || 0) + payload.amount;
            } 
        }
        // 🏆 랭킹(누적 데미지) 조작 기능 추가
        if (action === 'setRankScore') { 
            const t = gameState.players[payload.targetId]; 
            if(t) {
                t.totalDamage = payload.score;
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
