registerCharacter('bigboss', {
    getStats: () => ({ speed: 3.5, weight: 1.5, type: 'bigboss' }),
    attack: (player, type, projectiles) => {
        if (type === 'normal') {
            player.isCharging = true;
            setTimeout(() => {
                player.isCharging = false;
                if (player.hitstunFrames > 0) { player.inAttackLag = false; return; }
                player.isAttacking = true;
                player.attackStartTime = Date.now();
                let props = { type: 'sword-swing', reach: 64, damage: 14.4, baseKnockback: 8, knockbackScaling: 0.12, color: 'rgba(192, 192, 192, 0)', duration: 250 };
                player.currentAttack = props;
                player.attackBox = { x: player.lastDirection > 0 ? player.x + player.width / 2 : player.x + player.width / 2 - props.reach, y: player.y - 16, width: props.reach, height: player.height + 32, color: props.color };
                setTimeout(() => {
                    player.isAttacking = false; player.currentAttack = null; player.attackBox = {}; player.inAttackLag = true;
                    setTimeout(() => { player.inAttackLag = false; }, 300);
                }, props.duration);
            }, 200);
            return true;
        } else if (type === 'special') {
            player.inAttackLag = true;
            player.isCharging = true;
            setTimeout(() => {
                player.isCharging = false;
                if (player.hitstunFrames > 0) { player.inAttackLag = false; return; }
                player.isAttacking = true;
                const bossLaser = { type: 'laser', reach: player.width, duration: 400, damage: 14.4, baseKnockback: 8, knockbackScaling: 0.15, color: 'rgba(139, 0, 0, 0)' };
                player.currentAttack = bossLaser;
                player.attackBox = { x: player.x, y: player.y + 24, width: player.width, height: player.height, color: bossLaser.color };
                setTimeout(() => {
                    player.isAttacking = false; player.currentAttack = null; player.attackBox = {};
                    setTimeout(() => { player.inAttackLag = false; }, 400);
                }, bossLaser.duration);
            }, 200);
            return true;
        } else if (type === 'special2') {
            if (player.inAttackLag) return true;
            player.inAttackLag = true;
            player.isAttacking = true;
            const explosionProps = { type: 'explosion', reach: 0, duration: 600, damage: 8, baseKnockback: 10, knockbackScaling: 0.15, color: 'rgba(255, 0, 0, 0.5)' };
            player.currentAttack = explosionProps;
            const range = 100;
            player.attackBox = { x: player.x - range, y: player.y - range, width: player.width + range * 2, height: player.height + range * 2, color: explosionProps.color };
            setTimeout(() => {
                player.isAttacking = false; player.currentAttack = null; player.attackBox = {};
                setTimeout(() => { player.inAttackLag = false; }, 400);
            }, explosionProps.duration);
            return true;
        }
    }
});
