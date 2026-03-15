# C++ EasyX Pong 教程

> 现在，我们达到了 1972 年的游戏技术水平了。

如果你已经不满足于黑乎乎的命令行项目，想做一个图形化的 C/C++ 小游戏，这篇教程就是给你的。

## EasyX 是什么

**EasyX** 是一个面向 C++ 初学者的简易图形库，可以很快上手图形与小游戏编程。

> 如果你要做长期、复杂的商业项目，建议使用成熟游戏引擎；EasyX 更适合教学、练习和快速原型。

---

## 01 环境安装

### 1. 安装 Visual Studio

请先安装 Visual Studio：

- https://visualstudio.microsoft.com/zh-hans/vs/

安装时勾选 **Desktop development with C++**（桌面 C++ 开发）即可。

### 2. 安装 EasyX

EasyX 官网（含文档）：

- https://easyx.cn

安装完成后，在 VS 中创建空项目进行测试。

### 3. 验证 EasyX 是否可用

创建 `main.cpp`（请用 `.cpp`，不要用 `.c`），写入：

```cpp
#include <stdio.h>
#include <graphics.h>

int main() {
    initgraph(640, 480);     // 创建窗口
    circle(320, 240, 100);   // 画圆
    getchar();               // 等待按键
    closegraph();
    return 0;
}
```

运行后若出现圆形窗口，说明安装成功。

---

## 02 程序制作（Pong）

我们的目标是实现传统 Pong：

- 左右双方移动挡板
- 小球反弹
- 计分并判定胜负

> EasyX 不支持 Unicode。建议先把项目属性调成与 EasyX 推荐设置一致，并关闭 scanf 安全检查相关干扰项。

### 2.1 先创建窗口并开启双缓冲

```cpp
#include <stdio.h>
#include <graphics.h>

int main() {
    initgraph(640, 480);   // 创建窗口
    setbkcolor(BLACK);     // 背景色
    cleardevice();

    BeginBatchDraw();      // 开启批量绘图

    setfillcolor(WHITE);
    FlushBatchDraw();      // 刷新缓冲区
    Sleep(10);

    EndBatchDraw();
    closegraph();
    return 0;
}
```

### 2.2 定义挡板并绘制

```cpp
struct platform {
    int x, y;
    int width = 10;
    int height = 80;
    int vy = 10;
} left_plat, right_plat;

void drawPlatform(const platform& plat) {
    fillrectangle(plat.x, plat.y, plat.x + plat.width, plat.y + plat.height);
}
```

初始化：

```cpp
left_plat = {80, 200};
right_plat = {640 - 90, 200};
```

### 2.3 输入处理：改用 GetAsyncKeyState

`peekmessage` 更偏消息驱动，双人同键盘连续控制时体验一般。这里改用按键状态检测：

```cpp
void Input() {
    if (GetAsyncKeyState('W') & 0x8000) {
        if (left_plat.y > 0) left_plat.y -= left_plat.vy;
    }
    if (GetAsyncKeyState('S') & 0x8000) {
        if (left_plat.y < 480 - left_plat.height) left_plat.y += left_plat.vy;
    }

    if (GetAsyncKeyState(VK_UP) & 0x8000) {
        if (right_plat.y > 0) right_plat.y -= right_plat.vy;
    }
    if (GetAsyncKeyState(VK_DOWN) & 0x8000) {
        if (right_plat.y < 480 - right_plat.height) right_plat.y += right_plat.vy;
    }
}
```

### 2.4 小球与基础物理

```cpp
struct ballStruct {
    int x, y;
    int r = 5;
    int vx;
    int vy;
} ball;
```

初始化与更新：

```cpp
ball = {320, 240, 5, 5, 0};

ball.x += ball.vx;
ball.y += ball.vy;

if (ball.y <= ball.r || ball.y >= 480 - ball.r) {
    ball.vy = -ball.vy;
}
```

### 2.5 挡板碰撞（圆形-矩形）

```cpp
void checkCollision(platform& plat) {
    int closestX = ball.x;
    if (ball.x < plat.x) closestX = plat.x;
    else if (ball.x > plat.x + plat.width) closestX = plat.x + plat.width;

    int closestY = ball.y;
    if (ball.y < plat.y) closestY = plat.y;
    else if (ball.y > plat.y + plat.height) closestY = plat.y + plat.height;

    int dx = ball.x - closestX;
    int dy = ball.y - closestY;
    int distanceSquared = dx * dx + dy * dy;

    if (distanceSquared < ball.r * ball.r) {
        int overlapX = ball.r - abs(dx);
        int overlapY = ball.r - abs(dy);

        if (overlapX >= overlapY) {
            ball.vx = -ball.vx;
            ball.vy = ((plat.y + plat.height / 2) - ball.y) / (plat.height / 10);
            ball.x += (ball.vx > 0 ? overlapX : -overlapX);
        } else {
            ball.vy = -ball.vy;
            ball.y += (ball.vy > 0 ? overlapY : -overlapY);
        }
    }
}
```

主循环调用：

```cpp
checkCollision(left_plat);
checkCollision(right_plat);
```

### 2.6 计分、重置与胜负

```cpp
int left_score = 0;
int right_score = 0;
char score_text[32];

void resetBall() {
    ball.x = 320;
    ball.y = 240;
    ball.vy = 0;
    ball.vx = (rand() % 2 == 0) ? 5 : -5;
    Sleep(500);
}
```

得分逻辑：

```cpp
if (ball.x <= ball.r) {
    right_score++;
    resetBall();
}
if (ball.x + ball.r >= 640) {
    left_score++;
    resetBall();
}
```

结束界面函数：

```cpp
void gameOver(const char* winner) {
    cleardevice();
    settextstyle(48, 0, "Consolas");
    settextcolor(WHITE);
    char msg[64];
    sprintf(msg, "%s Wins!", winner);
    outtextxy(100, 200, msg);
    FlushBatchDraw();
    Sleep(3000);
}
```

### 2.7 UI 美化与 ESC 退出

```cpp
for (int i = 60; i < 450; i += 30) {
    fillrectangle(314, i, 322, i + 20);
}
rectangle(0, 0, 639, 479);

settextstyle(16, 0, "Consolas");
outtextxy(10, 460, "[W/S]: Move Left Paddle");
outtextxy(400, 460, "[Up/Down]: Move Right Paddle");
outtextxy(10, 10, "First to 10 Points Wins!");
outtextxy(540, 10, "[ESC]: Quit");
```

```cpp
if (peekmessage(&msg, EX_KEY)) {
    if (msg.message == WM_KEYDOWN && msg.vkcode == VK_ESCAPE) {
        break;
    }
}
```

---

## 03 双人版汇总代码

> 下方是教程版双人 Pong 汇总代码。

```cpp
#include <stdio.h>
#include <graphics.h>
#include <stdlib.h>

struct platform {
    int x, y;
    int width = 10;
    int height = 80;
    int vy = 10;
} left_plat, right_plat;

struct ballStruct {
    int x, y;
    int r = 5;
    int vx;
    int vy;
} ball;

void drawPlatform(const platform& plat) {
    fillrectangle(plat.x, plat.y, plat.x + plat.width, plat.y + plat.height);
}

void Input() {
    if (GetAsyncKeyState('W') & 0x8000 && left_plat.y > 0) {
        left_plat.y -= left_plat.vy;
    }
    if (GetAsyncKeyState('S') & 0x8000 && left_plat.y < 480 - left_plat.height) {
        left_plat.y += left_plat.vy;
    }
    if (GetAsyncKeyState(VK_UP) & 0x8000 && right_plat.y > 0) {
        right_plat.y -= right_plat.vy;
    }
    if (GetAsyncKeyState(VK_DOWN) & 0x8000 && right_plat.y < 480 - right_plat.height) {
        right_plat.y += right_plat.vy;
    }
}

void checkCollision(platform& plat) {
    int closestX = ball.x;
    if (ball.x < plat.x) closestX = plat.x;
    else if (ball.x > plat.x + plat.width) closestX = plat.x + plat.width;

    int closestY = ball.y;
    if (ball.y < plat.y) closestY = plat.y;
    else if (ball.y > plat.y + plat.height) closestY = plat.y + plat.height;

    int dx = ball.x - closestX;
    int dy = ball.y - closestY;
    int distanceSquared = dx * dx + dy * dy;

    if (distanceSquared < ball.r * ball.r) {
        int overlapX = ball.r - abs(dx);
        int overlapY = ball.r - abs(dy);

        if (overlapX >= overlapY) {
            ball.vx = -ball.vx;
            ball.vy = ((plat.y + plat.height / 2) - ball.y) / (plat.height / 10);
            ball.x += (ball.vx > 0 ? overlapX : -overlapX);
        } else {
            ball.vy = -ball.vy;
            ball.y += (ball.vy > 0 ? overlapY : -overlapY);
        }
    }
}

void resetBall() {
    ball.x = 320;
    ball.y = 240;
    ball.vy = 0;
    ball.vx = (rand() % 2 == 0) ? 5 : -5;
    Sleep(500);
}

void gameOver(const char* winner) {
    cleardevice();
    settextstyle(48, 0, "Consolas");
    settextcolor(WHITE);
    char msg[64];
    sprintf(msg, "%s Wins!", winner);
    outtextxy(100, 200, msg);
    FlushBatchDraw();
    Sleep(3000);
}

int main() {
    initgraph(640, 480);
    setbkcolor(BLACK);

    ExMessage msg;
    int left_score = 0;
    int right_score = 0;
    char score_text[32];

    left_plat = {80, 200};
    right_plat = {640 - 90, 200};

    resetBall();
    BeginBatchDraw();

    while (true) {
        if (peekmessage(&msg, EX_KEY)) {
            if (msg.message == WM_KEYDOWN && msg.vkcode == VK_ESCAPE) {
                break;
            }
        }

        if (left_score >= 10) {
            gameOver("Left Player");
            break;
        }
        if (right_score >= 10) {
            gameOver("Right Player");
            break;
        }

        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.y <= ball.r || ball.y >= 480 - ball.r) {
            ball.vy = -ball.vy;
        }

        if (ball.x <= ball.r) {
            right_score++;
            resetBall();
        }
        if (ball.x + ball.r >= 640) {
            left_score++;
            resetBall();
        }

        checkCollision(left_plat);
        checkCollision(right_plat);
        Input();

        cleardevice();

        setfillcolor(WHITE);
        drawPlatform(left_plat);
        drawPlatform(right_plat);
        solidcircle(ball.x, ball.y, ball.r);

        settextstyle(24, 0, "Consolas");
        settextcolor(WHITE);
        sprintf(score_text, "%d - %d", left_score, right_score);
        outtextxy(290, 10, score_text);

        for (int i = 60; i < 450; i += 30) {
            fillrectangle(314, i, 322, i + 20);
        }
        rectangle(0, 0, 639, 479);

        settextstyle(16, 0, "Consolas");
        outtextxy(10, 460, "[W/S]: Move Left Paddle");
        outtextxy(400, 460, "[Up/Down]: Move Right Paddle");
        outtextxy(10, 10, "First to 10 Points Wins!");
        outtextxy(540, 10, "[ESC]: Quit");

        FlushBatchDraw();
        Sleep(10);
    }

    EndBatchDraw();
    closegraph();
    return 0;
}
```

---

## 04 进阶版（状态机）

你后续实现了主菜单、单/双人选择、人机对战、重复游玩等功能，并引入了游戏状态机。这是很好的工程化升级方向。

> 建议：状态机版本的完整代码可以单独放到 `src/advanced_main.cpp`，README 保留核心教学版，便于初学者阅读。

---

## 05 运行与打包说明

如果运行时弹出调试命令行窗口，可在项目属性里调整子系统设置（按你项目截图的方式配置）。

打包流程：

1. 切换到 `Release`。
2. 生成解决方案。
3. 在输出目录找到 `.exe` 与依赖文件。

---

## 06 资源链接

- 蓝奏云：https://wwwr.lanzoul.com/i9pMg37m6dtg
- 提取码：`1111`

Github 仓库包含可直接在 Visual Studio 中打开的完整项目文件。

---

## 07 可继续扩展的功能

- 初始菜单与参数自定义（球半径、挡板大小、速度、胜利分数）
- 图片与音效资源加载
- 重复游玩
- 人机难度梯度（反应区、速度、预判）

---

祝你在 CS 的学习路上更进一步。
