registerCharacter('indigo', {
    getStats: () => ({ speed: 3.7, weight: 0.9, type: 'indigo' }),
    attack: (player, type, projectiles) => {
        if (type === 'special') {
            player.isAttacking = true;
            player.inAttackLag = true;
            const gravityProps = { type: 'gravity', reach: 60, duration: 200, damage: 4, baseKnockback: 1, knockbackScaling: 0.05, color: 'rgba(75, 0, 130, 0.6)' };
            player.currentAttack = gravityProps;
            player.attackBox = { x: player.lastDirection > 0 ? player.x + player.width : player.x - gravityProps.reach, y: player.y, width: gravityProps.reach, height: player.height, color: gravityProps.color };
            setTimeout(() => {
                player.isAttacking = false; player.currentAttack = null;
            }, gravityProps.duration);
            setTimeout(() => { player.inAttackLag = false; }, gravityProps.duration + 300);
            return true;
        } else if (type === 'special2') {
            player.isAttacking = true;
            player.inAttackLag = true;
            player.currentAttack = null; // 他の攻撃情報をリセット
            player.attackBox = {};       // 他の攻撃の枠を消す
            
            const meteorProps = { width: 60, height: 60, damage: 15, baseKnockback: 8, knockbackScaling: 0.12, color: 'rgba(75, 0, 130, 0.9)' };
            
            // プレイヤーの斜め上の位置から隕石を出す
            const startX = player.x + (player.lastDirection > 0 ? -30 : 30 + player.width);
            const startY = player.y - 150;
            
            projectiles.push({
                x: startX,
                y: startY,
                velocityX: 12 * player.lastDirection, // 斜め横
                velocityY: 10,  // 下に向かって飛ぶ
                owner: player,
                width: meteorProps.width,
                height: meteorProps.height,
                damage: meteorProps.damage,
                baseKnockback: meteorProps.baseKnockback,
                knockbackScaling: meteorProps.knockbackScaling,
                color: meteorProps.color,
                duration: 2000,
                createdAt: Date.now()
            });

            setTimeout(() => { player.isAttacking = false; }, 300);
            setTimeout(() => { player.inAttackLag = false; }, 400);
            return true;
        }
    }
});
