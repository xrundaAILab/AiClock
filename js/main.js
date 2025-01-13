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
            isEditMode: false,
            showMarker: false,
            currentRow: 0,
            currentCol: 0,
            needle1Time: 12,
            needle2Time: 12,
            markedPositions: {}
        }
    },
    
    watch: {
        rippleRadius(newVal) {
            if (this.lightMatrix) {
                this.lightMatrix.rippleRadius = newVal;
            }
        },
        responseSpeed(newVal) {
            if (this.lightMatrix) {
                this.lightMatrix.responseSpeed = newVal;
            }
        },
        text(newVal) {
            this.updateInputText();
        },
        isEditMode(newVal) {
            if (!newVal) {
                this.showMarker = false;
            }
        }
    },
    
    mounted() {
        this.initMatrix();
        this.updateInputText();
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
                this.markedPositions = {};
                this.updateDebugInfo();
            }
        },
        
        updateDebugInfo() {
            if (this.lightMatrix) {
                let info = '';
                for (let row = 0; row < this.rows; row++) {
                    let line = '';
                    for (let col = 0; col < this.cols; col++) {
                        const key = `${row},${col}`;
                        const mark = this.markedPositions[key];
                        line += mark 
                            ? `[${String(mark[0]).padStart(2)},${String(mark[1]).padStart(2)}] `
                            : '[--,--] ';
                    }
                    info += line.trimEnd() + '\n';
                }
                this.debugInfo = info;
            }
        },
        
        async updateInputText() {
            if (!this.lightMatrix) return;
            
            if (this.text.trim() === '') return;

            try {
                // 获取数字配置
                const response = await fetch('font_configs/number_config.json');
                const numberConfig = await response.json();
                console.log('Loaded number config:', numberConfig);
                
                // 等待所有动画完成后再继续
                await new Promise(resolve => setTimeout(resolve, this.lightMatrix.lights[0][0].ANIMATION_DURATION));
                
                // 记录当前活动的表针位置
                const activePositions = new Set();
                this.lightMatrix.lights.forEach((row, rowIndex) => {
                    row.forEach((light, colIndex) => {
                        light.needles.forEach(needle => {
                            if (needle.angle !== light.DEFAULT_ANGLE) {
                                activePositions.add(`${rowIndex},${colIndex}`);
                            }
                        });
                    });
                });
                console.log('Current active positions:', Array.from(activePositions));
                
                // 获取输入的字符
                const chars = this.text.split('');
                console.log('Processing characters:', chars);
                
                // 计算起始列，使字符水平居中显示
                let totalWidth = 0;
                chars.forEach(char => {
                    // 冒号只占1列，其他字符占3列
                    totalWidth += char === ':' ? 1 : 3;
                });
                const startCol = Math.max(0, Math.floor((this.cols - totalWidth) / 2));
                console.log('Start column:', startCol);
                
                // 计算起始行，使字符垂直居中显示
                const charHeight = 6;
                const startRow = Math.max(0, Math.floor((this.rows - charHeight) / 2));
                console.log('Start row:', startRow);
                
                // 记录新的活动位置
                const newActivePositions = new Set();
                
                // 遍历每个字符
                let currentCol = startCol;
                chars.forEach((char, charIndex) => {
                    console.log(`Processing char: ${char}`);
                    if (numberConfig[char]) {
                        const matrix = numberConfig[char];
                        const offsetCol = currentCol;
                        console.log(`Matrix for char ${char}:`, matrix);
                        
                        // 应用字符矩阵到表针
                        matrix.forEach((row, rowIndex) => {
                            row.forEach((cell, cellIndex) => {
                                const col = offsetCol + cellIndex;
                                const adjustedRow = startRow + rowIndex;
                                
                                // 检查是否在表盘范围内
                                if (adjustedRow < this.rows && col < this.cols) {
                                    if (cell[0] !== null && cell[1] !== null) {
                                        const key = `${adjustedRow},${col}`;
                                        newActivePositions.add(key);
                                        
                                        // 更新表针角度
                                        const angles = this.timeToAngles(cell[0], cell[1]);
                                        console.log(`Setting angles at [${adjustedRow},${col}]:`, angles);
                                        const light = this.lightMatrix.lights[adjustedRow][col];
                                        light.updateNeedleAngle(0, angles[0]);
                                        light.updateNeedleAngle(1, angles[1]);
                                        
                                        // 更新位置记录
                                        this.markedPositions[key] = [cell[0], cell[1]];
                                    }
                                }
                            });
                        });
                        // 更新下一个字符的起始列
                        currentCol += char === ':' ? 1 : 3;
                    }
                });
                
                console.log('New active positions:', Array.from(newActivePositions));
                
                // 重置不再使用的表针
                activePositions.forEach(pos => {
                    if (!newActivePositions.has(pos)) {
                        console.log(`Resetting position: ${pos}`);
                        const [row, col] = pos.split(',').map(Number);
                        const light = this.lightMatrix.lights[row][col];
                        light.resetToDefault();
                        delete this.markedPositions[pos];
                    }
                });
                
                // 更新显示
                this.lightMatrix.draw();
                this.updateDebugInfo();
                
            } catch (error) {
                console.error('Error updating text:', error);
                console.error('Error details:', error.stack);
            }
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
        
        handleDebugInput(event) {
            // 可以在这里添加输入验证逻辑
        },
        
        applyDebugInfo() {
            try {
                // 首先清理输入文本，移除多余空格
                const cleanedText = this.debugInfo
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)  // 移除空行
                    .join('\n');
                
                // 解析调试信息文本
                const lines = cleanedText.split('\n');
                this.markedPositions = {};
                
                let currentRow = 0;
                lines.forEach((line) => {
                    // 跳过数字标识行（只包含一个数字的行）
                    if (/^\d+$/.test(line.trim())) {
                        currentRow = 0;  // 重置行计数
                        return;
                    }
                    
                    // 移除所有多余空格，包括方括号内的空格
                    const cleanLine = line.replace(/\s+/g, '');
                    const positions = cleanLine.match(/\[(\d{1,2}|\-\-),(\d{1,2}|\-\-)\]/g);
                    if (positions) {
                        positions.forEach((pos, col) => {
                            // 处理 [--,--] 情况
                            if (pos === '[--,--]') {
                                if (this.lightMatrix.lights[currentRow] && this.lightMatrix.lights[currentRow][col]) {
                                    this.lightMatrix.lights[currentRow][col].resetToDefault();
                                }
                                return;
                            }
                            
                            // 解析时间值
                            const matches = pos.match(/\[(\d{1,2}|\-\-),(\d{1,2}|\-\-)\]/);
                            if (!matches) return;
                            
                            const time1 = matches[1] === '--' ? null : parseInt(matches[1], 10);
                            const time2 = matches[2] === '--' ? null : parseInt(matches[2], 10);
                            
                            if (time1 === null || time2 === null) {
                                // 如果任一值为 null，重置到默认位置
                                if (this.lightMatrix.lights[currentRow] && this.lightMatrix.lights[currentRow][col]) {
                                    this.lightMatrix.lights[currentRow][col].resetToDefault();
                                }
                            } else {
                                const key = `${currentRow},${col}`;
                                this.markedPositions[key] = [time1, time2];
                                
                                // 更新表针角度
                                const angles = this.timeToAngles(time1, time2);
                                if (this.lightMatrix.lights[currentRow] && this.lightMatrix.lights[currentRow][col]) {
                                    this.lightMatrix.lights[currentRow][col].needles[0].angle = angles[0];
                                    this.lightMatrix.lights[currentRow][col].needles[1].angle = angles[1];
                                }
                            }
                        });
                        currentRow++;  // 只在处理完有效行后增加行计数
                    }
                });
                
                // 更新显示
                this.lightMatrix.draw();
                // 重新格式化显示
                this.updateDebugInfo();
            } catch (error) {
                console.error('Error applying debug info:', error);
                console.log('Debug info content:', this.debugInfo);
            }
        },
        
        async exportDebugInfo() {
            try {
                // 获取当前调试信息
                const configText = this.debugInfo;
                
                // 复制到剪贴板
                await navigator.clipboard.writeText(configText);
                
                // 可选：显示提示信息
                alert('配置已复制到剪贴板');
            } catch (error) {
                console.error('复制失败:', error);
                alert('复制失败，请手动复制');
            }
        },
        
        timeToAngles(time1, time2) {
            // 将时钟位置转换为角度（12点为0度，3点为90度，以此类推）
            const angle1 = ((time1 % 12) * 30 - 90) * Math.PI / 180;
            const angle2 = ((time2 % 12) * 30 - 90) * Math.PI / 180;
            return [angle1, angle2];
        },
        
        handleCanvasClick(event) {
            if (!this.isEditMode) return;
            
            const rect = event.target.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            this.currentCol = Math.floor(x / this.lightSize);
            this.currentRow = Math.floor(y / this.lightSize);
            
            // 如果该位置已有标记，显示已保存的值
            const key = `${this.currentRow},${this.currentCol}`;
            if (this.markedPositions[key]) {
                const [time1, time2] = this.markedPositions[key];
                this.needle1Time = time1;
                this.needle2Time = time2;
            } else {
                // 如果没有标记，设置为默认值12点
                this.needle1Time = 12;
                this.needle2Time = 12;
            }
            
            // 显示标记弹层
            this.showMarker = true;
        },
        
        saveNeedlePosition() {
            const key = `${this.currentRow},${this.currentCol}`;
            this.markedPositions[key] = [this.needle1Time, this.needle2Time];
            
            // 更新表针角度
            const angles = this.timeToAngles(this.needle1Time, this.needle2Time);
            const light = this.lightMatrix.lights[this.currentRow][this.currentCol];
            light.updateNeedleAngle(0, angles[0]);
            light.updateNeedleAngle(1, angles[1]);
            
            // 更新显示
            this.lightMatrix.draw();
            this.updateDebugInfo();
            this.showMarker = false;
        },
    }
}).mount('#app'); 