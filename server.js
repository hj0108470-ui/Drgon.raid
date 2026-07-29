const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.static(path.join(__dirname, 'public')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// 👾 보스 체력도 10배 상향 유지
const BOSS_LIST = [
    { name: '🐷 꿀신', maxHp: 1575000, currentHp: 1575000 },
    { name: '🗿 골리앗', maxHp: 3675000, currentHp: 3675000 },
    { name: '🦖 이라소', maxHp: 8400000, currentHp: 8400000 },
    { name: '🐉 드래곤', maxHp: 21000000, currentHp: 21000000 }
];

// ⚔️ 모든 무기 기본 공격력(atk) 및 판매가격 10배 적용
const WEAPON_DB = {
    knife_common: { name: '녹슨 도살도', type: 'knife', rarity: 'Common', atk: 100, sellPrice: 500, icon: '🔪' },
    knife_rare: { name: '혈각의 서사도', type: 'knife', rarity: 'Rare', atk: 250, sellPrice: 2500, icon: '🗡️' },
    knife_epic: { name: '흑염의 사도검', type: 'knife', rarity: 'Epic', atk: 600, sellPrice: 25000, icon: '🗡️🔥' },
    knife_legendary: { name: '피빛의 소울리퍼', type: 'knife', rarity: 'Legendary', atk: 1400, sellPrice: 100000, icon: '⚔️🩸' },
    knife_mythic: { name: '심연의 핏빛 멸살검', type: 'knife', rarity: 'Mythic', atk: 3500, sellPrice: 1000000, icon: '🗡️💀' },

    shield_common: { name: '나무 냄비뚜껑', type: 'shield', rarity: 'Common', atk: 60, shieldDuration: 10, sellPrice: 500, icon: '🛡️' },
    shield_rare: { name: '수호자의 가디언 실드', type: 'shield', rarity: 'Rare', atk: 180, shieldDuration: 12, sellPrice: 2500, icon: '🛡️✨' },
    shield_epic: { name: '불멸의 가고일 방패', type: 'shield', rarity: 'Epic', atk: 450, shieldDuration: 14, sellPrice: 25000, icon: '🛡️🗿' },
    shield_legendary: { name: '성기사의 천상 실드', type: 'shield', rarity: 'Legendary', atk: 1000, shieldDuration: 16, sellPrice: 100000, icon: '🛡️👑' },
    shield_mythic: { name: '신성한 절대자의 결계', type: 'shield', rarity: 'Mythic', atk: 2500, shieldDuration: 20, sellPrice: 1000000, icon: '🛡️❇️' },

    bow_common: { name: '굽은 나무활', type: 'bow', rarity: 'Common', atk: 80, sellPrice: 500, icon: '🏹' },
    bow_rare: { name: '사냥꾼의 숏보우', type: 'bow', rarity: 'Rare', atk: 220, sellPrice: 2500, icon: '🏹✨' },
    bow_epic: { name: '폭풍의 엘븐 보우', type: 'bow', rarity: 'Epic', atk: 550, sellPrice: 25000, icon: '🎯🔥' },
    bow_legendary: { name: '천둥의 스톰브링어', type: 'bow', rarity: 'Legendary', atk: 1250, sellPrice: 100000, icon: '🏹⚡' },
    bow_mythic: { name: '태양의 신궁 아폴론', type: 'bow', rarity: 'Mythic', atk: 3000, sellPrice: 1000000, icon: '🏹🌌' },

    staff_common: { name: '새싹의 허브 지팡이', type: 'staff', rarity: 'Common', atk: 40, heal: 100, targets: 1, sellPrice: 500, icon: '🌿' },
    staff_rare: { name: '축복의 성수 지팡이', type: 'staff', rarity: 'Rare', atk: 120, heal: 150, targets: 1, sellPrice: 2500, icon: '💧✨' },
    staff_epic: { name: '요정의 생명 지팡이', type: 'staff', rarity: 'Epic', atk: 350, heal: 200, targets: 1, sellPrice: 25000, icon: '🔮🌿' },
    staff_legendary: { name: '세라핌의 치유 지팡이', type: 'staff', rarity: 'Legendary', atk: 800, heal: 250, targets: 1, sellPrice: 100000, icon: '🌟💖' },
    staff_mythic: { name: '세계수의 영원한 생명', type: 'staff', rarity: 'Mythic', atk: 2000, heal: 300, targets: 2, sellPrice: 1000000, icon: '🌌✨' },

    hidden_hong: { name: '홍인준의 뱃살 방패', type: 'shield', rarity: 'Mythic', atk: 6000, shieldDuration: 25, sellPrice: 1000000, icon: '🐷🛡️' }
};

const COUPONS = {
    'WCDI26070123': { type: 'gold', reward: 10000 },
    'Fiwndq9': { type: 'weapon', reward: 'hidden_hong' },
    'ddddf1014': { type: 'gold', reward: 50000 },
    'HGAD026781': { type: 'gold', reward: 30000 },
    'HIJPIG12': { type: 'weapon', reward: 'hidden_hong' }
};

let gameState = {
    boss: { ...BOSS_LIST[0] },
    players: {},
    registeredAccounts: {},
    parties: {}
};

function saveAccountState(p) {
    if (p && gameState.registeredAccounts[p.name]) {
        gameState.registeredAccounts[p.name].gold = p.gold;
        gameState.registeredAccounts[p.name].hp = p.hp;
        gameState.registeredAccounts[p.name].inventory = p.inventory;
        gameState.registeredAccounts[p.name].equippedIndex = p.equippedIndex;
        gameState.registeredAccounts[p.name].totalDamage = p.totalDamage;
    }
}

function getRandomWeaponKey() {
    const types = ['knife', 'shield', 'bow', 'staff'];
    const selectedType = types[Math.floor(Math.random() * types.length)];
    const rand = Math.random() * 100;
    
    let rarity = 'Common';
    if (rand < 1.5) rarity = 'Mythic';
    else if (rand < 1.5 + 5.5) rarity = 'Legendary';
    else if (rand < 1.5 + 5.5 + 13.0) rarity = 'Epic';
    else if (rand < 1.5 + 5.5 + 13.0 + 30.0) rarity = 'Rare';
    else rarity = 'Common';

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

// 🎯 기본 데미지 계산 (무기 장착 안 했을 때 기본공격력도 80으로 10배 적용)
function calculateDamage(p) {
    let eq = p.equippedIndex !== null ? p.inventory[p.equippedIndex] : null;
    let baseAtk = 80; 
    let rarityMul = 1.0;
    if (eq) {
        rarityMul = getRarityMultiplier(eq.rarity);
        baseAtk = (eq.atk * (1 + (eq.enhance || 0) * 0.15)) * rarityMul;
    }
    return Math.round(baseAtk + (p.bonusAtk || 0));
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
            nickname, password, hp: 1000, maxHp: 1000, gold: 5000,
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
            hp: account.hp !== undefined ? account.hp : 1000,
            maxHp: account.maxHp !== undefined ? account.maxHp : 1000,
            gold: account.gold !== undefined ? account.gold : 5000,
            inventory: account.inventory ? [...account.inventory] : [],
            equippedIndex: account.equippedIndex !== undefined ? account.equippedIndex : null,
            totalDamage: account.totalDamage || 0,
            bonusAtk: account.bonusAtk || 0,
            lastSkillTime: 0, 
            isInvincible: false, 
            invincibleUntil: 0, 
            partyId: null
        };

        socket.emit('loginSuccess', { success: true, player: gameState.players[socket.id] });
        io.emit('updateState', gameState);
    });

    socket.on('sellItems', (indices) => {
        const p = gameState.players[socket.id];
        if (!p || !Array.isArray(indices) || indices.length === 0) return;

        const uniqueIndices = [...new Set(indices)].sort((a, b) => b - a);
        let totalEarnedGold = 0;

        uniqueIndices.forEach(idx => {
            if (idx >= 0 && idx < p.inventory.length) {
                const soldItem = p.inventory[idx];
                totalEarnedGold += (soldItem.sellPrice || 0);
                p.inventory.splice(idx, 1);

                if (p.equippedIndex === idx) {
                    p.equippedIndex = null;
                } else if (p.equippedIndex !== null && p.equippedIndex > idx) {
                    p.equippedIndex--;
                }
            }
        });

        p.gold += totalEarnedGold;
        saveAccountState(p);

        socket.emit('sellResult', { success: true, message: `💰 총 ${totalEarnedGold.toLocaleString()} 골드 획득!` });
        io.emit('updateState', gameState);
    });

    socket.on('deleteItems', (indices) => {
        const p = gameState.players[socket.id];
        if (!p || !Array.isArray(indices) || indices.length === 0) return;

        const uniqueIndices = [...new Set(indices)].sort((a, b) => b - a);

        uniqueIndices.forEach(idx => {
            if (idx >= 0 && idx < p.inventory.length) {
                p.inventory.splice(idx, 1);

                if (p.equippedIndex === idx) {
                    p.equippedIndex = null;
                } else if (p.equippedIndex !== null && p.equippedIndex > idx) {
                    p.equippedIndex--;
                }
            }
        });

        saveAccountState(p);

        socket.emit('deleteResult', { success: true, message: `🗑️ 선택한 무기들이 삭제되었습니다.` });
        io.emit('updateState', gameState);
    });

    socket.on('drawGacha', () => {
        const p = gameState.players[socket.id];
        if (!p || p.gold < 10000 || p.inventory.length >= 36) return;
        p.gold -= 10000;
        const wKey = getRandomWeaponKey();
        const w = { ...WEAPON_DB[wKey], id: Date.now() + Math.random(), enhance: 0 };
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
        p.gold += 150;
        saveAccountState(p);

        checkBossKill(p);
        io.emit('updateState', gameState);
    });

    // ⚡ 스킬 데미지 및 회복 수치 10배 적용
    socket.on('useSkill', () => {
        const p = gameState.players[socket.id];
        if (!p || p.hp <= 0) return;
        const now = Date.now();
        
        let eq = p.equippedIndex !== null ? p.inventory[p.equippedIndex] : null;
        let weaponType = eq ? eq.type : 'none';
        let rarityMul = eq ? getRarityMultiplier(eq.rarity) : 1.0;
        let baseAtk = eq ? eq.atk : 100; // 지팡이/근접무기 기본 공격력 10배 적용

        let currentCooldown = (weaponType === 'shield') ? ((eq.shieldDuration || 10) + 5) * 1000 : 5000;
        if (now - (p.lastSkillTime || 0) < currentCooldown) {
            socket.emit('skillResult', { success: false, message: '⏳ 스킬 쿨타임 중입니다!' });
            return;
        }
        p.lastSkillTime = now;

        if (weaponType === 'staff') {
            let healBase = eq.heal || 100; // 지팡이 힐량 10배 반영
            let totalHealAmt = Math.round((healBase * rarityMul) + 200);
            p.hp = Math.min(p.maxHp, p.hp + totalHealAmt);
            p.gold += 300;
            socket.emit('skillResult', { success: true, message: `🌿 [치유의 파동] 체력 ${totalHealAmt} 회복!` });
        } else if (weaponType === 'shield') {
            let durationSec = eq.shieldDuration || 10;
            p.isInvincible = true;
            p.invincibleUntil = now + (durationSec * 1000);
            p.gold += 250;
            socket.emit('skillResult', { success: true, message: `🛡️ [절대 방벽] ${durationSec}초 무적!` });
        } else {
            // 무기 스킬 데미지 10배 반영 (baseAtk가 이미 10배임)
            let skillDmg = Math.round((baseAtk * rarityMul * 2.5) + (p.bonusAtk || 0));
            gameState.boss.currentHp -= skillDmg;
            p.totalDamage += skillDmg;
            p.gold += 500;
            socket.emit('skillResult', { success: true, message: `⚔️ 스킬 적중! ${skillDmg} 대미지!` });
            checkBossKill(p);
        }
        saveAccountState(p);
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
            saveAccountState(p);
        }
    }

    socket.on('createParty', (partyName) => {
        const p = gameState.players[socket.id];
        if (!p || p.partyId) return;
        const partyId = 'party_' + Date.now();
        gameState.parties[partyId] = { name: partyName.trim(), leader: socket.id, members: [socket.id] };
        p.partyId = partyId;
        socket.emit('partyResult', { success: true, message: '🎉 파티 생성 완료!' });
        io.emit('updateState', gameState);
    });

    socket.on('getPartyList', () => {
        const list = Object.keys(gameState.parties).map(id => ({
            id, name: gameState.parties[id].name, count: gameState.parties[id].members.length
        }));
        socket.emit('partyListResult', list);
    });

    socket.on('joinParty', (partyId) => {
        const p = gameState.players[socket.id];
        if (!p || p.partyId || !gameState.parties[partyId]) return;
        gameState.parties[partyId].members.push(socket.id);
        p.partyId = partyId;
        socket.emit('partyResult', { success: true, message: '✨ 파티 참여 완료!' });
        io.emit('updateState', gameState);
    });

    socket.on('leaveParty', () => {
        const p = gameState.players[socket.id];
        if (!p || !p.partyId) return;
        delete p.partyId;
        socket.emit('partyResult', { success: true, message: '👋 파티 탈퇴 완료.' });
        io.emit('updateState', gameState);
    });

    socket.on('useCoupon', (code) => {
        const p = gameState.players[socket.id];
        if (!p || !COUPONS[code]) return;
        const c = COUPONS[code];
        if (c.type === 'gold') {
            p.gold += c.reward;
            socket.emit('couponResult', { success: true, message: `💰 ${c.reward.toLocaleString()} 골드 획득!` });
        } else if (c.type === 'weapon' && p.inventory.length < 36) {
            const w = { ...WEAPON_DB[c.reward], id: Date.now() + Math.random(), enhance: 0 };
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
            const cost = ((item.enhance || 0) + 1) * 4000;
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

    socket.on('adminAction', (data) => {
        const { action, payload } = data;
        if (action === 'spawnBoss') {
            const map = { 'pig': 0, 'goliath': 1, 'iraso': 2, 'dragon': 3 };
            if (map[payload] !== undefined) gameState.boss = { ...BOSS_LIST[map[payload]] };
        }
        if (action === 'killBoss') gameState.boss.currentHp = 0;
        if (action === 'giveSpecificWeapon') {
            const target = gameState.players[payload.targetId];
            const wKey = payload.weaponKey;
            if (target && WEAPON_DB[wKey] && target.inventory.length < 36) {
                const w = { ...WEAPON_DB[wKey], id: Date.now() + Math.random(), enhance: 0 };
                target.inventory.push(w);
                saveAccountState(target);
                io.to(target.id).emit('itemObtained', { weapon: w, full: false });
            }
        }
        io.emit('updateState', gameState);
    });

    socket.on('disconnect', () => {
        const p = gameState.players[socket.id];
        if (p) saveAccountState(p);
        delete gameState.players[socket.id];
        io.emit('updateState', gameState);
    });
});

server.listen(3000, () => console.log('서버 실행 중 포트: 3000'));
