## 前言

这是一个适合前端和 Python 入门者阅读的综合小项目，通过“北京地铁线路图 + 最短路径查询”串起页面结构、样式、交互和数据处理。

想用更简单的方法做出精美的前端界面吗？

Web前端三大件是必须掌握的技术。它们是`HTML`,`CSS`和`Javascript`。其中，HTML承担页面结构的作用，已经介绍过的markdown语法就依托HTML渲染，只用HTML做出精美的页面有些困难，CSS则可以渲染更好的效果和动画，Javascript是Web的编程语言，控制了网页的行为，也有循环语句，条件语句等。

本项目还涉及到Python的数据清理，Dijkstra寻路算法等内用，没有用到任何额外框架，且原理很容易理解。内容稍稍有点多，估计要分上下两期，**上期着重介绍三大件**，后面介绍最短路算法和数据清理。

## 前置环境
Python库，能实时渲染页面的编辑器或IDE会有更好的体验，例如VsCode+Live Server插件等组合。下面会提供gitee上别人分享的北京地铁线路图的相关数据。

相较于前面的项目，稍微有些复杂，我们需要提前计划一下项目结构。

## Demo实现效果

- 点击任意两个站点（起点/终点），自动高亮最短路径。
- 支持 SVG 平移/缩放，换乘站单独样式标识。
- 环线（2号线、10号线）闭合显示，线内站点顺序正确、换乘可达。

![alt text](image-1.png)

## 项目结构

- Subway.html：引入 data.js（清洗后数据）与 script.js（渲染与寻路）
- style.css：地图、站点、路径的样式
- script.js：SVG 绘图、平移缩放、点击交互、Dijkstra 寻路
- process_data.py：读取 GeoJSON，排序站点、合并换乘、输出 data.js
- data.js：最终的 const stations 与 const lines 数据

### 数据结构
我们的地图数据存储在 `data.js` 中，它是一个包含所有站点坐标和线路信息的 JSON 对象。
```javascript
const stations = {
  "S_110100023339034": {
    "name": "苹果园",
    "x": 929.6, // 相对坐标 X
    "y": 912.0, // 相对坐标 Y
    "lines": ["L_1", "L_6"] // 所属线路
  },
  // ... 更多站点
};
```

## 前置知识
如果你想系统的学习Web前端，建议自行检索相关内容，篇幅限制了介绍的详细程度，这里不会介绍的太详细。


**拓扑图数据**
https://gitcode.com/open-source-toolkit/dbb97  


本篇大多代码为Agent协助笔者完成。

### HTML基本介绍
如果你用的是VsCode并且装上了HTML的相关插件后，创建文件,输入!并回车可以一键生成HTML模板。

```html
<!DOCTYPE html> //声明使用HTML5标准
<html lang="en"> //语言声明 中文为 zh-CN
<head> //文档头部不直接显示给用户
    <meta charset="UTF-8"> //字符声明
    <meta name="viewport" content="width=device-width, initial-scale=1.0"> //适配窗口设置
    <title>Document</title> //标签页显示标题，默认为Document
</head>
<body> //主体
</body>
</html> //文档结束
```
可以看见，HTML中，各个标签包含内容，例如`<body>`与`<\body>`代表body的开始与结束。
```html
   <h1>这是一级标题，独占一行,等级为h后数字</h1>
   <p>这是段落，使用<br>或</br>可以换行</p>
   <button>这是按钮，可以点击触发事件</button>
   还有<li>列表</li>，<table>表格</table>等，不详细介绍。
```

通过容器组合元素，会让结构变得更清晰。

```html
<body>    
    <div>
        这是块级元素，相当于容器，可以嵌套
    </div>
    <span>这是内联元素，作为容器只能组合行内元素</span>
</body>
```

标签内可以添加属性。例如：
```html
<div class="controls"> controls </div> //定义类名，可以引用，比较方便
<span id="header"> header </span>   //定义id，id唯一
<p style="color: red; font-size: 16px;">text</p> //自定义CSS样式
```

更多属性请查看HTML标准，上面只介绍下文可能用到的。

### SVG矢量图
为了正确显示地铁的拓扑图，这里介绍`SVG矢量图`，它不同于传统的位图，矢量图不由一个个像素构成，放大矢量图看不到锯齿，没有损失，且SVG的源代码可以容易在编辑器中编辑，由XML格式定义。

此外，海报也经常使用矢量图制作。Adobe Illustractor等软件可以画出矢量图，因此也可以用于网页设计。（笔者还参与绘制了军训的大海报XD,用的就是Illustractor）。

我们来用SVG画一个有边框的蓝色圆形，在这里可以渲染哦。
```html
<svg xmlns="http://www.w3.org/2000/svg" version="1.1">//命名空间和版本，默认不用改
   <circle cx="50" cy="50" r="40" stroke="black" stroke-width="2" fill="blue" />
</svg>
```

<svg xmlns="http://www.w3.org/2000/svg" version="1.1">
   <circle cx="50" cy="50" r="40" stroke="black" stroke-width="2" fill="blue" />
</svg>

### 外联CSS
观察以下代码，CSS的语法简单来说便是`选择器`+`样式表`。选择器可以是全部的某个标签，例如`body`,或者类名例如`.controls`。后面的样式表更是多样，读者可以直接读懂他们的作用或者上网检索。

创建一个新的后缀为.css的文件。

```css
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #f0f2f5;
    margin: 0;
    padding: 20px;
}

.controls {
    margin-bottom: 20px;
    background: white;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    display: flex;
    gap: 20px;
    align-items: center;
    flex-wrap: wrap;
    width: 800px;
    justify-content: space-between;
}
```

外联CSS文件只需要在HTML的header中添加一行即可。例如：
```html 
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Doucument</title>
    <link rel="stylesheet" href="style.css"> //外联CSS,后面是文件名字，需要放在同一文件夹中。
</head>
```
### Javascript

JavaScript是个脚本语言，可以写在HTML中的`<script></script>`标签中。Js可以直接修改HTML页面。例如
```html
<script>
document.write("<h1>这是一个标题</h1>");
</script>
```

### JSON 数据格式
在介绍 JavaScript 语法之前，我们先了解一下 JSON。JSON (JavaScript Object Notation) 是一种轻量级的数据交换格式，易于人阅读和编写，同时也易于机器解析和生成。在本项目中，我们使用 JSON 来存储地铁站点和线路的数据。

例如，一个站点的数据可能长这样：
```json
{
  "name": "苹果园",
  "x": 929.6,
  "y": 912.0,
  "lines": ["L_1", "L_6"]
}
```
在 JavaScript 中，我们可以直接将 JSON 数据作为对象来处理。

更重要的是函数和事件功能。例如
```html
<script>
function myFunction(){
	alert("你点击了按钮");
}
</script>
<button type="button" onclick="myFunction()">点击这里</button>
```
点击了按钮之后，你的浏览器会自动弹出事件，显示“你点击了按钮”。

我们这里简述一下JavaScript的语法。
```javascript
//变量、数据类型和元素。
var x=1;
var name="MengPaul";
var x = true;
var ages=["ten","nine","eight"];
var person={firstname:"MengPaul", age:"18", id:114514};
```

js的if和for语句和C语言类似，不在这里赘述。

```js
function cmp(var a ,var b){
    return a>b;
}
```

```js
class Book {
    // 构造函数为constructor关键字
    constructor(title, author, year) {
      this.title = title;
      this.author = author;
      this.year = year;
    }
    getSummary() {
      return `${this.title} by ${this.author}, published in ${this.year}`;
    }
}
let myBook = new Book("JavaScript Guide", "John Doe", 2021);
```
更多语法细节请自行查询。


```js
//外联js文件
<script src="myScript.js"></script>
```

## 页面设计
如果你像读者一样，设计天赋很一般，这部分可以尝试Vide Coding。

我们最好使用外联CSS和JS以保障HTML页面结构清晰。
例如，分块处理各个按钮和模块，这部分不是重点。
```js
<div class="controls">
        <div class="status-panel">
            <div class="status-item">
                <span class="label">起点:</span>
                <span id="start-station-display" class="value">未选择</span>
            </div>
            <div class="status-item">
                <span class="label">终点:</span>
                <span id="end-station-display" class="value">未选择</span>
            </div>
        </div>

        <div class="button-group">
            <button class="btn-run" id="btn-run">查找最短路径</button>
            <button class="btn-reset" id="btn-reset">重置选择</button>
        </div>
        
        <div class="instruction">
            点击站点以选择起点和终点
        </div>
    </div>
```

## 核心渲染逻辑
有了数据和 SVG 基础，我们不需要手动写几百个 `<circle>` 标签。使用 JavaScript 的循环，可以自动生成整个地图。

**绘制线路 (Polyline)**
遍历每一条线路，将其包含的站点坐标连接成折线。
```javascript
// 伪代码示例
for (const lineId in lines) {
    const points = line.stations.map(id => `${stations[id].x},${stations[id].y}`).join(' ');
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', points);
    polyline.setAttribute('stroke', line.color);
    svg.appendChild(polyline);
}
```

**绘制站点 (Circle)**
同理，遍历所有站点数据，在对应坐标生成圆形。
```javascript
for (const id in stations) {
    const s = stations[id];
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', s.x);
    circle.setAttribute('cy', s.y);
    circle.setAttribute('r', 5); // 半径
    // ... 添加点击事件监听 ...
    svg.appendChild(circle);
}
```

### 事件函数设计
我们在HTML中定义了类名和id,在外联JS文件中进行处理。

这是一个例子，利用`getElementById`处理事件清楚站点的选择。
```js
    function resetSelection() {
        startStationId = null;//清状态
        endStationId = null;
        document.getElementById('start-station-display').textContent = '未选择';//改文本
        document.getElementById('end-station-display').textContent = '未选择';
        
        document.querySelectorAll('.station-circle').forEach(el => {
            el.classList.remove('selected-start', 'selected-end');//移除高亮的点和终点
        });
        
        clearPath();//清楚高亮路径
}   
```

我们地铁图的尺寸很大，因此我们要考虑缩放和平移。没有框架，需要手动设计逻辑。



**初始化**
```js
//DOM读取svg
const svg = document.getElementById('subway-map');
// SVG 初始视窗（根据你的地图尺寸定）
let viewBox = { x: 0, y: 0, w: 1200, h: 800 };
// 拖拽起点与状态
let startPoint = { x: 0, y: 0 };
let isPanning = false;
// 初始化：把初始 viewBox 应用到 SVG（可在 DOMContentLoaded 后执行）
svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
```


**拖动逻辑**  

按照注释还是比较容易理解的`e.clientX/Y`由浏览器提供，是鼠标相对浏览器视口的像素坐标。
```js
const svg = document.getElementById('subway-map');
let isDown = false;

// 鼠标按下开始拖拽
svg.onmousedown = (e) => {
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
        // 坐标转化 + 更新 viewBox + 起始点更新
        viewBox.x -= dx * (viewBox.w / width);
        viewBox.y -= dy * (viewBox.h / height);
        svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
        startPoint = { x: e.clientX, y: e.clientY };
    }
};
// 鼠标松开或离开停止拖拽
svg.onmouseup = svg.onmouseleave = () => isDown = false;
```


**缩放逻辑** 

其中`e.deltaY`可以记录鼠标滚轮滑动量，`e.offsetX`是鼠标相对事件目标元素内容盒子的像素坐标。
```js
// 滚轮缩放
svg.onwheel = (e) => {
    //避免页面跟随滚动，专用于自定义缩放。
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9; // 滚轮向下缩小，向上放大
    const { width, height } = svg.getBoundingClientRect();
    
    // 计算鼠标在SVG坐标系中的位置
    const mx = (e.offsetX / width) * viewBox.w + viewBox.x;
    const my = (e.offsetY / height) * viewBox.h + viewBox.y;

    // 更新宽高
    viewBox.w *= zoomFactor;
    viewBox.h *= zoomFactor;
    
    // 调整 viewBox 原点，保持鼠标位置不变
    viewBox.x = mx - (e.offsetX / width) * viewBox.w;
    viewBox.y = my - (e.offsetY / height) * viewBox.h;

    //更新viewBox
    svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);
};
```

## 下期预告
至此，我们已经拥有了一张可以拖拽、缩放的北京地铁矢量地图！
但它还只是“好看的图片”，不知道如何从 A 到 B。
下期我们将深入后端逻辑与算法：
1. **数据清洗**：如何用 Python 从原始 GeoJSON 中提取出我们刚才使用的干净数据？
2. **最短路径**：手写 Dijkstra 算法，教计算机“认识”路。
敬请期待！









