const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.static(path.join(__dirname, 'public')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

const BOSS_LIST = [
    { name: '🐷 꿀신', maxHp: 157500, currentHp: 157500, expReward: 10000, type: 'normal' },
    { name: '🗿 골리앗', maxHp: 367500, currentHp: 367500, expReward: 30000, type: 'normal' },
    { name: '🦖 이라소', maxHp: 840000, currentHp: 840000, expReward: 150000, type: 'normal' },
    { name: '🐉 드래곤', maxHp: 2100000, currentHp: 2100000, expReward: 500000, type: 'normal' }
];

const UPPER_BOSS_LIST = [
    { name: '🦁 우흐라', maxHp: 12000000, currentHp: 12000000, damage: 20, interval: 10000, type: 'upper' },
    { name: '🐯 기호전', maxHp: 17000000, currentHp: 17000000, damage: 12, interval: 5000, type: 'upper' },
    { name: '👾 사이키', maxHp: 25000000, currentHp: 25000000, damage: 3, interval: 1000, type: 'upper' },
    { name: '👁 개념의 눈알', maxHp: 5000000, currentHp: 5000000, damage: 5, interval: 1000, type: 'upper' }
];

const WEAPON_DB = {
    knife_common: { name: '녹슨 도살도', type: 'knife', rarity: 'Common', atk: 100, sellPrice: 50, icon: '🔪' },
    knife_rare: { name: '혈각의 서사도', type: 'knife', rarity: 'Rare', atk: 250, sellPrice: 250, icon: '🗡️' },
    knife_epic: { name: '흑염의 사도검', type: 'knife', rarity: 'Epic', atk: 600, sellPrice: 2500, icon: '🗡️🔥' },
    knife_legendary: { name: '피빛의 소울리퍼', type: 'knife', rarity: 'Legendary', atk: 1400, sellPrice: 10000, icon: '⚔️🩸' },
    knife_mythic: { name: '심연의 핏빛 멸살검', type: 'knife', rarity: 'Mythic', atk: 3500, sellPrice: 100000, icon: '🗡️💀' },

    shield_common: { name: '나무 냄비뚜껑', type: 'shield', rarity: 'Common', atk: 60, shieldDuration: 10, sellPrice: 50, icon: '🛡️' },
    shield_rare: { name: '수호자의 가디언 실드', type: 'shield', rarity: 'Rare', atk: 180, shieldDuration: 12, sellPrice: 250, icon: '🛡️✨' },
    shield_epic: { name: '불멸의 가고일 방패', type: 'shield', rarity: 'Epic', atk: 450, shieldDuration: 14, sellPrice: 2500, icon: '🛡️🗿' },
    shield_legendary: { name: '성기사의 천상 실드', type: 'shield', rarity: 'Legendary', atk: 1000, shieldDuration: 16, sellPrice: 10000, icon: '🛡️👑' },
    shield_mythic: { name: '신성한 절대자의 결계', type: 'shield', rarity: 'Mythic', atk: 2500, shieldDuration: 20, sellPrice: 100000, icon: '🛡️❇️' },

    bow_common: { name: '굽은 나무활', type: 'bow', rarity: 'Common', atk: 80, sellPrice: 50, icon: '🏹' },
    bow_rare: { name: '사냥꾼의 숏보우', type: 'bow', rarity: 'Rare', atk: 220, sellPrice: 250, icon: '🏹✨' },
    bow_epic: { name: '폭풍의 엘븐 보우', type: 'bow', rarity: 'Epic', atk: 550, sellPrice: 2500, icon: '🎯🔥' },
    bow_legendary: { name: '천둥의 스톰브링어', type: 'bow', rarity: 'Legendary', atk: 1250, sellPrice: 10000, icon: '🏹⚡' },
    bow_mythic: { name: '태양의 신궁 아폴론', type: 'bow', rarity: 'Mythic', atk: 3000, sellPrice: 100000, icon: '🏹🌌' },

    staff_common: { name: '새싹의 허브 지팡이', type: 'staff', rarity: 'Common', atk: 40, heal: 100, targets: 1, sellPrice: 50, icon: '🌿' },
    staff_rare: { name: '축복의 성수 지팡이', type: 'staff', rarity: 'Rare', atk: 120, heal: 150, targets: 1, sellPrice: 250, icon: '💧✨' },
    staff_epic: { name: '요정의 생명 지팡이', type: 'staff', rarity: 'Epic', atk: 350, heal: 200, targets: 1, sellPrice: 2500, icon: '🔮🌿' },
    staff_legendary: { name: '세라핌의 치유 지팡이', type: 'staff', rarity: 'Legendary', atk: 800, heal: 250, targets: 1, sellPrice: 10000, icon: '🌟💖' },
    staff_mythic: { name: '세계수의 영원한 생명', type: 'staff', rarity: 'Mythic', atk: 2000, heal: 300, targets: 2, sellPrice: 100000, icon: '🌌✨' },

    hidden_hong: { name: '홍인준의 뱃살 방패', type: 'shield', rarity: 'Mythic', atk: 6000, shieldDuration: 25, sellPrice: 100000, icon: '🐷🛡️' },

    secret_void_blade: { name: '공허의 파멸검', type: 'knife', rarity: 'Secret', atk: 999999, sellPrice: 1000000, icon: '🗡️' },
    secret_meteor_bow: { name: '유성우의 시위', type: 'bow', rarity: 'Secret', atk: 950000, sellPrice: 1000000, icon: '🏹' },
    secret_titan_wall: { name: '타이탄의 불멸벽', type: 'shield', rarity: 'Secret', atk: 850000, shieldDuration: 30, sellPrice: 1000000, icon: '🛡️' },
    secret_goddess_grail: { name: '여신의 눈물 성배', type: 'staff', rarity: 'Secret', atk: 800000, heal: 5000, sellPrice: 1000000, icon: '🍷' },
    secret_arcana_stone: { name: '아르카나의 파괴석', type: 'special', rarity: 'Secret', atk: 1200000, sellPrice: 1500000, icon: '💎' },

    artifact_common_shard: { name: '고대의 부서진 조각', type: 'artifact', rarity: 'Common', sellPrice: 1000, icon: '🪨' },
    artifact_common_ring: { name: '빛바랜 용사의 반지', type: 'artifact', rarity: 'Common', sellPrice: 2500, icon: '💍' },
    artifact_rare_feather: { name: '정령의 속삭임 깃털', type: 'artifact', rarity: 'Rare', sellPrice: 7500, icon: '🪶' },
    artifact_rare_hourglass: { name: '마력 스며든 모래시계', type: 'artifact', rarity: 'Rare', sellPrice: 15000, icon: '⏳' },
    artifact_epic_scale: { name: '화염룡의 비늘 조각', type: 'artifact', rarity: 'Epic', sellPrice: 45000, icon: '🔥' },
    artifact_epic_orb: { name: '혹한의 서릿발 구슬', type: 'artifact', rarity: 'Epic', sellPrice: 100000, icon: '❄️' },
    artifact_legendary_crown: { name: '천공의 황금 왕관', type: 'artifact', rarity: 'Legendary', sellPrice: 350000, icon: '👑' },
    artifact_legendary_leaf: { name: '세계수의 나뭇잎', type: 'artifact', rarity: 'Legendary', sellPrice: 700000, icon: '🍃' },
    artifact_mythic_tablet: { name: '신들의 심판의 서판', type: 'artifact', rarity: 'Mythic', sellPrice: 2000000, icon: '📜' },
    artifact_mythic_grail: { name: '창조주의 영원한 성배', type: 'artifact', rarity: 'Mythic', sellPrice: 5000000, icon: '🏆' }
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
    upperBoss: { ...UPPER_BOSS_LIST[0] },
    players: {},
    registeredAccounts: {},
    guilds: {},
    marketListings: {},
    trades: {},
    rankings: { players: [], guilds: [] }
};

function saveAccountState(p) {
    if (p && gameState.registeredAccounts[p.name]) {
        gameState.registeredAccounts[p.name].gold = p.gold;
        gameState.registeredAccounts[p.name].hp = p.hp;
        gameState.registeredAccounts[p.name].exp = p.exp;
        gameState.registeredAccounts[p.name].level = p.level;
        gameState.registeredAccounts[p.name].maxHp = p.maxHp;
        gameState.registeredAccounts[p.name].inventory = p.inventory;
        gameState.registeredAccounts[p.name].equippedIndex = p.equippedIndex;
        gameState.registeredAccounts[p.name].totalDamage = p.totalDamage;
        gameState.registeredAccounts[p.name].guildId = p.guildId;
    }
}

function updateRankings() {
    const pList = Object.values(gameState.players).map(p => ({
        name: p.name,
        totalDamage: p.totalDamage || 0
    })).sort((a, b) => b.totalDamage - a.totalDamage);
    gameState.rankings.players = pList;

    const gList = Object.values(gameState.guilds).map(g => {
        let gDmg = 0;
        g.members.forEach(mId => {
            if (gameState.players[mId]) gDmg += (gameState.players[mId].totalDamage || 0);
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
    gameState.rankings.guilds = gList;
}

function getRandomArtifactKey(isUpper = false) {
    const tierRand = Math.random() * 100;
    let chosenTier = 'Common';
    let mythicRate = isUpper ? 3.0 : 1.0;
    let legendaryRate = isUpper ? 10.0 : 5.0;
    let epicRate = isUpper ? 25.0 : 15.0;
    let rareRate = isUpper ? 60.0 : 45.0;

    if (tierRand < mythicRate) chosenTier = 'Mythic';
    else if (tierRand < legendaryRate) chosenTier = 'Legendary';
    else if (tierRand < epicRate) chosenTier = 'Epic';
    else if (tierRand < rareRate) chosenTier = 'Rare';
    else chosenTier = 'Common';

    const tierItems = Object.keys(WEAPON_DB).filter(k => WEAPON_DB[k].type === 'artifact' && WEAPON_DB[k].rarity === chosenTier);
    return tierItems.length > 0 ? tierItems[Math.floor(Math.random() * tierItems.length)] : 'artifact_common_shard';
}

function getRandomWeaponKey(isUpper = false) {
    const rand = Math.random() * 100;
    let rarity = 'Common';
    if (isUpper && rand < 0.02) {
        rarity = 'Secret';
    } else if (rand < 0.08) {
        rarity = 'Mythic';
    } else if (rand < 2.9) {
        rarity = 'Legendary';
    } else if (rand < 15) {
        rarity = 'Epic';
    } else if (rand < 32) {
        rarity = 'Rare';
    } else {
        rarity = 'Common';
    }

    if (rarity === 'Secret' && !isUpper) rarity = 'Mythic';

    let keys = Object.keys(WEAPON_DB).filter(k => WEAPON_DB[k].type !== 'artifact' && WEAPON_DB[k].rarity === rarity);
    if (keys.length === 0) keys = Object.keys(WEAPON_DB).filter(k => WEAPON_DB[k].type !== 'artifact' && WEAPON_DB[k].rarity === 'Common');
    return keys[Math.floor(Math.random() * keys.length)];
}

function getRarityMultiplier(rarity) {
    switch (rarity) {
        case 'Secret': return 5.0;
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
    if (eq && eq.type !== 'artifact' && eq.type !== 'box') {
        rarityMul = getRarityMultiplier(eq.rarity);
        baseAtk = (eq.atk * (1 + (eq.enhance || 0) * 0.15)) * rarityMul;
    }

    let levelBonusAtk = 0;
    if (p.level >= 10) {
        levelBonusAtk = (p.level - 10) * 200;
    }

    return Math.round(baseAtk + (p.bonusAtk || 0) + levelBonusAtk);
}

// 필요 경험치 계산 배율 1.2배로 수정 반영 (360 -> 432 공식 호환)
function addExp(p, amount) {
    if (p.level >= 100) {
        p.exp = 0;
        return;
    }
    p.exp += amount;
    let reqExp = Math.round(360 * Math.pow(1.2, p.level - 1));
    while (p.level < 100 && p.exp >= reqExp) {
        p.exp -= reqExp;
        p.level++;
        p.maxHp += 10;
        p.hp = p.maxHp;
        p.gold += 5000;
        reqExp = Math.round(360 * Math.pow(1.2, p.level - 1));
    }
    if (p.level >= 100) {
        p.level = 100;
        p.exp = 0;
    }
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
                if (p.isInUpperDungeon) {
                    if (p.equippedIndex !== null && p.inventory[p.equippedIndex]) {
                        p.inventory.splice(p.equippedIndex, 1);
                        p.equippedIndex = null;
                    }
                    p.isInUpperDungeon = false;
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
            nickname, password, hp: 100, maxHp: 100, gold: 500, exp: 0, level: 1,
            inventory: [], equippedIndex: null, totalDamage: 0, bonusAtk: 0, guildId: null
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
            hp: account.hp !== undefined ? account.hp : 100,
            maxHp: account.maxHp !== undefined ? account.maxHp : 100,
            gold: account.gold !== undefined ? account.gold : 500,
            exp: account.exp !== undefined ? account.exp : 0,
            level: account.level !== undefined ? account.level : 1,
            inventory: account.inventory ? [...account.inventory] : [],
            equippedIndex: account.equippedIndex !== undefined ? account.equippedIndex : null,
            totalDamage: account.totalDamage || 0,
            bonusAtk: account.bonusAtk || 0,
            lastSkillTime: 0,
            isInvincible: false,
            invincibleUntil: 0,
            guildId: account.guildId || null,
            isInUpperDungeon: false,
            sessionDamage: 0
        };

        socket.emit('loginSuccess', { success: true, player: gameState.players[socket.id] });
        updateRankings();
        io.emit('updateState', gameState);
    });

    socket.on('chatMessage', ({ channel, message }) => {
        const p = gameState.players[socket.id];
        if (!p || !message || message.trim() === '') return;
        const cleanMsg = message.trim().substring(0, 150);

        if (channel === 'guild') {
            if (!p.guildId) return;
            const guild = gameState.guilds[p.guildId];
            if (guild) {
                guild.members.forEach(mId => {
                    io.to(mId).emit('chatMessage', { senderName: p.name, message: cleanMsg, channel: 'guild' });
                });
            }
        } else {
            io.emit('chatMessage', { senderName: p.name, message: cleanMsg, channel: 'all' });
        }
    });

    socket.on('attack', () => {
        const p = gameState.players[socket.id];
        if (!p || p.hp <= 0) return;
        let dmg = calculateDamage(p);

        if (p.isInUpperDungeon) {
            gameState.upperBoss.currentHp -= dmg;
            p.sessionDamage = (p.sessionDamage || 0) + dmg;
        } else {
            gameState.boss.currentHp -= dmg;
            p.sessionDamage = (p.sessionDamage || 0) + dmg;
        }

        p.totalDamage = (p.totalDamage || 0) + dmg;
        p.gold += 15;
        addExp(p, Math.max(1, Math.floor(dmg / 10)));

        saveAccountState(p);
        updateRankings();
        if (p.isInUpperDungeon) checkUpperBossKill();
        else checkBossKill();

        io.emit('updateState', gameState);
    });

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
            socket.emit('skillResultPop', { success: false, message: '⏳ 스킬 쿨타임 중입니다!' });
            return;
        }
        p.lastSkillTime = now;

        let skillResultData = { success: true, message: '', type: weaponType };

        if (weaponType === 'staff') {
            let totalHealAmt = Math.round(((eq.heal || 100) * rarityMul) + 200);
            p.hp = Math.min(p.maxHp, p.hp + totalHealAmt);
            p.gold += 30;
            addExp(p, 60);
            skillResultData.message = `🌿 [치유의 파동] 체력 ${totalHealAmt} 회복!`;
            skillResultData.val = totalHealAmt;
        } else if (weaponType === 'shield') {
            let durationSec = eq.shieldDuration || 10;
            p.isInvincible = true;
            p.invincibleUntil = now + (durationSec * 1000);
            p.gold += 25;
            addExp(p, 50);
            skillResultData.message = `🛡️ [절대 방벽] ${durationSec}초 무적 개시!`;
            skillResultData.val = durationSec;
        } else {
            let levelBonusAtk = p.level >= 10 ? (p.level - 10) * 200 : 0;
            let skillDmg = Math.round(((baseAtk * rarityMul * 2.5) + (p.bonusAtk || 0) + levelBonusAtk));
            if (p.isInUpperDungeon) {
                gameState.upperBoss.currentHp -= skillDmg;
                p.sessionDamage = (p.sessionDamage || 0) + skillDmg;
            } else {
                gameState.boss.currentHp -= skillDmg;
                p.sessionDamage = (p.sessionDamage || 0) + skillDmg;
            }
            p.totalDamage += skillDmg;
            p.gold += 50;
            addExp(p, 100);
            skillResultData.message = `⚔️ 필살기 적중! ${skillDmg.toLocaleString()} 대미지 작렬!`;
            skillResultData.val = skillDmg;
            updateRankings();
            if (p.isInUpperDungeon) checkUpperBossKill();
            else checkBossKill();
        }
        saveAccountState(p);
        socket.emit('skillResultPop', skillResultData);
        io.emit('updateState', gameState);
    });

    function checkBossKill() {
        if (gameState.boss.currentHp <= 0) {
            let currentBoss = BOSS_LIST.find(b => b.name === gameState.boss.name) || BOSS_LIST[0];
            let requiredDamage = currentBoss.maxHp * 0.10;

            Object.values(gameState.players).forEach(player => {
                if ((player.sessionDamage || 0) >= requiredDamage) {
                    let rewardExp = currentBoss.expReward;
                    addExp(player, rewardExp);

                    const artifactKey = getRandomArtifactKey(false);
                    const droppedItem = { ...WEAPON_DB[artifactKey], id: Date.now() + Math.random(), enhance: 0 };
                    
                    const targetSocket = io.sockets.sockets.get(player.id);
                    if (targetSocket) {
                        if (player.inventory.length < 36) {
                            player.inventory.push(droppedItem);
                            targetSocket.emit('itemObtained', { weapon: droppedItem, full: false });
                        } else {
                            targetSocket.emit('itemObtained', { weapon: droppedItem, full: true });
                        }
                        targetSocket.emit('tradeAlert', { success: true, message: `🎉 보스 처치 기여 성공! 유물(${droppedItem.name})과 경험치를 획득했습니다!` });
                    }
                } else {
                    const targetSocket = io.sockets.sockets.get(player.id);
                    if (targetSocket) {
                        targetSocket.emit('tradeAlert', { success: false, message: `보스 체력의 10% 이상을 기여하지 못해 보상을 받지 못했습니다!` });
                    }
                }
                player.sessionDamage = 0;
                saveAccountState(player);
            });

            gameState.boss = { ...BOSS_LIST[Math.floor(Math.random() * BOSS_LIST.length)] };
        }
    }

    function checkUpperBossKill() {
        if (gameState.upperBoss.currentHp <= 0) {
            let currentUpperBoss = UPPER_BOSS_LIST.find(b => b.name === gameState.upperBoss.name) || UPPER_BOSS_LIST[0];
            let requiredDamage = currentUpperBoss.maxHp * 0.10;

            Object.values(gameState.players).forEach(player => {
                if ((player.sessionDamage || 0) >= requiredDamage) {
                    addExp(player, 500000);
                    const artifactKey = getRandomArtifactKey(true);
                    const droppedItem = { ...WEAPON_DB[artifactKey], id: Date.now() + Math.random(), enhance: 0 };
                    
                    const targetSocket = io.sockets.sockets.get(player.id);
                    if (targetSocket) {
                        if (player.inventory.length < 36) {
                            player.inventory.push(droppedItem);
                            targetSocket.emit('itemObtained', { weapon: droppedItem, full: false });
                        } else {
                            targetSocket.emit('itemObtained', { weapon: droppedItem, full: true });
                        }
                        targetSocket.emit('tradeAlert', { success: true, message: `🎉 상위 보스 처치 기여 성공! 유물(${droppedItem.name})과 경험치를 획득했습니다!` });
                    }
                } else {
                    const targetSocket = io.sockets.sockets.get(player.id);
                    if (targetSocket) {
                        targetSocket.emit('tradeAlert', { success: false, message: `상위 보스 체력의 10% 이상을 기여하지 못해 보상을 받지 못했습니다!` });
                    }
                }
                player.sessionDamage = 0;
                saveAccountState(player);
            });

            const r = Math.random() * 100;
            let nextBossIdx = 0;
            if (r < 45) nextBossIdx = 0;
            else if (r < 70) nextBossIdx = 1;
            else if (r < 85) nextBossIdx = 2;
            else nextBossIdx = 3;

            gameState.upperBoss = { ...UPPER_BOSS_LIST[nextBossIdx] };
        }
    }

    socket.on('enterUpperDungeon', () => {
        const p = gameState.players[socket.id];
        if (!p) return;
        if (p.level < 50) {
            socket.emit('upperDungeonResult', { success: false, message: '50레벨 이상만 입장 가능합니다!' });
            return;
        }
        if (p.gold < 6000000) {
            socket.emit('upperDungeonResult', { success: false, message: '입장 골드(6,000,000G)가 부족합니다!' });
            return;
        }
        p.gold -= 6000000;
        p.isInUpperDungeon = true;
        p.sessionDamage = 0;
        saveAccountState(p);
        socket.emit('upperDungeonResult', { success: true, message: '상위 던전에 입장했습니다!' });
        io.emit('updateState', gameState);
    });

    socket.on('exitUpperDungeon', () => {
        const p = gameState.players[socket.id];
        if (!p) return;
        p.isInUpperDungeon = false;
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    socket.on('packItemsIntoBox', ({ indices, boxName }) => {
        const p = gameState.players[socket.id];
        if (!p || !Array.isArray(indices) || indices.length === 0) return;
        if (indices.length > 25) {
            socket.emit('tradeAlert', { success: false, message: '상자에는 최대 25개까지만 담을 수 있습니다!' });
            return;
        }

        let cleanIndices = [...new Set(indices)].sort((a, b) => b - a);
        let packedItems = [];
        let totalSellPrice = 500;

        for (let idx of cleanIndices) {
            if (idx >= 0 && idx < p.inventory.length) {
                let item = p.inventory[idx];
                if (item.isLocked) {
                    socket.emit('tradeAlert', { success: false, message: '잠겨 있는(락) 아이템은 상자에 담을 수 없습니다.' });
                    return;
                }
                if (p.equippedIndex === idx) {
                    socket.emit('tradeAlert', { success: false, message: '장착 중인 아이템은 상자에 담을 수 없습니다.' });
                    return;
                }
                let extracted = p.inventory.splice(idx, 1)[0];
                packedItems.push(extracted);
                totalSellPrice += (extracted.sellPrice || 50);
            }
        }

        p.equippedIndex = null;

        const newBox = {
            id: Date.now() + Math.random(),
            name: boxName && boxName.trim() !== '' ? boxName.trim() : '무기 보관 상자',
            type: 'box',
            rarity: 'Epic',
            sellPrice: totalSellPrice,
            icon: '📦',
            items: packedItems
        };

        p.inventory.push(newBox);
        saveAccountState(p);
        socket.emit('tradeAlert', { success: true, message: `📦 [${newBox.name}] 상자 제작 완료! (가치 합산: ${totalSellPrice.toLocaleString()}G)` });
        io.emit('updateState', gameState);
    });

    socket.on('unpackBox', (boxIndex) => {
        const p = gameState.players[socket.id];
        if (!p || boxIndex < 0 || boxIndex >= p.inventory.length) return;
        const boxItem = p.inventory[boxIndex];
        
        if (!boxItem || boxItem.type !== 'box' || !boxItem.items) {
            socket.emit('tradeAlert', { success: false, message: '유효한 상자가 아닙니다.' });
            return;
        }

        let itemsCount = boxItem.items.length;
        let currentEmptySlots = 36 - p.inventory.length;

        if (currentEmptySlots + 1 < itemsCount || p.inventory.length + itemsCount - 1 > 36) {
            socket.emit('tradeAlert', { success: false, message: '[ 무기고가 꽉 찼습니다! ]' });
            return;
        }

        p.inventory.splice(boxIndex, 1);
        p.inventory.push(...boxItem.items);
        p.equippedIndex = null;

        saveAccountState(p);
        socket.emit('tradeAlert', { success: true, message: '📦 상자를 성공적으로 풀었습니다!' });
        io.emit('updateState', gameState);
    });

    socket.on('requestTrade', (targetName) => {
        const sender = gameState.players[socket.id];
        if (!sender) return;
        let targetSocketId = null;
        for (let [sId, pObj] of Object.entries(gameState.players)) {
            if (pObj.name === targetName) {
                targetSocketId = sId;
                break;
            }
        }
        if (!targetSocketId || targetSocketId === socket.id) {
            socket.emit('tradeAlert', { success: false, message: '상대를 찾을 수 없거나 자기 자신과는 거래할 수 없습니다.' });
            return;
        }
        io.to(targetSocketId).emit('tradeRequestReceived', { senderId: socket.id, senderName: sender.name });
        socket.emit('tradeAlert', { success: true, message: `${targetName}님께 [실시간] 1대1 거래를 요청했습니다.` });
    });

    socket.on('acceptTrade', (senderId) => {
        const acceptor = gameState.players[socket.id];
        const sender = gameState.players[senderId];
        if (!acceptor || !sender) return;

        const tradeId = 'trade_' + Date.now();
        gameState.trades[tradeId] = {
            id: tradeId,
            p1: senderId,
            p2: socket.id,
            p1Name: sender.name,
            p2Name: acceptor.name,
            p1Offer: { items: [], gold: 0, locked: false },
            p2Offer: { items: [], gold: 0, locked: false }
        };

        io.to(senderId).emit('tradeStarted', { tradeId, partnerName: acceptor.name });
        io.to(socket.id).emit('tradeStarted', { tradeId, partnerName: sender.name });
    });

    socket.on('updateTradeOffer', ({ tradeId, offerItems, offerGold }) => {
        const trade = gameState.trades[tradeId];
        const p = gameState.players[socket.id];
        if (!trade || !p) return;

        if (trade.p1 === socket.id) {
            if (trade.p1Offer.locked) return;
            trade.p1Offer.items = offerItems;
            trade.p1Offer.gold = parseInt(offerGold) || 0;
        } else if (trade.p2 === socket.id) {
            if (trade.p2Offer.locked) return;
            trade.p2Offer.items = offerItems;
            trade.p2Offer.gold = parseInt(offerGold) || 0;
        }

        const p1 = gameState.players[trade.p1];
        const p2 = gameState.players[trade.p2];

        // 상대방에게 등록된 아이템들의 실제 데이터 이름(WEAPON_DB 또는 저장된 이름)을 제대로 조회하도록 수정
        let tradeUpdatePayload = {
            ...trade,
            p1ItemsName: p1 ? trade.p1Offer.items.map(idx => (p1.inventory[idx] ? p1.inventory[idx].name : '알 수 없음')) : [],
            p2ItemsName: p2 ? trade.p2Offer.items.map(idx => (p2.inventory[idx] ? p2.inventory[idx].name : '알 수 없음')) : []
        };

        io.to(trade.p1).emit('tradeStateUpdate', tradeUpdatePayload);
        io.to(trade.p2).emit('tradeStateUpdate', tradeUpdatePayload);
    });

    socket.on('lockTradeOffer', (tradeId) => {
        const trade = gameState.trades[tradeId];
        if (!trade) return;

        if (trade.p1 === socket.id) trade.p1Offer.locked = true;
        else if (trade.p2 === socket.id) trade.p2Offer.locked = true;

        const p1 = gameState.players[trade.p1];
        const p2 = gameState.players[trade.p2];

        let tradeUpdatePayload = {
            ...trade,
            p1ItemsName: p1 ? trade.p1Offer.items.map(idx => (p1.inventory[idx] ? p1.inventory[idx].name : '알 수 없음')) : [],
            p2ItemsName: p2 ? trade.p2Offer.items.map(idx => (p2.inventory[idx] ? p2.inventory[idx].name : '알 수 없음')) : []
        };

        io.to(trade.p1).emit('tradeStateUpdate', tradeUpdatePayload);
        io.to(trade.p2).emit('tradeStateUpdate', tradeUpdatePayload);

        if (trade.p1Offer.locked && trade.p2Offer.locked) {
            if (p1 && p2) {
                let p1Items = trade.p1Offer.items.map(idx => p1.inventory[idx]);
                let p2Items = trade.p2Offer.items.map(idx => p2.inventory[idx]);

                if (p1.gold < trade.p1Offer.gold || p2.gold < trade.p2Offer.gold || p1Items.includes(undefined) || p2Items.includes(undefined)) {
                    io.to(trade.p1).emit('tradeComplete', { success: false, message: '보유 자산이나 아이템이 부족하여 거래가 취소되었습니다.' });
                    io.to(trade.p2).emit('tradeComplete', { success: false, message: '보유 자산이나 아이템이 부족하여 거래가 취소되었습니다.' });
                    delete gameState.trades[tradeId];
                    return;
                }

                p1.gold -= trade.p1Offer.gold;
                p1.gold += trade.p2Offer.gold;
                p2.gold -= trade.p2Offer.gold;
                p2.gold += trade.p1Offer.gold;

                let p1Indices = [...trade.p1Offer.items].sort((a, b) => b - a);
                let p2Indices = [...trade.p2Offer.items].sort((a, b) => b - a);

                let extractedP1Items = p1Indices.map(idx => p1.inventory.splice(idx, 1)[0]);
                let extractedP2Items = p2Indices.map(idx => p2.inventory.splice(idx, 1)[0]);

                p1.inventory.push(...extractedP2Items);
                p2.inventory.push(...extractedP1Items);

                p1.equippedIndex = null;
                p2.equippedIndex = null;

                saveAccountState(p1);
                saveAccountState(p2);

                io.to(trade.p1).emit('tradeComplete', { success: true, message: `🤝 [${trade.p2Name}]님과 1대1 거래가 완료되었습니다!` });
                io.to(trade.p2).emit('tradeComplete', { success: true, message: `🤝 [${trade.p1Name}]님과 1대1 거래가 완료되었습니다!` });
            }
            delete gameState.trades[tradeId];
            io.emit('updateState', gameState);
        }
    });

    socket.on('cancelTrade', (tradeId) => {
        const trade = gameState.trades[tradeId];
        if (!trade) return;
        io.to(trade.p1).emit('tradeComplete', { success: false, message: '상대방이 거래를 취소했습니다.' });
        io.to(trade.p2).emit('tradeComplete', { success: false, message: '상대방이 거래를 취소했습니다.' });
        delete gameState.trades[tradeId];
    });

    socket.on('getMarketList', () => { socket.emit('marketListResult', gameState.marketListings); });
    socket.on('listMarketItem', ({ inventoryIndex, priceGold }) => {
        const p = gameState.players[socket.id];
        if (!p || inventoryIndex < 0 || inventoryIndex >= p.inventory.length) return;
        const itemToSell = p.inventory[inventoryIndex];
        if (p.equippedIndex === inventoryIndex || itemToSell.isLocked) return;
        p.inventory.splice(inventoryIndex, 1);
        if (p.equippedIndex !== null && p.equippedIndex > inventoryIndex) p.equippedIndex--;

        const listingId = 'market_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        gameState.marketListings[listingId] = {
            id: listingId, sellerId: socket.id, sellerName: p.name, item: itemToSell,
            itemName: itemToSell.name,
            priceGold: parseInt(priceGold) || 0
        };
        saveAccountState(p);
        io.emit('updateState', gameState);
        io.emit('marketListResult', gameState.marketListings);
    });

    socket.on('cancelMarketItem', (listingId) => {
        const p = gameState.players[socket.id];
        const listing = gameState.marketListings[listingId];
        if (!p || !listing || listing.sellerId !== socket.id) return;
        if (p.inventory.length >= 36) return;
        p.inventory.push(listing.item);
        delete gameState.marketListings[listingId];
        saveAccountState(p);
        io.emit('updateState', gameState);
        io.emit('marketListResult', gameState.marketListings);
    });

    socket.on('buyMarketItem', ({ listingId, payWithGold }) => {
        const buyer = gameState.players[socket.id];
        const listing = gameState.marketListings[listingId];
        if (!buyer || !listing) return;
        const seller = gameState.players[listing.sellerId];

        if (payWithGold) {
            if (buyer.gold < listing.priceGold || buyer.inventory.length >= 36) return;
            buyer.gold -= listing.priceGold;
            buyer.inventory.push(listing.item);
            if (seller) {
                seller.gold += listing.priceGold;
                saveAccountState(seller);
            } else if (gameState.registeredAccounts[listing.sellerName]) {
                gameState.registeredAccounts[listing.sellerName].gold += listing.priceGold;
            }
            delete gameState.marketListings[listingId];
            saveAccountState(buyer);
            io.emit('updateState', gameState);
            io.emit('marketListResult', gameState.marketListings);
        }
    });

    socket.on('toggleLockItem', (idx) => {
        const p = gameState.players[socket.id];
        if (!p || !p.inventory[idx]) return;
        p.inventory[idx].isLocked = !p.inventory[idx].isLocked;
        p.inventory.sort((a, b) => (b.isLocked ? 1 : 0) - (a.isLocked ? 1 : 0));
        p.equippedIndex = null;
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    socket.on('enhanceItemWithArtifact', ({ weaponIndex, artifactIndex }) => {
        const p = gameState.players[socket.id];
        if (!p || weaponIndex < 0 || artifactIndex < 0) return;
        const weapon = p.inventory[weaponIndex];
        const artifact = p.inventory[artifactIndex];
        if (!weapon || !artifact || weapon.type === 'artifact' || weapon.type === 'box' || artifact.type !== 'artifact' || weaponIndex === artifactIndex) return;

        p.inventory.splice(artifactIndex, 1);
        if (p.equippedIndex === artifactIndex) p.equippedIndex = null;
        else if (p.equippedIndex !== null && p.equippedIndex > artifactIndex) p.equippedIndex--;

        weapon.enhance = (weapon.enhance || 0) + 1;
        saveAccountState(p);
        socket.emit('enhanceResult', { success: true, message: `✨ 유물 강화 성공! (+${weapon.enhance})` });
        io.emit('updateState', gameState);
    });

    socket.on('createGuild', ({ guildName, maxMembers }) => {
        const p = gameState.players[socket.id];
        if (!p || p.guildId) return;
        const guildId = 'g_' + Math.random().toString(36).substring(2, 9);
        gameState.guilds[guildId] = {
            id: guildId, name: guildName.trim(), maxMembers: Math.max(2, Math.min(20, maxMembers || 5)),
            leaderId: socket.id, subLeaderId: null, members: [socket.id]
        };
        p.guildId = guildId;
        saveAccountState(p);
        updateRankings();
        io.emit('updateState', gameState);
    });

    socket.on('getGuildList', () => {
        const list = Object.values(gameState.guilds).map(g => ({
            id: g.id, name: g.name, maxMembers: g.maxMembers, currentCount: g.members.length
        }));
        socket.emit('guildListResult', list);
    });

    socket.on('getGuildDetail', () => {
        const p = gameState.players[socket.id];
        if (!p || !p.guildId || !gameState.guilds[p.guildId]) return;
        const g = gameState.guilds[p.guildId];
        const memberDetails = g.members.map(mId => {
            const memberObj = gameState.players[mId];
            return {
                socketId: mId, name: memberObj ? memberObj.name : '알수없음', level: memberObj ? memberObj.level : 1,
                isLeader: (g.leaderId === mId), isSubLeader: (g.subLeaderId === mId)
            };
        });
        socket.emit('guildDetailResult', { guildName: g.name, isLeader: (g.leaderId === socket.id), members: memberDetails });
    });

    socket.on('joinGuild', (guildId) => {
        const p = gameState.players[socket.id];
        const guild = gameState.guilds[guildId];
        if (!p || !guild || p.guildId || guild.members.length >= guild.maxMembers) return;
        guild.members.push(socket.id);
        p.guildId = guildId;
        saveAccountState(p);
        updateRankings();
        io.emit('updateState', gameState);
    });

    socket.on('leaveGuild', () => {
        const p = gameState.players[socket.id];
        if (!p || !p.guildId) return;
        const guild = gameState.guilds[p.guildId];
        if (guild) {
            guild.members = guild.members.filter(id => id !== socket.id);
            if (guild.members.length === 0) delete gameState.guilds[p.guildId];
            else if (guild.leaderId === socket.id) guild.leaderId = guild.members[0];
        }
        p.guildId = null;
        saveAccountState(p);
        updateRankings();
        io.emit('updateState', gameState);
    });

    socket.on('useCoupon', (code) => {
        const p = gameState.players[socket.id];
        if (!p || !COUPONS[code]) return;
        const c = COUPONS[code];
        if (c.type === 'gold') p.gold += c.reward;
        else if (c.type === 'weapon' && p.inventory.length < 36) {
            p.inventory.push({ ...WEAPON_DB[c.reward], id: Date.now(), enhance: 0 });
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

    socket.on('sellItems', (indices) => {
        const p = gameState.players[socket.id];
        if (!p || !Array.isArray(indices)) return;
        [...new Set(indices)].sort((a, b) => b - a).forEach(idx => {
            if (idx >= 0 && idx < p.inventory.length) {
                if (p.inventory[idx].isLocked) return;
                p.gold += (p.inventory[idx].sellPrice || 0);
                p.inventory.splice(idx, 1);
                if (p.equippedIndex === idx) p.equippedIndex = null;
                else if (p.equippedIndex !== null && p.equippedIndex > idx) p.equippedIndex--;
            }
        });
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    socket.on('deleteItems', (indices) => {
        const p = gameState.players[socket.id];
        if (!p || !Array.isArray(indices)) return;
        [...new Set(indices)].sort((a, b) => b - a).forEach(idx => {
            if (idx >= 0 && idx < p.inventory.length) {
                if (p.inventory[idx].isLocked) return;
                p.inventory.splice(idx, 1);
                if (p.equippedIndex === idx) p.equippedIndex = null;
                else if (p.equippedIndex !== null && p.equippedIndex > idx) p.equippedIndex--;
            }
        });
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    socket.on('drawGacha', (isUpper = false) => {
        const p = gameState.players[socket.id];
        if (!p || p.gold < 1000 || p.inventory.length >= 36) {
            socket.emit('gachaResultPop', { success: false, message: '골드가 부족하거나 인벤토리가 가득 찼습니다!' });
            return;
        }
        p.gold -= 1000;
        const wKey = getRandomWeaponKey(isUpper);
        const wonItem = { ...WEAPON_DB[wKey], id: Date.now(), enhance: 0 };
        p.inventory.push(wonItem);
        saveAccountState(p);
        socket.emit('gachaResultPop', { success: true, item: wonItem });
        io.emit('updateState', gameState);
    });

    socket.on('disconnect', () => {
        const p = gameState.players[socket.id];
        if (p) {
            saveAccountState(p);
            if (p.guildId && gameState.guilds[p.guildId]) {
                const guild = gameState.guilds[p.guildId];
                guild.members = guild.members.filter(id => id !== socket.id);
                if (guild.members.length === 0) delete gameState.guilds[p.guildId];
                else if (guild.leaderId === socket.id) guild.leaderId = guild.members[0];
            }
        }
        for (let [tId, tObj] of Object.entries(gameState.trades)) {
            if (tObj.p1 === socket.id || tObj.p2 === socket.id) {
                const otherId = (tObj.p1 === socket.id) ? tObj.p2 : tObj.p1;
                io.to(otherId).emit('tradeComplete', { success: false, message: '상대방의 연결이 끊어져 거래가 취소되었습니다.' });
                delete gameState.trades[tId];
            }
        }
        delete gameState.players[socket.id];
        updateRankings();
        io.emit('updateState', gameState);
    });
});

server.listen(3000, () => console.log('서버 실행 중 포트: 3000'));
