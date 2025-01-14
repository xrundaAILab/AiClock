class AnimationLibrary {
    constructor(lightMatrix) {
        this.lightMatrix = lightMatrix;
        this.currentAnimation = null;
        this.isPlaying = false;
        this.autoPlay = false;
        this.transitionDuration = 2000;
        this.animationDuration = 10000;  // 统一设置为10秒
        this.currentAngles = null;  // 存储当前角度状态
        this.targetAngles = null;   // 存储目标角度状态
        this.transitionStartTime = 0;
        this.isTransitioning = false;
        this.animationKeys = null;  // 存储动画键的顺序

        // 基础动画配置
        const baseConfig = {
            centerX: this.lightMatrix.cols / 2,
            centerY: this.lightMatrix.rows / 2,
            defaultAngle: 8 * 30 * Math.PI / 180  // 默认8点钟位置
        };

        this.animations = {
            'fluidFlow': {
                name: '流体波动',
                duration: this.animationDuration,
                getTargetAngles: (progress, row, col) => {
                    const dx = col - baseConfig.centerX;
                    const dy = row - baseConfig.centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx);
                    
                    // 创建流动效果
                    const flowPhase = distance * 0.2 - progress * Math.PI * 2;
                    const flowAmplitude = 0.6;
                    
                    // 两个指针使用不同的相位，创造流动感
                    return [
                        angle + Math.sin(flowPhase) * flowAmplitude,
                        angle + Math.sin(flowPhase + Math.PI * 0.5) * flowAmplitude
                    ];
                }
            },

            'spiralFlow': {
                name: '螺旋流动',
                duration: this.animationDuration,
                getTargetAngles: (progress, row, col) => {
                    const dx = col - baseConfig.centerX;
                    const dy = row - baseConfig.centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx);
                    
                    // 创建螺旋流动效果
                    const spiralPhase = angle + distance * 0.3 + progress * Math.PI * 2;
                    const flowStrength = Math.exp(-distance * 0.1); // 距离衰减
                    
                    return [
                        spiralPhase * flowStrength,
                        spiralPhase * flowStrength + Math.PI * 0.5
                    ];
                }
            },

            'waveFlow': {
                name: '波浪流动',
                duration: this.animationDuration,
                getTargetAngles: (progress, row, col) => {
                    const dx = col - baseConfig.centerX;
                    const dy = row - baseConfig.centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx);
                    
                    // 创建波浪效果
                    const wavePhase1 = dx * 0.3 + progress * Math.PI * 2;
                    const wavePhase2 = dy * 0.3 + progress * Math.PI * 2;
                    const amplitude = 0.5;
                    
                    return [
                        angle + Math.sin(wavePhase1) * amplitude,
                        angle + Math.sin(wavePhase2) * amplitude
                    ];
                }
            },

            'vortexFlow': {
                name: '漩涡流动',
                duration: this.animationDuration,
                getTargetAngles: (progress, row, col) => {
                    const dx = col - baseConfig.centerX;
                    const dy = row - baseConfig.centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx);
                    
                    // 创建漩涡效果
                    const vortexStrength = 1 - Math.min(1, distance * 0.15);
                    const rotationSpeed = progress * Math.PI * 2;
                    const vortexPhase = angle + rotationSpeed * vortexStrength;
                    
                    // 两个指针形成交错的漩涡
                    return [
                        vortexPhase,
                        vortexPhase + Math.PI * (0.5 + distance * 0.1)
                    ];
                }
            },

            'chaseLightFlow': {
                name: "追光流动",
                duration: this.animationDuration,
                getTargetAngles: (progress, row, col) => {
                    const totalCols = 16;
                    const waveSpeed = 0.1;
                    const phaseDelay = (totalCols - 1 - col) * waveSpeed;
                    const adjustedProgress = progress * Math.PI * 2 - phaseDelay;
                    const angle1 = Math.sin(adjustedProgress) * Math.PI;
                    const angle2 = Math.cos(adjustedProgress) * Math.PI;
                    return [angle1, angle2];
                }
            },

            'leftToRightFlow': {
                name: '逆光追逐',
                duration: this.animationDuration,
                getTargetAngles: (progress, row, col) => {
                    const totalCols = 16;
                    const waveSpeed = 0.1;
                    const phaseDelay = col * waveSpeed;  // 从左向右
                    const adjustedProgress = progress * Math.PI * 2 - phaseDelay;
                    const angle1 = Math.sin(adjustedProgress) * Math.PI;
                    const angle2 = Math.cos(adjustedProgress) * Math.PI;
                    return [angle1, angle2];
                }
            },

            'topToBottomFlow': {
                name: '垂直瀑布',
                duration: this.animationDuration,
                getTargetAngles: (progress, row, col) => {
                    const totalRows = 8;
                    const waveSpeed = 0.15;
                    const phaseDelay = row * waveSpeed;  // 从上向下
                    const adjustedProgress = progress * Math.PI * 2 - phaseDelay;
                    const angle1 = Math.sin(adjustedProgress) * Math.PI;
                    const angle2 = Math.cos(adjustedProgress) * Math.PI;
                    return [angle1, angle2];
                }
            },

            'diagonalFlow': {
                name: '斜向律动',
                duration: this.animationDuration,
                getTargetAngles: (progress, row, col) => {
                    const waveSpeed = 0.12;
                    // 对角线延迟：行和列的和决定延迟
                    const phaseDelay = (row + col) * waveSpeed;
                    const adjustedProgress = progress * Math.PI * 2 - phaseDelay;
                    const angle1 = Math.sin(adjustedProgress) * Math.PI;
                    const angle2 = Math.cos(adjustedProgress) * Math.PI;
                    return [angle1, angle2];
                }
            },

            'cornerSpread': {
                name: '角落扩散',
                duration: this.animationDuration,
                getTargetAngles: (progress, row, col) => {
                    const waveSpeed = 0.1;
                    // 计算到左上角的距离
                    const distance = Math.sqrt(row * row + col * col);
                    const phaseDelay = distance * waveSpeed;
                    const adjustedProgress = progress * Math.PI * 2 - phaseDelay;
                    const angle1 = Math.sin(adjustedProgress) * Math.PI;
                    const angle2 = Math.cos(adjustedProgress) * Math.PI;
                    return [angle1, angle2];
                }
            },

            'centerRipple': {
                name: '中心涟漪',
                duration: this.animationDuration,
                getTargetAngles: (progress, row, col) => {
                    const centerX = 7.5;  // 中心点X（16列的中间）
                    const centerY = 3.5;  // 中心点Y（8行的中间）
                    const dx = col - centerX;
                    const dy = row - centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const waveSpeed = 0.15;
                    const phaseDelay = distance * waveSpeed;
                    const adjustedProgress = progress * Math.PI * 2 - phaseDelay;
                    const angle1 = Math.sin(adjustedProgress) * Math.PI;
                    const angle2 = Math.cos(adjustedProgress) * Math.PI;
                    return [angle1, angle2];
                }
            }
        };

        // 初始化动画键的顺序
        this.animationKeys = Object.keys(this.animations);
    }

    updateAnimation(currentTime) {
        if (!this.currentAnimation || !this.isPlaying) return;

        const animation = this.animations[this.currentAnimation];
        const elapsed = currentTime - this.transitionStartTime;
        const progress = (elapsed % this.animationDuration) / this.animationDuration;

        // 检查是否需要切换到下一个动画
        if (this.autoPlay && elapsed >= this.animationDuration) {
            const currentIndex = this.animationKeys.indexOf(this.currentAnimation);
            const nextIndex = (currentIndex + 1) % this.animationKeys.length;
            const nextAnimation = this.animationKeys[nextIndex];
            console.log(`Switching to next animation: ${nextAnimation}`);
            this.play(nextAnimation);
            return;
        }

        // 计算所有表针的目标角度
        for (let row = 0; row < this.lightMatrix.rows; row++) {
            for (let col = 0; col < this.lightMatrix.cols; col++) {
                const light = this.lightMatrix.lights[row][col];
                const [targetAngle1, targetAngle2] = animation.getTargetAngles(progress, row, col);

                // 平滑过渡
                const transitionProgress = Math.min(1, elapsed / this.transitionDuration);
                const easeProgress = this.easeInOutCubic(transitionProgress);

                light.needles.forEach((needle, index) => {
                    const currentAngle = this.currentAngles[row][col][index];
                    const targetAngle = index === 0 ? targetAngle1 : targetAngle2;
                    
                    // 计算最短路径的角度差
                    let angleDiff = targetAngle - currentAngle;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    
                    needle.angle = currentAngle + angleDiff * easeProgress;
                });
            }
        }

        this.lightMatrix.draw();
        requestAnimationFrame(this.updateAnimation.bind(this));
    }

    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    captureCurrentState() {
        const state = Array(this.lightMatrix.rows).fill().map(() => 
            Array(this.lightMatrix.cols).fill().map(() => [0, 0])
        );

        this.lightMatrix.lights.forEach((row, rowIndex) => {
            row.forEach((light, colIndex) => {
                state[rowIndex][colIndex] = light.needles.map(needle => needle.angle);
            });
        });

        return state;
    }

    play(animationKey) {
        if (!this.animations[animationKey]) return;
        
        // 保存当前状态
        this.currentAngles = this.captureCurrentState();
        this.currentAnimation = animationKey;
        this.isPlaying = true;
        this.transitionStartTime = performance.now();

        // 触发动画切换事件
        if (this.onAnimationChange) {
            this.onAnimationChange(animationKey);
        }

        if (!this.animationFrameId) {
            this.animationFrameId = requestAnimationFrame(this.updateAnimation.bind(this));
        }
    }

    stop() {
        this.isPlaying = false;
        this.autoPlay = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // 触发动画停止事件
        if (this.onAnimationChange) {
            this.onAnimationChange(null);
        }
    }

    startAutoPlay() {
        this.autoPlay = true;
        if (!this.isPlaying) {
            this.play(this.animationKeys[0]);
        }
    }

    stopAutoPlay() {
        this.autoPlay = false;
    }
} 