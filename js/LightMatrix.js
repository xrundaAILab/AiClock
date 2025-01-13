class Light {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.ANIMATION_DURATION = 1200; // 固定动画时间为1.2秒
        this.needles = [
            {
                angle: 0,
                targetAngle: 0,
                startAngle: 0,
                animationStartTime: 0,
                angleDiff: 0,  // 存储需要旋转的角度差
                length: size * 0.3
            },
            {
                angle: 0,
                targetAngle: 0,
                startAngle: 0,
                animationStartTime: 0,
                angleDiff: 0,  // 存储需要旋转的角度差
                length: size * 0.3
            }
        ];
    }

    updateNeedleAngle(needleIndex, targetAngle) {
        const needle = this.needles[needleIndex];
        if (needle.angle === targetAngle) return;

        needle.startAngle = needle.angle;
        needle.targetAngle = targetAngle;

        // 计算角度差的绝对值（考虑最短路径）
        let angleDiff = targetAngle - needle.startAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        // 存储角度差，用于计算动态速度
        needle.angleDiff = angleDiff;
        needle.animationStartTime = performance.now();
    }

    animate(currentTime) {
        let isAnimating = false;

        this.needles.forEach(needle => {
            if (needle.animationStartTime > 0) {
                const elapsed = currentTime - needle.animationStartTime;
                if (elapsed >= this.ANIMATION_DURATION) {
                    // 动画结束
                    needle.angle = needle.targetAngle;
                    needle.animationStartTime = 0;
                } else {
                    // 使用正弦缓动函数，使动画更平滑
                    const progress = Math.min(elapsed / this.ANIMATION_DURATION, 1);
                    const easedProgress = Math.sin(progress * Math.PI / 2);
                    
                    // 使用预先计算的角度差
                    needle.angle = needle.startAngle + needle.angleDiff * easedProgress;
                    isAnimating = true;
                }
            }
        });

        return isAnimating;
    }

    resetToDefault() {
        // 设置为8点钟方向（240度）
        const defaultAngle = (240 - 90) * Math.PI / 180;
        this.needles.forEach(needle => {
            needle.angle = defaultAngle;
            needle.targetAngle = defaultAngle;
            needle.startAngle = defaultAngle;
            needle.animationStartTime = 0;
            needle.angleDiff = 0;
        });
    }
}

class LightMatrix {
    constructor(canvas, rows, cols, lightSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.rows = rows;
        this.cols = cols;
        this.lightSize = lightSize;
        this.rippleRadius = 2;
        this.responseSpeed = 0.5;
        this.lights = [];
        this.animationFrameId = null;

        this.initLights();
        this.resize(rows, cols, lightSize);
        this.startAnimation();
    }

    initLights() {
        this.lights = Array(this.rows).fill().map((_, row) => 
            Array(this.cols).fill().map((_, col) => {
                const light = new Light(
                    col * this.lightSize + this.lightSize / 2,
                    row * this.lightSize + this.lightSize / 2,
                    this.lightSize
                );
                light.resetToDefault();  // 初始化时设置为默认位置
                return light;
            })
        );
    }

    resize(rows, cols, lightSize) {
        this.rows = rows;
        this.cols = cols;
        this.lightSize = lightSize;
        this.initLights();
        this.init();
    }

    init() {
        this.canvas.width = this.cols * this.lightSize;
        this.canvas.height = this.rows * this.lightSize;
        this.draw();
    }

    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景圆形凹槽
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const light = this.lights[row][col];
                this.ctx.beginPath();
                this.ctx.arc(light.x, light.y, this.lightSize * 0.35, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // 重置阴影效果
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // 绘制所有光线
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = Math.max(1, this.lightSize * 0.06);
        this.ctx.lineCap = 'round';  // 添加圆形线帽
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const light = this.lights[row][col];
                
                light.needles.forEach(needle => {
                    this.ctx.beginPath();
                    this.ctx.moveTo(light.x, light.y);
                    this.ctx.lineTo(
                        light.x + Math.cos(needle.angle) * needle.length,
                        light.y + Math.sin(needle.angle) * needle.length
                    );
                    this.ctx.stroke();
                });
            }
        }
    }

    startAnimation() {
        const animate = (currentTime) => {
            let needsUpdate = false;
            
            // 更新所有光点的动画状态
            this.lights.forEach(row => {
                row.forEach(light => {
                    if (light.animate(currentTime)) {
                        needsUpdate = true;
                    }
                });
            });
            
            // 如果有需要更新的动画，重绘画布
            if (needsUpdate) {
                this.draw();
            }
            
            this.animationFrameId = requestAnimationFrame(animate);
        };
        
        this.animationFrameId = requestAnimationFrame(animate);
    }

    stopAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    resetNeedles() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const light = this.lights[row][col];
                light.resetToDefault();
            }
        }
        this.draw();
    }
} 