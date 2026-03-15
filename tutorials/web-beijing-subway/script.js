// 地铁网络数据
// 数据现在从 data.js 加载

// 状态变量
let startStationId = null; // 起点站ID
let endStationId = null;   // 终点站ID
let graph = {};            // 图结构，用于路径查找

// 缩放和平移状态
let viewBox = { x: 0, y: 0, w: 0, h: 0 };
let isPanning = false;
let startPoint = { x: 0, y: 0 };
let endPoint = { x: 0, y: 0 };
let scale = 1;

document.addEventListener('DOMContentLoaded', () => {
    scaleCoordinates(); // 放大坐标以增加间距
    buildGraph();       // 构建图结构
    renderMap();        // 渲染地图
    addEventListeners(); // 添加事件监听
    setupZoomPan();     // 设置缩放和平移
});

// 放大坐标函数
function scaleCoordinates() {
    const SCALE_FACTOR = 3.0; // 增加此值可以使站点分布更稀疏
    for (const id in stations) {
        stations[id].x *= SCALE_FACTOR;
        stations[id].y *= SCALE_FACTOR;
    }
}

// 构建图结构函数
function buildGraph() {
    // 初始化邻接表
    for (const id in stations) {
        graph[id] = [];
    }

    // 基于线路添加边
    for (const lineId in lines) {
        const lineStations = lines[lineId].stations;
        for (let i = 0; i < lineStations.length - 1; i++) {
            const u = lineStations[i];
            const v = lineStations[i + 1];
            
            // 计算欧几里得距离
            const dist = Math.sqrt(
                Math.pow(stations[u].x - stations[v].x, 2) + 
                Math.pow(stations[u].y - stations[v].y, 2)
            );

            // 添加双向边
            graph[u].push({ node: v, weight: dist, line: lineId });
            graph[v].push({ node: u, weight: dist, line: lineId });
        }
    }
}

// 添加事件监听器
function addEventListeners() {
    document.getElementById('btn-run').addEventListener('click', findPath);
    document.getElementById('btn-reset').addEventListener('click', resetSelection);
}

// 处理站点点击事件
function handleStationClick(id) {
    // 如果正在平移地图，则不触发点击
    if (isPanning) return;

    const stationGroups = document.querySelectorAll('.station-circle');
    
    if (!startStationId) {
        startStationId = id;
        updateStationVisuals(id, 'start');
        document.getElementById('start-station-display').textContent = stations[id].name;
    } else if (!endStationId && id !== startStationId) {
        endStationId = id;
        updateStationVisuals(id, 'end');
        document.getElementById('end-station-display').textContent = stations[id].name;
    } else if (id === startStationId) {
        startStationId = null;
        updateStationVisuals(id, 'reset');
        document.getElementById('start-station-display').textContent = '未选择';
        clearPath();
    } else if (id === endStationId) {
        endStationId = null;
        updateStationVisuals(id, 'reset');
        document.getElementById('end-station-display').textContent = '未选择';
        clearPath();
    }
}

// 更新站点视觉效果
function updateStationVisuals(id, type) {
    const circle = document.querySelector(`.station-group[data-id='${id}'] circle`);
    if (circle) {
        circle.classList.remove('selected-start', 'selected-end');
        if (type === 'start') circle.classList.add('selected-start');
        if (type === 'end') circle.classList.add('selected-end');
    }
}

// 重置选择
function resetSelection() {
    startStationId = null;
    endStationId = null;
    document.getElementById('start-station-display').textContent = '未选择';
    document.getElementById('end-station-display').textContent = '未选择';
    
    document.querySelectorAll('.station-circle').forEach(el => {
        el.classList.remove('selected-start', 'selected-end');
    });
    
    clearPath();
}

// 清除路径显示
function clearPath() {
    document.getElementById('connections-group').innerHTML = '';
    document.querySelectorAll('.line-path').forEach(el => el.classList.remove('dimmed'));
    document.querySelectorAll('.station-group').forEach(el => el.classList.remove('dimmed'));
}

// 查找路径 (Dijkstra算法)
function findPath() {
    if (!startStationId || !endStationId) {
        alert('请先选择起点和终点');
        return;
    }

    clearPath();

    const distances = {};
    const previous = {};
    const pq = new PriorityQueue();

    for (const id in stations) {
        distances[id] = Infinity;
        previous[id] = null;
    }

    distances[startStationId] = 0;
    pq.enqueue(startStationId, 0);

    while (!pq.isEmpty()) {
        const { element: currentId } = pq.dequeue();

        if (currentId === endStationId) break;

        if (currentId || distances[currentId] !== Infinity) {
            for (const neighbor of graph[currentId]) {
                const alt = distances[currentId] + neighbor.weight;
                if (alt < distances[neighbor.node]) {
                    distances[neighbor.node] = alt;
                    previous[neighbor.node] = currentId;
                    pq.enqueue(neighbor.node, alt);
                }
            }
        }
    }

    // 重建路径
    const path = [];
    let u = endStationId;
    if (previous[u] || u === startStationId) {
        while (u) {
            path.unshift(u);
            u = previous[u];
        }
    }

    if (path.length > 0) {
        animatePath(path);
        displayRouteDetails(path);
        focusOnPath(path); // 自动聚焦到路径
    } else {
        alert('未找到路径');
    }
}

// 路径动画
function animatePath(pathIds) {
    const connectionsGroup = document.getElementById('connections-group');
    
    // 调暗其他线路、站点和标签
    document.querySelectorAll('.line-path').forEach(el => el.classList.add('dimmed'));
    document.querySelectorAll('.station-group').forEach(el => el.classList.add('dimmed'));

    // 绘制路径段
    for (let i = 0; i < pathIds.length - 1; i++) {
        const uId = pathIds[i];
        const vId = pathIds[i+1];
        const u = stations[uId];
        const v = stations[vId];
        
        // 恢复路径上站点的亮度
        const uGroup = document.querySelector(`.station-group[data-id='${uId}']`);
        const vGroup = document.querySelector(`.station-group[data-id='${vId}']`);
        if (uGroup) uGroup.classList.remove('dimmed');
        if (vGroup) vGroup.classList.remove('dimmed');

        // 查找连接这两点的线路颜色
        let lineColor = '#f1c40f'; // 默认备用色
        const edges = graph[uId];
        if (edges) {
            const edge = edges.find(e => e.node === vId);
            if (edge && lines[edge.line]) {
                lineColor = lines[edge.line].color;
            }
        }

        // 绘制高亮线段
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', u.x);
        line.setAttribute('y1', u.y);
        line.setAttribute('x2', v.x);
        line.setAttribute('y2', v.y);
        line.setAttribute('stroke', lineColor); 
        line.classList.add('path-highlight');
        
        // 计算中点和角度以绘制箭头
        const midX = (u.x + v.x) / 2;
        const midY = (u.y + v.y) / 2;
        const angle = Math.atan2(v.y - u.y, v.x - u.x) * 180 / Math.PI;

        // 创建箭头标记
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        arrow.setAttribute('d', 'M -6 -6 L 6 0 L -6 6 z'); // 三角形箭头
        arrow.setAttribute('fill', '#fff'); // 白色箭头
        
        // 注意：这里我们将 transform 分为两部分：
        // 1. 静态的位置和旋转 (通过 transform 属性设置)
        // 2. 动态的移动动画 (通过 CSS 动画实现，但 CSS transform 会覆盖 SVG transform 属性)
        // 为了解决冲突，我们将箭头包裹在一个 group 中，group 负责定位和旋转，箭头本身负责动画
        
        const arrowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        arrowGroup.setAttribute('transform', `translate(${midX}, ${midY}) rotate(${angle})`);
        
        arrow.classList.add('path-arrow');
        // 移除内联样式中的 animation，改用 CSS 类控制，但保留延迟
        arrow.style.animationDelay = `${i * 0.05}s`; 
        
        arrowGroup.appendChild(arrow);
        
        // 每个段延迟动画
        line.style.animationDelay = `${i * 0.05}s`;

        connectionsGroup.appendChild(line);
        connectionsGroup.appendChild(arrowGroup);
    }
}

// 聚焦到路径
function focusOnPath(pathIds) {
    if (!pathIds || pathIds.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    pathIds.forEach(id => {
        const s = stations[id];
        if (s.x < minX) minX = s.x;
        if (s.y < minY) minY = s.y;
        if (s.x > maxX) maxX = s.x;
        if (s.y > maxY) maxY = s.y;
    });

    // 添加内边距
    const padding = 200; // 留出足够空间
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    
    // 获取容器尺寸以保持比例
    const svg = document.getElementById('subway-map');
    const rect = svg.getBoundingClientRect();
    // 防止除以0错误
    const ratio = (rect.height > 0) ? (rect.width / rect.height) : (viewBox.w / viewBox.h);

    let newW, newH, newX, newY;

    // 目标视口宽高（包含内边距）
    const targetW = contentW + padding * 2;
    const targetH = contentH + padding * 2;

    if (targetW / targetH > ratio) {
        // 内容更宽，以宽度为基准
        newW = targetW;
        newH = targetW / ratio;
    } else {
        // 内容更高，以高度为基准
        newH = targetH;
        newW = targetH * ratio;
    }

    // 计算中心点
    const centerX = minX + contentW / 2;
    const centerY = minY + contentH / 2;

    // 计算新的左上角
    newX = centerX - newW / 2;
    newY = centerY - newH / 2;

    // 更新全局 viewBox
    viewBox = { x: newX, y: newY, w: newW, h: newH };
    
    // 应用更新
    svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
}

// 优先队列辅助类
class PriorityQueue {
    constructor() {
        this.items = [];
    }
    
    enqueue(element, priority) {
        const queueElement = { element, priority };
        let added = false;
        for (let i = 0; i < this.items.length; i++) {
            if (queueElement.priority < this.items[i].priority) {
                this.items.splice(i, 0, queueElement);
                added = true;
                break;
            }
        }
        if (!added) this.items.push(queueElement);
    }
    
    dequeue() {
        return this.items.shift();
    }
    
    isEmpty() {
        return this.items.length === 0;
    }
}

// 显示路线详情
function displayRouteDetails(path) {
    const routeSummary = document.getElementById('route-summary');
    const routeSteps = document.getElementById('route-steps');
    
    // 清除之前的结果
    routeSummary.innerHTML = '';
    routeSteps.innerHTML = '';

    if (!path || path.length === 0) return;

    // 计算路段
    const segments = [];
    let currentSegment = null;

    for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i+1];
        
        // 查找连接线路
        const edges = graph[u];
        const possibleEdges = edges.filter(e => e.node === v);
        
        let lineId = null;
        
        // 优先继续使用同一条线路
        if (currentSegment && possibleEdges.some(e => e.line === currentSegment.lineId)) {
            lineId = currentSegment.lineId;
        } else {
            // 如果有多条线路连接这两个站点（且我们没有继续），选择第一条
            lineId = possibleEdges[0].line;
        }

        if (currentSegment && currentSegment.lineId === lineId) {
            currentSegment.stations.push(v);
            currentSegment.endStation = v;
        } else {
            if (currentSegment) {
                segments.push(currentSegment);
            }
            currentSegment = {
                lineId: lineId,
                startStation: u,
                endStation: v,
                stations: [u, v]
            };
        }
    }
    if (currentSegment) {
        segments.push(currentSegment);
    }

    // 渲染摘要
    const totalStations = path.length - 1;
    const transferCount = segments.length - 1;
    
    routeSummary.innerHTML = `
        <div class="summary-card">
            <div class="summary-item">
                <span>总站数</span>
                <span class="total-stations">${totalStations} 站</span>
            </div>
            <div class="summary-item">
                <span>换乘</span>
                <span>${transferCount} 次</span>
            </div>
        </div>
    `;

    // 渲染步骤
    segments.forEach((segment, index) => {
        const line = lines[segment.lineId];
        const startName = stations[segment.startStation].name;
        const endName = stations[segment.endStation].name;
        const count = segment.stations.length - 1;
        
        // 确定方向
        const lineStations = line.stations;
        const fullLineIdxStart = lineStations.indexOf(segment.startStation);
        const fullLineIdxEnd = lineStations.indexOf(segment.endStation);
        
        let directionName = "未知方向";
        if (fullLineIdxStart !== -1 && fullLineIdxEnd !== -1) {
            if (fullLineIdxEnd > fullLineIdxStart) {
                directionName = stations[lineStations[lineStations.length - 1]].name;
            } else {
                directionName = stations[lineStations[0]].name;
            }
        }

        const stepDiv = document.createElement('div');
        stepDiv.className = 'step';
        
        let html = '';
        
        // 换乘提示
        if (index > 0) {
             html += `<div class="transfer-label" style="font-size:12px; color:#e67e22; margin-bottom:5px; font-weight:bold;">换乘</div>`;
        }

        html += `
            <div class="step-header">
                <span class="line-badge" style="background-color: ${line.color}">${line.name}</span>
                <span class="station-name">${startName}</span>
            </div>
            <div class="step-content">
                <div class="direction" style="color:#7f8c8d; font-size:12px;">开往 ${directionName}</div>
                <div class="station-count">${count} 站</div>
            </div>
        `;
        
        stepDiv.innerHTML = html;
        routeSteps.appendChild(stepDiv);
        
        // 如果是最后一段，添加终点站作为单独的“步骤”
        if (index === segments.length - 1) {
            const endDiv = document.createElement('div');
            endDiv.className = 'step';
            endDiv.innerHTML = `
                <div class="step-header">
                    <span class="station-name" style="margin-left: 0">${endName}</span>
                </div>
                <div class="step-content" style="background:none; padding:0;">
                    <span style="font-size:12px; color:#27ae60; font-weight:bold;">终点</span>
                </div>
            `;
            routeSteps.appendChild(endDiv);
        }
    });
}

// 渲染地图
function renderMap() {
    const svg = document.getElementById('subway-map');
    const linesGroup = document.getElementById('lines-group');
    const stationsGroup = document.getElementById('stations-group');

    // 计算边界框
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const id in stations) {
        const s = stations[id];
        if (s.x < minX) minX = s.x;
        if (s.y < minY) minY = s.y;
        if (s.x > maxX) maxX = s.x;
        if (s.y > maxY) maxY = s.y;
    }

    // 添加内边距
    const padding = 100; // 增加内边距
    const width = maxX - minX + 2 * padding;
    const height = maxY - minY + 2 * padding;
    const viewBoxX = minX - padding;
    const viewBoxY = minY - padding;

    // 初始化 ViewBox 状态
    viewBox = { x: viewBoxX, y: viewBoxY, w: width, h: height };
    
    svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);

    // 绘制线路
    for (const lineId in lines) {
        const line = lines[lineId];
        const points = line.stations.map(id => `${stations[id].x},${stations[id].y}`).join(' ');
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        path.setAttribute('points', points);
        path.setAttribute('stroke', line.color);
        path.classList.add('line-path');
        path.id = `line-${lineId}`;
        linesGroup.appendChild(path);

        // 添加线路标签
        if (line.stations.length > 1) {
            const midIdx = Math.floor(line.stations.length / 2);
            const s1 = stations[line.stations[midIdx]];
            const s2 = stations[line.stations[midIdx + 1]];
            
            // 计算中点
            let midX = (s1.x + s2.x) / 2;
            let midY = (s1.y + s2.y) / 2;

            if (line.labelOffset) {
                // 使用手动指定的偏移量
                midX += line.labelOffset.x;
                midY += line.labelOffset.y;
            } else {
                // 自动计算偏移量以避开线路
                const dx = s2.x - s1.x;
                const dy = s2.y - s1.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                
                // 计算法向量 (垂直于线路方向)
                let nx = -dy;
                let ny = dx;
                
                if (len > 0) {
                    nx /= len;
                    ny /= len;
                }

                // 偏移距离 (像素)，将标签移出线路
                const offset = 45;
                midX += nx * offset;
                midY += ny * offset;
            }

            const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            labelGroup.classList.add('line-label-group');
            labelGroup.setAttribute('transform', `translate(${midX}, ${midY})`);

            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.classList.add('line-label-rect');
            rect.setAttribute('fill', line.color);
            
            // 动态计算宽度：基础宽度 80，每多一个字增加 20
            const textLength = line.name.length;
            const rectWidth = Math.max(80, textLength * 24 + 20); 
            
            rect.setAttribute('width', rectWidth); 
            rect.setAttribute('height', 40); 
            rect.setAttribute('x', -rectWidth / 2); // 居中
            rect.setAttribute('y', -20);
            rect.setAttribute('rx', 5);

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.classList.add('line-label-text');
            text.textContent = line.name;
            text.setAttribute('dy', '0.35em'); // 垂直居中修正
            text.setAttribute('text-anchor', 'middle'); // 水平居中
            text.setAttribute('font-size', '22px'); // 明确字体大小
            
            labelGroup.appendChild(rect);
            labelGroup.appendChild(text);
            linesGroup.appendChild(labelGroup);
        }
    }

    // 绘制站点
    for (const id in stations) {
        const station = stations[id];
        const isTransfer = station.lines.length > 1;
        
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('transform', `translate(${station.x}, ${station.y})`);
        g.classList.add('station-group');
        g.dataset.id = id;
        g.onclick = () => handleStationClick(id);

        if (isTransfer) {
            // 绘制换乘图标 (双箭头样式)
            const iconGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            iconGroup.setAttribute('transform', 'translate(-18, -18) scale(1.8)'); // 放大
            
            // 背景圆圈
            const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            bg.setAttribute('r', 14);
            bg.setAttribute('cx', 12);
            bg.setAttribute('cy', 12);
            bg.setAttribute('fill', 'white');
            bg.setAttribute('stroke', '#333');
            bg.setAttribute('stroke-width', 2);
            bg.classList.add('station-circle');
            bg.classList.add('transfer');
            
            // 箭头路径
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M 12 4 V 1 L 8 5 l 4 4 V 6 c 3.31 0 6 2.69 6 6 c 0 1.01 -0.25 1.97 -0.7 2.8 l 1.46 1.46 C 19.54 15.03 20 13.57 20 12 c 0 -4.42 -3.58 -8 -8 -8 Z m 0 14 c -3.31 0 -6 -2.69 -6 -6 c 0 -1.01 0.25 -1.97 0.7 -2.8 L 5.24 7.74 C 4.46 8.97 4 10.43 4 12 c 0 4.42 3.58 8 8 8 v 3 l 4 -4 l -4 -4 v 3 Z');
            path.classList.add('transfer-icon');
            
            iconGroup.appendChild(bg);
            iconGroup.appendChild(path);
            g.appendChild(iconGroup);
        } else {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', 18); // 增加半径
            circle.classList.add('station-circle');
            g.appendChild(circle);
        }
        
        // 固定标签位置 (移除智能算法)
        const labelX = 0;
        const labelY = -45; // 固定在站点上方

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', labelX);
        text.setAttribute('y', labelY);
        text.setAttribute('dy', '0.35em'); // 使用 dy 替代 dominant-baseline 以获得更好的垂直居中兼容性
        text.setAttribute('text-anchor', 'middle');
        text.textContent = station.name;
        text.classList.add('station-label');

        g.appendChild(text);
        stationsGroup.appendChild(g);
    }
}

// 设置缩放和平移
function setupZoomPan() {
    const svg = document.getElementById('subway-map');
    let isDown = false;

    // 鼠标按下开始拖拽
    svg.onmousedown = (e) => {
        e.preventDefault(); // 阻止默认拖拽行为 (修复SVG图片拖出bug)
        isDown = true;
        isPanning = false;
        startPoint = { x: e.clientX, y: e.clientY };
    };

    // 鼠标移动处理平移
    svg.onmousemove = (e) => {
        if (!isDown) return;
        const dx = e.clientX - startPoint.x;
        const dy = e.clientY - startPoint.y;
        
        // 移动超过5px视为拖拽
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) isPanning = true;

        if (isPanning) {
            const { width, height } = svg.getBoundingClientRect();
            // 更新 viewBox
            viewBox.x -= dx * (viewBox.w / width);
            viewBox.y -= dy * (viewBox.h / height);
            svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
            startPoint = { x: e.clientX, y: e.clientY };
        }
    };

    // 鼠标松开或离开停止拖拽
    svg.onmouseup = svg.onmouseleave = () => isDown = false;

    // 触摸事件状态
    let initialPinchDistance = null;

    // 触摸开始
    svg.ontouchstart = (e) => {
        if (e.touches.length === 1) {
            // 单指：开始平移
            isDown = true;
            isPanning = false;
            startPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2) {
            // 双指：开始缩放
            e.preventDefault();
            isDown = false; // 双指时不进行平移逻辑
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            initialPinchDistance = Math.hypot(dx, dy);
        }
    };

    // 触摸移动
    svg.ontouchmove = (e) => {
        // 阻止默认滚动行为
        if (e.cancelable) e.preventDefault();

        if (e.touches.length === 1 && isDown) {
            // 单指平移逻辑
            const dx = e.touches[0].clientX - startPoint.x;
            const dy = e.touches[0].clientY - startPoint.y;

            // 移动超过5px视为拖拽
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) isPanning = true;

            if (isPanning) {
                const { width, height } = svg.getBoundingClientRect();
                viewBox.x -= dx * (viewBox.w / width);
                viewBox.y -= dy * (viewBox.h / height);
                svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
                startPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        } else if (e.touches.length === 2 && initialPinchDistance) {
            // 双指缩放逻辑
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const currentDistance = Math.hypot(dx, dy);

            if (currentDistance > 0) {
                // 计算缩放比例 (旧距离/新距离)
                // 距离变大 -> 因子 < 1 -> viewBox变小 -> 放大
                const zoomFactor = initialPinchDistance / currentDistance;
                
                const { width, height } = svg.getBoundingClientRect();
                
                let newW = viewBox.w * zoomFactor;
                let newH = viewBox.h * zoomFactor;
                
                // 限制缩放范围
                const MIN_WIDTH = 400;
                const MAX_WIDTH = 10000;
                
                if (newW >= MIN_WIDTH && newW <= MAX_WIDTH) {
                    // 计算双指中心点
                    const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                    const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                    
                    // 围绕双指中心缩放
                    const rect = svg.getBoundingClientRect();
                    const relativeX = (cx - rect.left) / width;
                    const relativeY = (cy - rect.top) / height;
                    
                    viewBox.x += (viewBox.w - newW) * relativeX;
                    viewBox.y += (viewBox.h - newH) * relativeY;
                    
                    viewBox.w = newW;
                    viewBox.h = newH;
                    
                    svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
                    
                    initialPinchDistance = currentDistance; // 更新距离，实现连续缩放
                }
            }
        }
    };

    svg.ontouchend = (e) => {
        if (e.touches.length < 2) {
            initialPinchDistance = null;
        }
        if (e.touches.length === 0) {
            isDown = false;
        }
    };

    // 滚轮缩放
    svg.onwheel = (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9; // 滚轮向下缩小，向上放大
        const { width, height } = svg.getBoundingClientRect();
        
        // 限制缩放范围
        const MIN_WIDTH = 400;
        const MAX_WIDTH = 10000;
        
        let newW = viewBox.w * zoomFactor;
        let newH = viewBox.h * zoomFactor;

        if (newW < MIN_WIDTH || newW > MAX_WIDTH) return;

        // 计算鼠标在SVG坐标系中的位置
        const mx = (e.offsetX / width) * viewBox.w + viewBox.x;
        const my = (e.offsetY / height) * viewBox.h + viewBox.y;

        // 更新宽高
        viewBox.w = newW;
        viewBox.h = newH;
        
        // 调整 viewBox 原点，保持鼠标位置不变
        viewBox.x = mx - (e.offsetX / width) * viewBox.w;
        viewBox.y = my - (e.offsetY / height) * viewBox.h;

        svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
    };
}
