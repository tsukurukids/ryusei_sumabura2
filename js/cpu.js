// =============================================
// CPU AI Controller
// =============================================

class CPUController {
    constructor(cpuPlayer, opponent) {
        this.cpu = cpuPlayer;       // CPUが操作するプレイヤー
        this.opponent = opponent;   // 対戦相手（プレイヤー1）
        this.state = 'approach';    // AI状態: approach / attack / recover / dodge
        this.actionTimer = 0;       // 次のアクションまでのクールダウン
        this.jumpCooldown = 0;      // ジャンプのクールダウン
        this.attackCooldown = 0;    // 攻撃のクールダウン
        this.reactionDelay = 8;     // 反応速度（フレーム数）。大きいほど弱くなる
        this.reactionCounter = 0;   // 反応カウンター
        this.difficulty = 'normal'; // 難易度
        this.thinkTimer = 0;        // 思考インターバル
        this.currentDecision = null;// 現在の行動決定
        this.tickCount = 0;         // フレームカウント
        this.canvasWidth = 1100;
        this.canvasHeight = 650;
        this.lastDodgeDir = 1;
        this.dodgeTimer = 0;
        this.comboTimer = 0;
        this.jumpedFromFall = false;
    }

    setDifficulty(level) {
        this.difficulty = level;
        switch (level) {
            case 'easy':
                this.reactionDelay = 25;
                break;
            case 'normal':
                this.reactionDelay = 12;
                break;
            case 'hard':
                this.reactionDelay = 5;
                break;
        }
    }

    // メインのアップデート関数（毎フレーム呼ぶ）
    update() {
        this.tickCount++;
        const cpu = this.cpu;
        const opp = this.opponent;

        if (cpu.hitstunFrames > 0 || cpu.isAttacking || cpu.isCharging || cpu.inAttackLag) {
            // ヒットストップ・攻撃中は操作しない（DIだけ行う）
            if (cpu.hitstunFrames > 0) {
                this._applyDI();
            }
            return;
        }

        // クールダウンを減らす
        if (this.actionTimer > 0) this.actionTimer--;
        if (this.jumpCooldown > 0) this.jumpCooldown--;
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.dodgeTimer > 0) this.dodgeTimer--;

        // 一定間隔（反応速度に応じて）で判断を更新
        this.thinkTimer++;
        if (this.thinkTimer >= this.reactionDelay) {
            this.thinkTimer = 0;
            this._decideAction();
        }

        // 決定した行動を実行
        this._executeAction();
    }

    // 状況判断
    _decideAction() {
        const cpu = this.cpu;
        const opp = this.opponent;

        const dx = (opp.x + opp.width / 2) - (cpu.x + cpu.width / 2);
        const dy = (opp.y + opp.height / 2) - (cpu.y + cpu.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        // リカバリー判定（ステージ外に出そう）
        const isOffStage = cpu.x < 50 || cpu.x > this.canvasWidth - 50 || cpu.y > this.canvasHeight - 50;
        const isFalling = !cpu.isOnGround && cpu.velocityY > 2;

        if (isOffStage && isFalling) {
            this.currentDecision = 'recover';
            return;
        }

        // 画面外に落ちそうな時もジャンプ
        if (!cpu.isOnGround && cpu.y > 350 && cpu.jumpsLeft > 0) {
            this.currentDecision = 'recover';
            return;
        }

        // 距離に応じた行動
        if (dist < 80) {
            // 近距離：攻撃 or 回避
            const rand = Math.random();
            if (this.dodgeTimer > 0) {
                this.currentDecision = 'retreat';
            } else if (rand < 0.55) {
                this.currentDecision = 'attack';
            } else if (rand < 0.75) {
                this.currentDecision = 'smash';
            } else if (rand < 0.9) {
                this.currentDecision = 'special';
            } else {
                this.currentDecision = 'dodge';
                this.dodgeTimer = 40;
                this.lastDodgeDir = dx > 0 ? -1 : 1;
            }
        } else if (dist < 200) {
            // 中距離：近づいて攻撃
            const rand = Math.random();
            if (rand < 0.3 && this.attackCooldown <= 0) {
                this.currentDecision = 'special'; // 飛び道具など
            } else {
                this.currentDecision = 'approach';
            }
        } else {
            // 遠距離：接近する
            this.currentDecision = 'approach';
        }
    }

    // 行動実行
    _executeAction() {
        const cpu = this.cpu;
        const opp = this.opponent;
        const dx = (opp.x + opp.width / 2) - (cpu.x + cpu.width / 2);

        switch (this.currentDecision) {
            case 'approach':
                this._moveToward(dx);
                this._tryJumpIfNeeded(opp);
                break;
            case 'attack':
                this._moveToward(dx);
                if (this.attackCooldown <= 0) {
                    cpu.attack('normal');
                    this.attackCooldown = 30;
                }
                break;
            case 'smash':
                this._moveToward(dx);
                if (this.attackCooldown <= 0) {
                    cpu.attack('smash');
                    this.attackCooldown = 60;
                }
                break;
            case 'special':
                if (this.attackCooldown <= 0) {
                    cpu.attack('special');
                    this.attackCooldown = 90;
                }
                this._moveToward(dx);
                break;
            case 'recover':
                this._recover();
                break;
            case 'dodge':
                this._dodge();
                break;
            case 'retreat':
                // 相手から逃げる
                cpu.velocityX = dx > 0 ? -cpu.stats.speed : cpu.stats.speed;
                cpu.lastDirection = dx > 0 ? -1 : 1;
                break;
        }
    }

    // 相手へ近づく
    _moveToward(dx) {
        const cpu = this.cpu;
        const speed = cpu.stats.speed * (cpu.isSlowed ? 0.5 : 1);
        if (dx > 8) {
            cpu.velocityX = speed;
            cpu.lastDirection = 1;
        } else if (dx < -8) {
            cpu.velocityX = -speed;
            cpu.lastDirection = -1;
        } else {
            if (cpu.isOnGround) cpu.velocityX = 0;
        }
    }

    // 必要ならジャンプ（段差を乗り越える）
    _tryJumpIfNeeded(opp) {
        const cpu = this.cpu;
        if (this.jumpCooldown > 0) return;
        // 相手が上にいてジャンプで届きそうな場合
        const dy = (opp.y + opp.height / 2) - (cpu.y + cpu.height / 2);
        if (dy < -60 && cpu.isOnGround && cpu.jumpsLeft > 0) {
            cpu.jump();
            this.jumpCooldown = 40;
        }
        // 地面に接していないのに落下したら二段ジャンプ
        if (!cpu.isOnGround && cpu.velocityY > 3 && cpu.jumpsLeft > 0 && !this.jumpedFromFall) {
            // 少し待ってからジャンプ（自然に見せる）
            if (Math.random() < 0.1) {
                cpu.jump();
                this.jumpedFromFall = true;
                this.jumpCooldown = 30;
            }
        }
        if (cpu.isOnGround) this.jumpedFromFall = false;
    }

    // リカバリー（ステージ中央に戻る）
    _recover() {
        const cpu = this.cpu;
        const centerX = this.canvasWidth / 2;
        const dx = centerX - (cpu.x + cpu.width / 2);

        if (dx > 0) { cpu.velocityX = cpu.stats.speed; cpu.lastDirection = 1; }
        else { cpu.velocityX = -cpu.stats.speed; cpu.lastDirection = -1; }

        // ジャンプでステージ上に戻る
        if (cpu.jumpsLeft > 0 && this.jumpCooldown <= 0) {
            cpu.jump();
            this.jumpCooldown = 20;
        }
    }

    // 回避（後ろに飛ぶ）
    _dodge() {
        const cpu = this.cpu;
        cpu.velocityX = this.lastDodgeDir * cpu.stats.speed * 1.5;
        cpu.lastDirection = this.lastDodgeDir;
        if (cpu.isOnGround && cpu.jumpsLeft > 0 && this.jumpCooldown <= 0) {
            cpu.jump();
            this.jumpCooldown = 30;
        }
    }

    // ノックバック中のDI（ダメージ影響） 
    _applyDI() {
        const cpu = this.cpu;
        // 中央方向にDIを入れる
        const centerX = this.canvasWidth / 2;
        const toCenter = centerX - (cpu.x + cpu.width / 2);
        if (toCenter > 0) cpu.velocityX -= 0.1;
        else cpu.velocityX += 0.1;
    }
}
