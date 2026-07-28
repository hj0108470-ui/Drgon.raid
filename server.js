const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.static('public'));

// 보스 리스트 정의
const BOSS_LIST = [
    { name: '🐷 꿀신', maxHp: 50000, currentHp: 50000, damage: 15, interval: 10 },
    { name: '🐉 드래곤', maxHp: 120000, currentHp: 120000, damage: 25, interval: 8 },
    { name: '💀 해골왕', maxHp: 250000, currentHp: 250000, damage: 40, interval: 6 }
];

let gameState = {
    boss: { ...BOSS_LIST[0] },
    players: {},
    fieldDrops: []
};

let bossTimerSeconds = 0;

// 무기 가챠 풀 정의 (스프레드시트/기존 데이터 기반)
const WEAPON_POOL = [
    { name: '초보자의 나무 막대기', type: 'knife', icon: '🪵', atk: 15, sellPrice: 100, skillName: '연속 베기' },
    { name: '낡은 단검', type: 'knife', icon: '🗡️', atk: 30, sellPrice: 250, skillName: '연속 베기' },
    { name: '사냥꾼의 활', type: 'bow', icon: '🏹', atk: 25, sellPrice: 300, skillName: '집중의 눈' },
    { name: '마법사의 스태프', type: 'staff', icon: '🪄', atk: 20, sellPrice: 300, skillName: '회복의 파동', baseHeal: 15 },
    { name: '튼튼한 방패', type: 'shield', icon: '🛡️', atk: 10, sellPrice: 200, skillName: '철벽 방어' },
    { name: '기사의 대검', type: 'knife', icon: '⚔️', atk: 60, sellPrice: 800, skillName: '연속 베기' },
    { name: '정령의 활', type: 'bow', icon: '🌟', atk: 55, sellPrice: 900, skillName: '집중의 눈' },
    { name: '현자의 스태프', type: 'staff', icon: '🔮', atk: 45, sellPrice: 950, skillName: '회복의 파동', baseHeal: 30 },
    { name: '이지스 방패', type: 'shield_special', icon: '🛡️✨', atk: 25, sellPrice: 1000, skillName: '철벽 방어' }
];

// 쿠폰 리스트
const COUPONS = {
    'WELCOME2026': 5000,
    'BUFFED': 10000,
    'GM_GIFT': 3000
};

io.on('connection', (socket) => {
    console.log(`플레이어 접속: ${socket.id}`);

    // 플레이어 초기 생성
    gameState.players[socket.id] = {
        id: socket.id,
        name: `용사_${socket.id.substring(0, 4)}`,
        hp: 100,
        maxHp: 100,
        gold: 1500,
        totalDamage: 0,
        inventory: new Array(36).fill(null),
        equippedIndex: null,
        usedCoupons: [],
        critBuffDuration: 0,
        shieldDuration: 0,
        skillCoolTime: 0 // ✨ 스킬 쿨타임 (초)
    };

    // 기본 지급 무기 (마법사의 스태프) 장착 테스트용 지급
    gameState.players[socket.id].inventory[0] = { ...WEAPON_POOL[3], enhance: 0 };
    gameState.players[socket.id].equippedIndex = 0;

    io.emit('updateState', gameState);

    // 닉네임 변경
    socket.on('setNickname', (name) => {
        const p = gameState.players[socket.id];
        if (p && name.trim()) {
            p.name = name.trim().substring(0, 12);
            io.emit('updateState', gameState);
        }
    });

    // 공격하기
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
        let skillName = '맨손 공격';

        if (p.equippedIndex !== null && p.inventory[p.equippedIndex]) {
            let eq = p.inventory[p.equippedIndex];
            baseDmg = eq.atk * (1 + (eq.enhance || 0) * 0.4);
            skillName = eq.name;
        }

        if (p.critBuffDuration && p.critBuffDuration > 0) {
            baseDmg *= 2; // 집중의 눈 버프 시 데미지 2배
        }

        let finalDmg = Math.round(baseDmg);
        gameState.boss.currentHp -= finalDmg;
        p.totalDamage += finalDmg;

        socket.emit('attackEffect', { skillName, dmg: finalDmg });

        if (gameState.boss.currentHp <= 0) {
            // 보스 토벌 시 다음 보스로 로테이션 및 전원 골드 지급
            const nextIdx = (BOSS_LIST.findIndex(b => b.name === gameState.boss.name) + 1) % BOSS_LIST.length;
            gameState.boss = { ...BOSS_LIST[nextIdx] };
            bossTimerSeconds = 0;
            Object.values(gameState.players).forEach(pl => { pl.gold += 1000; });
            io.emit('notify', `🎉 보스를 토벌했습니다! 모든 플레이어에게 골드 1,000G 지급!`);
        }

        io.emit('updateState', gameState);
    });

    // ✨ 수동 스킬 사용 이벤트 (20초 쿨타임 적용 및 스태프 체력 회복 포함)
    socket.on('useSkill', () => {
        const p = gameState.players[socket.id];
        if (!p || p.equippedIndex === null) return;

        // 쿨타임 체크
        if (p.skillCoolTime && p.skillCoolTime > 0) {
            socket.emit('notify', `⏳ 스킬 쿨타임 중입니다! (${p.skillCoolTime}초 남음)`);
            return;
        }

        let eq = p.inventory[p.equippedIndex];
        if (!eq) return;

        let baseAtk = eq.atk * (1 + (eq.enhance || 0) * 0.4);
        let skillMsg = '';

        if (eq.type === 'staff') {
            // 스태프 체력 회복 공식 (기본 15 + 강화당 +3~30 등)
            let healAmount = (eq.baseHeal || 15) + ((eq.enhance || 0) * 5);
            p.hp = Math.min(p.maxHp, p.hp + healAmount);
            skillMsg = `🪄 [회복의 파동] 발동! 체력 +${healAmount} 회복!`;
        } 
        else if (eq.type === 'bow') {
            p.critBuffDuration = 10;
            skillMsg = `🏹 [집중의 눈] 발동! 10초간 크리티컬(데미지 2배) 적용!`;
        } 
        else if (eq.type === 'knife') {
            let baseSkillDmg = Math.round(baseAtk * 2.5);
            let extraDmg = Math.round(baseSkillDmg * (1/8) * (eq.enhance || 0));
            let totalSkillDmg = baseSkillDmg + extraDmg;

            gameState.boss.currentHp -= totalSkillDmg;
            p.totalDamage += totalSkillDmg;
            skillMsg = `⚔️ [연속 베기] 폭딜 작렬! 보스에게 ${totalSkillDmg.toLocaleString()} 피해!`;
        } 
        else if (eq.type === 'shield' || eq.type === 'shield_special') {
            let shieldSec = 8 + (eq.enhance || 0);
            p.shieldDuration = shieldSec;
            skillMsg = `🛡️ [철벽 방어] 발동! ${shieldSec}초동안 무적 실드 전개!`;
        }

        // 스킬 사용 직후 20초 쿨타임 부여
        p.skillCoolTime = 20;

        if (gameState.boss.currentHp <= 0) {
            const nextIdx = (BOSS_LIST.findIndex(b => b.name === gameState.boss.name) + 1) % BOSS_LIST.length;
            gameState.boss = { ...BOSS_LIST[nextIdx] };
            bossTimerSeconds = 0;
        }

        socket.emit('notify', skillMsg);
        io.emit('updateState', gameState);
    });

    // 무기 뽑기 (가챠)
    socket.on('drawGacha', () => {
        const p = gameState.players[socket.id];
        if (!p) return;
        if (p.gold < 1000) {
            socket.emit('notify', '❌ 골드가 부족합니다! (필요: 1,000G)');
            return;
        }

        p.gold -= 1000;
        const randomWeapon = { ...WEAPON_POOL[Math.floor(Math.random() * WEAPON_POOL.length)], enhance: 0 };
        
        let emptyIdx = p.inventory.findIndex(slot => slot === null);
        if (emptyIdx !== -1) {
            p.inventory[emptyIdx] = randomWeapon;
            socket.emit('notify', `🎁 [${randomWeapon.name}] 획득! 인벤토리에 추가되었습니다.`);
        } else {
            socket.emit('notify', '🎒 인벤토리가 가득 찼습니다!');
            p.gold += 1000; // 환불
        }
        io.emit('updateState', gameState);
    });

    // 장비 장착/해제
    socket.on('equipItem', (index) => {
        const p = gameState.players[socket.id];
        if (!p || !p.inventory[index]) return;

        if (p.equippedIndex === index) {
            p.equippedIndex = null;
            socket.emit('notify', '무기를 해제했습니다.');
        } else {
            p.equippedIndex = index;
            socket.emit('notify', `[${p.inventory[index].name}] 장착 완료!`);
        }
        io.emit('updateState', gameState);
    });

    // 장비 강화
    socket.on('enhanceItem', (index) => {
        const p = gameState.players[socket.id];
        if (!p || !p.inventory[index]) return;

        let item = p.inventory[index];
        let enhanceCost = ((item.enhance || 0) + 1) * 500;

        if (p.gold < enhanceCost) {
            socket.emit('notify', `❌ 강화 비용이 부족합니다! (필요: ${enhanceCost}G)`);
            return;
        }

        p.gold -= enhanceCost;
        item.enhance = (item.enhance || 0) + 1;
        socket.emit('notify', `✨ [${item.name}] 강화 성공! (+${item.enhance})`);
        io.emit('updateState', gameState);
    });

    // 장비 판매
    socket.on('sellItem', (index) => {
        const p = gameState.players[socket.id];
        if (!p || !p.inventory[index]) return;

        let item = p.inventory[index];
        if (p.equippedIndex === index) {
            p.equippedIndex = null;
        }
        p.gold += item.sellPrice;
        p.inventory[index] = null;
        socket.emit('notify', `💰 [${item.name}]을(를) 판매하여 ${item.sellPrice}G를 획득했습니다.`);
        io.emit('updateState', gameState);
    });

    // 필드 드랍 줍기
    socket.on('pickupDrop', (dropId) => {
        const p = gameState.players[socket.id];
        if (!p) return;

        let dropIdx = gameState.fieldDrops.findIndex(d => d.id === dropId);
        if (dropIdx !== -1) {
            let emptyIdx = p.inventory.findIndex(slot => slot === null);
            if (emptyIdx !== -1) {
                let drop = gameState.fieldDrops.splice(dropIdx, 1)[0];
                p.inventory[emptyIdx] = drop.weapon;
                socket.emit('notify', `📦 [${drop.weapon.name}]을(를) 주웠습니다!`);
                io.emit('updateState', gameState);
            } else {
                socket.emit('notify', '🎒 인벤토리가 가득 찼습니다!');
            }
        }
    });

    // 쿠폰 사용
    socket.on('useCoupon', (code) => {
        const p = gameState.players[socket.id];
        if (!p) return;

        if (p.usedCoupons.includes(code)) {
            socket.emit('notify', '❌ 이미 사용한 쿠폰입니다.');
            return;
        }

        if (COUPONS[code]) {
            let reward = COUPONS[code];
            p.gold += reward;
            p.usedCoupons.push(code);
            socket.emit('notify', `🎉 쿠폰 등록 성공! 골드 +${reward.toLocaleString()}G 지급!`);
            io.emit('updateState', gameState);
        } else {
            socket.emit('notify', '❌ 존재하지 않거나 만료된 쿠폰입니다.');
        }
    });

    socket.on('disconnect', () => {
        delete gameState.players[socket.id];
        io.emit('updateState', gameState);
        console.log(`플레이어 퇴장: ${socket.id}`);
    });
});

// 매초 보스 공격 타이머 및 버프/쿨타임 감소 타이머
setInterval(() => {
    bossTimerSeconds++;
    let currentBoss = gameState.boss;
    let interval = currentBoss.interval || 10;

    if (bossTimerSeconds % interval === 0) {
        let updated = false;
        Object.entries(gameState.players).forEach(([id, p]) => {
            if (p.hp > 0) {
                let damageToTake = currentBoss.damage;
                if (p.shieldDuration && p.shieldDuration > 0) {
                    damageToTake = 0; // 실드 활성화 중이면 피격 무효화
                }
                p.hp = Math.max(0, p.hp - damageToTake);
                updated = true;

                if (p.hp === 0 && p.equippedIndex !== null) {
                    const droppedWeapon = p.inventory.splice(p.equippedIndex, 1)[0];
                    p.equippedIndex = null;
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
    }

    // 매초 플레이어 버프, 실드, 스킬 쿨타임 감소 처리
    Object.values(gameState.players).forEach(p => {
        if (p.critBuffDuration && p.critBuffDuration > 0) p.critBuffDuration--;
        if (p.shieldDuration && p.shieldDuration > 0) p.shieldDuration--;
        if (p.skillCoolTime && p.skillCoolTime > 0) p.skillCoolTime--;
    });
}, 1000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
