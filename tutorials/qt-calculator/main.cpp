// 引入主窗口类的声明
#include "widget.h"

// 引入 Qt 应用程序核心类
#include <QApplication>

// 程序入口函数
int main(int argc, char *argv[])
{
    // 创建一个 Qt 应用程序对象，管理应用程序生命周期和事件循环
    QApplication a(argc, argv);

    // 创建主窗口对象
    Widget w;

    // 显示主窗口
    w.show();

    // 启动事件循环，等待用户交互
    return a.exec();
}
