const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.static(path.join(__dirname, 'public')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

const USERS_FILE = path.join(__dirname, 'users.json');

let registeredAccounts = {};
if (fs.existsSync(USERS_FILE)) {
    try {
        registeredAccounts = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (e) {
        registeredAccounts = {};
    }
}

function saveAccountsToFile() {
    fs.writeFileSync(USERS_FILE, JSON.stringify(registeredAccounts, null, 2), 'utf8');
}

const BOSS_LIST = [
    { name: '🐷 꿀신', maxHp: 157500, currentHp: 157500 },
    { name: '🗿 골리앗', maxHp: 367500, currentHp: 367500 },
    { name: '🦖 이라소', maxHp: 840000, currentHp: 840000 },
    { name: '🐉 드래곤', maxHp: 2100000, currentHp: 2100000 }
];

const WEAPON_DB = {
    // 단검 (Knife)
    knife_common: { name: '녹슨 도살도', type: 'knife', rarity: 'Common', atk: 100, sellPrice: 50, icon: '🔪' },
    knife_rare: { name: '혈각의 서사도', type: 'knife', rarity: 'Rare', atk: 250, sellPrice: 250, icon: '🗡️' },
    knife_epic: { name: '흑염의 사도검', type: 'knife', rarity: 'Epic', atk: 600, sellPrice: 2500, icon: '🗡️🔥' },
    knife_legendary: { name: '피빛의 소울리퍼', type: 'knife', rarity: 'Legendary', atk: 1400, sellPrice: 10000, icon: '⚔️🩸' },
    knife_mythic: { name: '심연의 핏빛 멸살검', type: 'knife', rarity: 'Mythic', atk: 3500, sellPrice: 100000, icon: '🗡️💀' },

    // 방패 (Shield)
    shield_common: { name: '나무 냄비뚜껑', type: 'shield', rarity: 'Common', atk: 60, shieldDuration: 10, sellPrice: 50, icon: '🛡️' },
    shield_rare: { name: '수호자의 가디언 실드', type: 'shield', rarity: 'Rare', atk: 180, shieldDuration: 12, sellPrice: 250, icon: '🛡️✨' },
    shield_epic: { name: '불멸의 가고일 방패', type: 'shield', rarity: 'Epic', atk: 450, shieldDuration: 14, sellPrice: 2500, icon: '🛡️🗿' },
    shield_legendary: { name: '성기사의 천상 실드', type: 'shield', rarity: 'Legendary', atk: 1000, shieldDuration: 16, sellPrice: 10000, icon: '🛡️👑' },
    shield_mythic: { name: '신성한 절대자의 결계', type: 'shield', rarity: 'Mythic', atk: 2500, shieldDuration: 20, sellPrice: 100000, icon: '🛡️❇️' },

    // 활 (Bow)
    bow_common: { name: '굽은 나무활', type: 'bow', rarity: 'Common', atk: 80, sellPrice: 50, icon: '🏹' },
    bow_rare: { name: '사냥꾼의 숏보우', type: 'bow', rarity: 'Rare', atk: 220, sellPrice: 250, icon: '🏹✨' },
    bow_epic: { name: '폭풍의 엘븐 보우', type: 'bow', rarity: 'Epic', atk: 550, sellPrice: 2500, icon: '🎯🔥' },
    bow_legendary: { name: '천둥의 스톰브링어', type: 'bow', rarity: 'Legendary', atk: 1250, sellPrice: 10000, icon: '🏹⚡' },
    bow_mythic: { name: '태양의 신궁 아폴론', type: 'bow', rarity: 'Mythic', atk: 3000, sellPrice: 100000, icon: '🏹🌌' },

    // 지팡이 (Staff - 힐러)
    staff_common: { name: '새싹의 허브 지팡이', type: 'staff', rarity: 'Common', atk: 40, sellPrice: 50, icon: '🌿' },
    staff_rare: { name: '축복의 성수 지팡이', type: 'staff', rarity: 'Rare', atk: 120, sellPrice: 250, icon: '💧✨' },
    staff_epic: { name: '요정의 생명 지팡이', type: 'staff', rarity: 'Epic', atk: 350, sellPrice: 2500, icon: '🔮🌿' },
    staff_legendary: { name: '세라핌의 치유 지팡이', type: 'staff', rarity: 'Legendary', atk: 800, sellPrice: 10000, icon: '🌟💖' },
    staff_mythic: { name: '세계수의 영원한 생명', type: 'staff', rarity: 'Mythic', atk: 2000, sellPrice: 100000, icon: '🌌✨' },

    // 🌟 버프템 계열 (공격력 10, 30, 50, 100, 150, 250 순서 + 방어력 복합)
    buff_common: { name: '작은 사기의 북', type: 'buff', rarity: 'Common', atk: 20, buffValue: 10, defValue: 0, sellPrice: 50, icon: '🥁' },
    buff_uncommon: { name: '군악대의 나팔', type: 'buff', rarity: 'Uncommon', atk: 40, buffValue: 30, defValue: 0, sellPrice: 150, icon: '🎺' },
    buff_rare: { name: '수호자의 깃발', type: 'buff', rarity: 'Rare', atk: 80, buffValue: 50, defValue: 20, sellPrice: 250, icon: '🚩' },
    buff_epic: { name: '용맹의 북', type: 'buff', rarity: 'Epic', atk: 150, buffValue: 100, defValue: 0, sellPrice: 1200, icon: '🪘' },
    buff_legendary: { name: '기사단의 대형 군단기', type: 'buff', rarity: 'Legendary', atk: 300, buffValue: 150, defValue: 50, sellPrice: 10000, icon: '✨🚩' },
    buff_mythic: { name: '태초의 군신 오라', type: 'buff', rarity: 'Mythic', atk: 600, buffValue: 250, defValue: 0, sellPrice: 100000, icon: '👑🔥' },

    hidden_hong: { name: '홍인준의 뱃살 방패', type: 'shield', rarity: 'Mythic', atk: 6000, shieldDuration: 25, sellPrice: 100000, icon: '🐷🛡️' },
    hidden_jiyu: { name: '지유의쌈장', type: 'knife', rarity: 'Mythic', atk: 10000000, sellPrice: 1000000, icon: '🐷' }
};

const COUPONS = {
    'WCDI26070123': { type: 'gold', reward: 1000 },
    'Fiwndq9': { type: 'weapon', reward: 'hidden_hong' },
    'ddddf1014': { type: 'gold', reward: 5000 },
    'HGAD026781': { type: 'gold', reward: 3000 },
    'HIJPIG12': { type: 'weapon', reward: 'hidden_hong' },
    'Ssamjang486': { type: 'weapon', reward: 'hidden_jiyu' }
};

let gameState = {
    boss: { ...BOSS_LIST[0] },
    players: {},
    registeredAccounts: registeredAccounts,
    guilds: {}
};

function saveAccountState(p) {
    if (p && gameState.registeredAccounts[p.name]) {
        gameState.registeredAccounts[p.name].gold = p.gold;
        gameState.registeredAccounts[p.name].hp = p.hp;
        gameState.registeredAccounts[p.name].inventory = p.inventory;
        gameState.registeredAccounts[p.name].equippedIndex = p.equippedIndex;
        gameState.registeredAccounts[p.name].totalDamage = p.totalDamage;
        saveAccountsToFile();
    }
}

function getRandomWeaponKey() {
    const types = ['knife', 'shield', 'bow', 'staff', 'buff'];
    const selectedType = types[Math.floor(Math.random() * types.length)];
    
    if (selectedType === 'buff') {
        const rand = Math.random() * 100;
        if (rand < 1.5) return 'buff_mythic';
        if (rand < 7.0) return 'buff_legendary';
        if (rand < 20.0) return 'buff_epic';
        if (rand < 50.0) return 'buff_rare';
        if (rand < 80.0) return 'buff_uncommon';
        return 'buff_common';
    }

    const rand = Math.random() * 100;
    let rarity = 'Common';
    if (rand < 1.5) rarity = 'Mythic';
    else if (rand < 7.0) rarity = 'Legendary';
    else if (rand < 20.0) rarity = 'Epic';
    else if (rand < 50.0) rarity = 'Rare';
    
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
    let baseAtk = 80; 
    let rarityMul = 1.0;
    if (eq) {
        rarityMul = getRarityMultiplier(eq.rarity);
        baseAtk = (eq.atk * (1 + (eq.enhance || 0) * 0.15)) * rarityMul;
    }
    return Math.round(baseAtk + (p.bonusAtk || 0) + (p.buffAtk || 0));
}

// 랭킹 계산 함수 (개인 + 길드)
function getRankings() {
    const allAccs = Object.values(registeredAccounts);
    allAccs.sort((a, b) => (b.totalDamage || 0) - (a.totalDamage || 0));
    const playerRankings = allAccs.map((acc, index) => ({
        rank: index + 1,
        name: acc.nickname,
        totalDamage: acc.totalDamage || 0,
        gold: acc.gold || 0
    }));

    const guildRankings = Object.keys(gameState.guilds).map(guildId => {
        const guild = gameState.guilds[guildId];
        let totalGuildDamage = 0;
        guild.members.forEach(memberId => {
            let mem = gameState.players[memberId];
            if (mem) {
                totalGuildDamage += (mem.totalDamage || 0);
            } else {
                // 오프라인 상태 계정 데미지 반영 탐색
                const memberAccount = Object.values(gameState.registeredAccounts).find(acc => {
                    // memberId가 닉네임인 경우 등 대응을 위한 예시 처리
                    return false; 
                });
            }
        });
        return {
            id: guildId,
            name: guild.name,
            totalDamage: totalGuildDamage,
            memberCount: guild.members.length,
            maxMembers: guild.maxMembers
        };
    });

    guildRankings.sort((a, b) => b.totalDamage - a.totalDamage);
    const indexedGuildRankings = guildRankings.map((g, idx) => ({ rank: idx + 1, ...g }));

    return { players: playerRankings, guilds: indexedGuildRankings };
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
            nickname, password, hp: 100, maxHp: 100, gold: 500,
            inventory: [], equippedIndex: null, totalDamage: 0, bonusAtk: 0
        };
        saveAccountsToFile();
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
            hp: account.hp !== undefined ? account.hp : 100,
            maxHp: account.maxHp !== undefined ? account.maxHp : 100,
            gold: account.gold !== undefined ? account.gold : 500,
            inventory: account.inventory ? [...account.inventory] : [],
            equippedIndex: account.equippedIndex !== undefined ? account.equippedIndex : null,
            totalDamage: account.totalDamage || 0,
            bonusAtk: account.bonusAtk || 0,
            buffAtk: 0,
            buffDef: 0,
            lastSkillTime: 0, 
            isInvincible: false, 
            invincibleUntil: 0, 
            guildId: null
        };

        socket.emit('loginSuccess', { success: true, player: gameState.players[socket.id], rankings: getRankings() });
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
        if (!p || p.gold < 1000 || p.inventory.length >= 36) return;
        p.gold -= 1000;
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
        p.gold += 15;
        saveAccountState(p);

        checkBossKill(p);
        io.emit('updateState', gameState);
    });

    // 🌟 스킬 사용 (길드원 힐 및 버프 효과 공유)
    socket.on('useSkill', () => {
        const p = gameState.players[socket.id];
        if (!p || p.hp <= 0) return;
        const now = Date.now();
        
        let eq = p.equippedIndex !== null ? p.inventory[p.equippedIndex] : null;
        let weaponType = eq ? eq.type : 'none';
        let rarityMul = eq ? getRarityMultiplier(eq.rarity) : 1.0;
        let baseAtk = eq ? eq.atk : 100;

        let currentCooldown = (weaponType === 'shield') ? ((eq.shieldDuration || 10) + 5) * 1000 : 5000;
        if (now - (p.lastSkillTime || 0) < currentCooldown) {
            socket.emit('skillResult', { success: false, message: '⏳ 스킬 쿨타임 중입니다!' });
            return;
        }
        p.lastSkillTime = now;

        if (eq && eq.name === '지유의쌈장') {
            let skillDmg = 1000000000;
            gameState.boss.currentHp -= skillDmg;
            p.totalDamage += skillDmg;
            p.gold += 100;
            socket.emit('skillResult', { success: true, message: `🐷 [지유의쌈장 폭발] 1,000,000,000 대미지!` });
            checkBossKill(p);
        } else if (weaponType === 'staff') {
            let healTable = { 'Common': 10, 'Rare': 15, 'Epic': 25, 'Legendary': 35, 'Mythic': 50 };
            let healAmt = eq && healTable[eq.rarity] ? healTable[eq.rarity] : 10;

            if (p.guildId && gameState.guilds[p.guildId]) {
                gameState.guilds[p.guildId].members.forEach(memberId => {
                    let member = gameState.players[memberId];
                    if (member && member.hp > 0) {
                        member.hp = Math.min(member.maxHp, member.hp + healAmt);
                        io.to(memberId).emit('skillResult', { success: true, message: `🌿 [길드 치유의 파동] 힐러 ${p.name}의 능력으로 체력 ${healAmt} 회복!` });
                        saveAccountState(member);
                    }
                });
            } else {
                p.hp = Math.min(p.maxHp, p.hp + healAmt);
                socket.emit('skillResult', { success: true, message: `🌿 [치유의 파동] 체력 ${healAmt} 회복!` });
            }
            p.gold += 30;
        } else if (weaponType === 'buff') {
            let buffAtkVal = eq.buffValue || 10;
            let buffDefVal = eq.defValue || 0;
            let buffDuration = 15;

            if (p.guildId && gameState.guilds[p.guildId]) {
                gameState.guilds[p.guildId].members.forEach(memberId => {
                    let member = gameState.players[memberId];
                    if (member) {
                        member.buffAtk = (member.buffAtk || 0) + buffAtkVal;
                        member.buffDef = (member.buffDef || 0) + buffDefVal;
                        
                        let msg = `🥁 [길드 버프] 공격력 +${buffAtkVal}`;
                        if (buffDefVal > 0) msg += `, 방어력 +${buffDefVal}`;
                        
                        io.to(memberId).emit('skillResult', { success: true, message: `${msg} 증가!` });
                        
                        setTimeout(() => {
                            if (gameState.players[memberId]) {
                                gameState.players[memberId].buffAtk = Math.max(0, (gameState.players[memberId].buffAtk || 0) - buffAtkVal);
                                gameState.players[memberId].buffDef = Math.max(0, (gameState.players[memberId].buffDef || 0) - buffDefVal);
                            }
                        }, buffDuration * 1000);
                    }
                });
            } else {
                p.buffAtk = (p.buffAtk || 0) + buffAtkVal;
                p.buffDef = (p.buffDef || 0) + buffDefVal;
                
                let msg = `🥁 [버프 활성화] 공격력 +${buffAtkVal}`;
                if (buffDefVal > 0) msg += `, 방어력 +${buffDefVal}`;
                
                socket.emit('skillResult', { success: true, message: `${msg} 증가!` });
                
                setTimeout(() => {
                    if (gameState.players[socket.id]) {
                        gameState.players[socket.id].buffAtk = Math.max(0, (gameState.players[socket.id].buffAtk || 0) - buffAtkVal);
                        gameState.players[socket.id].buffDef = Math.max(0, (gameState.players[socket.id].buffDef || 0) - buffDefVal);
                    }
                }, buffDuration * 1000);
            }
            p.gold += 35;
        } else if (weaponType === 'shield') {
            let durationSec = eq.shieldDuration || 10;
            p.isInvincible = true;
            p.invincibleUntil = now + (durationSec * 1000);
            p.gold += 25;
            socket.emit('skillResult', { success: true, message: `🛡️ [절대 방벽] ${durationSec}초 무적!` });
        } else {
            let skillDmg = Math.round((baseAtk * rarityMul * 2.5) + (p.bonusAtk || 0) + (p.buffAtk || 0));
            gameState.boss.currentHp -= skillDmg;
            p.totalDamage += skillDmg;
            p.gold += 50;
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

    // 길드 시스템 소켓
    socket.on('createGuild', ({ guildName, maxMembers }) => {
        const p = gameState.players[socket.id];
        if (!p || p.guildId) return;
        
        const limit = parseInt(maxMembers) || 5;
        const guildId = 'guild_' + Date.now();
        
        gameState.guilds[guildId] = {
            name: guildName.trim(),
            master: socket.id,
            maxMembers: limit,
            members: [socket.id]
        };
        
        p.guildId = guildId;
        socket.emit('guildResult', { success: true, message: `🏰 [${guildName}] 길드가 창설되었습니다! (최대 인원: ${limit}명)` });
        io.emit('updateState', gameState);
    });

    socket.on('getGuildList', () => {
        const list = Object.keys(gameState.guilds).map(id => ({
            id,
            name: gameState.guilds[id].name,
            currentCount: gameState.guilds[id].members.length,
            maxMembers: gameState.guilds[id].maxMembers
        }));
        socket.emit('guildListResult', list);
    });

    socket.on('joinGuild', (guildId) => {
        const p = gameState.players[socket.id];
        const guild = gameState.guilds[guildId];
        
        if (!p || p.guildId || !guild) return;
        
        if (guild.members.length >= guild.maxMembers) {
            socket.emit('guildResult', { success: false, message: '❌ 길드 정원이 가득 찼습니다!' });
            return;
        }
        
        guild.members.push(socket.id);
        p.guildId = guildId;
        socket.emit('guildResult', { success: true, message: `✨ [${guild.name}] 길드에 가입되었습니다!` });
        io.emit('updateState', gameState);
    });

    socket.on('leaveGuild', () => {
        const p = gameState.players[socket.id];
        if (!p || !p.guildId) return;
        
        const guild = gameState.guilds[p.guildId];
        if (guild) {
            guild.members = guild.members.filter(id => id !== socket.id);
            if (guild.members.length === 0) {
                delete gameState.guilds[p.guildId];
            } else if (guild.master === socket.id) {
                guild.master = guild.members[0];
            }
        }
        
        delete p.guildId;
        socket.emit('guildResult', { success: true, message: '👋 길드를 탈퇴했습니다.' });
        io.emit('updateState', gameState);
    });

    socket.on('useCoupon', (code) => {
        const p = gameState.players[socket.id];
        if (!p || !COUPONS[code]) return;
        const c = COUPONS[code];
        if (c.type === 'gold') {
            p.gold += c.reward;
            socket.emit('couponResult', { success: true, message: `💰 ${c.reward} 골드 획득!` });
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
            const cost = ((item.enhance || 0) + 1) * 400;
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
        if (action === 'giveGold') {
            const target = gameState.players[payload.targetId] || Object.values(gameState.players).find(p => p.name === payload.targetName);
            if (target) {
                target.gold += Number(payload.amount || 0);
                saveAccountState(target);
            } else if (gameState.registeredAccounts[payload.targetName]) {
                gameState.registeredAccounts[payload.targetName].gold = (gameState.registeredAccounts[payload.targetName].gold || 0) + Number(payload.amount || 0);
                saveAccountsToFile();
            }
        }
        if (action === 'setDamage') {
            const target = gameState.players[payload.targetId] || Object.values(gameState.players).find(p => p.name === payload.targetName);
            if (target) {
                target.totalDamage = Number(payload.damage || 0);
                saveAccountState(target);
            } else if (gameState.registeredAccounts[payload.targetName]) {
                gameState.registeredAccounts[payload.targetName].totalDamage = Number(payload.damage || 0);
                saveAccountsToFile();
            }
        }
        if (action === 'giveSpecificWeapon') {
            const target = gameState.players[payload.targetId] || Object.values(gameState.players).find(p => p.name === payload.targetName);
            const wKey = payload.weaponKey;
            if (target && WEAPON_DB[wKey] && target.inventory.length < 36) {
                const w = { ...WEAPON_DB[wKey], id: Date.now() + Math.random(), enhance: 0 };
                target.inventory.push(w);
                saveAccountState(target);
                io.to(target.id).emit('itemObtained', { weapon: w, full: false });
            } else if (gameState.registeredAccounts[payload.targetName] && WEAPON_DB[wKey]) {
                const acc = gameState.registeredAccounts[payload.targetName];
                if (!acc.inventory) acc.inventory = [];
                if (acc.inventory.length < 36) {
                    const w = { ...WEAPON_DB[wKey], id: Date.now() + Math.random(), enhance: 0 };
                    acc.inventory.push(w);
                    saveAccountsToFile();
                }
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
