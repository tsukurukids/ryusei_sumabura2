registerCharacter('grey', {
    getStats: () => ({ speed: 3.5, weight: 1.0, type: 'grey' }),
    attack: (player, type, projectiles) => {
        // 巨大化の必殺ワザ（Eキー）
        if (type === 'special') {
            if (player.isSizeChanging) { player.inAttackLag = false; return true; }
            player.inAttackLag = true;
            player.isSizeChanging = true;
            player.isGiant = true;
            player.width = player.originalWidth * 3;
            player.height = player.originalHeight * 3;
            setTimeout(() => {
                player.width = player.originalWidth;
                player.height = player.originalHeight;
                player.isSizeChanging = false;
                player.isGiant = false;
            }, 4000);
            setTimeout(() => { player.inAttackLag = false; }, 300);
            return true;
        } 
        // 巨大パンチの必殺ワザ2（Qキー）
        else if (type === 'special2') {
            GreyLogic.giantPunch(player);
            return true;
        }
        // 通常攻撃（スペースキー）を押したときに溜めはじめる！
        else if (type === 'normal') {
            player.startCharge('normal');
            return true;
        }
    },
    endCharge: (player, type) => {
        if (type === 'normal') {
            if (!player.isCharging) return;
            player.isCharging = false;
            const chargeDuration = Date.now() - player.chargeStartTime;
            
            // 1秒（1000ms）以上溜めていたら巨大パンチ！
            if (chargeDuration >= 1000) {
                GreyLogic.giantPunch(player);
            } else {
                // 1秒未満なら普通のパンチ
                GreyLogic.normalPunch(player);
            }
        }
    }
});

// グレー専用のロジック（巨大パンチと普通のパンチ）
const GreyLogic = {
    giantPunch: (player) => {
        player.isAttacking = true;
        player.inAttackLag = true;
        
        const punchProps = { 
            reach: 120, 
            duration: 300, 
            damage: 20, 
            baseKnockback: 12, 
            knockbackScaling: 0.18, 
            color: 'rgba(128, 128, 128, 0.8)' 
        };
        
        player.currentAttack = punchProps;
        
        player.attackBox = { 
            x: player.lastDirection > 0 ? player.x + player.width : player.x - punchProps.reach, 
            y: player.y - 10, 
            width: punchProps.reach, 
            height: player.height + 20, 
            color: punchProps.color 
        };
        
        setTimeout(() => {
            player.isAttacking = false;
            player.currentAttack = null;
            player.attackBox = {};
        }, punchProps.duration);
        
        setTimeout(() => {
            player.inAttackLag = false;
        }, punchProps.duration + 200);
    },
    
    normalPunch: (player) => {
        player.isAttacking = true;
        const props = { reach: 50, duration: 150, damage: 7, baseKnockback: 3.5, knockbackScaling: 0.08, color: 'rgba(255, 255, 0, 0.5)' };
        player.currentAttack = props;
        player.attackBox = { 
            x: player.lastDirection > 0 ? player.x + player.width : player.x - props.reach, 
            y: player.y, 
            width: props.reach, 
            height: player.height, 
            color: props.color 
        };
        setTimeout(() => {
            player.isAttacking = false; 
            player.currentAttack = null; 
            player.attackBox = {}; 
            player.inAttackLag = true;
            setTimeout(() => { player.inAttackLag = false; }, 100);
        }, props.duration);
    }
};
