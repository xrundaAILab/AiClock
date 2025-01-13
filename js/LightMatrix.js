class LightMatrix {
    constructor(canvas, rows, cols, lightSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.rows = rows;
        this.cols = cols;
        this.lightSize = lightSize;
        
        // 8点位置 = 240度 = 4π/3弧度
        // Canvas中需要减去90度(π/2)来调整起始位置
        this.RESET_ANGLE = (Math.PI * 4) / 3 - Math.PI / 2;
        
        // 存储所有光点的角度，现在每个位置有两个指针
        this.lights = Array(rows).fill().map(() => 
            Array(cols).fill().map(() => ({
                needles: [
                    {
                        angle: (Math.PI * 4) / 3 - Math.PI / 2, // 8点方向（240度，调整后）
                        length: lightSize * 0.3
                    },
                    {
                        angle: (Math.PI * 4) / 3 - Math.PI / 2, // 8点方向（240度，调整后）
                        length: lightSize * 0.3
                    }
                ]
            }))
        );
        
        this.textCanvas = document.createElement('canvas');
        this.textCtx = this.textCanvas.getContext('2d');
        
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
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.ctx.beginPath();
                this.ctx.arc(
                    col * this.lightSize + this.lightSize / 2,
                    row * this.lightSize + this.lightSize / 2,
                    this.lightSize * 0.35,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
        }
        
        // 绘制所有光线
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = Math.max(1, this.lightSize * 0.06);
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const light = this.lights[row][col];
                const centerX = col * this.lightSize + this.lightSize / 2;
                const centerY = row * this.lightSize + this.lightSize / 2;
                
                // 绘制短针
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY);
                this.ctx.lineTo(
                    centerX + Math.cos(light.needles[0].angle) * light.needles[0].length,
                    centerY + Math.sin(light.needles[0].angle) * light.needles[0].length
                );
                this.ctx.stroke();
                
                // 绘制长针
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY);
                this.ctx.lineTo(
                    centerX + Math.cos(light.needles[1].angle) * light.needles[1].length,
                    centerY + Math.sin(light.needles[1].angle) * light.needles[1].length
                );
                this.ctx.stroke();
            }
        }
    }
    
    resize(rows, cols, lightSize) {
        this.rows = rows;
        this.cols = cols;
        this.lightSize = lightSize;
        
        // 重新初始化光点数组
        this.lights = Array(rows).fill().map(() => 
            Array(cols).fill().map(() => ({
                needles: [
                    {
                        angle: (Math.PI * 4) / 3 - Math.PI / 2, // 8点方向（240度，调整后）
                        length: lightSize * 0.3
                    },
                    {
                        angle: (Math.PI * 4) / 3 - Math.PI / 2, // 8点方向（240度，调整后）
                        length: lightSize * 0.3
                    }
                ]
            }))
        );
        
        this.init();
    }
    
    drawText(text) {
        // 设置临时画布大小
        this.textCanvas.width = this.cols * 2;
        this.textCanvas.height = this.rows * 2;
        
        // 清空画布并填充白色背景
        this.textCtx.fillStyle = 'white';
        this.textCtx.fillRect(0, 0, this.textCanvas.width, this.textCanvas.height);
        
        // 配置文字样式 - 使用等宽字体
        this.textCtx.fillStyle = 'black';
        this.textCtx.textAlign = 'center';
        this.textCtx.textBaseline = 'middle';
        
        // 计算合适的字体大小
        const maxWidth = this.textCanvas.width * 0.9;  // 使用90%的宽度
        let fontSize = this.textCanvas.height * 0.6;   // 初始字体大小调小一些
        
        do {
            // 使用等宽字体，如 'Courier New' 或 'monospace'
            this.textCtx.font = `bold ${fontSize}px "Courier New", monospace`;
            fontSize -= 1;
        } while (this.textCtx.measureText(text).width > maxWidth && fontSize > 0);
        
        // 绘制文字 - 可以稍微调整位置
        this.textCtx.fillText(
            text,
            this.textCanvas.width / 2,
            this.textCanvas.height / 2
        );
        
        // 获取像素数据
        const imageData = this.textCtx.getImageData(
            0, 0,
            this.textCanvas.width,
            this.textCanvas.height
        );
        
        // 初始化目标角度数组
        this.targetAngles = Array(this.rows).fill().map(() => 
            Array(this.cols).fill().map(() => ({
                needles: [
                    { angle: 0 },
                    { angle: Math.PI / 2 }
                ]
            }))
        );

        // 分析每个表针位置对应的像素区域
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                // 计算对应的像素区域
                const startX = Math.floor(col * 2);
                const startY = Math.floor(row * 2);
                const endX = Math.floor((col + 1) * 2);
                const endY = Math.floor((row + 1) * 2);
                
                // 分析该区域的像素分布
                let darkPixels = 0;
                let verticalEdge = 0;
                let horizontalEdge = 0;
                
                // 扩大检测范围
                const margin = 1;
                for (let y = Math.max(0, startY - margin); y < Math.min(this.textCanvas.height, endY + margin); y++) {
                    for (let x = Math.max(0, startX - margin); x < Math.min(this.textCanvas.width, endX + margin); x++) {
                        const idx = (y * this.textCanvas.width + x) * 4;
                        const brightness = imageData.data[idx];
                        
                        if (brightness < 128) {
                            darkPixels++;
                            
                            // 检测边缘 - 使用更大的范围
                            if (x > margin && x < this.textCanvas.width - margin) {
                                const leftBrightness = imageData.data[(y * this.textCanvas.width + (x - 1)) * 4];
                                const rightBrightness = imageData.data[(y * this.textCanvas.width + (x + 1)) * 4];
                                horizontalEdge += Math.abs(leftBrightness - rightBrightness);
                            }
                            
                            if (y > margin && y < this.textCanvas.height - margin) {
                                const topBrightness = imageData.data[((y - 1) * this.textCanvas.width + x) * 4];
                                const bottomBrightness = imageData.data[((y + 1) * this.textCanvas.width + x) * 4];
                                verticalEdge += Math.abs(topBrightness - bottomBrightness);
                            }
                        }
                    }
                }
                
                // 根据分析结果设置表针角度
                if (darkPixels > 1) {  // 调整阈值
                    let mainAngle;
                    
                    // 调整判断条件
                    if (verticalEdge > horizontalEdge * 1.5) {
                        mainAngle = Math.PI / 2;  // 垂直
                    } else if (horizontalEdge > verticalEdge * 1.5) {
                        mainAngle = 0;  // 水平
                    } else {
                        // 根据边缘强度的比例来确定角度
                        mainAngle = Math.atan2(verticalEdge, horizontalEdge);
                    }
                    
                    this.targetAngles[row][col].needles[0].angle = mainAngle;
                    this.targetAngles[row][col].needles[1].angle = mainAngle + Math.PI / 2;
                } else {
                    // 空白区域
                    this.targetAngles[row][col].needles[0].angle = 0;
                    this.targetAngles[row][col].needles[1].angle = Math.PI / 2;
                }
            }
        }
    }
    
    animate(progress) {
        const easeProgress = this.easeInOutQuad(progress);
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                for (let i = 0; i < 2; i++) {
                    const current = this.lights[row][col].needles[i].angle;
                    const target = this.targetAngles[row][col].needles[i].angle;
                    
                    // 计算最短角度路径
                    let diff = target - current;
                    if (diff > Math.PI) diff -= Math.PI * 2;
                    if (diff < -Math.PI) diff += Math.PI * 2;
                    
                    // 应用缓动
                    this.lights[row][col].needles[i].angle = 
                        current + diff * easeProgress;
                }
            }
        }
        
        this.draw();
    }
    
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    
    resetNeedles() {
        // 重置所有表针到8点方向
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.lights[row][col].needles[0].angle = this.RESET_ANGLE;
                this.lights[row][col].needles[1].angle = this.RESET_ANGLE;  // 两个指针都指向8点
            }
        }
        this.draw();
    }
    
    getDebugInfo() {
        let info = '矩阵数据:\n\n';
        
        // 添加列标题
        info += '   ';
        for (let col = 0; col < this.cols; col++) {
            info += `${col.toString().padStart(2, ' ')} `;
        }
        info += '\n';
        
        // 添加分隔线
        info += '   ' + '-'.repeat(this.cols * 3) + '\n';
        
        // 添加矩阵数据
        for (let row = 0; row < this.rows; row++) {
            info += `${row.toString().padStart(2, ' ')}|`;
            for (let col = 0; col < this.cols; col++) {
                const needles = this.lights[row][col].needles;
                // 将角度转换为0-7的方向值（类似时钟方向）
                const direction1 = Math.round(((needles[0].angle + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4));
                const direction2 = Math.round(((needles[1].angle + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4));
                info += `${direction1}${direction2} `;
            }
            info += '\n';
        }
        
        return info;
    }
} 