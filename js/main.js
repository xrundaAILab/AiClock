const app = Vue.createApp({
    data() {
        return {
            rows: 8,
            cols: 15,
            lightSize: 50,
            rippleRadius: 2,
            responseSpeed: 0.5,
            lightMatrix: null,
            text: '0',
            debugInfo: '',
        }
    },
    
    watch: {
        text: {
            handler(newText) {
                if (this.lightMatrix) {
                    if (newText.trim() === '') {
                        this.resetNeedles();
                    } else {
                        this.resetNeedles();
                        this.fetchCharMatrix(newText[0]);
                    }
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
            this.fetchCharMatrix(this.text);
        }
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
        
        resetNeedles() {
            if (this.lightMatrix) {
                this.lightMatrix.resetNeedles();
                this.updateDebugInfo();
            }
        },
        
        updateDebugInfo(grayMatrix) {
            if (this.lightMatrix) {
                let info = '灰度值矩阵:\n\n';
                if (grayMatrix) {
                    grayMatrix.forEach((row, i) => {
                        info += row.map(val => val.toString().padStart(4)).join(' ') + '\n';
                    });
                }
                this.debugInfo = info;
            }
        },
        
        updateText(event) {
            // 移除默认值设置，允许输入框为空
        },
        
        async fetchCharMatrix(char) {
            try {
                const response = await fetch(`http://localhost:8081/get_char_matrix?char=${char}`);
                const data = await response.json();
                console.log('Received matrix data:', data);
                console.log('Gray values:', data.gray_matrix);
                if (data.matrix) {
                    this.updateMatrixDisplay(data.matrix);
                    this.updateDebugInfo(data.gray_matrix);
                }
            } catch (error) {
                console.error('Error fetching matrix:', error);
            }
        },
        
        updateMatrixDisplay(matrix) {
            // 更新表针角度
            for (let row = 0; row < matrix.length; row++) {
                for (let col = 0; col < matrix[0].length; col++) {
                    if (row < this.rows && col < this.cols) {
                        const angles = matrix[row][col];
                        this.lightMatrix.lights[row][col].needles[0].angle = angles[0];
                        this.lightMatrix.lights[row][col].needles[1].angle = angles[1];
                    }
                }
            }
            this.lightMatrix.draw();
        },
    }
}).mount('#app'); 