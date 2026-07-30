const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(express.static(path.join(__dirname, 'public')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// 1. 보스 4종 (꿀신, 골리앗, 이라소, 드래곤) 및 처치 시 지급할 경험치 설정
const BOSS_LIST = [
    { name: '🐷 꿀신', maxHp: 157500, currentHp: 157500, expReward: 2000 },
    { name: '🗿 골리앗', maxHp: 367500, currentHp: 367500, expReward: 4500 },
    { name: '🦖 이라소', maxHp: 840000, currentHp: 840000, expReward: 7500 },
    { name: '🐉 드래곤', maxHp: 2100000, currentHp: 2100000, expReward: 15000 }
];

// 상위 던전 보스 4종 (50레벨 이상 입장)
const UPPER_BOSS_LIST = [
    { name: '🦁 우흐라', maxHp: 12000000, currentHp: 12000000, expReward: 30000, atk: 20, interval: 10 },
    { name: '🐯 기호전', maxHp: 17000000, currentHp: 17000000, expReward: 45000, atk: 12, interval: 5 },
    { name: '👾 사이키', maxHp: 25000000, currentHp: 25000000, expReward: 70000, atk: 3, interval: 1 },
    { name: '👁️ 개념의 눈알', maxHp: 5000000, currentHp: 5000000, expReward: 20000, atk: 5, interval: 1 }
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

    // 시크릿 및 신규 아이템 (코드 전용 혹은 드문 확률)
    secret_celestial_blade: { name: '🌌 천상의 성검', type: 'knife', rarity: 'Secret', atk: 8000, sellPrice: 500000, icon: '✨⚔️' },
    secret_world_bow: { name: '🌠 세계수의 진노궁', type: 'bow', rarity: 'Secret', atk: 7500, sellPrice: 500000, icon: '🏹🌠' },
    secret_aegis_shield: { name: '🛡️ 불멸의 이지스 실드', type: 'shield', rarity: 'Secret', atk: 6500, shieldDuration: 30, sellPrice: 500000, icon: '🛡️💎' },
    secret_god_staff: { name: '💫 창조주의 생명 구원봉', type: 'staff', rarity: 'Secret', atk: 6000, heal: 1000, targets: 3, sellPrice: 500000, icon: '💫🌿' },

    hidden_hong: { name: '홍인준의 뱃살 방패', type: 'shield', rarity: 'Mythic', atk: 6000, shieldDuration: 25, sellPrice: 100000, icon: '🐷🛡️' },
    hidden_jiyu_ssamjang: { name: '지유의 쌈장', type: 'artifact', rarity: 'Legendary', atk: 0, sellPrice: 50000, icon: '🍲' },

    artifact_honey_fork: { name: '부러진 꿀신 갈퀴', type: 'artifact', rarity: 'Common', atk: 0, sellPrice: 1000, icon: '🪵' },
    artifact_goliath_stone: { name: '골리앗의 돌멩이 조각', type: 'artifact', rarity: 'Common', atk: 0, sellPrice: 1000, icon: '🪨' },
    artifact_iraso_scale: { name: '이라소의 비늘 파편', type: 'artifact', rarity: 'Common', atk: 0, sellPrice: 1000, icon: '🐟' },
    artifact_dragon_claw: { name: '낡은 드래곤 발톱 껍질', type: 'artifact', rarity: 'Common', atk: 0, sellPrice: 1000, icon: '🦴' },
    artifact_honey_jar: { name: '정제된 꿀신 단지', type: 'artifact', rarity: 'Rare', atk: 0, sellPrice: 5000, icon: '🍯' },
    artifact_goliath_knee: { name: '골리앗의 단단한 무릎 보호대', type: 'artifact', rarity: 'Rare', atk: 0, sellPrice: 5000, icon: '🛡️' },
    artifact_iraso_tear: { name: '이라소의 푸른 눈물방울', type: 'artifact', rarity: 'Rare', atk: 0, sellPrice: 5000, icon: '💧' },
    artifact_dragon_horn: { name: '드래곤의 불에 그슬린 뿔', type: 'artifact', rarity: 'Rare', atk: 0, sellPrice: 5000, icon: '🔥' },
    artifact_honey_urn: { name: '꿀신이 봉인된 황금 항아리', type: 'artifact', rarity: 'Epic', atk: 0, sellPrice: 20000, icon: '⚱️' },
    artifact_goliath_helm: { name: '골리앗의 거대 투구 장식', type: 'artifact', rarity: 'Epic', atk: 0, sellPrice: 20000, icon: '🪖' },
    artifact_iraso_heart: { name: '이라소의 심해 심장 석', type: 'artifact', rarity: 'Epic', atk: 0, sellPrice: 20000, icon: '💎' },
    artifact_dragon_scale: { name: '드래곤의 영원 불타는 비늘', type: 'artifact', rarity: 'Legendary', atk: 0, sellPrice: 80000, icon: '🌟' },
    artifact_mythic_crown: { name: '[서버 공인] 신화의 파편: 절대자의 왕관', type: 'artifact', rarity: 'Mythic', atk: 0, sellPrice: 300000, icon: '👑' }
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
    tradeSessions: {},
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

function getRandomArtifactKey() {
    const tierRand = Math.random() * 100;
    let chosenTier = 'Common';
    if (tierRand < 1.0) chosenTier = 'Mythic';
    else if (tierRand < 5.0) chosenTier = 'Legendary';
    else if (tierRand < 15.0) chosenTier = 'Epic';
    else if (tierRand < 45.0) chosenTier = 'Rare';
    else chosenTier = 'Common';

    const tierItems = Object.keys(WEAPON_DB).filter(k => WEAPON_DB[k].type === 'artifact' && WEAPON_DB[k].rarity === chosenTier);
    return tierItems.length > 0 ? tierItems[Math.floor(Math.random() * tierItems.length)] : 'artifact_honey_fork';
}

// 무기 뽑기 확률 변경 (커먼 50%, 레어 32%, 에픽 15%, 레전더리 2.9%, 신화 0.08%, 시크릿 0.02%)
// ※ 홍인준의 뱃살방패, 지유의 쌈장은 뽑기에서 제외
function getRandomWeaponKey() {
    const rand = Math.random() * 100;
    let targetRarity = 'Common';
    if (rand < 0.02) targetRarity = 'Secret';
    else if (rand < 0.02 + 0.08) targetRarity = 'Mythic';
    else if (rand < 0.02 + 0.08 + 2.9) targetRarity = 'Legendary';
    else if (rand < 0.02 + 0.08 + 2.9 + 15) targetRarity = 'Epic';
    else if (rand < 0.02 + 0.08 + 2.9 + 15 + 32) targetRarity = 'Rare';
    else targetRarity = 'Common';

    const keys = Object.keys(WEAPON_DB).filter(k => {
        const item = WEAPON_DB[k];
        if (k === 'hidden_hong' || k === 'hidden_jiyu_ssamjang') return false;
        if (item.type === 'artifact') return false;
        return item.rarity === targetRarity;
    });

    if (keys.length === 0) return 'knife_common';
    return keys[Math.floor(Math.random() * keys.length)];
}

function getRarityMultiplier(rarity) {
    switch (rarity) {
        case 'Secret': return 3.5;
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
    if (eq && eq.type !== 'artifact') {
        rarityMul = getRarityMultiplier(eq.rarity);
        baseAtk = (eq.atk * (1 + (eq.enhance || 0) * 0.15)) * rarityMul;
    }
    return Math.round(baseAtk + (p.bonusAtk || 0));
}

// 최대 레벨 100제, 1레벨업당 체력 +10
function addExp(p, amount) {
    if (p.level >= 100) {
        p.exp = 0;
        return;
    }
    p.exp += amount;
    let reqExp = p.level * 1500 + 500;
    while (p.level < 100 && p.exp >= reqExp) {
        p.exp -= reqExp;
        p.level++;
        p.maxHp += 10;
        p.hp = p.maxHp;
        reqExp = p.level * 1500 + 500;
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
            nickname, password, hp: 100, maxHp: 100, gold: 500, exp: 0, level: 1,
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
            guildId: null
        };

        socket.emit('loginSuccess', { success: true, player: gameState.players[socket.id] });
        updateRankings();
        io.emit('updateState', gameState);
    });

    // 일반 보스 타격
    socket.on('attack', () => {
        const p = gameState.players[socket.id];
        if (!p || p.hp <= 0) return;
        let dmg = calculateDamage(p);
        gameState.boss.currentHp -= dmg;
        p.totalDamage = (p.totalDamage || 0) + dmg;
        p.gold += 15;
        // 타격 대미지 비례 경험치 지급 (기본 30 + 대미지 비례)
        addExp(p, Math.max(10, Math.round(dmg / 100)));
        saveAccountState(p);

        updateRankings();
        checkBossKill(p);
        io.emit('updateState', gameState);
    });

    // 상위 던전 보스 타격
    socket.on('attackUpper', () => {
        const p = gameState.players[socket.id];
        if (!p || p.hp <= 0 || p.level < 50) return;
        let dmg = calculateDamage(p);
        gameState.upperBoss.currentHp -= dmg;
        p.totalDamage = (p.totalDamage || 0) + dmg;
        p.gold += 50;
        addExp(p, Math.max(30, Math.round(dmg / 80)));
        saveAccountState(p);

        updateRankings();
        checkUpperBossKill(p);
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
            socket.emit('skillResult', { success: false, message: '⏳ 스킬 쿨타임 중입니다!' });
            return;
        }
        p.lastSkillTime = now;

        if (weaponType === 'staff') {
            let totalHealAmt = Math.round(((eq.heal || 100) * rarityMul) + 200);
            p.hp = Math.min(p.maxHp, p.hp + totalHealAmt);
            p.gold += 30;
            addExp(p, 60);
            socket.emit('skillResult', { success: true, message: `스킬 치유의 파동 발동! 체력 ${totalHealAmt} 회복!` });
        } else if (weaponType === 'shield') {
            let durationSec = eq.shieldDuration || 10;
            p.isInvincible = true;
            p.invincibleUntil = now + (durationSec * 1000);
            p.gold += 25;
            addExp(p, 50);
            socket.emit('skillResult', { success: true, message: `스킬 절대 방벽 발동! ${durationSec}초 무적!` });
        } else {
            let skillDmg = Math.round((baseAtk * rarityMul * 2.5) + (p.bonusAtk || 0));
            gameState.boss.currentHp -= skillDmg;
            p.totalDamage += skillDmg;
            p.gold += 50;
            addExp(p, 100);
            socket.emit('skillResult', { success: true, message: `스킬 광역참격 발동! ${skillDmg} 대미지!` });
            updateRankings();
            checkBossKill(p);
        }
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    function checkBossKill(p) {
        if (gameState.boss.currentHp <= 0) {
            addExp(p, gameState.boss.expReward);
            const artifactKey = getRandomArtifactKey();
            const droppedItem = { ...WEAPON_DB[artifactKey], id: Date.now() + Math.random(), enhance: 0 };
            
            if (p.inventory.length < 36) {
                p.inventory.push(droppedItem);
                socket.emit('itemObtained', { weapon: droppedItem, full: false });
            } else {
                socket.emit('itemObtained', { weapon: droppedItem, full: true });
            }
            gameState.boss = { ...BOSS_LIST[Math.floor(Math.random() * BOSS_LIST.length)] };
            saveAccountState(p);
        }
    }

    function checkUpperBossKill(p) {
        if (gameState.upperBoss.currentHp <= 0) {
            addExp(p, gameState.upperBoss.expReward);
            const dropKeys = ['secret_celestial_blade', 'secret_world_bow', 'secret_aegis_shield', 'secret_god_staff', 'hidden_jiyu_ssamjang'];
            const chosenKey = dropKeys[Math.floor(Math.random() * dropKeys.length)];
            const droppedItem = { ...WEAPON_DB[chosenKey], id: Date.now() + Math.random(), enhance: 0 };

            if (p.inventory.length < 36) {
                p.inventory.push(droppedItem);
                socket.emit('itemObtained', { weapon: droppedItem, full: false });
            } else {
                socket.emit('itemObtained', { weapon: droppedItem, full: true });
            }

            // 상위 던전 보스 등장 확률 (우흐라 45%, 기호전 25%, 사이키 15%, 개념의 눈알 15%)
            const uRand = Math.random() * 100;
            let nextIndex = 0;
            if (uRand < 45) nextIndex = 0; // 우흐라
            else if (uRand < 45 + 25) nextIndex = 1; // 기호전
            else if (uRand < 45 + 25 + 15) nextIndex = 2; // 사이키
            else nextIndex = 3; // 개념의 눈알
            gameState.upperBoss = { ...UPPER_BOSS_LIST[nextIndex] };
            saveAccountState(p);
        }
    }

    // 50% 확률 및 등급별/강화 수치별 유물 강화 시스템
    socket.on('enhanceItemWithArtifact', ({ weaponIndex, artifactIndex }) => {
        const p = gameState.players[socket.id];
        if (!p || weaponIndex < 0 || artifactIndex < 0) return;
        const weapon = p.inventory[weaponIndex];
        const artifact = p.inventory[artifactIndex];
        if (!weapon || !artifact || weapon.type === 'artifact' || artifact.type !== 'artifact' || weaponIndex === artifactIndex) return;

        let currentEnhance = weapon.enhance || 0;
        let successChance = 50; // 기본 50프로 확률

        // 10강까지 커먼, 20강까지 레어, 30강까지 에픽, 40강까지 레전더리, 50강까지 미스틱, 60까지
        // 10씩 늘어날수록 확률이 5%씩 감소 (맞지 않는 유물 사용 시 20% 보정)
        let requiredTier = 'Common';
        if (currentEnhance >= 40) requiredTier = 'Mythic';
        else if (currentEnhance >= 30) requiredTier = 'Legendary';
        else if (currentEnhance >= 20) requiredTier = 'Epic';
        else if (currentEnhance >= 10) requiredTier = 'Rare';
        else requiredTier = 'Common';

        // 10씩 늘어날 때마다 확률 5% 감소 계산 (예: 14강을 커먼 유물로 하면 20% 등)
        let tierPenalty = (artifact.rarity === requiredTier) ? 0 : 20;
        let stepReduction = Math.floor(currentEnhance / 10) * 5;
        let finalChance = Math.max(5, successChance - stepReduction - tierPenalty);

        p.inventory.splice(artifactIndex, 1);
        if (p.equippedIndex === artifactIndex) p.equippedIndex = null;
        else if (p.equippedIndex !== null && p.equippedIndex > artifactIndex) p.equippedIndex--;

        if (Math.random() * 100 <= finalChance) {
            weapon.enhance = currentEnhance + 1;
            socket.emit('enhanceResult', { success: true, message: `✨ 유물 강화 성공! (+${weapon.enhance}) [확률: ${finalChance}%]` });
        } else {
            socket.emit('enhanceResult', { success: false, message: `💥 유물 강화 실패... (+${currentEnhance}) [확률: ${finalChance}%]` });
        }
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    // 실시간 거래소 매물 등록 및 교환 가치 지원
    socket.on('listMarketItem', ({ inventoryIndex, priceGold, desiredItemType }) => {
        const p = gameState.players[socket.id];
        if (!p || inventoryIndex < 0 || inventoryIndex >= p.inventory.length) return;
        const itemToSell = p.inventory[inventoryIndex];
        if (p.equippedIndex === inventoryIndex) return;
        p.inventory.splice(inventoryIndex, 1);
        if (p.equippedIndex !== null && p.equippedIndex > inventoryIndex) p.equippedIndex--;

        const listingId = 'market_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        gameState.marketListings[listingId] = {
            id: listingId, sellerId: socket.id, sellerName: p.name, item: itemToSell,
            priceGold: parseInt(priceGold) || 0, desiredItemType: desiredItemType || 'none'
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

    socket.on('buyMarketItem', ({ listingId }) => {
        const buyer = gameState.players[socket.id];
        const listing = gameState.marketListings[listingId];
        if (!buyer || !listing) return;
        const seller = gameState.players[listing.sellerId];

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
    });

    // 1대1 실시간 거래 시스템
    socket.on('requestTrade', (targetSocketId) => {
        const requester = gameState.players[socket.id];
        const target = gameState.players[targetSocketId];
        if (!requester || !target) return;
        const tradeId = 'trade_' + Date.now();
        gameState.tradeSessions[tradeId] = { id: tradeId, p1: socket.id, p2: targetSocketId, p1Item: null, p2Item: null, p1Accept: false, p2Accept: false };
        io.to(targetSocketId).emit('tradeRequested', { tradeId, requesterName: requester.name });
    });

    socket.on('acceptTrade', ({ tradeId }) => {
        const session = gameState.tradeSessions[tradeId];
        if (!session) return;
        io.to(session.p1).emit('startTradeSession', { tradeId });
        io.to(session.p2).emit('startTradeSession', { tradeId });
    });

    // 길드 시스템 및 부마스터 승급
    socket.on('createGuild', ({ guildName, maxMembers }) => {
        const p = gameState.players[socket.id];
        if (!p || p.guildId) return;
        const guildId = 'g_' + Math.random().toString(36).substring(2, 9);
        gameState.guilds[guildId] = {
            id: guildId, name: guildName.trim(), maxMembers: Math.max(2, Math.min(20, maxMembers || 5)),
            leaderId: socket.id, subLeaderId: null, members: [socket.id]
        };
        p.guildId = guildId;
        updateRankings();
        io.emit('updateState', gameState);
    });

    socket.on('promoteSubLeader', (targetSocketId) => {
        const p = gameState.players[socket.id];
        if (!p || !p.guildId || !gameState.guilds[p.guildId]) return;
        const guild = gameState.guilds[p.guildId];
        if (guild.leaderId !== socket.id) return;
        guild.subLeaderId = targetSocketId;
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
                if (p.inventory[idx].isImportant) return; // 중요 아이템 판매 방지
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
                if (p.inventory[idx].isImportant) return; // 중요 아이템 삭제 방지
                p.inventory.splice(idx, 1);
                if (p.equippedIndex === idx) p.equippedIndex = null;
                else if (p.equippedIndex !== null && p.equippedIndex > idx) p.equippedIndex--;
            }
        });
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    // 중요 아이템 토글 및 상단 정렬
    socket.on('toggleImportant', (idx) => {
        const p = gameState.players[socket.id];
        if (!p || !p.inventory[idx]) return;
        p.inventory[idx].isImportant = !p.inventory[idx].isImportant;
        // 중요 아이템인 경우 인벤토리 상단으로 정렬
        p.inventory.sort((a, b) => (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0));
        p.equippedIndex = null;
        saveAccountState(p);
        io.emit('updateState', gameState);
    });

    socket.on('drawGacha', () => {
        const p = gameState.players[socket.id];
        if (!p || p.gold < 1000 || p.inventory.length >= 36) return;
        p.gold -= 1000;
        const wKey = getRandomWeaponKey();
        const drawnItem = { ...WEAPON_DB[wKey], id: Date.now(), enhance: 0 };
        p.inventory.push(drawnItem);
        saveAccountState(p);
        socket.emit('gachaResultPopup', { weaponName: drawnItem.name });
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
        delete gameState.players[socket.id];
        updateRankings();
        io.emit('updateState', gameState);
    });
});

server.listen(3000, () => console.log('서버 실행 중 포트: 3000'));
