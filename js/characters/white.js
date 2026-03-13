registerCharacter('white', {
    getStats: () => ({ speed: 3.9, weight: 0.85, type: 'white' }),
    attack: (player, type, projectiles) => {
        if (type === 'normal') {
            player.startCharge('normal');
            return true;
        } else if (type === 'special') {
            player.isAttacking = true;
            player.inAttackLag = true;
            player.attackStartTime = Date.now();
            const tornadoProps = { type: 'tornado', reachX: 60, reachY: 120, duration: 500, damage: 9, baseKnockback: 7.2, knockbackScaling: 0.096, color: '#kaze' };
            player.currentAttack = tornadoProps;
            player.attackBox = { x: player.x + (player.width / 2) - (tornadoProps.reachX / 2), y: player.y - tornadoProps.reachY + player.height, width: tornadoProps.reachX, height: tornadoProps.reachY, color: tornadoProps.color };
            setTimeout(() => { player.isAttacking = false; player.currentAttack = null; }, tornadoProps.duration);
            setTimeout(() => { player.inAttackLag = false; }, tornadoProps.duration + 100);
            return true;
        }
    },
    endCharge: (player, type, projectiles) => {
        if (type === 'normal') {
            player.isCharging = false;
            const chargeDuration = Date.now() - player.chargeStartTime;
            if (chargeDuration < 300) {
                // We need to trigger a "real" normal attack here
                // But avoid infinite loop. We can call a helper.
                player.isAttacking = true;
                let props = { reach: 147, duration: 250, damage: 7, baseKnockback: 3.5, knockbackScaling: 0.08, color: '#kaze' };
                player.currentAttack = props;
                let boxHeight = 80;
                player.attackBox = { 
                    x: player.lastDirection > 0 ? player.x + player.width : player.x - props.reach, 
                    y: player.y + (player.height - boxHeight) / 2, 
                    width: props.reach, 
                    height: boxHeight, 
                    color: props.color 
                };
                setTimeout(() => {
                    player.isAttacking = false; player.currentAttack = null; player.attackBox = {}; player.inAttackLag = true;
                    setTimeout(() => { player.inAttackLag = false; }, 100);
                }, props.duration);
            } else {
                player.releaseWhiteStorm();
            }
        }
    }
});
