const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// 무기 데이터베이스 (4종 클래스 × 5등급 = 총 20종)
const WEAPON_DB = {
    // 칼 (Knife)
    'knife_common': { name: '녹슨 도살도', type: 'knife', rarity: 'Common', atk: 15, sellPrice: 50, icon: '🔪', skillName: '연속 베기' },
    'knife_rare': { name: '혈각의 서사도', type: 'knife', rarity: 'Rare', atk: 45, sellPrice: 250, icon: '🗡️', skillName: '연속 베기' },
    'knife_epic': { name: '흑염의 사도검', type: 'knife', rarity: 'Epic', atk: 120, sellPrice: 2500, icon: '🗡️🔥', skillName: '연속 베기' },
    'knife_legendary': { name: '피빛의 소울리퍼', type: 'knife', rarity: 'Legendary', atk: 380, sellPrice: 10000, icon: '⚔️🩸', skillName: '연속 베기' },
    'knife_mythic': { name: '심연의 핏빛 멸살검', type: 'knife', rarity: 'Mythic', atk: 1500, sellPrice: 100000, icon: '🗡️💀', skillName: '연속 베기' },

    // 활 (Bow)
    'bow_common': { name: '부러진 나무활', type: 'bow', rarity: 'Common', atk: 14, sellPrice: 50, icon: '🏹', skillName: '집중의 눈' },
    'bow_rare': { name: '정밀한 사냥꾼의 활', type: 'bow', rarity: 'Rare', atk: 42, sellPrice: 250, icon: '🏹✨', skillName: '집중의 눈' },
    'bow_epic': { name: '폭풍의 질풍궁', type: 'bow', rarity: 'Epic', atk: 115, sellPrice: 2500, icon: '🏹🌪️', skillName: '집중의 눈' },
    'bow_legendary': { name: '태양의 엘븐 롱보우', type: 'bow', rarity: 'Legendary', atk: 360, sellPrice: 10000, icon: '🏹☀️', skillName: '집중의 눈' },
    'bow_mythic': { name: '천공을 꿰뚫는 스나이퍼', type: 'bow', rarity: 'Mythic', atk: 1450, sellPrice: 100000, icon: '🏹💫', skillName: '집중의 눈' },

    // 방패 (Shield)
    'shield_common': { name: '나무 냄비뚜껑', type: 'shield', rarity: 'Common', atk: 8, sellPrice: 50, icon: '🛡️', skillName: '철벽 방어' },
    'shield_rare': { name: '수호자의 가디언 실드', type: 'shield', rarity: 'Rare', atk: 25, sellPrice: 250, icon: '🛡️✨', skillName: '철벽 방어' },
    'shield_epic': { name: '불멸의 가고일 방패', type: 'shield', rarity: 'Epic', atk: 70, sellPrice: 2500, icon: '🛡️🗿', skillName: '철벽 방어' },
    'shield_legendary': { name: '성기사의 천상 실드', type: 'shield', rarity: 'Legendary', atk: 220, sellPrice: 10000, icon: '🛡️👑', skillName: '철벽 방어' },
    'shield_mythic': { name: '신성한 절대자의 결계', type: 'shield', rarity: 'Mythic', atk: 900, sellPrice: 100000, icon: '🛡️❇️', skillName: '철벽 방어' },

    // 스태프 (Staff)
    'staff_common': { name: '빛 바랜 나뭇가지', type: 'staff', rarity: 'Common', atk: 10, sellPrice: 50, icon: '🪄', baseHeal: 10, skillName: '회복의 파동' },
    'staff_rare': { name: '견습 메딕의 지팡이', type: 'staff', rarity: 'Rare', atk: 32, sellPrice: 250, icon: '🪄💖', baseHeal: 15, skillName: '회복의 파동' },
    'staff_epic': { name: '정령의 생명 지팡이', type: 'staff', rarity: 'Epic', atk: 90, sellPrice: 2500, icon: '🪄🌿', baseHeal: 20, skillName: '회복의 파동' },
    'staff_legendary': { name: '대현자의 홀', type: 'staff', rarity: 'Legendary', atk: 280, sellPrice: 10000, icon: '🪄🔮', baseHeal: 25, skillName: '회복의 파동' },
    'staff_mythic': { name: '태초의 세라핌 스태프', type: 'staff', rarity: 'Mythic', atk: 1100, sellPrice: 100000, icon: '🪄✨', baseHeal: 30, skillName: '회복의 파동' }
};

const BOSS_LIST = [
    { name: '슬라임 킹', currentHp: 5000, maxHp: 5000, attackInterval: 10 },
    { name: '골리앗', currentHp: 15000, maxHp: 15000, attackInterval: 10 },
    { name: '이라소', currentHp: 30000, maxHp: 30000, attackInterval: 5 }
];

let gameState = {
    players: {},
    boss: { ...BOSS_LIST[0] },
    maxInventorySlots: 36
};

io.on('connection', (socket) => {
    // 플레이어 초기화 (36칸 인벤토리를 명확한 null 배열로 생성)
    gameState.players[socket.id] = {
        id: socket.id,
        gold: 5000, // 테스트용 초기 골드
        hp: 100,
        maxHp: 100,
        equippedIndex: null,
        inventory: new Array(36).fill(null),
        skillGauge: 0,
        skillCooldown: 0
    };

    io.emit('updateState', gameState);

    // 공격하기 및 골드 수급 로직
    socket.on('attack', () => {
        const p = gameState.players[socket.id];
        if (!p) return;

        if (p.hp <= 0) {
            p.hp = p.maxHp;
            socket.emit('notify', '✨ 부활했습니다!');
            io.emit('updateState', gameState);
            return;
        }

        let baseDmg = 10;
        if (p.equippedIndex !== null && p.inventory[p.equippedIndex]) {
            let eq = p.inventory[p.equippedIndex];
            baseDmg = eq.atk * (1 + (eq.enhance || 0) * 0.4);
        }

        let finalDmg = Math.round(baseDmg);
        gameState.boss.currentHp -= finalDmg;

        // ✨ 골드 버그 해결: 공격 성공 시 골드가 확실히 누적되도록 반영
        p.gold += 150;

        // 스킬 게이지 충전 (5회 공격 시 완충)
        p.skillGauge = (p.skillGauge || 0) + 1;
        if (p.skillGauge >= 5) {
            p.skillGauge = 5;
        }

        // 보스 토벌 체크
        if (gameState.boss.currentHp <= 0) {
            const nextIdx = (BOSS_LIST.findIndex(b => b.name === gameState.boss.name) + 1) % BOSS_LIST.length;
            gameState.boss = { ...BOSS_LIST[nextIdx] };

            // ✨ 보스 토벌 시 모든 플레이어에게 대량 골드 지급
            Object.values(gameState.players).forEach(pl => {
                pl.gold += 10000;
            });
            io.emit('notify', '🎉 보스 토벌 성공! 모든 플레이어에게 10,000G 지급!');
        }

        io.emit('updateState', gameState);
    });

    // 무기 뽑기(가챠) 로직
    socket.on('gacha', () => {
        const p = gameState.players[socket.id];
        if (!p) return;

        const COST = 1000;
        if (p.gold < COST) {
            socket.emit('notify', '❌ 골드가 부족합니다!');
            return;
        }

        // 빈 슬롯 체크 (배열 전체를 탐색해 빈 슬롯 확인)
        const emptyIndex = p.inventory.findIndex(slot => slot === null);
        if (emptyIndex === -1) {
            socket.emit('notify', '❌ 인벤토리가 가득 찼습니다!');
            return;
        }

        p.gold -= COST;

        // 가챠 확률 적용 (Common 70%, Rare 20%, Epic 7.8%, Legendary 2.1%, Mythic 0.1%)
        const rand = Math.random() * 100;
        let rarity = 'Common';
        if (rand < 0.1) rarity = 'Mythic';
        else if (rand < 2.2) rarity = 'Legendary';
        else if (rand < 10.0) rarity = 'Epic';
        else if (rand < 30.0) rarity = 'Rare';

        const keys = Object.keys(WEAPON_DB).filter(k => WEAPON_DB[k].rarity === rarity);
        const chosenKey = keys[Math.floor(Math.random() * keys.length)];

        // 인벤토리에 무기 장착
        p.inventory[emptyIndex] = { ...WEAPON_DB[chosenKey], enhance: 0 };

        socket.emit('notify', `🎁 [${rarity}] 등급의 무기를 획득했습니다!`);
        io.emit('updateState', gameState);
    });

    socket.on('disconnect', () => {
        delete gameState.players[socket.id];
        io.emit('updateState', gameState);
    });
});

server.listen(3000, () => {
    console.log('🚀 서버가 3000 포트에서 정상 가동 중입니다.');
});
