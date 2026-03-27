class Player {
    constructor(x, y, color, name, projectiles, image = null) {
        this.name = name;
        this.x = x; this.y = y;
        this.width = 42.5; this.height = 42.5;
        this.originalWidth = this.width;
        this.originalHeight = this.height;
        this.isSizeChanging = false;
        this.isFloating = false;
        this.color = color;
        this.stats = this.getStatsByColor(color);
        this.logic = window.CharacterLogic[this.stats.type] || {};

        if (this.stats.type === 'bigboss') {
            this.width = 170; // 42.5 * 4
            this.height = 127.5; // 42.5 * 3
            this.originalWidth = 170;
            this.originalHeight = 127.5;
        } else if (this.stats.type === 'gold') {
            this.width = 60;
            this.height = 60;
            this.originalWidth = 60;
            this.originalHeight = 60;
        } else if (this.stats.type === 'pink') {
            this.width = 90;
            this.height = 60;
            this.originalWidth = 90;
            this.originalHeight = 60;
        }
        this.velocityX = 0; this.velocityY = 0;
        this.jumpsLeft = 2; this.isOnGround = false;
        if (this.stats.type === 'red-white') {
            this.jumpsLeft = 1;
        }
        this.damage = 0;
        this.stocks = 3;
        this.isInvincible = false;
        this.isAttacking = false;
        this.hitstunFrames = 0;
        this.isCharging = false; this.inAttackLag = false;
        this.isDashing = false;
        this.isGiant = false;
        this.isSmall = false;
        this.attackBox = {}; this.currentAttack = null;
        this.lastDirection = 1;
        this.attackStartTime = 0;
        this.chargeStartTime = 0;
        this.isChargingSpecial2 = false;
        this.isSuperArmor = false;
        this.projectiles = projectiles;
        this.barrierUsed = false;
        this.hasBarrier = false;
        if (this.stats.type === 'blue') this.hasBarrier = true;
        this.image = image;
        this.attackImage = null;
        this.specialImage = null;
        this.specialBodyImage = null;
        this.smashImage = null;

        this.isSlowed = false;
        this.slowedTimer = 0;
        this.blackHoleCooldown = false;

        if (this.stats.type === 'black') {
            this.hp = 120;
            this.damage = 0;
        }

        if (this.logic.init) this.logic.init(this);
    }

    startCharge(type) {
        if (this.isAttacking || this.hitstunFrames > 0 || this.inAttackLag) return;
        if (type === 'special' && this.stats.type === 'kohaku') {
            this.isCharging = true;
            this.chargeStartTime = Date.now();
        } else if (type === 'normal' && (this.stats.type === 'white' || this.stats.type === 'grey')) {
            this.isCharging = true;
            this.chargeStartTime = Date.now();
        } else if (type === 'special2' && (this.stats.type === 'red' || this.stats.type === 'blue')) {
            if (this.isChargingSpecial2 || (this.stats.type === 'blue' && this.barrierUsed)) return;
            this.isChargingSpecial2 = true;
            this.chargeStartTime = Date.now();
            this.isCharging = true;
        }
    }

    endCharge(type) {
        if (this.logic && this.logic.endCharge) {
            this.logic.endCharge(this, type, this.projectiles, window.gamePlayers);
            return;
        }

        if (type === 'special' && this.stats.type === 'kohaku') {
            this.releaseKohakuChargeBeam();
        } else if (type === 'special2' && this.stats.type === 'red') {
            this.releaseChargeBeam();
        } else if (type === 'normal' && (this.stats.type === 'white' || this.stats.type === 'grey')) {
            this.isCharging = false;
            const chargeDuration = Date.now() - this.chargeStartTime;
            if (chargeDuration < 300) {
                this.attack('normal');
            } else {
                if (this.stats.type === 'white') {
                    this.releaseWhiteStorm();
                } else if (this.stats.type === 'grey') {
                    this.attack('normal');
                }
            }
            return;
        }
        this.isCharging = false;
    }

    releaseKohakuChargeBeam() {
        if (!this.isCharging) return;
        this.isCharging = false;
        this.inAttackLag = true;
        const chargeDuration = Date.now() - this.chargeStartTime;
        const maxChargeTime = 2000;
        const minDamage = 6; const maxDamage = 25;
        const minKnockback = 4; const maxKnockback = 12;
        const minProjectileSize = 10; const maxProjectileSize = 30;
        const minProjectileSpeed = 7; const maxProjectileSpeed = 18;
        const chargeRatio = Math.min(chargeDuration / maxChargeTime, 1);
        const damage = Math.floor(minDamage + (maxDamage - minDamage) * chargeRatio);
        const baseKnockback = minKnockback + (maxKnockback - minKnockback) * chargeRatio;
        const projectileSize = minProjectileSize + (maxProjectileSize - minProjectileSize) * chargeRatio;
        const projectileSpeed = minProjectileSpeed + (maxProjectileSpeed - minProjectileSpeed) * chargeRatio;
        this.projectiles.push({
            x: this.x + (this.lastDirection > 0 ? this.width : -projectileSize),
            y: this.y + this.height / 2 - projectileSize / 2,
            velocityX: projectileSpeed * this.lastDirection,
            velocityY: 0,
            owner: this,
            width: projectileSize, height: projectileSize,
            damage: damage,
            baseKnockback: baseKnockback,
            knockbackScaling: 0.09,
            color: `rgba(255, 191, 0, ${0.5 + chargeRatio * 0.5})`
        });
        setTimeout(() => { this.inAttackLag = false; }, 400);
    }

    releaseChargeBeam() {
        if (!this.isChargingSpecial2) return;
        this.isChargingSpecial2 = false;
        this.isCharging = false;
        this.inAttackLag = true;
        const chargeDuration = Date.now() - this.chargeStartTime;
        const maxChargeTime = 2000;
        const minDamage = 5; const maxDamage = 20;
        const minKnockback = 3; const maxKnockback = 10;
        const minProjectileSize = 8; const maxProjectileSize = 24;
        const minProjectileSpeed = 8; const maxProjectileSpeed = 15;
        const chargeRatio = Math.min(chargeDuration / maxChargeTime, 1);
        const damage = Math.floor(minDamage + (maxDamage - minDamage) * chargeRatio);
        const baseKnockback = minKnockback + (maxKnockback - minKnockback) * chargeRatio;
        const projectileSize = minProjectileSize + (maxProjectileSize - minProjectileSize) * chargeRatio;
        const projectileSpeed = minProjectileSpeed + (maxProjectileSpeed - minProjectileSpeed) * chargeRatio;
        this.projectiles.push({
            x: this.x + (this.lastDirection > 0 ? this.width : -projectileSize),
            y: this.y + this.height / 2 - projectileSize / 2,
            velocityX: projectileSpeed * this.lastDirection,
            velocityY: 0,
            owner: this,
            width: projectileSize, height: projectileSize,
            damage: damage,
            baseKnockback: baseKnockback,
            knockbackScaling: 0.08,
            color: `rgba(255, ${255 - Math.floor(255 * chargeRatio)}, 0, 1)`
        });
        setTimeout(() => { this.inAttackLag = false; }, 300);
    }

    releaseWhiteStorm() {
        this.inAttackLag = true;
        this.damage += 5;
        const stormProps = { damage: 12, baseKnockback: 8, knockbackScaling: 0.1, velocity: 10, width: 147, height: 80, duration: 800, color: '#kaze' };
        this.projectiles.push({
            x: this.x + (this.lastDirection > 0 ? this.width : -stormProps.width),
            y: this.y + this.height / 2 - stormProps.height / 2,
            velocityX: stormProps.velocity * this.lastDirection,
            velocityY: 0,
            owner: this,
            width: stormProps.width, height: stormProps.height,
            damage: stormProps.damage, baseKnockback: stormProps.baseKnockback, knockbackScaling: stormProps.knockbackScaling,
            color: '#kaze', duration: stormProps.duration, createdAt: Date.now()
        });
        setTimeout(() => { this.inAttackLag = false; }, 400);
    }

    jump() {
        const canJumpDuringNova = this.currentAttack && this.currentAttack.type === 'nova';
        if (this.jumpsLeft > 0 && this.hitstunFrames <= 0 && !this.isCharging && (!this.inAttackLag || canJumpDuringNova)) {
            const jumpPower = this.isSmall ? -15 * 1.5 : -15;
            this.velocityY = jumpPower; this.jumpsLeft--; this.isOnGround = false;
        }
    }

    getStatsByColor(color) {
        if (window.CharacterLogic) {
            for (let type in window.CharacterLogic) {
                let stats = window.CharacterLogic[type].getStats();
                // This is a bit slow but okay for initialization
                // Actually characterData uses the color as key.
            }
        }
        // Fallback to the known mapping
        switch (color) {
            case '#50c878': return { speed: 4.0, weight: 0.95, type: 'green' };
            case '#3498db': return { speed: 3.5, weight: 1.08, type: 'blue' };
            case '#f1c40f': return { speed: 3.3, weight: 1.1, type: 'yellow' };
            case '#9b59b6': return { speed: 3.8, weight: 0.98, type: 'purple' };
            case '#daa520': return { speed: 3.0, weight: 1.5, type: 'gold' };
            case '#E0E0E0': return { speed: 3.9, weight: 0.85, type: 'white' };
            case '#FF8C00': return { speed: 3.6, weight: 1.05, type: 'orange' };
            case '#8B4513': return { speed: 3.4, weight: 1.15, type: 'brown' };
            case '#4B0082': return { speed: 3.7, weight: 0.9, type: 'indigo' };
            case '#FFC0CB': return { speed: 4.2, weight: 1.12, type: 'pink' };
            case '#000000': return { speed: 3.5, weight: 1.0, type: 'black' };
            case '#808080': return { speed: 3.5, weight: 1.0, type: 'grey' };
            case '#FADADD': return { speed: 3.7, weight: 1.0, type: 'red-white' };
            case '#FF9900': return { speed: 3.7, weight: 1.0, type: 'kohaku' };
            case '#800000': return { speed: 3.5, weight: 1.5, type: 'bigboss' };
            default: return { speed: 3.8, weight: 1.0, type: 'red' };
        }
    }

    draw(ctx) {
        ctx.save();
        if (this.isInvincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        let scaleX = 1.5; let scaleY = 1.5;
        if (this.stats.type === 'bigboss') { scaleX = 1.3; scaleY = 1.0; }
        else if (this.stats.type === 'gold') { scaleX = 2.2; scaleY = 1.8; }
        else if (this.stats.type === 'white') { scaleX = 1.8; scaleY = 1.8; }
        else if (this.stats.type === 'kohaku') { scaleX = 1.8; scaleY = 1.5; }
        else if (this.stats.type === 'blue' || this.stats.type === 'pink') { scaleX = 2.25; scaleY = 2.25; }

        if (this.lastDirection === -1) { ctx.scale(-scaleX, scaleY); }
        else { ctx.scale(scaleX, scaleY); }

        const drawX = -this.width / 2; const drawY = -this.height / 2;

        if (this.stats.type === 'kohaku' && this.isCharging) {
            ctx.shadowBlur = 15 + Math.sin(Date.now() / 150) * 5;
            ctx.shadowColor = '#FF9900';
        } else { ctx.shadowBlur = 0; ctx.shadowColor = 'rgba(0,0,0,0)'; }

        if (this.image && this.image.complete && this.image.naturalHeight !== 0) {
            let drawWidth = this.width; let drawHeight = this.height; let vOffset = 0;
            if (this.stats.type === 'bigboss') { vOffset = 20; drawHeight += 10; }
            let currentImg = this.image;
            if (this.stats.type === 'bigboss' && this.isAttacking && this.currentAttack) {
                if (this.currentAttack.type === 'sword-swing' && this.attackImage) currentImg = this.attackImage;
                else if (this.currentAttack.type === 'laser' && this.specialBodyImage) currentImg = this.specialBodyImage;
                else if (this.currentAttack.type === 'bigboss-smash' && this.smashImage) currentImg = this.smashImage;
            }
            // ゴールド：必殺技1（pillar）中は specialImage に切替
            if (this.stats.type === 'gold' && this.isAttacking && this.currentAttack &&
                this.currentAttack.type === 'pillar' && this.specialImage) {
                currentImg = this.specialImage;
            }
            // ホワイト：必殺技（tornado）中は specialImage に切替
            if (this.stats.type === 'white' && this.isAttacking && this.currentAttack &&
                this.currentAttack.type === 'tornado' && this.specialImage) {
                currentImg = this.specialImage;
            }
            ctx.drawImage(currentImg, drawX, drawY + vOffset, drawWidth, drawHeight);
        } else if (this.isCharging || this.isChargingSpecial2) {
            if (Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.fillStyle = '#FFFFFF'; ctx.fillRect(drawX, drawY, this.width, this.height);
            } else {
                if (this.stats.type === 'red-white') {
                    ctx.fillStyle = '#FF0000'; ctx.fillRect(drawX, drawY, this.width, this.height / 2);
                    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(drawX, drawY + this.height / 2, this.width, this.height / 2);
                } else {
                    ctx.fillStyle = this.color; if (this.isDashing) ctx.globalAlpha = 0.6;
                    ctx.fillRect(drawX, drawY, this.width, this.height);
                }
            }
        } else if (this.stats.type === 'red-white') {
            ctx.fillStyle = '#FF0000'; ctx.fillRect(drawX, drawY, this.width, this.height / 2);
            ctx.fillStyle = '#FFFFFF'; ctx.fillRect(drawX, drawY + this.height / 2, this.width, this.height / 2);
        } else {
            ctx.fillStyle = this.color; if (this.isDashing) ctx.globalAlpha = 0.6;
            ctx.fillRect(drawX, drawY, this.width, this.height);
        }
        ctx.restore();

        // UI parts and animations
        if (this.isAttacking && this.attackBox) {
            this.drawAttackAnimations(ctx);
        }
    }

    drawAttackAnimations(ctx) {
        if (this.currentAttack && this.currentAttack.type === 'tornado') {
            const elapsed = Date.now() - this.attackStartTime;
            const angle = (elapsed / 150) * Math.PI * 2;
            const centerX = this.x + this.width / 2;
            const centerY = this.attackBox.y + this.attackBox.height / 2;
            ctx.save();
            ctx.translate(centerX, centerY);

            if (this.attackBox.color === '#kaze' || this.currentAttack.color === '#kaze') {
                if (!window.kazeImg) {
                    window.kazeImg = new Image();
                    window.kazeImg.src = 'キャラクター/kaze.png';
                }
                if (window.kazeImg.complete) {
                    for (let i = 0; i < 3; i++) {
                        ctx.save();
                        ctx.rotate(angle + (i * Math.PI * 2 / 3));
                        const height = this.attackBox.height * (0.5 + (Math.sin(elapsed / 200 + i) * 0.1));
                        ctx.globalAlpha = 0.8;
                        ctx.drawImage(window.kazeImg, -this.attackBox.width / 2, -height / 2, this.attackBox.width, height);
                        ctx.restore();
                    }
                } else {
                    ctx.fillStyle = 'rgba(200, 255, 200, 0.7)'; ctx.globalAlpha = 0.7;
                    for (let i = 0; i < 3; i++) {
                        ctx.save();
                        ctx.rotate(angle + (i * Math.PI * 2 / 3));
                        const height = this.attackBox.height * (0.5 + (Math.sin(elapsed / 200 + i) * 0.1));
                        ctx.fillRect(-this.attackBox.width / 4, -height / 2, this.attackBox.width / 2, height);
                        ctx.restore();
                    }
                }
            } else {
                ctx.fillStyle = this.attackBox.color; ctx.globalAlpha = 0.7;
                for (let i = 0; i < 3; i++) {
                    ctx.save();
                    ctx.rotate(angle + (i * Math.PI * 2 / 3));
                    const height = this.attackBox.height * (0.5 + (Math.sin(elapsed / 200 + i) * 0.1));
                    ctx.fillRect(-this.attackBox.width / 4, -height / 2, this.attackBox.width / 2, height);
                    ctx.restore();
                }
            }
            ctx.restore();
        } else if (this.currentAttack && this.currentAttack.type === 'sword-swing') {
            const elapsed = Date.now() - this.attackStartTime;
            const duration = this.currentAttack.duration;
            const ratio = elapsed / duration;
            const centerX = this.x + this.width / 2; const centerY = this.y + this.height / 2;
            const radius = this.currentAttack.reach + 20;
            ctx.save(); ctx.beginPath(); ctx.strokeStyle = 'rgba(192, 192, 192, 0.8)';
            ctx.lineWidth = 15; ctx.lineCap = 'round';
            const startAngle = this.lastDirection > 0 ? -Math.PI / 2 : Math.PI * 1.5;
            const sweepAngle = this.lastDirection > 0 ? Math.PI : -Math.PI;
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + (sweepAngle * ratio), this.lastDirection < 0);
            ctx.stroke();
            ctx.restore();
        } else if (this.currentAttack && this.currentAttack.type === 'nova') {
            ctx.beginPath();
            const centerX = this.attackBox.x + this.attackBox.width / 2;
            const centerY = this.attackBox.y + this.attackBox.height / 2;
            const radius = this.attackBox.width / 2;
            const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius);
            gradient.addColorStop(0, this.attackBox.color); gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient; ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.fill();
        } else if (this.attackBox && this.attackBox.color) {
            if (this.attackBox.color === '#kaze') {
                if (!window.kazeImg) {
                    window.kazeImg = new Image();
                    window.kazeImg.src = 'キャラクター/kaze.png';
                }
                if (window.kazeImg.complete) {
                    ctx.save();
                    if (this.lastDirection < 0) {
                        ctx.translate(this.attackBox.x + this.attackBox.width, this.attackBox.y);
                        ctx.scale(-1, 1);
                        ctx.drawImage(window.kazeImg, 0, 0, this.attackBox.width, this.attackBox.height);
                    } else {
                        ctx.drawImage(window.kazeImg, this.attackBox.x, this.attackBox.y, this.attackBox.width, this.attackBox.height);
                    }
                    ctx.restore();
                } else {
                    ctx.fillStyle = 'rgba(200, 255, 200, 0.7)';
                    ctx.fillRect(this.attackBox.x, this.attackBox.y, this.attackBox.width, this.attackBox.height);
                }
            } else {
                ctx.fillStyle = this.attackBox.color;
                ctx.fillRect(this.attackBox.x, this.attackBox.y, this.attackBox.width, this.attackBox.height);
            }
        }
    }

    update(platforms, earthBlocks) {
        if (this.hitstunFrames > 0) this.hitstunFrames--;
        if (this.slowedTimer > 0) { this.slowedTimer--; if (this.slowedTimer <= 0) this.isSlowed = false; }
        const prevY = this.y;
        if (!this.isFloating) {
            const effectiveWeight = this.isGiant ? this.stats.weight * 2 : this.stats.weight;
            this.velocityY += 0.6 * effectiveWeight;
        }
        this.y += this.velocityY;
        this.isOnGround = false;
        for (const p of platforms) {
            if (this.x + this.width > p.x && this.x < p.x + p.width && (prevY + this.height) <= (p.y + 1) && (this.y + this.height) >= p.y) {
                this.y = p.y - this.height; this.velocityY = 0; this.isOnGround = true; this.hitstunFrames = 0;
                this.jumpsLeft = this.stats.type === 'red-white' ? 1 : 2; break;
            }
        }
        for (const b of earthBlocks) {
            if (this.x + this.width > b.x && this.x < b.x + b.width && (prevY + this.height) <= (b.y + 1) && (this.y + this.height) >= b.y) {
                this.y = b.y - this.height; this.velocityY = 0; this.isOnGround = true; this.hitstunFrames = 0;
                this.jumpsLeft = this.stats.type === 'red-white' ? 1 : 2; break;
            }
        }
        this.x += this.velocityX;
        for (const p of platforms) {
            if (this.x + this.width > p.x && this.x < p.x + p.width && this.y + this.height > p.y && this.y < p.y + p.height) {
                if (this.velocityX > 0) { this.x = p.x - this.width; this.velocityX = 0; }
                else if (this.velocityX < 0) { this.x = p.x + p.width; this.velocityX = 0; }
            }
        }
        for (const b of earthBlocks) {
            if (this.x + this.width > b.x && this.x < b.x + b.width && this.y + this.height > b.y && this.y < b.y + b.height) {
                if (this.velocityX > 0) { this.x = b.x - this.width; this.velocityX = 0; }
                else if (this.velocityX < 0) { this.x = b.x + b.width; this.velocityX = 0; }
            }
        }
        if (this.isAttacking && this.currentAttack) {
            this.updateAttackBox();
        }
    }

    updateAttackBox() {
        if (this.currentAttack.type === 'stomp') {
            this.attackBox.x = this.x + (this.width - this.currentAttack.reach) / 2;
            this.attackBox.y = this.y + this.height;
        } else if (this.currentAttack.type === 'tackle') {
            this.attackBox.x = this.x - 5; this.attackBox.y = this.y - 5;
        } else if (this.currentAttack.type === 'nova') {
            const elapsed = Date.now() - this.attackStartTime;
            const progress = Math.min(elapsed / this.currentAttack.duration, 1);
            const currentReach = this.currentAttack.reach * progress;
            this.attackBox.width = currentReach; this.attackBox.height = currentReach;
            this.attackBox.x = this.x + this.width / 2 - currentReach / 2;
            this.attackBox.y = this.y + this.height / 2 - currentReach / 2;
        } else if (this.currentAttack.type === 'combo') {
            this.attackBox.x = this.lastDirection > 0 ? this.x + this.width : this.x - this.attackBox.width;
            this.attackBox.y = this.y + (this.attackBox.height === 40 ? 5 : 10);
        }
    }

    attack(type) {
        if (this.isAttacking || this.hitstunFrames > 0 || this.isCharging || this.inAttackLag) return;

        if (this.logic && this.logic.attack) {
            if (this.logic.attack(this, type, this.projectiles, window.earthBlocks, window.blackHoles)) return;
        }

        if (type === 'smash') {
            if (!this.isOnGround) return;
            this.isCharging = true;
            let chargeTime = 400; if (this.stats.type === 'orange') chargeTime = 150;
            setTimeout(() => {
                this.isCharging = false; if (this.hitstunFrames > 0) return;
                this.isAttacking = true;
                let props = { reach: 70, duration: 400, damage: 17, baseKnockback: 5, knockbackScaling: 0.15, color: 'rgba(255, 0, 255, 0.5)' };
                if (this.stats.type === 'purple') { props.reach *= 1.5; props.damage -= 3; }
                if (this.stats.type === 'bigboss') { props.reach = 80; props.damage = 20; props.baseKnockback = 10; props.knockbackScaling = 0.2; props.color = 'rgba(128, 0, 0, 0.8)'; props.type = 'bigboss-smash'; }
                this.currentAttack = props;
                if (this.stats.type === 'orange') {
                    props.reach = this.width; props.baseKnockback = 0; props.knockbackScaling = 0; props.damage = 15;
                    const boxX = this.lastDirection > 0 ? (this.x + this.width * 4) : (this.x - props.reach - this.width * 3);
                    this.attackBox = { x: boxX, y: this.y, width: props.reach, height: props.reach, color: props.color };
                } else if (this.stats.type === 'bigboss') {
                    this.attackBox = { x: this.lastDirection > 0 ? this.x + this.width - 50 : this.x - props.reach + 50, y: this.y, width: props.reach, height: this.height, color: props.color };
                } else {
                    this.attackBox = { x: this.lastDirection > 0 ? this.x + this.width : this.x - props.reach, y: this.y, width: props.reach, height: this.height, color: props.color };
                }
                setTimeout(() => {
                    this.isAttacking = false; this.currentAttack = null; this.attackBox = {}; this.inAttackLag = true;
                    setTimeout(() => { this.inAttackLag = false; }, this.stats.type === 'yellow' ? 700 : 500);
                }, props.duration);
            }, chargeTime);
        } else if (type === 'normal') {
            this.isAttacking = true;
            let props = { reach: 50, duration: 150, damage: 7, baseKnockback: 3.5, knockbackScaling: 0.08, color: 'rgba(255, 255, 0, 0.5)' };
            if (this.stats.type === 'purple') { props.reach *= 1.5; props.damage -= 3; }
            this.currentAttack = props;
            this.attackBox = { x: this.lastDirection > 0 ? this.x + this.width : this.x - props.reach, y: this.y, width: props.reach, height: this.height, color: props.color };
            setTimeout(() => {
                this.isAttacking = false; this.currentAttack = null; this.attackBox = {}; this.inAttackLag = true;
                setTimeout(() => { this.inAttackLag = false; }, 100);
            }, props.duration);
        }
    }

    respawn() {
        this.x = this.name === 'Player 1' ? 275 : 825; this.y = 65; this.damage = 0;
        if (this.stats.type === 'black') this.hp = 120;
        this.velocityX = 0; this.velocityY = 0; this.hitstunFrames = 0; this.isInvincible = true;
        this.isGiant = false; this.isSmall = false; this.isSizeChanging = false;
        this.width = this.originalWidth; this.height = this.originalHeight;
        if (this.hasBarrier) this.barrierUsed = false;
        setTimeout(() => { this.isInvincible = false; }, 2000);
    }
}
