#ifndef WIDGET_H
#define WIDGET_H

// 引入 Qt 的 QWidget 类，所有窗口部件的基类
#include <QWidget>

QT_BEGIN_NAMESPACE
namespace Ui
{
    // 声明 Ui 命名空间中的 Widget 类
    class Widget;
}
QT_END_NAMESPACE

// 定义 Widget 类，继承自 QWidget
class Widget : public QWidget
{
Q_OBJECT // 启用 Qt 的信号和槽机制

    public :
    // 构造函数，接受一个父窗口指针，默认为 nullptr
    Widget(QWidget *parent = nullptr);

    // 析构函数
    ~Widget();

private slots:
    // 槽函数：处理数字按钮点击事件
    void onDigitPressed();

    // 槽函数：处理操作符按钮点击事件
    void onOperatorPressed();

    // 槽函数：处理清除按钮点击事件
    void onClearPressed();

    // 槽函数：处理等号按钮点击事件
    void onEqualsPressed();

private:
    Ui::Widget *ui;
    double firstOperand;
    double secondOperand;
    QString pendingOperator;
    bool isNewCalculation;  // 新增：标记是否为新计算
};
#endif // WIDGET_H



