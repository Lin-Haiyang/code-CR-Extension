import React, { useEffect, useRef, useState } from 'react';

const ParticleBackground = () => {
    const canvasRef = useRef(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];
        let time = 0;

        // Interaction State
        let mouse = { x: null, y: null, isInside: false };
        
        // Log防抖：记录上次log输出的时间
        let lastLogTime = 0;
        const logDebounceInterval = 100; // 100ms内只输出一次log
        
        // 5组颜色配色方案，每次访问随机选择一组
        const colorPalettes = [
            // 蓝色系 - 保留之前的配色
            [
                { r: 100, g: 150, b: 255 },
                { r: 50, g: 100, b: 240 },
                { r: 150, g: 200, b: 255 },
                { r: 80, g: 220, b: 255 },
            ],
            // 绿色系 - 基于 #2DE79E
            [
                { r: 45, g: 231, b: 158 },     // #2DE79E 原始色
                { r: 80, g: 255, b: 200 },     // 更亮版本
                { r: 20, g: 180, b: 120 },     // 更暗版本
                { r: 100, g: 255, b: 220 },    // 最亮版本
            ],
            // 紫色系 - 基于 #5466EA
            [
                { r: 84, g: 102, b: 234 },     // #5466EA 原始色
                { r: 120, g: 140, b: 255 },    // 更亮版本
                { r: 50, g: 65, b: 200 },      // 更暗版本
                { r: 150, g: 170, b: 255 },    // 最亮版本
            ],
            // AI风格1 - 基于 #7956B2
            [
                { r: 121, g: 86, b: 178 },     // #7956B2 原始色
                { r: 150, g: 110, b: 220 },    // 更亮版本
                { r: 90, g: 65, b: 140 },      // 更暗版本
                { r: 180, g: 140, b: 240 },    // 最亮版本
            ],
            // AI风格2 - 前四组主色的组合色
            [
                { r: 73, g: 191, b: 207 },     // 蓝色+绿色混合
                { r: 65, g: 167, b: 196 },     // 绿色+紫色混合
                { r: 103, g: 94, b: 206 },      // 紫色+紫色2混合
                { r: 88, g: 142, b: 206 },     // 四色平均混合
            ],
        ];
        
        // 随机选择一组颜色组
        const selectedColorPalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
        
        // 全局随机中心点（所有粒子共享）
        let randomCenter = {
            x: 0,
            y: 0
        };
        // 目标中心点（用于平滑过渡）
        let targetCenter = {
            x: 0,
            y: 0
        };
        // 初始中心位置（保护期内使用）
        let initialCenter = {
            x: 0,
            y: 0
        };
        let centerChangeTimer = 0;
        const centerChangeInterval = 2.0; // 固定5秒间隔
        const centerTransitionSpeed = 0.004; // 中心点过渡速度（0-1之间，越大过渡越快）
        // 初始化保护时间（2秒）
        let initProtectionTimer = 0;
        const initProtectionInterval = 1.2; // 假设60fps，2秒 = 120帧，120 * 0.01 = 1.2

        // 生成在画布可视区域内的随机中心点
        const generateRandomCenter = () => {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            // 增加变化幅度：使用更大的范围
            const margin = 100; // 减少边距，增加可用范围
            // 水平方向的最大距离比例
            const maxDistanceX = Math.min(centerX - margin, canvas.width * 0.45);
            // 垂直方向的最大距离：再增加一倍，充分利用垂直空间
            // 使用 centerY - margin 作为最大距离，这样可以达到接近画布边缘的位置
            const maxDistanceY = centerY - margin;
            
            // 分别计算水平和垂直方向的随机距离
            const angle = Math.random() * Math.PI * 2;
            const distanceX = (Math.random() * maxDistanceX * 0.9) * Math.cos(angle);
            // 垂直方向使用更大的范围（接近100%的最大距离）
            const distanceY = (Math.random() * maxDistanceY * 0.95) * Math.sin(angle);
            
            let x = centerX + distanceX;
            let y = centerY + distanceY;
            
            // 确保在画布范围内（添加安全边距）
            const safeMargin = 100;
            x = Math.max(safeMargin, Math.min(canvas.width - safeMargin, x));
            y = Math.max(safeMargin, Math.min(canvas.height - safeMargin, y));
            
            return { x, y };
        };

        // Resize 防抖定时器
        let resizeTimer = null;
        const resizeDebounceDelay = 300; // resize 结束后 300ms 再显示粒子

        const handleResize = () => {
            // 立即隐藏粒子
            setIsVisible(false);
            
            // 清除之前的定时器
            if (resizeTimer) {
                clearTimeout(resizeTimer);
            }
            
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // 初始化中心位置（使用画布中心）
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            initialCenter.x = centerX;
            initialCenter.y = centerY;
            randomCenter.x = centerX;
            randomCenter.y = centerY;
            targetCenter.x = centerX;
            targetCenter.y = centerY;
            // 重置保护时间
            initProtectionTimer = 0;
            initParticles();
            
            // 设置防抖定时器，resize 结束后显示粒子
            resizeTimer = setTimeout(() => {
                setIsVisible(true);
                resizeTimer = null;
            }, resizeDebounceDelay);
        };

        const handleMouseMove = (event) => {
            mouse.x = event.clientX;
            mouse.y = event.clientY;
            mouse.isInside = true;
        };

        const handleMouseLeave = (event) => {
            // 检查鼠标是否真的离开了窗口
            if (!event.relatedTarget || 
                (event.clientX <= 0 || event.clientX >= window.innerWidth ||
                 event.clientY <= 0 || event.clientY >= window.innerHeight)) {
                mouse.isInside = false;
                mouse.x = null;
                mouse.y = null;
            }
        };


        class Particle {
            constructor(index = 0, total = 300) {
                this.index = index;
                this.total = total;
                this.init();
            }

            init() {
                // 初始位置：以画布中心为圆心的圆形分布，使用均匀分布
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                
                // 使用黄金角度螺旋分布，让粒子更均匀分散
                const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // 黄金角度
                this.circleAngle = (this.index * goldenAngle) % (Math.PI * 2);
                
                // 使用均匀的半径分布，让粒子形成多层圆形
                const radiusRange = Math.min(canvas.width, canvas.height) * 0.3;
                const radiusRatio = Math.sqrt(this.index / this.total); // 平方根分布，让内圈更密集
                this.circleRadius = radiusRatio * radiusRange;
                
                // 添加一些随机偏移，让分布更自然
                const radiusOffset = (Math.random() - 0.5) * radiusRange * 0.1;
                this.circleRadius += radiusOffset;
                
                this.x = centerX + Math.cos(this.circleAngle) * this.circleRadius;
                this.y = centerY + Math.sin(this.circleAngle) * this.circleRadius;
                
                // 初始速度：围绕中心点的切向速度，更自然的圆形运动
                const tangentAngle = this.circleAngle + Math.PI / 2; // 垂直于半径的方向
                // 原有代码（备份）
                // const baseSpeed = 0.5 + Math.random() * 1.5;
                // 调整后：降低基础速度，范围从 0.5-2.0 调整为 0.3-1.1
                const baseSpeed = 0.3 + Math.random() * 0.8;
                this.vx = Math.cos(tangentAngle) * baseSpeed;
                this.vy = Math.sin(tangentAngle) * baseSpeed;

                this.size = Math.random() * 2 + 1;

                // 从选中的颜色组中随机选择一个颜色
                this.colorRGB = selectedColorPalette[Math.floor(Math.random() * selectedColorPalette.length)];

                // 蠕动范围：增加范围，让动画更灵动
                this.originX = this.x;
                this.originY = this.y;
                this.wanderRadius = Math.random() * 80 + 60; // 60-140 像素的蠕动范围（增加）
                this.wanderAngle = Math.random() * Math.PI * 2;
                // 原有代码（备份）
                this.wanderSpeed = Math.random() * 0.03 + 0.02; // 增加蠕动速度，让动画更灵动
                // 调整后：降低蠕动速度，范围从 0.02-0.05 调整为 0.01-0.025
                // this.wanderSpeed = Math.random() * 0.015 + 0.01;

                this.history = [];
                this.maxHistory = 5;
            }

            // 统一的运动逻辑函数，根据中心点计算粒子运动
            // forceScale: 力度缩放因子，用于控制跟随速度（默认1.0，鼠标跟随时使用更小的值）
            updateAroundCenter(centerX, centerY, forceScale = 1.0) {
                // 计算相对于中心的位置
                const dx = this.x - centerX;
                const dy = this.y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);
                
                // 目标距离：使用粒子的circleRadius，形成统一的圆形分布
                const targetDist = this.circleRadius;
                
                // 保持圆形分布的力（统一的参数），增加力度让分布更稳定
                if (dist < targetDist * 0.7) {
                    // 向外推，保持圆形
                    // 原有代码（备份）
                    // const pushStrength = 0.1; // 增加力度
                    // 调整后：降低推力，从 0.1 调整为 0.06
                    const pushStrength = 0.06 * forceScale;
                    this.vx += Math.cos(angle) * pushStrength;
                    this.vy += Math.sin(angle) * pushStrength;
                } else if (dist > targetDist * 1.3) {
                    // 向内拉，保持圆形
                    // 原有代码（备份）
                    // const pullStrength = 0.08; // 增加力度
                    // 调整后：降低拉力，从 0.08 调整为 0.05
                    const pullStrength = 0.05 * forceScale;
                    this.vx -= Math.cos(angle) * pullStrength;
                    this.vy -= Math.sin(angle) * pullStrength;
                }
                
                // 在圆形范围内自由蠕动（统一的蠕动逻辑）
                this.wanderAngle += this.wanderSpeed;
                // 增加蠕动幅度，让动画更灵动
                const wanderX = Math.cos(this.wanderAngle) * this.wanderRadius * 0.5;
                const wanderY = Math.sin(this.wanderAngle) * this.wanderRadius * 0.5;
                const wanderTargetX = centerX + Math.cos(this.circleAngle) * this.circleRadius + wanderX;
                const wanderTargetY = centerY + Math.sin(this.circleAngle) * this.circleRadius + wanderY;
                
                // 计算到蠕动目标的距离
                const toWanderX = wanderTargetX - this.x;
                const toWanderY = wanderTargetY - this.y;
                const wanderDist = Math.sqrt(toWanderX * toWanderX + toWanderY * toWanderY);
                
                // 如果偏离蠕动范围太远，拉回来
                if (wanderDist > this.wanderRadius) {
                    // 原有代码（备份）
                    // const pullStrength = 0.05; // 稍微增加力度
                    // 调整后：降低拉回力度，从 0.05 调整为 0.03
                    const pullStrength = 0.03 * forceScale;
                    this.vx += (toWanderX / wanderDist) * pullStrength;
                    this.vy += (toWanderY / wanderDist) * pullStrength;
                } else {
                    // 在范围内随机蠕动，增加力度让动画更灵动
                    // 原有代码（备份）
                    // const wanderForce = 0.03;
                    // 调整后：降低蠕动力度，从 0.03 调整为 0.02
                    const wanderForce = 0.02 * forceScale;
                    this.vx += toWanderX * wanderForce;
                    this.vy += toWanderY * wanderForce;
                }
                
                // 添加轻微的随机扰动，增加频率让动画更灵动
                if (Math.random() < 0.02) {
                    // 原有代码（备份）
                    // this.vx += (Math.random() - 0.5) * 0.6;
                    // this.vy += (Math.random() - 0.5) * 0.6;
                    // 调整后：降低随机扰动力度，从 0.6 调整为 0.4
                    this.vx += (Math.random() - 0.5) * 0.4 * forceScale;
                    this.vy += (Math.random() - 0.5) * 0.4 * forceScale;
                }
            }

            update() {
                // 检查是否在初始化保护期内
                const isInProtection = initProtectionTimer < initProtectionInterval;
                
                // 检查鼠标是否在头部区域内（包括上方 12px padding 区域）
                let isMouseInHeader = false;
                if (mouse.isInside && mouse.x !== null && mouse.y !== null) {
                    const headerElement = document.querySelector('.cr-header');
                    if (headerElement) {
                        const headerRect = headerElement.getBoundingClientRect();
                        const headerTopWithPadding = headerRect.top - 12; // 包含上方 12px padding
                        isMouseInHeader = (
                            mouse.x >= headerRect.left &&
                            mouse.x <= headerRect.right &&
                            mouse.y >= headerTopWithPadding &&
                            mouse.y <= headerRect.bottom
                        );
                    }
                }
                
                if (isInProtection) {
                    // 保护期内：强制使用初始中心位置，优先级最高
                    this.updateAroundCenter(initialCenter.x, initialCenter.y);
                } else if (mouse.isInside && mouse.x !== null && !isMouseInHeader) {
                    // 鼠标移入且不在头部区域：以鼠标为中心
                    // 原有代码（备份）
                    // this.updateAroundCenter(mouse.x, mouse.y);
                    // 调整后：降低鼠标跟随速度，使用 0.5 的力度缩放因子（降低50%的跟随速度）
                    this.updateAroundCenter(mouse.x, mouse.y, 0.8);
                } else {
                    // 鼠标移出或在头部区域：以全局随机位置为中心
                    this.updateAroundCenter(randomCenter.x, randomCenter.y, 1.5);
                }

                // Friction，稍微减少摩擦力，让动画更灵动
                // 原有代码（备份）
                // this.vx *= 0.94;
                // this.vy *= 0.94;
                // 调整后：增加摩擦力，从 0.94 调整为 0.92，让速度衰减更快
                this.vx *= 0.92;
                this.vy *= 0.92;

                // Speed Limit
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                // 原有代码（备份）
                // const limit = 5;
                // 调整后：降低最大速度限制，从 5 调整为 3
                const limit = 3;
                if (speed > limit) {
                    this.vx = (this.vx / speed) * limit;
                    this.vy = (this.vy / speed) * limit;
                }

                this.x += this.vx;
                this.y += this.vy;

                // Update History for Trails
                this.history.push({ x: this.x, y: this.y });
                if (this.history.length > this.maxHistory) this.history.shift();

                // Boundary Wrapping
                let wrapped = false;
                const margin = 50;
                if (this.x < -margin) { 
                    this.x = canvas.width + margin; 
                    wrapped = true; 
                }
                if (this.x > canvas.width + margin) { 
                    this.x = -margin; 
                    wrapped = true; 
                }
                if (this.y < -margin) { 
                    this.y = canvas.height + margin; 
                    wrapped = true; 
                }
                if (this.y > canvas.height + margin) { 
                    this.y = -margin; 
                    wrapped = true; 
                }

                if (wrapped) {
                    this.history = [];
                }
            }

            draw() {
                const alpha = 0.8;
                ctx.fillStyle = `rgba(${this.colorRGB.r}, ${this.colorRGB.g}, ${this.colorRGB.b}, ${alpha})`;

                // Draw Trail
                if (this.history.length > 1) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(${this.colorRGB.r}, ${this.colorRGB.g}, ${this.colorRGB.b}, ${alpha})`;
                    ctx.lineWidth = this.size;
                    ctx.lineCap = 'round';

                    ctx.moveTo(this.history[0].x, this.history[0].y);
                    for (let i = 1; i < this.history.length; i++) {
                        ctx.lineTo(this.history[i].x, this.history[i].y);
                    }
                    ctx.stroke();
                } else {
                    // Fallback dot
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        function initParticles() {
            particles = [];
            const count = 300;
            // 使用均匀分布，让粒子分散更均匀
            for (let i = 0; i < count; i++) {
                particles.push(new Particle(i, count));
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            time += 0.01;
            
            // 更新初始化保护时间
            const isInProtection = initProtectionTimer < initProtectionInterval;
            if (isInProtection) {
                initProtectionTimer += 0.01;
                // 保护期内，强制使用初始中心位置
                randomCenter.x = initialCenter.x;
                randomCenter.y = initialCenter.y;
                targetCenter.x = initialCenter.x;
                targetCenter.y = initialCenter.y;
            } else {
                // 保护期结束后，正常更新中心点
                // 统一更新全局随机中心点（只在鼠标移出时更新）
                if (!mouse.isInside || mouse.x === null) {
                    centerChangeTimer += 0.01;
                    if (centerChangeTimer > centerChangeInterval) {
                        // 生成在画布可视区域内的随机中心点（设置为目标点）
                        const newCenter = generateRandomCenter();
                        targetCenter.x = newCenter.x;
                        targetCenter.y = newCenter.y;
                        centerChangeTimer = 0;
                        
                        // 防抖：只在指定时间间隔内输出一次log
                        const now = Date.now();
                        if (now - lastLogTime > logDebounceInterval) {
                            const centerX = canvas.width / 2;
                            const centerY = canvas.height / 2;
                            const distance = Math.sqrt(
                                Math.pow(targetCenter.x - centerX, 2) + 
                                Math.pow(targetCenter.y - centerY, 2)
                            );
                            console.log("🚀 ~ target distance:", distance, targetCenter.x, targetCenter.y);
                            lastLogTime = now;
                        }
                    }
                    
                    // 平滑过渡：当前中心点向目标中心点移动
                    const dx = targetCenter.x - randomCenter.x;
                    const dy = targetCenter.y - randomCenter.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // 如果距离足够近，直接设置；否则平滑过渡
                    if (distance < 0.1) {
                        randomCenter.x = targetCenter.x;
                        randomCenter.y = targetCenter.y;
                    } else {
                        // 使用线性插值（lerp）实现平滑过渡
                        randomCenter.x += dx * centerTransitionSpeed;
                        randomCenter.y += dy * centerTransitionSpeed;
                    }
                }
            }

            particles.forEach(p => {
                p.update();
                p.draw();
            });

            animationFrameId = requestAnimationFrame(animate);
        }

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseLeave);

        handleResize();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
            // 清理 resize 定时器
            if (resizeTimer) {
                clearTimeout(resizeTimer);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="particle-background"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: -1,
                opacity: isVisible ? 1 : 0,
                transition: isVisible ? 'opacity 0.6s ease' : 'opacity 0.05s ease'
            }}
        />
    );
};

export default ParticleBackground;
