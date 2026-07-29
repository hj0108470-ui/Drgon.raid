const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// 게임 전체 상태
const gameState = {
    players: {},
    boss: {
        name: "Lv.1 슬라임 왕",
        level: 1,
        maxHp: 5000,
        currentHp: 5000,
        atk: 25,
        maxLevel: 100
    },
    registeredAccounts: {} // { nickname: { password, level, exp, maxExp, gold, hp, maxHp, inventory, equippedIndex, totalDamage, bonusAtk, guildId } }
};

// 무기 가챠 데이터 (등급별 확률 및 공격력)
const weapons = [
    { name: "낡은 검", rarity: "Common", atk: 10, sellPrice: 50, icon: "🗡️" },
    { name: "철제 검", rarity: "Rare", atk: 25, sellPrice: 150, icon: "⚔️" },
    { name: "기사의 검", rarity: "Epic", atk: 60, sellPrice: 500, icon: "🛡️" },
    { name: "드레이크의 대검", rarity: "Legendary", atk: 150, sellPrice: 2000, icon: "🔥" },
    { name: "세계수의 검", rarity: "Mythic", atk: 350, sellPrice: 8000, icon: "✨" }
];

// 쿠폰 데이터
const coupons = {
    "WELCOME2026": { gold: 5000, used: [] },
    "RPGMASTER": { gold: 15000, used: [] }
};

// 플레이어 공격력 계산 함수
function calculatePlayerAtk(player) {
    let baseAtk = 10 + (player.level * 2); // 레벨당 기본 공격력 상승
    let weaponAtk = 0;
    if (player.equippedIndex !== null && player.inventory[player.equippedIndex]) {
        let item = player.inventory[player.equippedIndex];
        let enhanceBonus = item.enhance ? item.enhance * 5 : 0;
        weaponAtk = (item.atk || 0) + enhanceBonus;
    }
    return baseAtk + weaponAtk + (player.bonusAtk || 0);
}

// 경험치 및 레벨업 처리 함수
function addExp(socketId, amount) {
    const player = gameState.players[socketId];
    if (!player) return;

    player.exp += amount;
    let leveledUp = false;

    while (player.exp >= player.maxExp && player.level < 75) {
        player.exp -= player.maxExp;
        player.level += 1;
        player.maxHp += 10;
        player.hp = player.maxHp; // 레벨업 시 체력 완전 회복
        player.maxExp = Math.floor(player.maxExp * 1.25);
        leveledUp = true;
    }

    if (leveledUp) {
        io.to(socketId).emit('couponResult', { message: `🎉 레벨 업! 현재 레벨: ${player.level}` });
    }
    saveAccountState(socketId);
}

// 계정 상태 저장 함수
function saveAccountState(socketId) {
    const player = gameState.players[socketId];
    if (player && gameState.registeredAccounts[player.name]) {
        const acc = gameState.registeredAccounts[player.name];
        acc.level = player.level;
        acc.exp = player.exp;
        acc.maxExp = player.maxExp;
        acc.hp = player.hp;
        acc.maxHp = player.maxHp;
        acc.gold = player.gold;
        acc.inventory = player.inventory;
        acc.equippedIndex = player.equippedIndex;
        acc.totalDamage = player.totalDamage;
        acc.bonusAtk = player.bonusAtk;
    }
}

// 소켓 연결
io.on('connection', (socket) => {
    console.log(`사용자 접속: ${socket.id}`);

    // 회원가입
    socket.on('register', (data) => {
        const { nickname, password } = data;
        if (!nickname || !password) {
            return socket.emit('authResult', { success: false, message: '닉네임과 비밀번호를 입력해주세요.' });
        }
        if (gameState.registeredAccounts[nickname]) {
            return socket.emit('authResult', { success: false, message: '이미 존재하는 닉네임입니다.' });
        }

        gameState.registeredAccounts[nickname] = {
            nickname, password,
            level: 1, exp: 0, maxExp: 100,
            hp: 100, maxHp: 100, gold: 500,
            inventory: [], equippedIndex: null, totalDamage: 0, bonusAtk: 0, guildId: null
        };
        socket.emit('authResult', { success: true, message: '회원가입 완료! 로그인해주세요.' });
    });

    // 로그인
    socket.on('login', (data) => {
        const { nickname, password } = data;
        const account = gameState.registeredAccounts[nickname];
        if (!account || account.password !== password) {
            return socket.emit('authResult', { success: false, message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        }

        gameState.players[socket.id] = {
            id: socket.id,
            name: account.nickname,
            level: account.level !== undefined ? account.level : 1,
            exp: account.exp !== undefined ? account.exp : 0,
            maxExp: account.maxExp !== undefined ? account.maxExp : 100,
            hp: account.hp !== undefined ? account.hp : 100,
            maxHp: account.maxHp !== undefined ? account.maxHp : 100,
            gold: account.gold !== undefined ? account.gold : 500,
            inventory: account.inventory ? [...account.inventory] : [],
            equippedIndex: account.equippedIndex !== undefined ? account.equippedIndex : null,
            totalDamage: account.totalDamage || 0,
            bonusAtk: account.bonusAtk || 0,
            lastSkillTime: 0,
            isInvincible: false,
            invincibleUntil: 0,
            guildId: account.guildId || null,
            inGameActive: false
        };

        socket.emit('loginSuccess', { player: gameState.players[socket.id] });
    });

    socket.on('setGameActive', (isActive) => {
        if (gameState.players[socket.id]) {
            gameState.players[socket.id].inGameActive = isActive;
        }
    });

    // 보스 공격
    socket.on('attack', () => {
        const player = gameState.players[socket.id];
        if (!player || player.hp <= 0) return;

        let dmg = calculatePlayerAtk(player);
        gameState.boss.currentHp -= dmg;
        player.totalDamage += dmg;

        // 경험치 획득 (일반 공격 시 20 EXP)
        addExp(socket.id, 20);

        checkBossDeath();
    });

    // 스킬 사용
    socket.on('useSkill', () => {
        const player = gameState.players[socket.id];
        if (!player || player.hp <= 0) return;

        let now = Date.now();
        if (now - player.lastSkillTime < 5000) {
            return socket.emit('skillResult', { message: '스킬 쿨타임 중입니다! (5초)' });
        }
        player.lastSkillTime = now;

        let dmg = calculatePlayerAtk(player) * 2.5;
        gameState.boss.currentHp -= dmg;
        player.totalDamage += dmg;

        // 경험치 획득 (스킬 사용 시 50 EXP)
        addExp(socket.id, 50);

        socket.emit('skillResult', { message: '✨ 강력한 스킬 적중!' });
        checkBossDeath();
    });

    // 장비 뽑기 (가챠)
    socket.on('drawGacha', () => {
        const player = gameState.players[socket.id];
        if (!player) return;
        if (player.gold < 1000) {
            return socket.emit('couponResult', { message: '골드가 부족합니다! (필요: 1000G)' });
        }
        if (player.inventory.length >= 36) {
            return socket.emit('couponResult', { message: '인벤토리가 가득 찼습니다!' });
        }

        player.gold -= 1000;

        // 확률 설정 (Common 60%, Rare 25%, Epic 10%, Legendary 4%, Mythic 1%)
        let rand = Math.random() * 100;
        let selectedRarity = "Common";
        if (rand > 99) selectedRarity = "Mythic";
        else if (rand > 95) selectedRarity = "Legendary";
        else if (rand > 85) selectedRarity = "Epic";
        else if (rand > 60) selectedRarity = "Rare";

        let pool = weapons.filter(w => w.rarity === selectedRarity);
        let weaponTemplate = pool[Math.floor(Math.random() * pool.length)];

        let newWeapon = { ...weaponTemplate, enhance: 0 };
        player.inventory.push(newWeapon);

        saveAccountState(socket.id);
        socket.emit('gachaResult', { success: true, weapon: newWeapon });
    });

    // 장비 장착 / 해제
    socket.on('equipItem', (index) => {
        const player = gameState.players[socket.id];
        if (!player || !player.inventory[index]) return;

        if (player.equippedIndex === index) {
            player.equippedIndex = null; // 장착 해제
        } else {
            player.equippedIndex = index; // 장착
        }
        saveAccountState(socket.id);
    });

    // 장비 강화
    socket.on('enhanceItem', (index) => {
        const player = gameState.players[socket.id];
        if (!player || !player.inventory[index]) return;

        let item = player.inventory[index];
        item.enhance = item.enhance || 0;

        if (item.enhance >= 15) {
            return socket.emit('couponResult', { message: '이미 최대 강화 단계입니다 (+15)' });
        }

        let cost = (item.enhance + 1) * 300;
        if (player.gold < cost) {
            return socket.emit('couponResult', { message: `강화 비용이 부족합니다! (필요: ${cost}G)` });
        }

        player.gold -= cost;
        let successRate = Math.max(30, 90 - (item.enhance * 4)); // 강화될수록 확률 감소
        let roll = Math.random() * 100;

        if (roll <= successRate) {
            item.enhance += 1;
            socket.emit('couponResult', { message: `✨ 강화 성공! (+${item.enhance})` });
        } else {
            socket.emit('couponResult', { message: '❌ 강화 실패...' });
        }
        saveAccountState(socket.id);
    });

    // 아이템 판매
    socket.on('sellItems', (indices) => {
        const player = gameState.players[socket.id];
        if (!player) return;

        indices.sort((a, b) => b - a).forEach(idx => {
            if (player.inventory[idx]) {
                let item = player.inventory[idx];
                let price = item.sellPrice + ((item.enhance || 0) * 100);
                player.gold += price;
                if (player.equippedIndex === idx) player.equippedIndex = null;
                else if (player.equippedIndex > idx) player.equippedIndex -= 1;
                player.inventory.splice(idx, 1);
            }
        });
        saveAccountState(socket.id);
    });

    // 아이템 삭제
    socket.on('deleteItems', (indices) => {
        const player = gameState.players[socket.id];
        if (!player) return;

        indices.sort((a, b) => b - a).forEach(idx => {
            if (player.inventory[idx]) {
                if (player.equippedIndex === idx) player.equippedIndex = null;
                else if (player.equippedIndex > idx) player.equippedIndex -= 1;
                player.inventory.splice(idx, 1);
            }
        });
        saveAccountState(socket.id);
    });

    // 쿠폰 사용
    socket.on('useCoupon', (code) => {
        const player = gameState.players[socket.id];
        if (!player) return;

        let coupon = coupons[code];
        if (!coupon) {
            return socket.emit('couponResult', { success: false, message: '존재하지 않는 쿠폰 코드입니다.' });
        }
        if (coupon.used.includes(player.name)) {
            return socket.emit('couponResult', { success: false, message: '이미 사용한 쿠폰입니다.' });
        }

        coupon.used.push(player.name);
        player.gold += coupon.gold;
        saveAccountState(socket.id);
        socket.emit('couponResult', { success: true, message: `🎁 쿠폰 등록 성공! ${coupon.gold.toLocaleString()} G 획득!` });
    });

    socket.on('disconnect', () => {
        if (gameState.players[socket.id]) {
            saveAccountState(socket.id);
            delete gameState.players[socket.id];
        }
        console.log(`사용자 퇴장: ${socket.id}`);
    });
});

// 보스 처치 체크 함수
function checkBossDeath() {
    if (gameState.boss.currentHp <= 0) {
        let rewardGold = gameState.boss.level * 1500;
        let rewardExp = gameState.boss.level * 300;

        for (let id in gameState.players) {
            let p = gameState.players[id];
            if (p.inGameActive) {
                p.gold += rewardGold;
                addExp(id, rewardExp);
            }
        }

        // 다음 보스 강화 소환
        gameState.boss.level += 1;
        gameState.boss.maxHp = Math.floor(gameState.boss.maxHp * 1.4);
        gameState.boss.currentHp = gameState.boss.maxHp;
        gameState.boss.name = `Lv.${gameState.boss.level} 보스 몬스터`;
    }
}

// 게임 상태 브로드캐스트 (주기적 갱신)
setInterval(() => {
    let activePlayers = {};
    for (let id in gameState.players) {
        if (gameState.players[id].inGameActive) {
            activePlayers[id] = gameState.players[id];
        }
    }

    let rankedPlayers = Object.values(gameState.players).sort((a, b) => b.totalDamage - a.totalDamage);

    io.emit('updateState', {
        players: activePlayers,
        boss: gameState.boss,
        rankings: { players: rankedPlayers }
    });
}, 100);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});
