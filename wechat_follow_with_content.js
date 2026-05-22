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
console.log("请前往微信接龙群聊后，点击悬浮窗的[开始]");

// ================= 全局配置区 =================
var isRunning = false;
var monitorThread = null;
var jielongContent = "这里填入你需要替换的新接龙内容"; // ⬅️ 把引号内换成你想发送的文字
// ============================================

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
                    
                    // 文本替换逻辑
                    // 1. 先用 findOne 阻塞等待，确保页面上至少有一个 guc 存在
                    if (id("guc").findOne(2000)) {
                        sleep(100); // 激进延迟0.1秒：给微信留一点时间把新的一行彻底渲染出来
                        
                        // 2. 用 find() 抓取当前屏幕上所有的 guc 控件，返回一个数组
                        var allBoxes = id("guc").find(); 
                        
                        if (allBoxes.length > 0) {
                            // 3. 直接通过数组的 length - 1 获取最后一个元素，这必然是刚生成的最新行
                            var lastBox = allBoxes[allBoxes.length - 1];
                            lastBox.setText(jielongContent);
                            console.log("📝 文本已替换");
                        }
                    } else {
                        console.error("❌ 丢失目标: 未找到[填写框]");
                    }

                    // 动态捕获发送按钮
                    var sendBtn = id("fp").findOne(2000);
                    if (sendBtn) {
                        sleep(100); // 延迟0.1秒：等待文字填充生效及界面重绘
                        
                        if(!sendBtn.click()){
                             let b = sendBtn.bounds();
                             if (b) click(b.centerX(), b.centerY());
                        }
                        
                        console.info("🎉 接龙成功！");
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