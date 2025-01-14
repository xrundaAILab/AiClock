const app = Vue.createApp({
    data() {
        return {
            rows: 8,
            cols: 16,
            lightSize: 50,
            rippleRadius: 2,
            responseSpeed: 0.5,
            lightMatrix: null,
            text: '',
            debugInfo: '',
            isEditMode: false,
            showMarker: false,
            currentRow: 0,
            currentCol: 0,
            needle1Time: 12,
            needle2Time: 12,
            markedPositions: {},
            selectedAnimation: '',
            animationLibrary: null,
            animations: null,
            mode: 'text',  // 'text' 或 'animation' 模式
            isAutoPlaying: false,
            autoPlayTimer: null,
            currentContent: null,  // 当前显示的内容（动画名或矩阵数据）
            autoPlayList: [],      // 自动播放列表
            timeUpdateInterval: null,  // 用于存储时间更新定时器
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
            if (this.mode === 'animation') {
                this.stopAnimation();
                this.selectedAnimation = '';
                this.mode = 'text';
            }
            this.updateInputText();
        },
        isEditMode(newVal) {
            if (newVal) {
                // 进入编辑模式时停止动画
                this.stopAnimation();
                
                // 重置所有指针
                this.lightMatrix.resetNeedles();
            }
        },
        selectedAnimation(newVal) {
            if (newVal) {
                console.log('Starting animation:', newVal);
                // 停止当前动画
                this.stopAnimation();
                // 重置所有指针到默认位置
                this.lightMatrix.resetNeedles();
                this.mode = 'animation';
                // 直接开始新动画
                this.animationLibrary.play(newVal);
                console.log('Animation started');
            } else {
                this.mode = 'text';
            }
        },
        needle1Time(newVal) {
            if (this.showMarker) {
                const angles = this.timeToAngles(newVal, this.needle2Time);
                const light = this.lightMatrix.lights[this.currentRow][this.currentCol];
                light.updateNeedleAngle(0, angles[0]);
                this.lightMatrix.draw();
            }
        },
        needle2Time(newVal) {
            if (this.showMarker) {
                const angles = this.timeToAngles(this.needle1Time, newVal);
                const light = this.lightMatrix.lights[this.currentRow][this.currentCol];
                light.updateNeedleAngle(1, angles[1]);
                this.lightMatrix.draw();
            }
        },
        isAutoPlaying(newVal) {
            if (newVal) {
                this.startAutoPlay();
            } else {
                this.stopAutoPlay();
            }
        }
    },
    
    mounted() {
        this.initMatrix();
        this.animationLibrary = new AnimationLibrary(this.lightMatrix);
        // 确保动画库正确初始化
        console.log('Animation library initialized:', this.animationLibrary);
        console.log('Available animations:', this.animationLibrary.animations);

        // 添加动画切换回调
        this.animationLibrary.onAnimationChange = (animationKey) => {
            this.selectedAnimation = animationKey || '';
            console.log('Animation changed to:', animationKey);
        };
        
        // 格式化动画列表以便于显示
        this.animations = Object.entries(this.animationLibrary.animations).map(([key, anim]) => ({
            key: key,
            name: anim.name
        }));
        this.updateInputText();

        // 初始化时显示当前时间
        this.updateCurrentTime();
        
        // 设置定时器，每分钟更新一次时间
        this.timeUpdateInterval = setInterval(() => {
            this.updateCurrentTime();
        }, 60000); // 60000ms = 1分钟
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
            if (this.mode === 'animation') return;
            if (!this.lightMatrix) return;
            if (this.text.trim() === '') {
                // 如果文本为空，重置所有指针
                this.lightMatrix.resetNeedles();
                this.markedPositions = {};
                this.updateDebugInfo();
                return;
            }

            try {
                // 获取数字配置和字母配置
                const numberResponse = await fetch('font_configs/number_config.json');
                const numberConfig = await numberResponse.json();
                const styleResponse = await fetch('font_configs/style_config.json');
                const styleConfig = await styleResponse.json();
                console.log('Full style_config content:', styleConfig);
                console.log('Keys in style_config:', Object.keys(styleConfig));

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
                const chars = this.text.replace(/\s+/g, '').split('');
                const char = chars[0].toLowerCase();
                console.log('Looking for character:', char);
                console.log('Found in style_config:', char in styleConfig);
                console.log('Matrix data:', styleConfig[char]);

                // 检查是否是字母
                const isLetter = chars[0].match(/[a-zA-Z]/);
                
                // 计算起始位置
                let startCol = 0;
                let startRow = 0;
                
                // 如果不是字母，则使用居中对齐
                if (!isLetter) {
                    let totalWidth = 0;
                    chars.forEach(char => {
                        totalWidth += char === ':' ? 1 : 3;
                    });
                    startCol = Math.max(0, Math.floor((this.cols - totalWidth) / 2));
                    
                    const charHeight = 6;
                    startRow = Math.max(0, Math.floor((this.rows - charHeight) / 2));
                }

                console.log('Start column:', startCol);
                console.log('Start row:', startRow);

                // 记录新的活动位置
                const newActivePositions = new Set();

                // 遍历每个字符
                let currentCol = startCol;
                chars.forEach((char, charIndex) => {
                    console.log(`Processing char: ${char}`);
                    const matrix = numberConfig[char] || styleConfig[char.toLowerCase()];
                    console.log(`Raw matrix data from config for '${char}':`, JSON.stringify(matrix, null, 2));

                    if (matrix) {
                        const offsetCol = currentCol;
                        // 只应用字符矩阵的实际数据部分（6x3）
                        for (let rowIndex = 0; rowIndex < matrix.length; rowIndex++) {
                            for (let cellIndex = 0; cellIndex < matrix[rowIndex].length; cellIndex++) {
                                const cell = matrix[rowIndex][cellIndex];
                                const col = offsetCol + cellIndex;
                                const adjustedRow = startRow + rowIndex;

                                // 检查是否在表盘范围内
                                if (adjustedRow < this.rows && col < this.cols) {
                                    if (cell[0] !== null && cell[1] !== null) {
                                        const key = `${adjustedRow},${col}`;
                                        console.log(`Setting position ${key} with values:`, cell);
                                        newActivePositions.add(key);

                                        // 更新表针角度
                                        const angles = this.timeToAngles(cell[0], cell[1]);
                                        const light = this.lightMatrix.lights[adjustedRow][col];
                                        light.updateNeedleAngle(0, angles[0]);
                                        light.updateNeedleAngle(1, angles[1]);

                                        // 更新位置记录
                                        this.markedPositions[key] = [cell[0], cell[1]];
                                    }
                                }
                            }
                        }
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
        
        stopAnimation() {
            console.log('Stopping animation');
            this.animationLibrary.stop();
            console.log('Animation stopped');
        },
        
        beforeDestroy() {
            this.stopAnimation();
            // 清除时间更新定时器
            if (this.timeUpdateInterval) {
                clearInterval(this.timeUpdateInterval);
            }
        },
        
        async startAutoPlay() {
            if (!this.autoPlayList.length) {
                // 构建播放列表：动画效果 + 字母矩阵
                this.autoPlayList = [
                    ...this.animations.map(anim => ({ type: 'animation', key: anim.key })),
                    ...Object.keys(await this.loadStyleConfig()).map(key => ({ 
                        type: 'matrix', 
                        key: key 
                    }))
                ];
            }

            this.playNext();
        },

        stopAutoPlay() {
            if (this.autoPlayTimer) {
                clearTimeout(this.autoPlayTimer);
                this.autoPlayTimer = null;
            }
            this.stopAnimation();
            this.mode = 'text';
            this.text = '';
            this.lightMatrix.resetNeedles();
            this.markedPositions = {};
            this.updateDebugInfo();
        },

        async playNext() {
            if (!this.isAutoPlaying) return;

            // 获取下一个要播放的内容
            const current = this.autoPlayList.shift();
            this.autoPlayList.push(current);  // 移到末尾以实现循环

            // 根据类型播放内容
            if (current.type === 'animation') {
                // 先清除文本，再设置动画
                this.text = '';
                this.selectedAnimation = current.key;
            } else {
                // 先停止动画，再设置文本
                this.stopAnimation();
                this.selectedAnimation = '';
                this.mode = 'text';  // 确保模式是文本模式
                this.text = current.key;
                // 强制更新文本显示
                await this.updateInputText();
            }

            // 10秒后播放下一个
            this.autoPlayTimer = setTimeout(() => {
                this.playNext();
            }, 10000);  // 保持10秒的显示时间
        },

        async loadStyleConfig() {
            const response = await fetch('font_configs/style_config.json');
            return await response.json();
        },

        onTextInput(event) {
            // 立即更新文本显示
            if (this.mode === 'animation') {
                this.stopAnimation();
                this.selectedAnimation = '';
                this.mode = 'text';
            }
            this.updateInputText();
        },

        updateCurrentTime() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            this.text = `${hours}:${minutes}`;
        }
    }
}).mount('#app'); 