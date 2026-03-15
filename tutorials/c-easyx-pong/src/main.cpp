#include<stdio.h>
#include<graphics.h>
#include<stdlib.h> // 用于 rand() 和 abs()
#include<time.h>   // 用于 time()

// --- 全局变量和结构体定义 ---

enum GameState { MAIN_MENU, IN_GAME, GAME_OVER };
enum GameMode { P_VS_AI, P_VS_P };

struct platform {
    int x, y;
    int width = 10;
    int height = 80;
    int vy = 10;
} left_plat, right_plat;

struct ballStruct {
    int x, y;
    int r = 5;
    int vx, vy;
} ball;

// --- 函数声明 ---

void drawPlatform(const platform& plat);
void handlePlayer1Input();
void handlePlayer2Input();
void updateAI();
void checkCollision(platform& plat);
void resetBall();
void drawGameElements();
GameMode showMainMenu();
const char* runGameLoop(GameMode mode);
void showGameOverScreen(const char* winner);

// --- 函数实现 ---

void drawPlatform(const platform& plat) {
    fillrectangle(plat.x, plat.y, plat.x + plat.width, plat.y + plat.height);
}

void handlePlayer1Input() {
    if (GetAsyncKeyState('W') & 0x8000 && left_plat.y > 0) left_plat.y -= left_plat.vy;
    if (GetAsyncKeyState('S') & 0x8000 && left_plat.y < 480 - left_plat.height) left_plat.y += left_plat.vy;
}

void handlePlayer2Input() {
    if (GetAsyncKeyState(VK_UP) & 0x8000 && right_plat.y > 0) right_plat.y -= right_plat.vy;
    if (GetAsyncKeyState(VK_DOWN) & 0x8000 && right_plat.y < 480 - right_plat.height) right_plat.y += right_plat.vy;
}

void updateAI() {
    if (ball.vx > 0 && ball.x > 320) {
        int ai_center_y = right_plat.y + right_plat.height / 2;
        int ai_speed = 4;
        int dead_zone = 10;
        int diff = ball.y - ai_center_y;
        if (abs(diff) > dead_zone) {
            if (diff > 0 && right_plat.y < 480 - right_plat.height) right_plat.y += ai_speed;
            else if (diff < 0 && right_plat.y > 0) right_plat.y -= ai_speed;
        }
    }
}

void checkCollision(platform& plat) {
    int closestX = (ball.x < plat.x) ? plat.x : (ball.x > plat.x + plat.width) ? (plat.x + plat.width) : ball.x;
    int closestY = (ball.y < plat.y) ? plat.y : (ball.y > plat.y + plat.height) ? (plat.y + plat.height) : ball.y;
    int dx = ball.x - closestX;
    int dy = ball.y - closestY;
    if ((dx * dx + dy * dy) < (ball.r * ball.r)) {
        int overlapX = ball.r - abs(dx);
        int overlapY = ball.r - abs(dy);
        if (overlapX >= overlapY) {
            ball.vx = -ball.vx;
            ball.vy = ((plat.y + plat.height / 2) - ball.y) / (plat.height / 10);
            ball.x += (ball.vx > 0 ? overlapX : -overlapX);
        }
        else {
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

void drawGameElements(int left_score, int right_score, GameMode mode) {
    cleardevice();
    setfillcolor(WHITE);
    drawPlatform(left_plat);
    drawPlatform(right_plat);
    solidcircle(ball.x, ball.y, ball.r);

    char score_text[32];
    if (mode == P_VS_AI) sprintf(score_text, "Player: %d - AI: %d", left_score, right_score);
    else sprintf(score_text, "P1: %d - P2: %d", left_score, right_score);

    settextstyle(24, 0, "Consolas");
    settextcolor(WHITE);
    outtextxy(240, 10, score_text);

    for (int i = 60; i < 450; i += 30) fillrectangle(314, i, 322, i + 20);
    rectangle(0, 0, 639, 479);

    settextstyle(16, 0, "Consolas");
    outtextxy(10, 10, "First to 10 Points Wins!");
    outtextxy(540, 10, "[ESC]: Quit");
}

GameMode showMainMenu() {
    cleardevice();
    settextstyle(48, 0, "Consolas");
    settextcolor(WHITE);
    outtextxy(220, 100, "PONG");

    settextstyle(24, 0, "Consolas");
    outtextxy(200, 200, "1. Player vs AI");
    outtextxy(200, 250, "2. Player vs Player");
    outtextxy(200, 300, "3. Exit");
    FlushBatchDraw();

    ExMessage msg;
    while (true) {
        if (peekmessage(&msg, EX_KEY) && msg.message == WM_KEYDOWN) {
            switch (msg.vkcode) {
            case '1': return P_VS_AI;
            case '2': return P_VS_P;
            case '3': case VK_ESCAPE: return (GameMode)-1; // 特殊值表示退出
            }
        }
        Sleep(10);
    }
}

const char* runGameLoop(GameMode mode) {
    int left_score = 0;
    int right_score = 0;
    left_plat = { 80, 200 };
    right_plat = { 640 - 90, 200 };
    resetBall();

    while (true) {
        ExMessage msg;
        if (peekmessage(&msg, EX_KEY) && msg.message == WM_KEYDOWN && msg.vkcode == VK_ESCAPE) return "QUIT";

        if (left_score >= 10) return (mode == P_VS_AI) ? "You Win!" : "Player 1 Wins!";
        if (right_score >= 10) return (mode == P_VS_AI) ? "AI Wins!" : "Player 2 Wins!";

        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.y <= ball.r || ball.y >= 480 - ball.r) ball.vy = -ball.vy;
        if (ball.x <= ball.r) { right_score++; resetBall(); }
        if (ball.x + ball.r >= 640) { left_score++; resetBall(); }

        checkCollision(left_plat);
        checkCollision(right_plat);

        handlePlayer1Input();
        if (mode == P_VS_AI) updateAI();
        else handlePlayer2Input();

        drawGameElements(left_score, right_score, mode);
        FlushBatchDraw();
        Sleep(10);
    }
}

void showGameOverScreen(const char* winner) {
    cleardevice();
    settextstyle(48, 0, "Consolas");
    settextcolor(WHITE);
    outtextxy(180, 180, winner);

    settextstyle(24, 0, "Consolas");
    outtextxy(190, 280, "Press 'R' to Restart");
    outtextxy(190, 320, "Press 'ESC' to Exit");
    FlushBatchDraw();
}

// --- 主函数：游戏状态机 ---

int main() {
    initgraph(640, 480);
    srand((unsigned int)time(NULL));

    GameState currentState = MAIN_MENU;
    GameMode currentMode = P_VS_AI;
    const char* winner = "";

    BeginBatchDraw();

    while (currentState != -1) { // -1 作为退出程序的信号
        switch (currentState) {
        case MAIN_MENU:
            currentMode = showMainMenu();
            if ((int)currentMode == -1) {
                currentState = (GameState)-1; // 退出
            }
            else {
                currentState = IN_GAME;
            }
            break;

        case IN_GAME:
            winner = runGameLoop(currentMode);
            if (strcmp(winner, "QUIT") == 0) {
                currentState = (GameState)-1; // 退出
            }
            else {
                currentState = GAME_OVER;
            }
            break;

        case GAME_OVER:
            showGameOverScreen(winner);
            ExMessage msg;
            while (true) {
                if (peekmessage(&msg, EX_KEY) && msg.message == WM_KEYDOWN) {
                    if (msg.vkcode == 'R') {
                        currentState = MAIN_MENU; // 返回主菜单
                        break;
                    }
                    if (msg.vkcode == VK_ESCAPE) {
                        currentState = (GameState)-1; // 退出
                        break;
                    }
                }
                Sleep(10);
            }
            break;
        }
    }

    EndBatchDraw();
    closegraph();
    return 0;
}