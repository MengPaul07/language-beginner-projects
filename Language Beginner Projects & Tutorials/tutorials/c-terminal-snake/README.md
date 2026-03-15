# C 语言命令行贪吃蛇教程

> 黑糊糊的命令行项目，是很多编码初学者的初恋。

你是否因为只会学校教的 C 语言，却不知道怎么做一个完整项目而苦恼？
这个教程就是给你准备的：从零开始，做一个可运行的命令行贪吃蛇。

> 提示：本文尽量用小白视角一步一步讲解。若有错误，欢迎指出。

## 00 写在前面

### Q: 为什么写这个系列？
A: 督促自己学习项目开发，也给其他初学者提供一个思路。

### Q: 你有什么实力？
A: 没有“大神实力”，写这篇时也是边做边学。

---

## 01 环境和前置知识

### 必备工具
- 一个编辑器
- 一个 C 语言编译器（`Dev-C++` 也可以）

### 可选工具
- 一个可以辅助解释/生成代码的大语言模型

### 前置知识
- C 语言基础语法（变量、循环、函数、数组、条件判断）

---

## 02 框架构建

### 2.1 明确游戏规则

- **游戏目标**：控制蛇吃食物，尽量得高分。
- **移动规则**：支持上下左右，且不能直接反向。
- **食物规则**：随机出现，吃到后蛇身变长。
- **地图规则**：固定区域，撞墙即结束。
- **失败条件**：蛇头撞墙或撞到自己。
- **计分规则**：每吃一个食物加 `1` 分。

### 2.2 实现思路

刚开始不知道怎么实现很正常。我们把问题拆小：

1. 先画地图
2. 再做输入
3. 再做移动
4. 最后做碰撞和得分

---

## 03 项目制作

> 为了阅读体验，下面尽量按“最终代码逻辑顺序”讲解。

### 3.1 定义基础变量

先定义地图大小、蛇和食物的字符表示、坐标和状态变量。

```c
#include <stdio.h>
#include <stdlib.h>
#include <conio.h>
#include <windows.h>
#include <stdbool.h>

const int grid_size = 20;

char snake_head = 'O';
char snake_body = 'o';
char fruit_body = '#';

int score = 0;
int x, y;
int fruit_x, fruit_y;

int tailX[100], tailY[100];
int nTail = 0;

bool game_over = false;
int dir = 0; // 1-左 2-右 3-上 4-下
```

### 3.2 主循环骨架

贪吃蛇本质是一个持续更新的循环：绘制 -> 输入 -> 移动 -> 检测。

```c
int main() {
    x = grid_size / 2;
    y = grid_size / 2;
    fruit_x = rand() % grid_size;
    fruit_y = rand() % grid_size;

    while (!game_over) {
        // Draw();
        // Input();
        // Move();
        // Check();
    }

    return 0;
}
```

### 3.3 绘制地图（Draw）

核心点：
- 蛇头、食物、蛇身优先级要明确
- 用 `tailX[]` 和 `tailY[]` 存蛇身坐标

```c
void Draw() {
    system("cls");

    for (int i = 0; i < grid_size; i++) {
        for (int j = 0; j < grid_size; j++) {
            if (i == y && j == x) {
                printf("%c", snake_head);
            } else if (i == fruit_y && j == fruit_x) {
                printf("%c", fruit_body);
            } else {
                bool isTailSegment = false;
                for (int k = 0; k < nTail; k++) {
                    if (tailX[k] == j && tailY[k] == i) {
                        printf("%c", snake_body);
                        isTailSegment = true;
                        break;
                    }
                }
                if (!isTailSegment) {
                    printf(" ");
                }
            }
        }
        printf("\n");
    }

    printf("Score: %d\n", score);
}
```

### 3.4 输入处理（Input）

Windows 下可用 `_kbhit()` 和 `_getch()` 实现非阻塞输入。

```c
void Input() {
    if (_kbhit()) {
        switch (_getch()) {
            case 'a': dir = 1; break;
            case 'd': dir = 2; break;
            case 'w': dir = 3; break;
            case 's': dir = 4; break;
            case 'x': game_over = true; break;
        }
    }
}
```

### 3.5 蛇移动逻辑（Move）

顺序很关键：
1. **先移动蛇身**（每节跟随前一节）
2. **再移动蛇头**

```c
void Move() {
    if (nTail > 0) {
        int prevX = tailX[0];
        int prevY = tailY[0];
        int prev2X, prev2Y;

        tailX[0] = x;
        tailY[0] = y;

        for (int i = 1; i < nTail; i++) {
            prev2X = tailX[i];
            prev2Y = tailY[i];
            tailX[i] = prevX;
            tailY[i] = prevY;
            prevX = prev2X;
            prevY = prev2Y;
        }
    }

    switch (dir) {
        case 1: x--; break;
        case 2: x++; break;
        case 3: y--; break;
        case 4: y++; break;
        default: break;
    }
}
```

### 3.6 碰撞与得分（Check）

```c
void Check() {
    // 撞墙
    if (x >= grid_size || x < 0 || y >= grid_size || y < 0) {
        game_over = true;
        return;
    }

    // 撞自己
    for (int i = 0; i < nTail; i++) {
        if (tailX[i] == x && tailY[i] == y) {
            game_over = true;
            return;
        }
    }

    // 吃到食物
    if (x == fruit_x && y == fruit_y) {
        score += 1;
        fruit_x = rand() % grid_size;
        fruit_y = rand() % grid_size;
        nTail++;
    }
}
```

### 3.7 主函数整合（可运行版）

```c
#include <stdio.h>
#include <stdlib.h>
#include <conio.h>
#include <windows.h>
#include <stdbool.h>

const int grid_size = 20;
char snake_head = 'O';
char snake_body = 'o';
char fruit_body = '#';

int score = 0;
int x, y;
int fruit_x, fruit_y;
int tailX[100], tailY[100];
int nTail = 0;
bool game_over = false;
int dir = 0;

void Draw();
void Input();
void Move();
void Check();

int main() {
    x = grid_size / 2;
    y = grid_size / 2;
    fruit_x = rand() % grid_size;
    fruit_y = rand() % grid_size;

    while (!game_over) {
        Draw();
        Input();
        Move();
        Check();
        Sleep(100);
    }

    printf("\nGame Over!\n");
    printf("Final Score: %d\n", score);
    system("pause");
    return 0;
}

void Draw() {
    system("cls");

    for (int i = 0; i < grid_size; i++) {
        for (int j = 0; j < grid_size; j++) {
            if (i == y && j == x) {
                printf("%c", snake_head);
            } else if (i == fruit_y && j == fruit_x) {
                printf("%c", fruit_body);
            } else {
                bool isTailSegment = false;
                for (int k = 0; k < nTail; k++) {
                    if (tailX[k] == j && tailY[k] == i) {
                        printf("%c", snake_body);
                        isTailSegment = true;
                        break;
                    }
                }
                if (!isTailSegment) {
                    printf(" ");
                }
            }
        }
        printf("\n");
    }

    printf("Score: %d\n", score);
}

void Input() {
    if (_kbhit()) {
        switch (_getch()) {
            case 'a': dir = 1; break;
            case 'd': dir = 2; break;
            case 'w': dir = 3; break;
            case 's': dir = 4; break;
            case 'x': game_over = true; break;
        }
    }
}

void Move() {
    if (nTail > 0) {
        int prevX = tailX[0];
        int prevY = tailY[0];
        int prev2X, prev2Y;
        tailX[0] = x;
        tailY[0] = y;

        for (int i = 1; i < nTail; i++) {
            prev2X = tailX[i];
            prev2Y = tailY[i];
            tailX[i] = prevX;
            tailY[i] = prevY;
            prevX = prev2X;
            prevY = prev2Y;
        }
    }

    switch (dir) {
        case 1: x--; break;
        case 2: x++; break;
        case 3: y--; break;
        case 4: y++; break;
        default: break;
    }
}

void Check() {
    if (x >= grid_size || x < 0 || y >= grid_size || y < 0) {
        game_over = true;
        return;
    }

    for (int i = 0; i < nTail; i++) {
        if (tailX[i] == x && tailY[i] == y) {
            game_over = true;
            return;
        }
    }

    if (x == fruit_x && y == fruit_y) {
        score += 1;
        fruit_x = rand() % grid_size;
        fruit_y = rand() % grid_size;
        nTail++;
    }
}
```

---

## 04 常见问题与修复

### Problem 1: 蛇跑太快 / 程序不稳定
- 原因：循环过快。
- 解决：主循环里加 `Sleep(100)` 控制刷新节奏。

### Problem 2: 画面叠在一起
- 原因：每次刷新未清屏。
- 解决：`Draw()` 开头加 `system("cls")`。

### Problem 3: 游戏结束后窗口立即关闭
- 原因：程序执行完直接退出。
- 解决：结束前加 `system("pause")`（Windows）。

---

## 05 可以继续优化的方向

当前版本可运行，但仍有改进空间：

1. **食物避开蛇身**：生成食物时加坐标冲突检测。
2. **可重复游玩**：封装 `InitGame()` + 再来一局逻辑。
3. **自定义参数**：地图大小、速度、食物数量、是否穿墙等。
4. **加入边框**：提升可读性和游玩体验。

> 建议：可以用 AI 辅助，但要保持自己的思考，尤其是逻辑顺序和 bug 定位。

---

祝你在 CS 的学习路上更进一步。
