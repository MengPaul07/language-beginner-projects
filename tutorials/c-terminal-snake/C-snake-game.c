#include <stdio.h>
#include <stdlib.h>
#include <conio.h>   // 包含 _kbhit() 和 _getch()
#include <windows.h> // 包含 Sleep() 和 system("cls")
#include <stdbool.h> // 包含 bool 类型

// --- 全局变量 ---
const int grid_size = 20; // 地图常量大小为20

// 蛇头、身体、食物的字符表示
char snake_head = 'O';
char snake_body = 'o';
char fruit_body = '#';

int score = 0; // 初始分数为0

// 蛇头的位置初始在地图中央
int x, y;

// 食物的位置
int fruit_x, fruit_y;

// 蛇的身体数组和长度
int tailX[100], tailY[100];
int nTail = 0;

// 游戏状态
bool game_over = false;

// 存储方向: 1-左, 2-右, 3-上, 4-下, 0-停止
int dir = 0;

// --- 函数声明 ---
void Draw();
void Input();
void Move();
void Check();
void GenerateFruit();
void ResetGame();

// --- 主函数 ---
int main()
{
    do
    {
        ResetGame();
        while (!game_over)
        {
            Draw();
            Input();
            Move();
            Check();
            Sleep(100); // 循环间停顿100ms
        }
        Draw();
        printf("\nGame Over!\n");
        printf("Final Score: %d\n", score);
        printf("\nEnter R to restart the game.\n");
        char ch = _getch();
        if (ch == 'r' || ch == 'R')
        {
            game_over = false;
        }
        else
        {
            break;
        }
    } while (1);
    return 0;
}

void Draw()
{
    system("cls"); // 清空屏幕
    // 打印上边框
    printf("+");
    for (int i = 0; i < grid_size; i++)
        printf("-");
    printf("+\n");
    for (int i = 0; i < grid_size; i++)
    {
        printf("|"); // 左边框
        for (int j = 0; j < grid_size; j++)
        {
            if (i == y && j == x)
            {
                printf("%c", snake_head); // 打印蛇头
            }
            else if (i == fruit_y && j == fruit_x)
            {
                printf("%c", fruit_body); // 打印食物
            }
            else
            {
                bool isTailSegment = false;
                for (int k = 0; k < nTail; k++)
                {
                    if (tailX[k] == j && tailY[k] == i)
                    {
                        printf("%c", snake_body); // 是身体，打印'o'
                        isTailSegment = true;
                        break; // 找到后即可退出循环
                    }
                }
                if (!isTailSegment)
                {
                    printf(" "); // 不是身体，打印空格
                }
            }
        }
        printf("|\n"); // 右边框
    }
    // 打印下边框
    printf("+");
    for (int i = 0; i < grid_size; i++)
        printf("-");
    printf("+\n");
    printf("Score: %d\n", score);
}

void Input()
{
    if (_kbhit())
    {
        switch (_getch())
        {
        case 'a':
            dir = 1; // left
            break;
        case 'd':
            dir = 2; // right
            break;
        case 'w':
            dir = 3; // up
            break;
        case 's':
            dir = 4; // down
            break;
        case 'x': // 按 'x' 键退出游戏
            game_over = true;
            break;
        }
    }
}

void Move()
{
    // 1. 蛇身移动
    if (nTail > 0)
    {
        int prevX = tailX[0];
        int prevY = tailY[0];
        int prev2X, prev2Y;
        tailX[0] = x; // 第一节身体移动到蛇头原来的位置
        tailY[0] = y;
        for (int i = 1; i < nTail; i++)
        {
            prev2X = tailX[i];
            prev2Y = tailY[i];
            tailX[i] = prevX;
            tailY[i] = prevY;
            prevX = prev2X;
            prevY = prev2Y;
        }
    }

    // 2. 蛇头移动
    switch (dir)
    {
    case 1: // left
        x--;
        break;
    case 2: // right
        x++;
        break;
    case 3: // up
        y--;
        break;
    case 4: // down
        y++;
        break;
    default:
        break;
    }
}

void Check()
{
    // 如果蛇头碰到墙壁, 游戏结束
    if (x >= grid_size || x < 0 || y >= grid_size || y < 0)
    {
        game_over = true;
        return; // 游戏已结束，无需再检测
    }

    // 蛇头撞蛇身, 游戏结束
    for (int i = 0; i < nTail; i++)
    {
        if (tailX[i] == x && tailY[i] == y)
        {
            game_over = true;
            return;
        }
    }

    // 撞到果实
    if (x == fruit_x && y == fruit_y)
    {
        score += 1;      // 分数增加
        nTail++;         // 蛇的身体变长
        GenerateFruit(); // 生成不在蛇身上的果实
    }
}

// 生成不在蛇身上的果实
void GenerateFruit()
{
    int valid = 0;
    do
    {
        fruit_x = rand() % grid_size;
        fruit_y = rand() % grid_size;
        valid = 1;
        // 不与蛇头重合
        if (fruit_x == x && fruit_y == y)
        {
            valid = 0;
            continue;
        }
        // 不与蛇身重合
        for (int i = 0; i < nTail; i++)
        {
            if (tailX[i] == fruit_x && tailY[i] == fruit_y)
            {
                valid = 0;
                break;
            }
        }
    } while (!valid);
}

// 重置游戏变量
void ResetGame(void)
{
    x = grid_size / 2;
    y = grid_size / 2;
    score = 0;
    nTail = 0;
    dir = 0;
    game_over = false;
    GenerateFruit();
    // 清空蛇身
    for (int i = 0; i < 100; i++)
    {
        tailX[i] = 0;
        tailY[i] = 0;
    }
}