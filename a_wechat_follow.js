// 检查并请求基础权限
auto.waitFor(); // 等待无障碍服务开启
if (!floaty.checkPermission()) {
    toast("请开启悬浮窗权限");
    floaty.requestPermission();
    exit();
}

// 开启内置可视化监控日志窗口
console.show();
console.info("初始化完成。");
console.log("监测将自动开始");

// 全局变量控制状态
var isRunning = true;
var monitorThread = null;

// 创建悬浮窗界面（控制面板）
var window = floaty.window(
    <horizontal id="action_bar" bg="#99000000" padding="5" borderRadius="8">
        <text text="✋拖拽" textColor="white" textSize="14sp" margin="5 0 5 0" gravity="center"/>
        <button id="start" text="开始" w="60" h="40" bg="#4CAF50" textColor="white" margin="0 5" style="Widget.AppCompat.Button.Borderless"/>
        <button id="stop" text="停止" w="60" h="40" bg="#F44336" textColor="white" margin="0 5" style="Widget.AppCompat.Button.Borderless"/>
        <button id="exit" text="退出" w="60" h="40" bg="#9E9E9E" textColor="white" margin="0 5" style="Widget.AppCompat.Button.Borderless"/>
    </horizontal>
);

window.setPosition(100, 200);

// 悬浮窗拖拽逻辑
var x = 0, y = 0, windowX, windowY;
window.action_bar.setOnTouchListener(function(view, event) {
    switch (event.getAction()) {
        case event.ACTION_DOWN:
            x = event.getRawX();
            y = event.getRawY();
            windowX = window.getX();
            windowY = window.getY();
            return true;
        case event.ACTION_MOVE:
            window.setPosition(windowX + (event.getRawX() - x), windowY + (event.getRawY() - y));
            return true;
    }
    return true;
});

//自动开启接龙子线程
monitorThread = threads.start(function() {
    monitorJielong();
});
console.info("⚡ 扫描中...");

// 按钮点击事件
window.start.click(() => {
    if (isRunning) {
        console.warn("⚠️ 已经在监测中了，请勿重复点击！");
        return;
    }
    isRunning = true;
    console.info("⚡ 扫描中...");
    
    // 开启子线程进行监测
    monitorThread = threads.start(function() {
        monitorJielong();
    });
});

window.stop.click(() => {
    if (!isRunning) return;
    stopMonitor();
    console.info("⏸️ 已手动停止监测");
});

window.exit.click(() => {
    console.info("⏹️ 退出接龙助手...");
    stopMonitor();
    window.close();
    console.hide();
    exit();
});

// 停止监测封装函数
function stopMonitor() {
    isRunning = false;
    if (monitorThread && monitorThread.isAlive()) {
        monitorThread.interrupt(); 
    }
}

// 接龙逻辑
function monitorJielong() {
    while (isRunning) {
        // 设置检测超时
        var bjpBtn = id("bjp").text("参与接龙").findOne(200); 
        
        if (bjpBtn) {
            try {
                //点击参与接龙
                if (!bjpBtn.click()) {
                    var bounds = bjpBtn.bounds();
                    if (bounds) click(bounds.centerX(), bounds.centerY());
                }

                // 用 findOne 动态捕获加号
                var addBtn = id("gui").findOne(2000);
                if (addBtn) {
                    sleep(100); // 延迟0.1秒：等待微信页面跳转动画响应完毕，防止点击丢失
                    
                    if (!addBtn.click()) {
                         let b = addBtn.bounds();
                         if (b) click(b.centerX(), b.centerY());
                    }
                    
                    // 动态捕获发送按钮
                    var sendBtn = id("fp").findOne(2000);
                    if (sendBtn) {
                        sleep(100); // 延迟0.1秒：等待加号按下的输入框弹出动画
                        
                        if(!sendBtn.click()){
                             let b = sendBtn.bounds();
                             if (b) click(b.centerX(), b.centerY());
                        }
                        
                        console.info("接龙成功！");
                        stopMonitor(); 
                        break; 
                    } else {
                        console.error("❌ 丢失目标: 未找到[发送]");
                    }
                } else {
                    console.error("❌ 丢失目标: 未找到[加号]");
                }
            } catch (e) {
                console.error("❌ 报错: " + e);
            }
        }
        
        //设置轮询间隔
        sleep(5); 
    }
}

// 保持脚本处于激活状态
setInterval(() => {}, 1000);