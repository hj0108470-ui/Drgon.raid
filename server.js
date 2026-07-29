const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public')));

// 게임 상태 데이터
const state = {
    boss: {
        name: '👑 전설의 암흑 드래곤',
        maxHp: 1000000,
        currentHp: 1000000,
        level: 1
    },
    players: {},   // id: { socketId, name, password, hp, gold, inventory, equippedIndex, totalDamage, guildId, tradePartnerId }
    guilds: {},    // guildId: { id, name, maxMembers, leaderId, members: [], totalDamage: 0 }
    trades: {},    // tradeId: { id, user1, user2, items1: [], items2: [], ready1: false, ready2: false }
    rankings: {
        players: [],
        guilds: []
    }
};

// 무기 등급 및 종류 설정
const WEAPON_TYPES = ['sword', 'staff', 'buff', 'shield', 'dagger'];
const RARITIES = [
    { name: '일반', color: '#bdc3c7', chance: 0.60, minDmg: 50, maxDmg: 100, sellPrice: 200 },
    { name: '고급', color: '#2ecc71', chance: 0.25, minDmg: 120, maxDmg: 250, sellPrice: 600 },
    { name: '희귀', color: '#3498db', chance: 0.10, minDmg: 300, maxDmg: 600, sellPrice: 1500 },
    { name: '영웅', color: '#9b59b6', chance: 0.04, minDmg: 800, maxDmg: 1500, sellPrice: 4000 },
    { name: '전설', color: '#f1c40f', chance: 0.01, minDmg: 2000, maxDmg: 5000, sellPrice: 12000 }
];

function getRandomWeapon() {
    const rand = Math.random();
    let cumulative = 0;
    let chosenRarity = RARITIES[0];
    for (let r of RARITIES) {
        cumulative += r.chance;
        if (rand <= cumulative) { chosenRarity = r; break; }
    }
    const type = WEAPON_TYPES[Math.floor(Math.random() * WEAPON_TYPES.length)];
    const damage = Math.floor(Math.random() * (chosenRarity.maxDmg - chosenRarity.minDmg + 1)) + chosenRarity.minDmg;
    
    let icon = '⚔️';
    if (type === 'staff') icon = '🔮';
    else if (type === 'buff') icon = '🥁';
    else if (type === 'shield') icon = '🛡️';
    else if (type === 'dagger') icon = '🗡️';

    return {
        id: 'w_' + Math.random().toString(36).substring(2, 9),
        name: `${chosenRarity.name} ${type.toUpperCase()}`,
        type,
        icon,
        rarity: chosenRarity.name,
        damage,
        enhance: 0,
        sellPrice: chosenRarity.sellPrice
    };
}

function updateRankings() {
    const pList = Object.values(state.players).map(p => ({
        name: p.name,
        totalDamage: p.totalDamage || 0
    })).sort((a, b) => b.totalDamage - a.totalDamage);
    state.rankings.players = pList;

    const gList = Object.values(state.guilds).map(g => {
        let gDmg = 0;
        g.members.forEach(mId => {
            if (state.players[mId]) gDmg += (state.players[mId].totalDamage || 0);
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
    state.rankings.guilds = gList;
}

io.on('connection', (socket) => {
    // 기본 플레이어 초기화 등록
    state.players[socket.id] = {
        socketId: socket.id,
        name: '모험가_' + socket.id.substring(0, 4),
        password: '',
        hp: 100,
        gold: 1500,
        inventory: [getRandomWeapon(), getRandomWeapon()],
        equippedIndex: 0,
        totalDamage: 0,
        guildId: null,
        tradePartnerId: null
    };

    socket.emit('updateState', state);

    // 로그인 및 회원가입
    socket.on('register', ({ nickname, password }) => {
        const player = state.players[socket.id];
        if (!player) return;
        player.name = nickname;
        player.password = password;
        socket.emit('authResult', { success: true, message: '회원가입 및 닉네임 설정 완료!' });
        io.emit('updateState', state);
    });

    socket.on('login', ({ nickname, password }) => {
        const player = state.players[socket.id];
        if (!player) return;
        player.name = nickname;
        player.password = password;
        socket.emit('loginSuccess', { success: true, message: '로그인 성공!' });
        io.emit('updateState', state);
    });

    // 보스 공격
    socket.on('attack', () => {
        const player = state.players[socket.id];
        if (!player) return;

        let dmg = 50;
        if (player.equippedIndex !== null && player.inventory[player.equippedIndex]) {
            const eq = player.inventory[player.equippedIndex];
            dmg = eq.damage + ((eq.enhance || 0) * 30);
        }

        state.boss.currentHp -= dmg;
        player.totalDamage += dmg;
        updateRankings();

        if (state.boss.currentHp <= 0) {
            state.boss.level += 1;
            state.boss.maxHp = Math.floor(state.boss.maxHp * 1.3);
            state.boss.currentHp = state.boss.maxHp;

            Object.values(state.players).forEach(p => {
                p.gold += 3000;
                if (p.inventory.length < 36) {
                    p.inventory.push(getRandomWeapon());
                }
            });
        }
        io.emit('updateState', state);
    });

    // 스킬 사용
    socket.on('useSkill', () => {
        const player = state.players[socket.id];
        if (!player) return;
        let dmg = 200;
        if (player.equippedIndex !== null && player.inventory[player.equippedIndex]) {
            const eq = player.inventory[player.equippedIndex];
            dmg = (eq.damage * 2) + ((eq.enhance || 0) * 50);
        }
        state.boss.currentHp -= dmg;
        player.totalDamage += dmg;
        updateRankings();
        socket.emit('skillResult', { success: true, message: `⚡ 스킬 발동! ${dmg.toLocaleString()} 데미지!` });
        io.emit('updateState', state);
    });

    // 뽑기
    socket.on('drawGacha', () => {
        const player = state.players[socket.id];
        if (!player) return;
        if (player.gold < 1000) {
            socket.emit('gachaResult', { success: false, message: '골드가 부족합니다! (필요: 1,000G)' });
            return;
        }
        player.gold -= 1000;
        if (player.inventory.length >= 36) {
            socket.emit('gachaResult', { success: false, message: '인벤토리가 가득 찼습니다!' });
            return;
        }
        const newWeapon = getRandomWeapon();
        player.inventory.push(newWeapon);
        socket.emit('gachaResult', { success: true, weapon: newWeapon });
        io.emit('updateState', state);
    });

    // 아이템 장착 / 강화 / 판매 / 삭제
    socket.on('equipItem', (idx) => {
        const player = state.players[socket.id];
        if (!player || !player.inventory[idx]) return;
        player.equippedIndex = (player.equippedIndex === idx) ? null : idx;
        io.emit('updateState', state);
    });

    socket.on('enhanceItem', (idx) => {
        const player = state.players[socket.id];
        if (!player || !player.inventory[idx]) return;
        const item = player.inventory[idx];
        const cost = ((item.enhance || 0) + 1) * 400;
        if (player.gold < cost) {
            socket.emit('enhanceResult', { success: false, message: '강화 비용이 부족합니다!' });
            return;
        }
        player.gold -= cost;
        item.enhance = (item.enhance || 0) + 1;
        socket.emit('enhanceResult', { success: true, message: `✨ ${item.name} +${item.enhance} 강화 성공!` });
        io.emit('updateState', state);
    });

    socket.on('sellItems', (indices) => {
        const player = state.players[socket.id];
        if (!player) return;
        let totalGain = 0;
        indices.sort((a, b) => b - a).forEach(idx => {
            if (player.inventory[idx] && idx !== player.equippedIndex) {
                totalGain += player.inventory[idx].sellPrice;
                player.inventory.splice(idx, 1);
                if (player.equippedIndex === idx) player.equippedIndex = null;
                else if (player.equippedIndex > idx) player.equippedIndex--;
            }
        });
        player.gold += totalGain;
        socket.emit('sellResult', { success: true, message: `💰 ${totalGain.toLocaleString()}G에 판매 완료!` });
        io.emit('updateState', state);
    });

    socket.on('deleteItems', (indices) => {
        const player = state.players[socket.id];
        if (!player) return;
        indices.sort((a, b) => b - a).forEach(idx => {
            if (player.inventory[idx] && idx !== player.equippedIndex) {
                player.inventory.splice(idx, 1);
                if (player.equippedIndex === idx) player.equippedIndex = null;
                else if (player.equippedIndex > idx) player.equippedIndex--;
            }
        });
        socket.emit('deleteResult', { success: true, message: '🗑️ 선택한 아이템이 삭제되었습니다.' });
        io.emit('updateState', state);
    });

    // 쿠폰
    socket.on('useCoupon', (code) => {
        const player = state.players[socket.id];
        if (!player) return;
        if (code === 'BOSS1000' || code === 'WELCOME') {
            player.gold += 5000;
            if (player.inventory.length < 36) player.inventory.push(getRandomWeapon());
            socket.emit('couponResult', { success: true, message: '🎁 쿠폰 등록 성공! 5,000G 및 무기 획득!' });
            io.emit('updateState', state);
        } else {
            socket.emit('couponResult', { success: false, message: '❌ 유효하지 않은 쿠폰 코드입니다.' });
        }
    });

    // 길드
    socket.on('createGuild', ({ guildName, maxMembers }) => {
        const player = state.players[socket.id];
        if (!player) return;
        if (player.guildId) {
            socket.emit('guildResult', { success: false, message: '이미 길드에 소속되어 있습니다.' });
            return;
        }
        const guildId = 'g_' + Math.random().toString(36).substring(2, 9);
        state.guilds[guildId] = {
            id: guildId,
            name: guildName,
            maxMembers: Math.max(2, Math.min(20, maxMembers || 5)),
            leaderId: socket.id,
            members: [socket.id]
        };
        player.guildId = guildId;
        updateRankings();
        socket.emit('guildResult', { success: true, message: `🏰 '${guildName}' 길드가 생성되었습니다!` });
        io.emit('updateState', state);
    });

    socket.on('getGuildList', () => {
        const list = Object.values(state.guilds).map(g => ({
            id: g.id,
            name: g.name,
            maxMembers: g.maxMembers,
            currentCount: g.members.length
        }));
        socket.emit('guildListResult', list);
    });

    socket.on('joinGuild', (guildId) => {
        const player = state.players[socket.id];
        const guild = state.guilds[guildId];
        if (!player || !guild) return;
        if (player.guildId) {
            socket.emit('guildResult', { success: false, message: '이미 다른 길드에 소속되어 있습니다.' });
            return;
        }
        if (guild.members.length >= guild.maxMembers) {
            socket.emit('guildResult', { success: false, message: '길드 정원이 가득 찼습니다.' });
            return;
        }
        guild.members.push(socket.id);
        player.guildId = guildId;
        updateRankings();
        socket.emit('guildResult', { success: true, message: `🏰 '${guild.name}' 길드에 가입되었습니다!` });
        io.emit('updateState', state);
    });

    socket.on('leaveGuild', () => {
        const player = state.players[socket.id];
        if (!player || !player.guildId) return;
        const guild = state.guilds[player.guildId];
        if (guild) {
            guild.members = guild.members.filter(id => id !== socket.id);
            if (guild.members.length === 0) {
                delete state.guilds[player.guildId];
            } else if (guild.leaderId === socket.id) {
                guild.leaderId = guild.members[0];
            }
        }
        player.guildId = null;
        updateRankings();
        socket.emit('guildResult', { success: true, message: '길드를 탈퇴했습니다.' });
        io.emit('updateState', state);
    });

    // 거래소 시스템
    socket.on('getOnlineUsers', () => {
        const users = Object.values(state.players)
            .filter(p => p.socketId !== socket.id)
            .map(p => ({ id: p.socketId, name: p.name }));
        socket.emit('onlineUsersResult', users);
    });

    socket.on('requestTrade', (targetSocketId) => {
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        const requester = state.players[socket.id];
        if (!targetSocket || !requester) return;

        targetSocket.emit('tradeRequested', {
            fromId: socket.id,
            fromName: requester.name
        });
        socket.emit('tradeMsg', { message: '상대방에게 거래 요청을 보냈습니다.' });
    });

    socket.on('acceptTrade', (fromId) => {
        const partnerSocket = io.sockets.sockets.get(fromId);
        const me = state.players[socket.id];
        const partner = state.players[fromId];
        if (!partnerSocket || !me || !partner) return;

        const tradeId = 't_' + Math.random().toString(36).substring(2, 9);
        state.trades[tradeId] = {
            id: tradeId,
            user1: fromId,
            user2: socket.id,
            items1: [],
            items2: [],
            ready1: false,
            ready2: false
        };

        me.tradePartnerId = fromId;
        partner.tradePartnerId = socket.id;

        partnerSocket.emit('tradeStart', { tradeId, partnerName: me.name });
        socket.emit('tradeStart', { tradeId, partnerName: partner.name });
    });

    socket.on('updateTradeOffer', ({ tradeId, offeredIndices }) => {
        const trade = state.trades[tradeId];
        if (!trade) return;
        const isUser1 = (socket.id === trade.user1);
        if (isUser1) {
            trade.items1 = offeredIndices;
            trade.ready1 = false;
        } else {
            trade.items2 = offeredIndices;
            trade.ready2 = false;
        }

        const p1 = io.sockets.sockets.get(trade.user1);
        const p2 = io.sockets.sockets.get(trade.user2);
        const data = {
            items1: trade.items1.map(i => state.players[trade.user1]?.inventory[i]).filter(Boolean),
            items2: trade.items2.map(i => state.players[trade.user2]?.inventory[i]).filter(Boolean),
            ready1: trade.ready1,
            ready2: trade.ready2
        };
        if (p1) p1.emit('tradeStateUpdate', data);
        if (p2) p2.emit('tradeStateUpdate', data);
    });

    socket.on('setTradeReady', ({ tradeId, ready }) => {
        const trade = state.trades[tradeId];
        if (!trade) return;
        const isUser1 = (socket.id === trade.user1);
        if (isUser1) trade.ready1 = ready;
        else trade.ready2 = ready;

        const p1 = io.sockets.sockets.get(trade.user1);
        const p2 = io.sockets.sockets.get(trade.user2);
        const data = {
            items1: trade.items1.map(i => state.players[trade.user1]?.inventory[i]).filter(Boolean),
            items2: trade.items2.map(i => state.players[trade.user2]?.inventory[i]).filter(Boolean),
            ready1: trade.ready1,
            ready2: trade.ready2
        };
        if (p1) p1.emit('tradeStateUpdate', data);
        if (p2) p2.emit('tradeStateUpdate', data);

        if (trade.ready1 && trade.ready2) {
            const u1 = state.players[trade.user1];
            const u2 = state.players[trade.user2];
            if (!u1 || !u2) return;

            const gainCount1 = trade.items2.length - trade.items1.length;
            const gainCount2 = trade.items1.length - trade.items2.length;
            
            if (u1.inventory.length + gainCount1 > 36 || u2.inventory.length + gainCount2 > 36) {
                if (p1) p1.emit('tradeMsg', { message: '거래 실패: 인벤토리 공간이 부족합니다.' });
                if (p2) p2.emit('tradeMsg', { message: '거래 실패: 인벤토리 공간이 부족합니다.' });
                return;
            }

            const u1ItemsToGive = trade.items1.sort((a,b)=>b-a).map(i => u1.inventory.splice(i, 1)[0]).filter(Boolean);
            const u2ItemsToGive = trade.items2.sort((a,b)=>b-a).map(i => u2.inventory.splice(i, 1)[0]).filter(Boolean);

            u1ItemsToGive.forEach(item => u2.inventory.push(item));
            u2ItemsToGive.forEach(item => u1.inventory.push(item));

            u1.tradePartnerId = null;
            u2.tradePartnerId = null;
            delete state.trades[tradeId];

            if (p1) p1.emit('tradeComplete', { message: '🎉 거래가 성공적으로 완료되었습니다!' });
            if (p2) p2.emit('tradeComplete', { message: '🎉 거래가 성공적으로 완료되었습니다!' });
            io.emit('updateState', state);
        }
    });

    socket.on('cancelTrade', (tradeId) => {
        const trade = state.trades[tradeId];
        if (!trade) return;
        const p1 = io.sockets.sockets.get(trade.user1);
        const p2 = io.sockets.sockets.get(trade.user2);
        if (p1) { p1.emit('tradeCancelled', { message: '거래가 취소되었습니다.' }); p1.tradePartnerId = null; }
        if (p2) { p2.emit('tradeCancelled', { message: '거래가 취소되었습니다.' }); p2.tradePartnerId = null; }
        delete state.trades[tradeId];
    });

    socket.on('disconnect', () => {
        const player = state.players[socket.id];
        if (player && player.guildId) {
            const guild = state.guilds[player.guildId];
            if (guild) {
                guild.members = guild.members.filter(id => id !== socket.id);
                if (guild.members.length === 0) delete state.guilds[player.guildId];
            }
        }
        delete state.players[socket.id];
        updateRankings();
        io.emit('updateState', state);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`서버 실행 중: http://localhost:${PORT}`);
});
