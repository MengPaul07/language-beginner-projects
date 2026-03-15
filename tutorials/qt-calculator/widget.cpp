#include "widget.h"
#include "./ui_widget.h"
#include <QPushButton>
#include <QDebug>

// 构造函数，初始化主窗口和成员变量
Widget::Widget(QWidget *parent)
    : QWidget(parent), ui(new Ui::Widget), firstOperand(0), secondOperand(0), pendingOperator(""), isNewCalculation(true)
{
    // 设置用户界面
    ui->setupUi(this);

    // 设置初始显示为0
    ui->display->setText("0");

    // 创建一个包含所有数字按钮的列表
    QList<QPushButton *> digitButtons = {ui->button0, ui->button1, ui->button2, ui->button3, ui->button4,
                                         ui->button5, ui->button6, ui->button7, ui->button8, ui->button9};
    // 遍历数字按钮列表，将每个按钮的点击信号连接到 onDigitPressed 槽函数
    for (QPushButton *button : digitButtons)
    {
        connect(button, &QPushButton::clicked, this, &Widget::onDigitPressed);
    }

    // 创建一个包含所有操作符按钮的列表
    QList<QPushButton *> operatorButtons = {ui->buttonPlus, ui->buttonMinus, ui->buttonMultiply, ui->buttonDivide};
    // 遍历操作符按钮列表，将每个按钮的点击信号连接到 onOperatorPressed 槽函数
    for (QPushButton *button : operatorButtons)
    {
        connect(button, &QPushButton::clicked, this, &Widget::onOperatorPressed);
    }

    // 将清除按钮的点击信号连接到 onClearPressed 槽函数
    connect(ui->buttonClear, &QPushButton::clicked, this, &Widget::onClearPressed);
    // 将等号按钮的点击信号连接到 onEqualsPressed 槽函数
    connect(ui->buttonEquals, &QPushButton::clicked, this, &Widget::onEqualsPressed);
}

// 析构函数，释放用户界面对象
Widget::~Widget()
{
    delete ui;
}

// 槽函数：处理数字按钮点击事件
void Widget::onDigitPressed()
{
    QPushButton *button = qobject_cast<QPushButton *>(sender());
    if (!button)
        return;

    QString currentText = ui->display->text();
    QString digit = button->text();

    // 如果是新计算或者显示的是错误信息，直接替换
    if (isNewCalculation || currentText == "0" || currentText.contains("Error")) {
        ui->display->setText(digit);
        isNewCalculation = false;
    } else {
        // 否则追加数字
        ui->display->setText(currentText + digit);
    }
}

// 槽函数：处理操作符按钮点击事件
void Widget::onOperatorPressed()
{
    QPushButton *button = qobject_cast<QPushButton *>(sender());
    if (!button)
        return;

    QString currentText = ui->display->text();
    if (!currentText.isEmpty() && !currentText.contains("Error")) {
        firstOperand = currentText.toDouble();
        qDebug() << "First operand set to:" << firstOperand;
    }

    // 将UI中的符号转换为代码中使用的符号
    QString operatorText = button->text();
    if (operatorText == "×") {
        pendingOperator = "*";
    } else if (operatorText == "÷") {
        pendingOperator = "/";
    } else if (operatorText == "−") {  // 修复减法符号问题
        pendingOperator = "-";
    } else {
        pendingOperator = operatorText;
    }

    qDebug() << "Operator set to:" << pendingOperator;

    // 清空显示屏，准备输入第二个操作数
    ui->display->clear();
    isNewCalculation = false;
}

// 槽函数：处理清除按钮点击事件
void Widget::onClearPressed()
{
    firstOperand = 0;
    secondOperand = 0;
    pendingOperator.clear();
    ui->display->setText("0");
    isNewCalculation = true;
    qDebug() << "Cleared all";
}

// 槽函数：处理等号按钮点击事件
void Widget::onEqualsPressed()
{
    if (pendingOperator.isEmpty()) {
        qDebug() << "No operator set";
        return;
    }

    QString currentText = ui->display->text();
    if (currentText.isEmpty() || currentText.contains("Error")) {
        qDebug() << "Display is empty or error";
        return;
    }

    secondOperand = currentText.toDouble();
    qDebug() << "Second operand set to:" << secondOperand;

    double result = 0;

    // 使用正确的符号进行比较
    if (pendingOperator == "+") {
        result = firstOperand + secondOperand;
        qDebug() << "Calculating:" << firstOperand << "+" << secondOperand << "=" << result;
    }
    else if (pendingOperator == "-") {
        result = firstOperand - secondOperand;
        qDebug() << "Calculating:" << firstOperand << "-" << secondOperand << "=" << result;
    }
    else if (pendingOperator == "*") {
        result = firstOperand * secondOperand;
        qDebug() << "Calculating:" << firstOperand << "*" << secondOperand << "=" << result;
    }
    else if (pendingOperator == "/") {
        if (secondOperand != 0) {
            result = firstOperand / secondOperand;
            qDebug() << "Calculating:" << firstOperand << "/" << secondOperand << "=" << result;
        } else {
            ui->display->setText("Error: Division by zero");
            pendingOperator.clear();
            isNewCalculation = true;
            return;
        }
    }

    ui->display->setText(QString::number(result));

    // 重置状态，但保留结果作为下一次计算的第一个操作数
    firstOperand = result;
    pendingOperator.clear();
    isNewCalculation = true;  // 标记为新计算，下次输入数字会清零
    qDebug() << "Result displayed:" << result;
}
