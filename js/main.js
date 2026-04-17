// ========== 数据加载与缓存降级 ==========
const CACHE_KEY = 'furrycup_data_cache';
const CACHE_TIME_KEY = 'furrycup_data_time';
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24小时

async function fetchDataWithCache() {
    try {
        const response = await fetch('/data/data.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        // 更新缓存
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());

        return data;
    } catch (error) {
        console.warn('[福瑞杯] 拉取最新数据失败，尝试使用缓存:', error);

        const cached = localStorage.getItem(CACHE_KEY);
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

        if (cached && cachedTime) {
            const age = Date.now() - parseInt(cachedTime);
            if (age < MAX_CACHE_AGE) {
                showNotification('📡 网络异常，展示的是上次同步的数据', 'warning');
                return JSON.parse(cached);
            }
        }

        showNotification('❌ 数据加载失败，请刷新重试', 'error');
        return null;
    }
}

// 简易通知条 (可自行美化)
function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `cache-toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: ${type === 'error' ? '#ff4654' : '#2a2a4a'};
        color: white; padding: 10px 20px; border-radius: 30px;
        font-size: 14px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border-left: 4px solid ${type === 'warning' ? '#ffaa00' : '#fff'};
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// 初始化加载 (你原来的初始化函数需要调用这个)
async function initApp() {
    const data = await fetchDataWithCache();
    if (!data) return; // 无数据时显示占位

    // 你原来的渲染逻辑...
    // renderTournaments(data);
    // renderHistory(data.history);
    console.log('数据加载成功', data);
}

// 启动
initApp();
