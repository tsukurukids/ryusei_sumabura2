// --- Game State Management & Data ---
const charSelectScreen = document.getElementById('character-select-screen');
const stageSelectScreen = document.getElementById('stage-select-screen');
const gameScreen = document.getElementById('game-screen');
let p1Selection = null;
let p2Selection = null;
let p1Ready = false;
let p2Ready = false;
let animationFrameId = null;
let selectedStageIndex = 0;
let isCpuMode = true;      // デフォルトは1人用（CPU対戦）
let cpuDifficulty = 'easy'; // CPU難易度
let cpuController = null;  // CPUコントローラー

// --- UI Elements ---
const p1Options = document.querySelectorAll('#p1-select .char-portrait');
const p2Options = document.querySelectorAll('#p2-select .char-portrait');
const p1ReadyBtn = document.getElementById('p1-ready-btn');
const p2ReadyBtn = document.getElementById('p2-ready-btn');
const startGameBtn = document.getElementById('start-game-btn');
const p1Desc = document.getElementById('p1-char-description');
const p2Desc = document.getElementById('p2-char-description');
const prevStageBtn = document.getElementById('prev-stage-btn');
const nextStageBtn = document.getElementById('next-stage-btn');
const stagePreview = document.getElementById('stage-preview');
const stageName = document.getElementById('stage-name');
const fightBtn = document.getElementById('fight-btn');
let gameOverOverlay, winnerText;


// --- モード切替関数 ---
function setGameMode(mode) {
    isCpuMode = (mode === 'cpu');
    const btn1p = document.getElementById('btn-1p');
    const btn2p = document.getElementById('btn-2p');
    const cpuDiffEl = document.getElementById('cpu-difficulty');
    const p2Title = document.getElementById('p2-title');
    const p2ReadyBtnEl = document.getElementById('p2-ready-btn');
    if (isCpuMode) {
        btn1p.classList.add('mode-btn-active');
        btn2p.classList.remove('mode-btn-active');
        if (cpuDiffEl) cpuDiffEl.style.display = '';
        if (p2Title) p2Title.textContent = 'CPU';
        if (p2ReadyBtnEl) p2ReadyBtnEl.style.display = 'none';
        // CPUモードはP2自動選択
        p2Ready = true;
        checkReady();
    } else {
        btn1p.classList.remove('mode-btn-active');
        btn2p.classList.add('mode-btn-active');
        if (cpuDiffEl) cpuDiffEl.style.display = 'none';
        if (p2Title) p2Title.textContent = 'Player 2';
        if (p2ReadyBtnEl) p2ReadyBtnEl.style.display = '';
        p2Ready = false;
        checkReady();
    }
}

function setCpuDifficulty(level) {
    cpuDifficulty = level;
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('diff-btn-active'));
    const target = document.getElementById('diff-' + level);
    if (target) target.classList.add('diff-btn-active');
}

// --- UI Logic ---
function updateCharacterAvailability() {
    if (!p1Options || !p2Options) return;
    if (!isCpuMode) {
        p1Options.forEach(opt => opt.classList.toggle('disabled', opt.dataset.color === p2Selection));
        p2Options.forEach(opt => opt.classList.toggle('disabled', opt.dataset.color === p1Selection));
    } else {
        p1Options.forEach(opt => opt.classList.remove('disabled'));
        p2Options.forEach(opt => opt.classList.remove('disabled'));
    }
}

p1Options.forEach(p => p.addEventListener('click', () => {
    if (p1Ready || p.classList.contains('disabled')) return;
    p1Options.forEach(opt => opt.classList.remove('selected'));
    p.classList.add('selected');
    p1Selection = p.dataset.color;
    p1Desc.textContent = characterData[p1Selection].description;
    updateCharacterAvailability();
}));

p2Options.forEach(p => p.addEventListener('click', () => {
    if (p2Ready || p.classList.contains('disabled')) return;
    p2Options.forEach(opt => opt.classList.remove('selected'));
    p.classList.add('selected');
    p2Selection = p.dataset.color;
    p2Desc.textContent = characterData[p2Selection].description;
    updateCharacterAvailability();
}));

function checkReady() {
    if (isCpuMode) {
        // CPUモード：P1だけreadyでOK、P2はCPUが自動選択
        startGameBtn.disabled = !p1Ready;
    } else {
        startGameBtn.disabled = !(p1Ready && p2Ready);
    }
}

p1ReadyBtn.addEventListener('click', () => {
    if (!p1Selection) {
        const p1select = document.getElementById('p1-select');
        const tempMsg = document.createElement('p');
        tempMsg.textContent = 'キャラクターを選択してください！';
        tempMsg.style.color = '#e94560';
        p1select.appendChild(tempMsg);
        setTimeout(() => tempMsg.remove(), 2000);
        return;
    }
    p1Ready = !p1Ready;
    p1ReadyBtn.classList.toggle('ready', p1Ready);
    p1ReadyBtn.textContent = p1Ready ? '準備OK!' : '準備完了';
    checkReady();
});

p2ReadyBtn.addEventListener('click', () => {
    if (!p2Selection) {
        const p2select = document.getElementById('p2-select');
        const tempMsg = document.createElement('p');
        tempMsg.textContent = 'キャラクターを選択してください！';
        tempMsg.style.color = '#e94560';
        p2select.appendChild(tempMsg);
        setTimeout(() => tempMsg.remove(), 2000);
        return;
    }
    p2Ready = !p2Ready;
    p2ReadyBtn.classList.toggle('ready', p2Ready);
    p2ReadyBtn.textContent = p2Ready ? '準備OK!' : '準備完了';
    checkReady();
});

startGameBtn.addEventListener('click', () => {
    // CPUモード：P2のキャラをランダム選択（P1と被らないように）
    if (isCpuMode) {
        const colors = Object.keys(characterData);
        const available = colors.filter(c => c !== p1Selection);
        // P2がまだ未選択ならランダムに決める
        if (!p2Selection || p2Selection === p1Selection) {
            p2Selection = available[Math.floor(Math.random() * available.length)];
        }
    }
    charSelectScreen.classList.add('hidden');
    stageSelectScreen.classList.remove('hidden');
    renderStagePreview();
});

function renderStagePreview() {
    const stage = stages[selectedStageIndex];
    stageName.textContent = stage.name;
    stagePreview.innerHTML = '';
    stage.platforms.forEach(p => {
        const pEl = document.createElement('div');
        pEl.style.position = 'absolute';
        pEl.style.left = `${p.x / 1100 * 100}%`;
        pEl.style.top = `${p.y / 650 * 100}%`;
        pEl.style.width = `${p.width / 1100 * 100}%`;
        pEl.style.height = `${p.height / 650 * 100}%`;
        pEl.style.backgroundColor = '#ddd';
        stagePreview.appendChild(pEl);
    });
}

prevStageBtn.addEventListener('click', () => {
    selectedStageIndex = (selectedStageIndex - 1 + stages.length) % stages.length;
    renderStagePreview();
});

nextStageBtn.addEventListener('click', () => {
    selectedStageIndex = (selectedStageIndex + 1) % stages.length;
    renderStagePreview();
});

fightBtn.addEventListener('click', () => {
    stageSelectScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    main(stages[selectedStageIndex]);
});

let keydownHandler, keyupHandler;

function resetToCharSelect() {
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
    if (keydownHandler) window.removeEventListener('keydown', keydownHandler);
    if (keyupHandler) window.removeEventListener('keyup', keyupHandler);
    cpuController = null;
    gameScreen.classList.add('hidden');
    if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
    charSelectScreen.classList.remove('hidden');
    p1Ready = false;
    p1Selection = null;
    p1ReadyBtn.classList.remove('ready');
    p1ReadyBtn.textContent = '準備完了';
    p1Options.forEach(opt => opt.classList.remove('selected', 'disabled'));
    p1Desc.textContent = 'キャラクターを選択してください';
    if (!isCpuMode) {
        p2Ready = false;
        p2Selection = null;
        p2ReadyBtn.classList.remove('ready');
        p2ReadyBtn.textContent = '準備完了';
        p2Options.forEach(opt => opt.classList.remove('selected', 'disabled'));
        p2Desc.textContent = 'キャラクターを選択してください';
    } else {
        // CPUモードはP2のReadyは維持
        p2Ready = true;
        p2Selection = null;
        p2Options.forEach(opt => opt.classList.remove('selected'));
        p2Desc.textContent = 'キャラクターを選択してください';
    }
    startGameBtn.disabled = true;
    if (winnerText) winnerText.textContent = '';
}

// Global game context variables
window.projectiles = [];
window.blackHoles = [];
window.earthBlocks = [];
window.gamePlayers = [];

function main(stageData) {
    gameOverOverlay = document.getElementById('game-over-overlay');
    winnerText = document.getElementById('winner-text');
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const p1DamageEl = document.getElementById('p1-damage');
    const p1LivesEl = document.getElementById('p1-lives');
    const p2DamageEl = document.getElementById('p2-damage');
    const p2LivesEl = document.getElementById('p2-lives');
    const controlsContainer = document.getElementById('game-controls-container');
    controlsContainer.innerHTML = isCpuMode
        ? `<div class="controls">
            <h3>Player 1 (${characterData[p1Selection].name})</h3>
            <p><strong>移動:</strong> A/D | <strong>ジャンプ:</strong> W</p>
            <p><strong>通常攻撃:</strong> Space</p>
            <p><strong>スマッシュ:</strong> S | <strong>必殺ワザ1:</strong> E | <strong>必殺ワザ2:</strong> Q</p>
        </div>
        <div class="controls" style="opacity:0.7">
            <h3>🤖 CPU (${characterData[p2Selection].name})</h3>
            <p>難易度: ${cpuDifficulty === 'easy' ? '🟢 よわい' : cpuDifficulty === 'normal' ? '🟡 ふつう' : '🔴 つよい'}</p>
            <p>CPUが自動操作します</p>
        </div>`
        : `<div class="controls">
            <h3>Player 1 (${characterData[p1Selection].name})</h3>
            <p><strong>移動:</strong> A/D | <strong>ジャンプ:</strong> W</p>
            <p><strong>通常攻撃:</strong> Space</p>
            <p><strong>スマッシュ:</strong> S | <strong>必殺ワザ1:</strong> E | <strong>必殺ワザ2:</strong> Q</p>
        </div>
        <div class="controls">
            <h3>Player 2 (${characterData[p2Selection].name})</h3>
            <p><strong>移動:</strong> ←/→ | <strong>ジャンプ:</strong> ↑</p>
            <p><strong>通常攻撃:</strong> Enter</p>
            <p><strong>スマッシュ:</strong> ↓ | <strong>必殺ワザ1:</strong> 0 | <strong>必殺ワザ2:</strong> .</p>
        </div>`;

    let audioContext;
    function playSound() { /* sound logic placeholder */ }
    const GRAVITY = 0.6;
    const JUMP_POWER = -15;
    const DI_INFLUENCE = 0.15;
    window.projectiles = [];
    window.blackHoles = [];
    window.earthBlocks = [];
    const platforms = stageData.platforms;

    function createCharacterImage(selection) {
        const charInfo = characterData[selection];
        if (charInfo && charInfo.imagePath) {
            const img = new Image(); img.src = charInfo.imagePath; return img;
        }
        return null;
    }

    const p1Image = createCharacterImage(p1Selection);
    const p2Image = createCharacterImage(p2Selection);

    const bosImgPaths = { norm: 'キャラクター/boos1.png', spec: 'キャラクター/boos2 copy.png', body: 'キャラクター/boos2.png', smash: 'キャラクター/boos3.png' };
    function getBossImgs(selection) {
        if (selection !== '#800000') return {};
        const imgs = {};
        for (let key in bosImgPaths) { imgs[key] = new Image(); imgs[key].src = bosImgPaths[key]; }
        return imgs;
    }
    const p1BossImgs = getBossImgs(p1Selection);
    const p2BossImgs = getBossImgs(p2Selection);

    const player1 = new Player(0, 0, p1Selection, 'Player 1', window.projectiles, p1Image);
    if (p1BossImgs.norm) { player1.attackImage = p1BossImgs.norm; player1.specialImage = p1BossImgs.spec; player1.specialBodyImage = p1BossImgs.body; player1.smashImage = p1BossImgs.smash; }
    const player2 = new Player(0, 0, p2Selection, isCpuMode ? 'CPU' : 'Player 2', window.projectiles, p2Image);
    if (p2BossImgs.norm) { player2.attackImage = p2BossImgs.norm; player2.specialImage = p2BossImgs.spec; player2.specialBodyImage = p2BossImgs.body; player2.smashImage = p2BossImgs.smash; }

    // ゴールド：必殺技1中の画像をセット
    function setSpecialImg(player, selection) {
        if (selection === '#daa520') {
            const img = new Image(); img.src = 'キャラクター/gold2.png';
            player.specialImage = img;
        }
        if (selection === '#E0E0E0') {
            const img = new Image(); img.src = 'キャラクター/ktara2.png';
            player.specialImage = img;
        }
    }
    setSpecialImg(player1, p1Selection);
    setSpecialImg(player2, p2Selection);

    // CPUコントローラーを初期化
    if (isCpuMode) {
        cpuController = new CPUController(player2, player1);
        cpuController.setDifficulty(cpuDifficulty);
    } else {
        cpuController = null;
    }

    const mainPlatform = platforms.reduce((a, b) => (a.width > b.width ? a : b), platforms[0]);
    player1.x = mainPlatform.x + mainPlatform.width * 0.25 - player1.width / 2;
    player1.y = mainPlatform.y - player1.height;
    player2.x = mainPlatform.x + mainPlatform.width * 0.75 - player2.width / 2;
    player2.y = mainPlatform.y - player2.height;

    const players = [player1, player2];
    window.gamePlayers = players;
    const keys = {
        a: { pressed: false }, d: { pressed: false }, w: { pressed: false }, s: { pressed: false }, ' ': { pressed: false }, e: { pressed: false }, q: { pressed: false },
        arrowleft: { pressed: false }, arrowright: { pressed: false }, arrowup: { pressed: false }, arrowdown: { pressed: false }, enter: { pressed: false }, '0': { pressed: false }, '.': { pressed: false }
    };

    function gameLoop() {
        // P1 Controls
        let p1Speed = player1.stats.speed; if (player1.isSlowed) p1Speed /= 2;
        if (player1.hitstunFrames > 0) {
            if (keys.a.pressed) player1.velocityX -= DI_INFLUENCE;
            else if (keys.d.pressed) player1.velocityX += DI_INFLUENCE;
        } else if ((player1.isCharging && !player1.isChargingSpecial2) || player1.isDashing) {
            player1.velocityX = player1.isDashing ? player1.velocityX : 0;
        } else if (!player1.inAttackLag || (player1.currentAttack && player1.currentAttack.type === 'nova')) {
            if (keys.a.pressed) { player1.velocityX = -p1Speed; player1.lastDirection = -1; }
            else if (keys.d.pressed) { player1.velocityX = p1Speed; player1.lastDirection = 1; }
            else if (player1.isOnGround) player1.velocityX = 0;
        }

        // P2 Controls (2人用モードのみ)
        if (!isCpuMode) {
            let p2Speed = player2.stats.speed; if (player2.isSlowed) p2Speed /= 2;
            if (player2.hitstunFrames > 0) {
                if (keys.arrowleft.pressed) player2.velocityX -= DI_INFLUENCE;
                else if (keys.arrowright.pressed) player2.velocityX += DI_INFLUENCE;
            } else if ((player2.isCharging && !player2.isChargingSpecial2) || player2.isDashing) {
                player2.velocityX = player2.isDashing ? player2.velocityX : 0;
            } else if (!player2.inAttackLag || (player2.currentAttack && player2.currentAttack.type === 'nova')) {
                if (keys.arrowleft.pressed) { player2.velocityX = -p2Speed; player2.lastDirection = -1; }
                else if (keys.arrowright.pressed) { player2.velocityX = p2Speed; player2.lastDirection = 1; }
                else if (player2.isOnGround) player2.velocityX = 0;
            }
        } else {
            // CPUの操作
            if (cpuController) cpuController.update();
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        platforms.forEach(p => { ctx.fillStyle = '#ddd'; ctx.fillRect(p.x, p.y, p.width, p.height); });
        window.earthBlocks.forEach(b => { ctx.fillStyle = b.color; ctx.strokeStyle = '#5D4037'; ctx.lineWidth = 2; ctx.fillRect(b.x, b.y, b.width, b.height); ctx.strokeRect(b.x, b.y, b.width, b.height); });

        window.projectiles.forEach((p, i) => {
            if (p.duration && (Date.now() - p.createdAt > p.duration)) { window.projectiles.splice(i, 1); return; }
            if (p.dir) p.x += 8 * p.dir; else { p.x += p.velocityX; p.y += p.velocityY; }
            if (p.color === '#kaze') {
                if (!window.kazeImg) {
                    window.kazeImg = new Image(); window.kazeImg.src = 'キャラクター/kaze.png';
                }
                if (window.kazeImg.complete) {
                    ctx.save();
                    if (p.owner.lastDirection < 0) {
                        ctx.translate(p.x + p.width, p.y);
                        ctx.scale(-1, 1);
                        ctx.drawImage(window.kazeImg, 0, 0, p.width, p.height);
                    } else {
                        ctx.drawImage(window.kazeImg, p.x, p.y, p.width, p.height);
                    }
                    ctx.restore();
                } else {
                    ctx.fillStyle = 'rgba(200, 255, 200, 0.7)'; ctx.fillRect(p.x, p.y, p.width || 8, p.height || 8);
                }
            } else if (p.color === '#pinnku') {
                if (!window.pinnkuImg) {
                    window.pinnkuImg = new Image(); window.pinnkuImg.src = 'キャラクター/pinnku.png';
                }
                if (window.pinnkuImg.complete) {
                    ctx.drawImage(window.pinnkuImg, p.x, p.y, p.width || 8, p.height || 8);
                } else {
                    ctx.fillStyle = 'pink'; ctx.fillRect(p.x, p.y, p.width || 8, p.height || 8);
                }
            } else if (p.isCrossPart) {
                ctx.fillStyle = Math.floor(Date.now() / 100) % 2 === 0 ? '#FFFFFF' : '#FF0000';
                ctx.fillRect(p.x, p.y, p.width || 8, p.height || 8);
            } else {
                ctx.fillStyle = p.color || p.owner.color;
                ctx.fillRect(p.x, p.y, p.width || 8, p.height || 8);
            }
            if (p.x < -100 || p.x > canvas.width + 100 || p.y < -100 || p.y > canvas.height + 100) window.projectiles.splice(i, 1);
        });

        window.blackHoles.forEach((bh, i) => {
            const elapsed = Date.now() - bh.createdAt;
            if (elapsed > bh.duration) { window.blackHoles.splice(i, 1); return; }
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.beginPath(); ctx.arc(bh.x + bh.width / 2, bh.y + bh.height / 2, bh.width / 2, 0, Math.PI * 2); ctx.fill();
            players.forEach(p => {
                if (p !== bh.owner) {
                    const dx = (bh.x + bh.width / 2) - (p.x + p.width / 2); const dy = (bh.y + bh.height / 2) - (p.y + p.height / 2); const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 200) { p.velocityX += (dx / dist) * 0.5; p.velocityY += (dy / dist) * 0.5; }
                }
            });
        });

        players.forEach(p => { p.update(platforms, window.earthBlocks); p.draw(ctx); });
        checkCollisions();
        checkRingOut();

        if (player1.stats.type === 'black') {
            p1DamageEl.textContent = `HP: ${Math.max(0, Math.floor(player1.hp))}`;
        } else {
            p1DamageEl.textContent = `${Math.floor(player1.damage)}%`;
        }
        p1LivesEl.textContent = `残機: ${player1.stocks}`;

        if (player2.stats.type === 'black') {
            p2DamageEl.textContent = `HP: ${Math.max(0, Math.floor(player2.hp))}`;
        } else {
            p2DamageEl.textContent = `${Math.floor(player2.damage)}%`;
        }
        p2LivesEl.textContent = `残機: ${player2.stocks}`;

        animationFrameId = requestAnimationFrame(gameLoop);
    }

    function applyDamage(target, damage, attacker) {
        if (target.isInvincible) return;
        let finalDamage = damage; if (attacker && attacker.isGiant) finalDamage *= 2;
        if (target.stats.type === 'black') {
            target.hp -= finalDamage;
            if (target.hp <= 0) { target.stocks--; if (target.stocks > 0) target.respawn(); else { target.stocks = 0; gameOver(attacker); } }
        } else target.damage += finalDamage;
    }

    function checkCollisions() {
        if (player1.isAttacking && player1.currentAttack && checkHit(player1.attackBox, player2)) {
            if (player1.currentAttack.type === 'nova') applyDamage(player2, player1.currentAttack.damage, player1);
            else { applyKnockback(player1, player2); if (player1.stats.type !== 'bigboss' && player1.currentAttack.type !== 'combo') player1.isAttacking = false; }
        }
        if (player2.isAttacking && player2.currentAttack && checkHit(player2.attackBox, player1)) {
            if (player2.currentAttack.type === 'nova') applyDamage(player1, player2.currentAttack.damage, player2);
            else { applyKnockback(player2, player1); if (player2.stats.type !== 'bigboss' && player2.currentAttack.type !== 'combo') player2.isAttacking = false; }
        }
        if (player1.isDashing && checkHit(player1, player2)) { applyKnockback(player1, player2, { damage: 3, baseKnockback: 4, knockbackScaling: 0.09 }); player1.isDashing = false; player1.velocityX = 0; }
        if (player2.isDashing && checkHit(player2, player1)) { applyKnockback(player2, player1, { damage: 3, baseKnockback: 4, knockbackScaling: 0.09 }); player2.isDashing = false; player2.velocityX = 0; }
        window.projectiles.forEach((proj, i) => {
            players.forEach(p => { if (proj.owner !== p && checkHit({ x: proj.x, y: proj.y, width: proj.width || 8, height: proj.height || 8 }, p)) { applyKnockback(proj.owner, p, proj); window.projectiles.splice(i, 1); } });
        });
        window.blackHoles.forEach(bh => { players.forEach(p => { if (p !== bh.owner && !p.blackHoleCooldown && checkHit(bh, p)) { applyDamage(p, 5, bh.owner); p.blackHoleCooldown = true; setTimeout(() => { p.blackHoleCooldown = false; }, 1000); } }); });
        window.earthBlocks.forEach(b => { players.forEach(p => { if (p !== b.owner && !p.blockHitCooldown && checkHit(b, p)) { applyDamage(p, 1, b.owner); p.blockHitCooldown = true; setTimeout(() => { p.blockHitCooldown = false; }, 1000); } }); });
    }

    function checkHit(box, target) { return box.x < target.x + target.width && box.x + box.width > target.x && box.y < target.y + target.height && box.y + box.height > target.y; }

    function applyKnockback(attacker, target, customAttack) {
        if (target.isInvincible) return;
        if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const attack = customAttack || attacker.currentAttack; if (!attack) return;
        if (attack.onHit === 'slow') { target.isSlowed = true; target.slowedTimer = 180; }
        let finalDamage = attack.damage; if (attacker && attacker.isGiant) finalDamage *= 2;
        if (target.stats.type === 'black') {
            target.hp -= finalDamage;
            if (target.hp <= 0) { target.stocks--; if (target.stocks > 0) target.respawn(); else { target.stocks = 0; gameOver(attacker); } }
            if (attacker.stats.type === 'bigboss') { target.isInvincible = true; setTimeout(() => { target.isInvincible = false; }, 500); }
            return;
        }
        target.damage += finalDamage;
        if (attacker.stats.type === 'bigboss') { target.isInvincible = true; setTimeout(() => { target.isInvincible = false; }, 500); }
        if (target.isSuperArmor) return;
        const effectiveWeight = target.isGiant ? target.stats.weight * 1.4 : target.stats.weight;
        let totalKB = (attack.baseKnockback + target.damage * attack.knockbackScaling) / effectiveWeight;
        if (attacker && attacker.isGiant) totalKB *= 2;
        target.hitstunFrames = Math.floor(totalKB);
        let kX = totalKB * (target.x + target.width / 2 > attacker.x + attacker.width / 2 ? 1 : -1);
        let kY = -totalKB;
        if (attack.type === 'stomp') kY = -totalKB * 0.6;
        if (attack.type === 'pillar') { kX = 0; kY = -totalKB * 1.5; }
        if (attack.type === 'tornado') { kX = (attacker.x + attacker.width / 2 - target.x) * 0.1; kY = -totalKB * 1.7; }
        if (attack.type === 'upswing') { kX = totalKB * 0.2 * (target.x + target.width / 2 > attacker.x + attacker.width / 2 ? 1 : -1); kY = -totalKB * 1.5; }
        if (attack.type === 'blue-aerial') { kX = totalKB * 1.3 * (target.x + target.width / 2 > attacker.x + attacker.width / 2 ? 1 : -1); kY = -totalKB * 1.2; }
        target.velocityX = kX; target.velocityY = kY;
        if (attack.type === 'gravity') target.velocityY += 15;
    }

    function checkRingOut() {
        players.forEach((p, i) => { if (p.x < -p.width - 50 || p.x > canvas.width + 50 || p.y > canvas.height + 100) { p.stocks--; if (p.stocks <= 0) { p.stocks = 0; gameOver(players[i === 0 ? 1 : 0]); } else p.respawn(); } });
    }

    function gameOver(winner) {
        if (!gameOverOverlay || !winnerText) return;
        if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
        winnerText.textContent = `${winner.name} WINS!`;
        gameOverOverlay.classList.remove('hidden');
        setTimeout(resetToCharSelect, 4000);
    }

    keydownHandler = (e) => {
        const k = e.key.toLowerCase(); if (keys[k] === undefined) return;
        if (['w', ' ', 's', 'e', 'q', 'arrowup', 'enter', 'arrowdown', '0', '.'].includes(k) && keys[k].pressed) return;
        keys[k].pressed = true;
        if (k === 'w') player1.jump();
        else if (k === ' ') player1.attack('normal');
        else if (k === 's') player1.attack('smash');
        else if (k === 'e') player1.attack('special');
        else if (k === 'q') player1.attack('special2');
        // P2キー操作は2人用モードのみ
        else if (!isCpuMode) {
            if (k === 'arrowup') player2.jump();
            else if (k === 'enter') player2.attack('normal');
            else if (k === 'arrowdown') player2.attack('smash');
            else if (k === '0') player2.attack('special');
            else if (k === '.') player2.attack('special2');
        }
    };
    keyupHandler = (e) => {
        const k = e.key.toLowerCase(); if (keys[k] !== undefined) {
            keys[k].pressed = false;
            if (k === 'q') player1.endCharge('special2');
            else if (k === 'e') player1.endCharge('special');
            else if (k === ' ') player1.endCharge('normal');
            if (!isCpuMode) {
                if (k === '.') player2.endCharge('special2');
                else if (k === '0') player2.endCharge('special');
                else if (k === 'enter') player2.endCharge('normal');
            }
        }
    };
    window.addEventListener('keydown', keydownHandler);
    window.addEventListener('keyup', keyupHandler);
    gameLoop();
}

// ページ読み込み時の初期化（デフォルト：1人用モード）
document.addEventListener('DOMContentLoaded', () => {
    // 初期状態でCPUモードUIを適用
    const p2ReadyBtnEl = document.getElementById('p2-ready-btn');
    if (p2ReadyBtnEl) p2ReadyBtnEl.style.display = 'none';
    p2Ready = true; // CPUモードではP2のReadyは不要
});
