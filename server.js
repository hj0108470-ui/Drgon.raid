const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// -------------------------------------------------------------
// 1. 무기 및 아이템 데이터베이스 (지팡이 계열 힐 기능 포함)
// -------------------------------------------------------------
const WEAPON_DB = {
    // 단검 계열
    'knife_common': { name: '녹슨 도살도', icon: '🔪', type: 'weapon', rarity: 'Common', atk: 5, sellPrice: 50 },
    'knife_rare': { name: '혈각의 서사도', icon: '🗡️', type: 'weapon', rarity: 'Rare', atk: 15, sellPrice: 200 },
    'knife_epic': { name: '흑염의 사도검', icon: '🗡️🔥', type: 'weapon', rarity: 'Epic', atk: 40, sellPrice: 800 },
    'knife_legendary': { name: '피빛의 소울리퍼', icon: '⚔️🩸', type: 'weapon', rarity: 'Legendary', atk: 100, sellPrice: 3000 },
    'knife_mythic': { name: '심연의 핏빛 멸살검', icon: '🗡️💀', type: 'weapon', rarity: 'Mythic', atk: 250, sellPrice: 10000 },

    // 방패 계열
    'shield_common': { name: '나무 냄비뚜껑', icon: '🛡️', type: 'weapon', rarity: 'Common', atk: 2, sellPrice: 40 },
    'shield_rare': { name: '수호자의 가디언 실드', icon: '🛡️✨', type: 'weapon', rarity: 'Rare', atk: 8, sellPrice: 180 },
    'shield_epic': { name: '불멸의 가고일 방패', icon: '🛡️🗿', type: 'weapon', rarity: 'Epic', atk: 22, sellPrice: 700 },
    'shield_legendary': { name: '성기사의 천상 실드', icon: '🛡️👑', type: 'weapon', rarity: 'Legendary', atk: 55, sellPrice: 2800 },
    'shield_mythic': { name: '신성한 절대자의 결계', icon: '🛡️❇️', type: 'weapon', rarity: 'Mythic', atk: 130, sellPrice: 9000 },

    // 활 계열
    'bow_common': { name: '굽은 나무활', icon: '🏹', type: 'weapon', rarity: 'Common', atk: 6, sellPrice: 60 },
    'bow_rare': { name: '사냥꾼의 숏보우', icon: '🏹✨', type: 'weapon', rarity: 'Rare', atk: 18, sellPrice: 220 },
    'bow_epic': { name: '폭풍의 엘븐 보우', icon: '🎯🔥', type: 'weapon', rarity: 'Epic', atk: 48, sellPrice: 900 },
    'bow_legendary': { name: '천둥의 스톰브링어', icon: '🏹⚡', type: 'weapon', rarity: 'Legendary', atk: 120, sellPrice: 3500 },
    'bow_mythic': { name: '태양의 신궁 아폴론', icon: '🏹🌌', type: 'weapon', rarity: 'Mythic', atk: 300, sellPrice: 12000 },

    // 지팡이 계열 (힐 템: Common 10, Rare 15, Epic 20, Legendary 25, Mythic 30 [최대 2명])
    'staff_common': { name: '새싹의 허브 지팡이', icon: '🌿', type: 'staff', rarity: 'Common', atk: 3, heal: 10, targets: 1, sellPrice: 60 },
    'staff_rare': { name: '축복의 성수 지팡이', icon: '💧✨', type: 'staff', rarity: 'Staff', atk: 10, heal: 15, targets: 1, sellPrice: 220 },
    'staff_epic': { name: '요정의 생명 지팡이', icon: '🔮🌿', type: 'staff', rarity: 'Epic', atk: 25, heal: 20, targets: 1, sellPrice: 900 },
    'staff_legendary': { name: '세라핌의 치유 지팡이', icon: '🌟💖', type: 'staff', rarity: 'Legendary', atk: 60, heal: 25, targets: 1, sellPrice: 3500 },
    'staff_mythic': { name: '세계수의 영원한 생명', icon: '🌌✨', type: 'staff', rarity: 'Mythic', atk: 150, heal: 30, targets: 2, sellPrice: 12000 },

    // 히든 아이템
    'hidden_hong': { name: '홍인준의 뱃살 방패', icon: '🐷🛡️', type: 'weapon', rarity: 'Mythic', atk: 500, sellPrice: 50000 }
};

// -------------------------------------------------------------
// 2. 보스 데이터 (체력 10.5배 적용)
// -------------------------------------------------------------
const BOSS_LIST = [
    { key: 'pig', name: '🐷 꿀신', maxHp: 52500, currentHp: 52500, rewardGold: 3000 },
    { key: 'goliath', name: '🗿 골리앗', maxHp: 157500, currentHp: 157500, rewardGold: 8000 },
    { key: 'iraso', name: '🦖 이라소', maxHp: 525000, currentHp: 525000, rewardGold: 25000 },
    { key: 'dragon', name: '🐉 드래곤', maxHp: 1575000, currentHp: 1575000, rewardGold: 80000 }
];

let currentBossIndex = 0;
let gameState = {
    boss: { ...BOSS_LIST[0] },
    players: {},
    parties: {}
};

// 리딤 쿠폰 코드 목록
const COUPONS = {
    'WCDI26070123': { type: 'gold', amount: 1000 },
    'Fiwndq9': { type: 'item', key: 'hidden_hong' },
    'ddddf1014': { type: 'gold', amount: 5000 },
    'HGAD026781': { type: 'gold', amount: 3000 },
    'HIJPIG12': { type: 'item', key: 'hidden_hong' }
};

// 가챠 풀 (지팡이 포함)
const GACHA_POOL = [
    { key: 'knife_common', weight: 40 }, { key: 'shield_common', weight: 40 }, { key: 'bow_common', weight: 40 }, { key: 'staff_common', weight: 40 },
    { key: 'knife_rare', weight: 20 }, { key: 'shield_rare', weight: 20 }, { key: 'bow_rare', weight: 20 }, { key: 'staff_rare', weight: 20 },
    { key: 'knife_epic', weight: 8 }, { key: 'shield_epic', weight: 8 }, { key: 'bow_epic', weight: 8 }, { key: 'staff_epic', weight: 8 },
    { key: 'knife_legendary', weight: 2 }, { key: 'shield_legendary', weight: 2 }, { key: 'bow_legendary', weight: 2 }, { key: 'staff_legendary', weight: 2 },
    { key: 'knife_mythic', weight: 0.5 }, { key: 'shield_mythic', weight: 0.5 }, { key: 'bow_mythic', weight: 0.5 }, { key: 'staff_mythic', weight: 0.5 },
    { key: 'hidden_hong', weight: 0.1 }
];

function getRandomWeapon() {
    const totalWeight = GACHA_POOL.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const entry of GACHA_POOL) {
        if (rand < entry.weight) {
            const template = WEAPON_DB[entry.key];
            return { ...template, id: Date.now() + Math.random(), enhance: 0 };
        }
        rand -= entry.weight;
    }
    const fallback = WEAPON_DB['knife_common'];
    return { ...fallback, id: Date.now() + Math.random(), enhance: 0 };
}

// -------------------------------------------------------------
// 3. 소켓 통신 및 게임 로직 처리
// -------------------------------------------------------------
io.on('connection', (socket) => {
    console.log(`용사 접속: ${socket.id}`);

    // 신규 플레이어 초기화
    gameState.players[socket.id] = {
        id: socket.id,
        name: `용사_${socket.id.substring(0, 4)}`,
        hp: 100,
        maxHp: 100,
        gold: 1500,
        totalDamage: 0,
        inventory: new Array(36).fill(null),
        equippedIndex: null,
        partyId: null
    };

    // 초기 지급용 단검 1개 장착
    const starterWeapon = { ...WEAPON_DB['knife_common'], id: Date.now() + Math.random(), enhance: 0 };
    gameState.players[socket.id].inventory[0] = starterWeapon;
    gameState.players[socket.id].equippedIndex = 0;

    broadcastState();

    // 닉네임 설정
    socket.on('setNickname', (name) => {
        if (gameState.players[socket.id]) {
            gameState.players[socket.id].name = name.substring(0, 12);
            broadcastState();
        }
    });

    // 일반 공격
    socket.on('attack', () => {
        const player = gameState.players[socket.id];
        if (!player || player.hp <= 0) return;

        let dmg = 10;
        if (player.equippedIndex !== null && player.inventory[player.equippedIndex]) {
            const w = player.inventory[player.equippedIndex];
            dmg += (w.atk || 0) + ((w.enhance || 0) * 3);
        }

        applyDamageToBoss(socket.id, dmg);
    });

    // 스킬 버튼 클릭 (무기 타입에 따른 분기: 일반 공격 vs 힐 스킬)
    socket.on('useSkill', (data) => {
        const player = gameState.players[socket.id];
        if (!player || player.hp <= 0) return;

        // 지팡이(힐 템)를 장착한 경우 힐 대상 선택 처리
        if (player.equippedIndex !== null && player.inventory[player.equippedIndex]) {
            const w = player.inventory[player.equippedIndex];
            if (w.type === 'staff') {
                // 클라이언트가 보낸 타겟 ID 배열 처리 (없으면 본인 힐)
                const targetIds = (data && data.targetIds && Array.isArray(data.targetIds)) ? data.targetIds : [socket.id];
                const maxTargets = w.targets || 1;
                const validTargets = targetIds.slice(0, maxTargets);

                validTargets.forEach(tId => {
                    const targetPlayer = gameState.players[tId];
                    if (targetPlayer && targetPlayer.hp > 0) {
                        targetPlayer.hp = Math.min(targetPlayer.maxHp, targetPlayer.hp + w.heal);
                    }
                });
                broadcastState();
                return;
            }
        }

        // 일반 무기 스킬 (강한 데미지)
        let dmg = 30;
        if (player.equippedIndex !== null && player.inventory[player.equippedIndex]) {
            const w = player.inventory[player.equippedIndex];
            dmg += ((w.atk || 0) + ((w.enhance || 0) * 3)) * 2;
        }
        applyDamageToBoss(socket.id, dmg);
    });

    // 가챠 뽑기
    socket.on('drawGacha', () => {
        const player = gameState.players[socket.id];
        if (!player || player.hp <= 0) return;

        if (player.gold < 1000) {
            socket.emit('gachaResult', { success: false, message: '골드가 부족합니다! (1,000G 필요)' });
            return;
        }

        player.gold -= 1000;
        const newWeapon = getRandomWeapon();

        let placed = false;
        for (let i = 0; i < 36; i++) {
            if (!player.inventory[i]) {
                player.inventory[i] = newWeapon;
                placed = true;
                break;
            }
        }

        if (placed) {
            socket.emit('gachaResult', { success: true, weapon: newWeapon });
        } else {
            socket.emit('gachaResult', { success: false, message: '가방(인벤토리)이 가득 찼습니다!' });
            player.gold += 1000; // 환불
        }
        broadcastState();
    });

    // 아이템 장착 / 해제
    socket.on('equipItem', (index) => {
        const player = gameState.players[socket.id];
        if (!player || player.hp <= 0) return;

        if (player.inventory[index]) {
            if (player.equippedIndex === index) {
                player.equippedIndex = null; // 해제
            } else {
                player.equippedIndex = index; // 장착
            }
            broadcastState();
        }
    });

    // 아이템 강화
    socket.on('enhanceItem', (index) => {
        const player = gameState.players[socket.id];
        if (!player || player.hp <= 0) return;

        const item = player.inventory[index];
        if (!item) return;

        const cost = (item.enhance + 1) * 400;
        if (player.gold < cost) {
            socket.emit('enhanceResult', { success: false, message: `골드가 부족합니다! (필요 골드: ${cost}G)` });
            return;
        }

        player.gold -= cost;
        item.enhance = (item.enhance || 0) + 1;
        socket.emit('enhanceResult', { success: true, message: `🎉 강화 성공! +${item.enhance} (${item.name})` });
        broadcastState();
    });

    // 아이템 판매
    socket.on('sellItem', (index) => {
        const player = gameState.players[socket.id];
        if (!player || player.hp <= 0) return;

        const item = player.inventory[index];
        if (!item) return;

        if (player.equippedIndex === index) {
            player.equippedIndex = null; // 장착 중인 아이템 판매 시 해제
        }

        player.gold += (item.sellPrice || 50) + ((item.enhance || 0) * 100);
        player.inventory[index] = null;
        broadcastState();
    });

    // 리딤 코드 사용
    socket.on('useCoupon', (code) => {
        const player = gameState.players[socket.id];
        if (!player || player.hp <= 0) return;

        const reward = COUPONS[code];
        if (!reward) {
            socket.emit('couponResult', { success: false, message: '유효하지 않거나 잘못된 쿠폰 코드입니다.' });
            return;
        }

        if (reward.type === 'gold') {
            player.gold += reward.amount;
            socket.emit('couponResult', { success: true, message: `🎁 쿠폰 보상 지급: ${reward.amount} 골드!` });
        } else if (reward.type === 'item') {
            const template = WEAPON_DB[reward.key];
            const newItem = { ...template, id: Date.now() + Math.random(), enhance: 0 };
            let placed = false;
            for (let i = 0; i < 36; i++) {
                if (!player.inventory[i]) {
                    player.inventory[i] = newItem;
                    placed = true;
                    break;
                }
            }
            if (placed) {
                socket.emit('couponResult', { success: true, message: `🎁 쿠폰 보상 지급: [${newItem.name}]!` });
            } else {
                socket.emit('couponResult', { success: false, message: '가방이 가득 차서 쿠폰 아이템을 받을 수 없습니다!' });
            }
        }
        broadcastState();
    });

    // 파티 시스템
    socket.on('createParty', (partyName) => {
        const player = gameState.players[socket.id];
        if (!player || player.partyId) return;

        const partyId = 'party_' + Date.now();
        gameState.parties[partyId] = {
            id: partyId,
            name: partyName,
            leader: socket.id,
            members: [socket.id]
        };
        player.partyId = partyId;
        socket.emit('partyResult', { success: true, message: '파티가 생성되었습니다!' });
        broadcastState();
    });

    socket.on('getPartyList', () => {
        const list = Object.values(gameState.parties).map(p => ({
            id: p.id,
            name: p.name,
            count: p.members.length
        }));
        socket.emit('partyListResult', list);
    });

    socket.on('joinParty', (partyId) => {
        const player = gameState.players[socket.id];
        const party = gameState.parties[partyId];
        if (!player || player.partyId || !party || party.members.length >= 4) {
            socket.emit('partyResult', { success: false, message: '파티에 참여할 수 없습니다.' });
            return;
        }
        party.members.push(socket.id);
        player.partyId = partyId;
        socket.emit('partyResult', { success: true, message: `[${party.name}] 파티에 가입했습니다!` });
        broadcastState();
    });

    socket.on('leaveParty', () => {
        const player = gameState.players[socket.id];
        if (!player || !player.partyId) return;

        const partyId = player.partyId;
        const party = gameState.parties[partyId];
        if (party) {
            party.members = party.members.filter(id => id !== socket.id);
            if (party.members.length === 0) {
                delete gameState.parties[partyId];
            } else if (party.leader === socket.id) {
                party.leader = party.members[0];
            }
        }
        player.partyId = null;
        socket.emit('partyResult', { success: true, message: '파티를 탈퇴했습니다.' });
        broadcastState();
    });

    // 어드민 제어 액션
    socket.on('adminAction', ({ action, payload }) => {
        if (action === 'spawnBoss') {
            const found = BOSS_LIST.find(b => b.key === payload);
            if (found) {
                gameState.boss = { ...found, currentHp: found.maxHp };
                broadcastState();
            }
        } else if (action === 'killBoss') {
            gameState.boss.currentHp = 0;
            checkBossDeath(socket.id);
        } else if (action === 'giveGold') {
            const target = gameState.players[payload.targetId];
            if (target) { target.gold += payload.amount; broadcastState(); }
        } else if (action === 'boostAtk') {
            // 어드민 버프 등
        } else if (action === 'giveSpecificWeapon') {
            const target = gameState.players[payload.targetId];
            const template = WEAPON_DB[payload.weaponKey];
            if (target && template && target.inventory.length === 36) {
                for (let i = 0; i < 36; i++) {
                    if (!target.inventory[i]) {
                        target.inventory[i] = { ...template, id: Date.now() + Math.random(), enhance: 0 };
                        break;
                    }
                }
                broadcastState();
            }
        }
    });

    // 연결 종료 처리
    socket.on('disconnect', () => {
        const player = gameState.players[socket.id];
        if (player && player.partyId) {
            const party = gameState.parties[player.partyId];
            if (party) {
                party.members = party.members.filter(id => id !== socket.id);
                if (party.members.length === 0) delete gameState.parties[player.partyId];
            }
        }
        delete gameState.players[socket.id];
        console.log(`용사 퇴장: ${socket.id}`);
        broadcastState();
    });
});

// -------------------------------------------------------------
// 4. 보스 전투 및 사망/부활 핵심 로직
// -------------------------------------------------------------
function applyDamageToBoss(socketId, dmg) {
    const boss = gameState.boss;
    const player = gameState.players[socketId];
    if (!boss || !player || boss.currentHp <= 0) return;

    boss.currentHp -= dmg;
    player.totalDamage = (player.totalDamage || 0) + dmg;

    if (boss.currentHp <= 0) {
        boss.currentHp = 0;
        checkBossDeath(socketId);
    }
    broadcastState();
}

function checkBossDeath(lastHitSocketId) {
    // 막타 보상 지급 (랜덤 무기 1개)
    const killer = gameState.players[lastHitSocketId];
    if (killer) {
        const rewardItem = getRandomWeapon();
        let placed = false;
        for (let i = 0; i < 36; i++) {
            if (!killer.inventory[i]) {
                killer.inventory[i] = rewardItem;
                placed = true;
                break;
            }
        }
        io.to(lastHitSocketId).emit('itemObtained', { weapon: rewardItem, full: !placed });
    }

    // 다음 보스로 순환
    currentBossIndex = (currentBossIndex + 1) % BOSS_LIST.length;
    const nextB = BOSS_LIST[currentBossIndex];
    gameState.boss = { ...nextB, currentHp: nextB.maxHp };
}

// 주기적인 보스 반격 및 플레이어 사망/부활 처리 루프 (1초 간격)
setInterval(() => {
    let stateChanged = false;

    Object.values(gameState.players).forEach(player => {
        if (player.hp > 0) {
            // 보스의 기본 공격력 (예: 10~15 데미지)
            const bossAtk = 12;
            player.hp -= bossAtk;
            stateChanged = true;

            // 플레이어 사망 시 처리
            if (player.hp <= 0) {
                player.hp = 0;
                
                // 1. 장착 중인 무기 버리기 (사망 패널티)
                if (player.equippedIndex !== null && player.inventory[player.equippedIndex]) {
                    player.inventory[player.equippedIndex] = null;
                    player.equippedIndex = null;
                }

                // 2. 즉시 부활 처리 (UI 멈춤 및 락 현상 방지, HP 100% 회복)
                player.hp = player.maxHp;
            }
        }
    });

    if (stateChanged) {
        broadcastState();
    }
}, 1000);

function broadcastState() {
    io.emit('updateState', gameState);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 서버 실행 중! 포트: ${PORT}`);
});

