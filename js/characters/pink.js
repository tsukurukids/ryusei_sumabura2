registerCharacter('pink', {
    getStats: () => ({ speed: 4.2, weight: 1.12, type: 'pink' }),
    attack: (player, type, projectiles) => {
        if (type === 'special') {
            player.inAttackLag = true;
            player.isCharging = true;
            setTimeout(() => {
                player.isCharging = false;
                if (player.hitstunFrames > 0) { player.inAttackLag = false; return; }

                const projectileCount = 30;
                const projectileSpeed = 4;
                const centerX = player.x + player.width / 2;
                const centerY = player.y + player.height / 2;

                for (let i = 0; i < projectileCount; i++) {
                    const angle = (i / projectileCount) * Math.PI * 2;
                    projectiles.push({
                        x: centerX,
                        y: centerY,
                        velocityX: Math.cos(angle) * projectileSpeed,
                        velocityY: Math.sin(angle) * projectileSpeed,
                        owner: player,
                        width: 16, height: 16,
                        damage: 5,
                        baseKnockback: 0.5,
                        knockbackScaling: 0.01,
                        color: '#FF69B4'
                    });
                }
                player.inAttackLag = true;
                setTimeout(() => { player.inAttackLag = false; }, 500);
            }, 1000);
            return true;
        }
    }
});
