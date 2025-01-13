const app = Vue.createApp({
    data() {
        return {
            rows: 8,
            cols: 15,
            lightSize: 50,
            currentX: 0,
            currentY: 0,
            matrixX: 0,
            matrixY: 0,
            rippleRadius: 2,
            responseSpeed: 0.5,
            lightMatrix: null,
            text: '0',
            isRunning: false,
            textUpdateInterval: null,
            animationFrame: null,
            animationStartTime: 0,
            animationDuration: 1000, // 动画持续1秒
            debugInfo: '',
        }
    },
    
    watch: {
        text: {
            handler(newText) {
                if (this.lightMatrix && newText.trim() !== '' && !this.isRunning) {
                    this.lightMatrix.drawText(newText);
                    this.updateDebugInfo();
                }
            },
            immediate: true
        },
        rippleRadius(newVal) {
            if (this.lightMatrix) {
                this.lightMatrix.rippleRadius = newVal;
            }
        },
        responseSpeed(newVal) {
            if (this.lightMatrix) {
                this.lightMatrix.responseSpeed = newVal;
            }
        }
    },
    
    mounted() {
        this.initMatrix();
        // 初始化时显示默认值 "0"
        if (this.lightMatrix) {
            this.lightMatrix.drawText(this.text);
            this.updateDebugInfo();
        }
        // 启动定时更新调试信息
        setInterval(() => {
            this.updateDebugInfo();
        }, 100); // 每100ms更新一次
    },
    
    methods: {
        initMatrix() {
            const canvas = this.$refs.canvas;
            this.lightMatrix = new LightMatrix(
                canvas,
                this.rows,
                this.cols,
                this.lightSize
            );
        },
        
        resetMatrix() {
            this.lightMatrix.resize(
                this.rows,
                this.cols,
                this.lightSize
            );
        },
        
        handleMouseMove(event) {
            const rect = event.target.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            this.currentX = Math.round(x);
            this.currentY = Math.round(y);
            
            this.matrixX = Math.floor(x / this.lightSize);
            this.matrixY = Math.floor(y / this.lightSize);
            
            this.lightMatrix.updateLight(x, y);
        },
        
        startAnimation() {
            this.isRunning = true;
            this.textUpdateInterval = setInterval(() => {
                if (this.text.trim() !== '') {
                    this.lightMatrix.drawText(this.text);
                    this.updateDebugInfo();
                }
            }, 100);
            
            this.animationStartTime = performance.now();
            this.animate();
        },
        
        stopAnimation() {
            this.isRunning = false;
            if (this.textUpdateInterval) {
                clearInterval(this.textUpdateInterval);
                this.textUpdateInterval = null;
            }
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
            this.resetNeedles();
        },
        
        animate() {
            if (!this.isRunning) return;
            
            const currentTime = performance.now();
            const elapsed = currentTime - this.animationStartTime;
            const progress = Math.min(elapsed / this.animationDuration, 1);
            
            this.lightMatrix.animate(progress);
            
            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(() => this.animate());
            } else {
                this.animationStartTime = performance.now();
            }
            
            this.updateDebugInfo();
        },
        
        resetNeedles() {
            if (this.lightMatrix) {
                this.lightMatrix.resetNeedles();
                this.updateDebugInfo();
            }
        },
        
        updateDebugInfo() {
            if (this.lightMatrix) {
                this.debugInfo = this.lightMatrix.getDebugInfo();
            }
        },
        
        updateText(event) {
            if (event.target.value.trim() === '') {
                this.text = '0';
            }
        },
    }
}).mount('#app'); 