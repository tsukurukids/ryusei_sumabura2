registerCharacter('blue', {
    getStats: () => ({ speed: 3.5, weight: 1.08, type: 'blue' }),
    attack: (player, type, projectiles) => {
        if (type === 'normal') {
            if (!player.isOnGround) {
                player.velocityY = -7;
                player.isAttacking = true;
                let props = { type: 'blue-aerial', reach: 70, duration: 250, damage: 4.5, baseKnockback: 7, knockbackScaling: 0.1, color: 'rgba(0, 191, 255, 0.7)' };
                player.currentAttack = props;
                player.attackBox = { x: player.lastDirection > 0 ? player.x + player.width : player.x - props.reach, y: player.y - 15, width: props.reach, height: player.height + 30, color: props.color };
                setTimeout(() => {
                    player.isAttacking = false; player.currentAttack = null; player.attackBox = {};
                    player.inAttackLag = true;
                    setTimeout(() => { player.inAttackLag = false; }, 100);
                }, props.duration);
                return true;
            }
        } else if (type === 'combo') {
            player.inAttackLag = true;
            player.velocityX = 3 * player.lastDirection;
            player.isAttacking = true;
            let props = { type: 'combo', damage: 3, reach: 60, duration: 150, baseKnockback: 1, knockbackScaling: 0.02, color: 'rgba(0, 191, 255, 0.6)' };
            player.currentAttack = props;
            player.attackBox = { x: player.lastDirection > 0 ? player.x + player.width : player.x - props.reach, y: player.y + 10, width: props.reach, height: 30, color: props.color };

            setTimeout(() => {
                player.isAttacking = true;
                player.velocityX = 3 * player.lastDirection;
                props = { type: 'combo', damage: 3, reach: 60, duration: 150, baseKnockback: 1, knockbackScaling: 0.02, color: 'rgba(0, 191, 255, 0.6)' };
                player.currentAttack = props;
                player.attackBox = { x: player.lastDirection > 0 ? player.x + player.width : player.x - props.reach, y: player.y + 10, width: props.reach, height: 30, color: props.color };

                setTimeout(() => {
                    player.isAttacking = true;
                    player.velocityX = 5 * player.lastDirection;
                    props = { type: 'combo', damage: 5, reach: 80, duration: 250, baseKnockback: 6, knockbackScaling: 0.05, color: 'rgba(30, 144, 255, 0.8)' };
                    player.currentAttack = props;
                    player.attackBox = { x: player.lastDirection > 0 ? player.x + player.width : player.x - props.reach, y: player.y + 5, width: props.reach, height: 40, color: props.color };
                    setTimeout(() => {
                        player.isAttacking = false; player.currentAttack = null; player.attackBox = {};
                        setTimeout(() => { player.inAttackLag = false; }, 150);
                    }, props.duration);
                }, 200);
            }, 200);
            return true;
        } else if (type === 'special') {
            player.inAttackLag = true;
            player.isAttacking = true;
            const repulseProps = { reach: 80, duration: 100, damage: 2, baseKnockback: 8, knockbackScaling: 0, color: 'rgba(52, 152, 219, 0.5)' };
            player.currentAttack = repulseProps;
            player.attackBox = { x: player.x - (repulseProps.reach - player.width) / 2, y: player.y - (repulseProps.reach - player.height) / 2, width: repulseProps.reach, height: repulseProps.reach, color: repulseProps.color };
            setTimeout(() => { player.isAttacking = false; player.currentAttack = null; player.inAttackLag = false; }, repulseProps.duration + 200);
            return true;
        } else if (type === 'special2') {
            if (player.barrierUsed) return true;
            player.isInvincible = true;
            player.barrierUsed = true;
            player.inAttackLag = true;
            setTimeout(() => { player.isInvincible = false; }, 5000);
            setTimeout(() => { player.inAttackLag = false; }, 500);
            return true;
        }
    }
});
