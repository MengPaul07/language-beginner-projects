# Qt Calculator 入门教程

> 我们终于要步入现代化了吗？

还在为不同操作系统重复写代码而头疼？
厌倦命令行程序的单调界面？
想用 C++ 开发出颜值与性能兼备的软件？

Qt 在等着你。

## 为什么是 Qt

Qt 不只是 GUI 框架，更是完整的开发生态。

- 一次编写，到处编译（Windows/macOS/Linux/移动端/嵌入式）
- 强大的界面设计能力（可视化拖拽）
- 独特的信号槽机制（优雅处理用户交互）
- 丰富的功能模块（网络、数据库、多媒体、3D 等）

> 本文目标是做一个入门计算器，重点体验面向对象思想、信号与槽、Qt 项目结构。

---

## 01 环境安装

### 1. 安装 Qt 在线安装器

下载地址：

- https://www.qt.io/download-qt-installer-oss

如需加速下载，可在安装器目录打开 PowerShell，使用中科大镜像启动安装器：

```powershell
.\qt-online-installer-windows-x64-4.10.0.exe --mirror https://mirrors.ustc.edu.cn/qtproject
```

> 把文件名替换成你实际下载的安装器名称。

安装过程中：

- 注册并登录 Qt 账号（需要邮箱验证）
- 选择个人用途，避免商业许可误选
- 安装编译器与 Qt Creator
- 额外库按需勾选，不建议全量安装

---

## 02 项目创建

在 Qt Creator 中创建新项目：

1. New Project
2. 选择 Qt Widgets Application
3. 命名项目
4. 选择 QWidget 基础模板
5. 选择一个可用编译器

项目创建后，先理解结构：

- CMakeLists.txt：构建脚本，决定怎么编译
- widget.ui：界面布局（XML）
- widget.h：类声明（成员变量、槽函数）
- widget.cpp：业务逻辑实现
- main.cpp：程序入口

---

## 03 先看主流程

main.cpp 负责应用启动和主窗口展示：

```cpp
#include "widget.h"
#include <QApplication>

int main(int argc, char *argv[]) {
    QApplication a(argc, argv);
    Widget w;
    w.show();
    return a.exec();
}
```

---

## 04 设计类与槽函数

### 1. 初始头文件（简化版）

```cpp
#ifndef WIDGET_H
#define WIDGET_H

#include <QWidget>

QT_BEGIN_NAMESPACE
namespace Ui {
class Widget;
}
QT_END_NAMESPACE

class Widget : public QWidget {
    Q_OBJECT

public:
    Widget(QWidget *parent = nullptr);
    ~Widget();

private:
    Ui::Widget *ui;
};

#endif
```

### 2. 扩展后头文件（计算器版）

```cpp
#ifndef WIDGET_H
#define WIDGET_H

#include <QWidget>

QT_BEGIN_NAMESPACE
namespace Ui {
class Widget;
}
QT_END_NAMESPACE

class Widget : public QWidget {
    Q_OBJECT

public:
    Widget(QWidget *parent = nullptr);
    ~Widget();

private slots:
    void onDigitPressed();
    void onOperatorPressed();
    void onClearPressed();
    void onEqualsPressed();

private:
    Ui::Widget *ui;
    double firstOperand;
    double secondOperand;
    QString pendingOperator;
    bool isNewCalculation;
};

#endif
```

### 槽函数是什么

槽函数可以理解为“事件发生后执行的处理函数”。

- 事件：按钮被点击
- 信号：按钮发出 clicked
- 连接：connect 把信号连到槽函数
- 槽：onDigitPressed 等具体业务逻辑

---

## 05 连接信号与槽

在构造函数里完成连接：

```cpp
#include "widget.h"
#include "./ui_widget.h"
#include <QPushButton>

Widget::Widget(QWidget *parent)
    : QWidget(parent),
      ui(new Ui::Widget),
      firstOperand(0),
      secondOperand(0),
      isNewCalculation(true) {
    ui->setupUi(this);

    QList<QPushButton *> digitButtons = {
        ui->button0, ui->button1, ui->button2, ui->button3, ui->button4,
        ui->button5, ui->button6, ui->button7, ui->button8, ui->button9
    };

    for (QPushButton *button : digitButtons) {
        connect(button, &QPushButton::clicked, this, &Widget::onDigitPressed);
    }

    QList<QPushButton *> operatorButtons = {
        ui->buttonPlus, ui->buttonMinus, ui->buttonMultiply, ui->buttonDivide
    };

    for (QPushButton *button : operatorButtons) {
        connect(button, &QPushButton::clicked, this, &Widget::onOperatorPressed);
    }

    connect(ui->buttonClear,  &QPushButton::clicked, this, &Widget::onClearPressed);
    connect(ui->buttonEquals, &QPushButton::clicked, this, &Widget::onEqualsPressed);
}

Widget::~Widget() {
    delete ui;
}
```

> 如果你不想用循环，也可以一个按钮一个按钮 connect。

---

## 06 槽函数实现

### 1. 数字输入

```cpp
void Widget::onDigitPressed() {
    QPushButton *button = qobject_cast<QPushButton *>(sender());
    if (!button) return;

    QString currentText = ui->display->text();
    QString digit = button->text();

    if (isNewCalculation || currentText == "0" || currentText.contains("Error")) {
        ui->display->setText(digit);
        isNewCalculation = false;
    } else {
        ui->display->setText(currentText + digit);
    }
}
```

### 2. 运算符输入

```cpp
void Widget::onOperatorPressed() {
    QPushButton *button = qobject_cast<QPushButton *>(sender());
    if (!button) return;

    QString currentText = ui->display->text();
    if (!currentText.isEmpty() && !currentText.contains("Error")) {
        firstOperand = currentText.toDouble();
    }

    QString operatorText = button->text();
    if (operatorText == "×")      pendingOperator = "*";
    else if (operatorText == "÷") pendingOperator = "/";
    else if (operatorText == "−") pendingOperator = "-";
    else                            pendingOperator = operatorText;

    ui->display->clear();
    isNewCalculation = false;
}
```

### 3. 清除

```cpp
void Widget::onClearPressed() {
    firstOperand = 0;
    secondOperand = 0;
    pendingOperator.clear();
    ui->display->setText("0");
    isNewCalculation = true;
}
```

### 4. 等号

```cpp
void Widget::onEqualsPressed() {
    if (pendingOperator.isEmpty()) return;

    QString currentText = ui->display->text();
    if (currentText.isEmpty() || currentText.contains("Error")) return;

    secondOperand = currentText.toDouble();
    double result = 0;

    if (pendingOperator == "+") {
        result = firstOperand + secondOperand;
    } else if (pendingOperator == "-") {
        result = firstOperand - secondOperand;
    } else if (pendingOperator == "*") {
        result = firstOperand * secondOperand;
    } else if (pendingOperator == "/") {
        if (secondOperand == 0) {
            ui->display->setText("Error: Division by zero");
            pendingOperator.clear();
            isNewCalculation = true;
            return;
        }
        result = firstOperand / secondOperand;
    }

    ui->display->setText(QString::number(result));
    firstOperand = result;
    pendingOperator.clear();
    isNewCalculation = true;
}
```

---

## 07 CMake 最小配置

如果你使用 Qt Creator 的默认模板，通常不需要手改 CMake。

学习用最小配置如下：

```cmake
cmake_minimum_required(VERSION 3.16)
project(Calculator)

set(CMAKE_AUTOUIC ON)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_CXX_STANDARD 17)

find_package(Qt6 REQUIRED COMPONENTS Widgets)

add_executable(Calculator
    main.cpp
    widget.cpp
    widget.h
    widget.ui
)

target_link_libraries(Calculator PRIVATE Qt6::Widgets)
```

---

## 08 调试记录与修复

### 问题 1
初始显示为 0 时继续输入，会变成 0XXX。

修复：在数字槽中处理初始 0 / Error / 新计算状态。

### 问题 2
UI 美化后乘除减异常，结果经常为 0。

原因：按钮字符是 × ÷ −，与内部运算符 * / - 不一致。

修复：在 onOperatorPressed 中做符号映射。

### 问题 3
连续运算状态混乱，等号后继续输入没有清屏。

修复：增加 isNewCalculation 状态位，等号后重置状态。

> qDebug 输出仅用于调试，发布前可删除。

---

## 09 成果与扩展

你现在已经完成一个可用的 Qt 计算器。

后续可以继续做：

- 浮点格式控制（保留小数位）
- 连续表达式输入（如 1 + 2 * 3）
- 键盘快捷键支持
- 主题切换与深色模式

---

## 10 参考仓库

- https://github.com/MengPaul07/Qt-Calculator

祝你在 CS 的学习路上更进一步。
