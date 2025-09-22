/**
 * Service Worker
 * 提供离线缓存、资源管理和后台同步功能
 */

const CACHE_NAME = 'rhelper-v1.0.0';
const STATIC_CACHE = 'rhelper-static-v1.0.0';
const DYNAMIC_CACHE = 'rhelper-dynamic-v1.0.0';
const IMAGE_CACHE = 'rhelper-images-v1.0.0';

// 需要缓存的静态资源
const STATIC_ASSETS = [
    '/',
    '/static/css/advanced-code-editor.css',
    '/static/js/advanced-code-editor.js',
    '/static/js/interaction-enhancer.js',
    '/static/js/performance-optimizer.js',
    '/static/css/bootstrap.min.css',
    '/static/js/bootstrap.bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs/loader.js'
];

// 需要动态缓存的路由模式
const DYNAMIC_CACHE_PATTERNS = [
    /^\/api\//,
    /^\/static\//,
    /\.json$/,
    /\.js$/,
    /\.css$/
];

// 图片缓存模式
const IMAGE_CACHE_PATTERNS = [
    /\.jpg$/,
    /\.jpeg$/,
    /\.png$/,
    /\.gif$/,
    /\.webp$/,
    /\.svg$/
];

// 缓存时间限制
const CACHE_EXPIRY = {
    static: 7 * 24 * 60 * 60 * 1000,    // 7天
    dynamic: 3 * 24 * 60 * 60 * 1000,   // 3天
    images: 30 * 24 * 60 * 60 * 1000,   // 30天
    api: 5 * 60 * 1000                  // 5分钟
};

// ===== Service Worker 生命周期 =====

// 安装事件
self.addEventListener('install', (event) => {
    console.log('Service Worker 安装中...');
    
    event.waitUntil(
        Promise.all([
            // 缓存静态资源
            caches.open(STATIC_CACHE).then(cache => {
                console.log('缓存静态资源...');
                return cache.addAll(STATIC_ASSETS.map(url => {
                    return new Request(url, { cache: 'reload' });
                }));
            }),
            
            // 跳过等待，立即激活
            self.skipWaiting()
        ])
    );
});

// 激活事件
self.addEventListener('activate', (event) => {
    console.log('Service Worker 激活中...');
    
    event.waitUntil(
        Promise.all([
            // 清理旧缓存
            cleanOldCaches(),
            
            // 声明控制所有客户端
            self.clients.claim()
        ])
    );
});

// 消息事件
self.addEventListener('message', (event) => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_CACHE_SIZE':
            getCacheSize().then(size => {
                event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
            });
            break;
            
        case 'CLEAR_CACHE':
            clearCache(payload.cacheName).then(() => {
                event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
            });
            break;
            
        case 'PREFETCH_URLS':
            prefetchUrls(payload.urls);
            break;
            
        default:
            console.warn('未知消息类型:', type);
    }
});

// ===== 网络请求拦截 =====

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // 跳过非HTTP(S)请求
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // 跳过POST请求的缓存
    if (request.method !== 'GET') {
        return;
    }
    
    // 根据请求类型选择缓存策略
    if (isStaticAsset(request)) {
        event.respondWith(handleStaticAsset(request));
    } else if (isImageRequest(request)) {
        event.respondWith(handleImageRequest(request));
    } else if (isDynamicRequest(request)) {
        event.respondWith(handleDynamicRequest(request));
    } else if (isApiRequest(request)) {
        event.respondWith(handleApiRequest(request));
    } else {
        event.respondWith(handleDefaultRequest(request));
    }
});

// ===== 缓存策略实现 =====

// 静态资源：缓存优先
async function handleStaticAsset(request) {
    try {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        
        if (cached && !isCacheExpired(cached, CACHE_EXPIRY.static)) {
            return cached;
        }
        
        // 网络请求
        const response = await fetch(request);
        
        if (response.ok) {
            const responseClone = response.clone();
            addTimestamp(responseClone);
            cache.put(request, responseClone);
        }
        
        return response;
        
    } catch (error) {
        console.error('静态资源加载失败:', request.url, error);
        
        // 回退到缓存
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        
        if (cached) {
            return cached;
        }
        
        // 返回离线页面
        if (request.destination === 'document') {
            return createOfflinePage();
        }
        
        throw error;
    }
}

// 图片资源：缓存优先，长期缓存
async function handleImageRequest(request) {
    try {
        const cache = await caches.open(IMAGE_CACHE);
        const cached = await cache.match(request);
        
        if (cached && !isCacheExpired(cached, CACHE_EXPIRY.images)) {
            return cached;
        }
        
        const response = await fetch(request);
        
        if (response.ok) {
            const responseClone = response.clone();
            addTimestamp(responseClone);
            cache.put(request, responseClone);
        }
        
        return response;
        
    } catch (error) {
        console.error('图片加载失败:', request.url, error);
        
        // 回退到缓存
        const cache = await caches.open(IMAGE_CACHE);
        const cached = await cache.match(request);
        
        if (cached) {
            return cached;
        }
        
        // 返回占位图片
        return createPlaceholderImage();
    }
}

// 动态资源：网络优先，回退到缓存
async function handleDynamicRequest(request) {
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            const responseClone = response.clone();
            addTimestamp(responseClone);
            cache.put(request, responseClone);
        }
        
        return response;
        
    } catch (error) {
        console.error('动态资源加载失败:', request.url, error);
        
        // 回退到缓存
        const cache = await caches.open(DYNAMIC_CACHE);
        const cached = await cache.match(request);
        
        if (cached && !isCacheExpired(cached, CACHE_EXPIRY.dynamic)) {
            return cached;
        }
        
        throw error;
    }
}

// API请求：网络优先，短期缓存
async function handleApiRequest(request) {
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            const responseClone = response.clone();
            addTimestamp(responseClone);
            cache.put(request, responseClone);
        }
        
        return response;
        
    } catch (error) {
        console.error('API请求失败:', request.url, error);
        
        // 回退到缓存（如果有）
        const cache = await caches.open(DYNAMIC_CACHE);
        const cached = await cache.match(request);
        
        if (cached && !isCacheExpired(cached, CACHE_EXPIRY.api)) {
            // 添加离线标记
            const offlineResponse = cached.clone();
            offlineResponse.headers.set('X-Served-From-Cache', 'true');
            return offlineResponse;
        }
        
        // 返回离线响应
        return new Response(
            JSON.stringify({
                error: '网络连接失败',
                offline: true,
                timestamp: Date.now()
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Served-From-Cache': 'false'
                }
            }
        );
    }
}

// 默认请求：网络优先
async function handleDefaultRequest(request) {
    try {
        return await fetch(request);
    } catch (error) {
        console.error('默认请求失败:', request.url, error);
        
        // 如果是HTML页面，返回离线页面
        if (request.destination === 'document') {
            return createOfflinePage();
        }
        
        throw error;
    }
}

// ===== 辅助函数 =====

// 判断请求类型
function isStaticAsset(request) {
    return STATIC_ASSETS.some(asset => request.url.includes(asset)) ||
           request.url.includes('/static/') ||
           request.url.includes('.css') ||
           request.url.includes('.js');
}

function isImageRequest(request) {
    return IMAGE_CACHE_PATTERNS.some(pattern => pattern.test(request.url)) ||
           request.destination === 'image';
}

function isDynamicRequest(request) {
    return DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
}

function isApiRequest(request) {
    return request.url.includes('/api/') ||
           request.url.includes('.json');
}

// 缓存过期检查
function isCacheExpired(response, maxAge) {
    const timestamp = response.headers.get('X-Cache-Timestamp');
    if (!timestamp) return true;
    
    const age = Date.now() - parseInt(timestamp);
    return age > maxAge;
}

// 添加时间戳
function addTimestamp(response) {
    response.headers.set('X-Cache-Timestamp', Date.now().toString());
    return response;
}

// 清理旧缓存
async function cleanOldCaches() {
    const cacheNames = await caches.keys();
    const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE];
    
    return Promise.all(
        cacheNames.map(cacheName => {
            if (!currentCaches.includes(cacheName)) {
                console.log('删除旧缓存:', cacheName);
                return caches.delete(cacheName);
            }
        })
    );
}

// 获取缓存大小
async function getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
    }
    
    return totalSize;
}

// 清理指定缓存
async function clearCache(cacheName) {
    if (cacheName) {
        return caches.delete(cacheName);
    } else {
        const cacheNames = await caches.keys();
        return Promise.all(cacheNames.map(name => caches.delete(name)));
    }
}

// 预加载URL
async function prefetchUrls(urls) {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    return Promise.all(
        urls.map(async (url) => {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    addTimestamp(response);
                    await cache.put(url, response);
                }
            } catch (error) {
                console.error('预加载失败:', url, error);
            }
        })
    );
}

// 创建离线页面
function createOfflinePage() {
    const html = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>离线模式 - R语言助手</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0;
                    padding: 2rem;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .offline-container {
                    background: white;
                    border-radius: 16px;
                    padding: 3rem;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    max-width: 500px;
                }
                .offline-icon {
                    font-size: 4rem;
                    color: #667eea;
                    margin-bottom: 1rem;
                }
                .offline-title {
                    font-size: 2rem;
                    color: #333;
                    margin-bottom: 1rem;
                }
                .offline-message {
                    color: #666;
                    margin-bottom: 2rem;
                    line-height: 1.6;
                }
                .retry-button {
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 8px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background 0.3s ease;
                }
                .retry-button:hover {
                    background: #5a6fd8;
                }
                .cached-pages {
                    margin-top: 2rem;
                    text-align: left;
                }
                .cached-pages h3 {
                    color: #333;
                    margin-bottom: 1rem;
                }
                .cached-pages ul {
                    list-style: none;
                    padding: 0;
                }
                .cached-pages li {
                    padding: 0.5rem;
                    border-radius: 4px;
                    margin-bottom: 0.5rem;
                    background: #f8f9fa;
                }
                .cached-pages a {
                    color: #667eea;
                    text-decoration: none;
                }
            </style>
        </head>
        <body>
            <div class="offline-container">
                <div class="offline-icon">📱</div>
                <h1 class="offline-title">离线模式</h1>
                <p class="offline-message">
                    网络连接似乎出现了问题，但您仍然可以访问一些缓存的内容。
                </p>
                <button class="retry-button" onclick="location.reload()">
                    重试连接
                </button>
                
                <div class="cached-pages">
                    <h3>可用的缓存页面：</h3>
                    <ul>
                        <li><a href="/">首页</a></li>
                        <li><a href="/dashboard">仪表板</a></li>
                    </ul>
                </div>
            </div>
            
            <script>
                // 监听网络状态恢复
                window.addEventListener('online', () => {
                    location.reload();
                });
            </script>
        </body>
        </html>
    `;
    
    return new Response(html, {
        status: 200,
        statusText: 'OK',
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Served-By': 'ServiceWorker'
        }
    });
}

// 创建占位图片
function createPlaceholderImage() {
    // 创建一个简单的SVG占位图片
    const svg = `
        <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#f0f0f0;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#e0e0e0;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="400" height="300" fill="url(#grad1)" />
            <text x="200" y="150" font-family="Arial, sans-serif" font-size="16" 
                  fill="#999" text-anchor="middle" dominant-baseline="middle">
                图片暂时无法加载
            </text>
        </svg>
    `;
    
    return new Response(svg, {
        status: 200,
        statusText: 'OK',
        headers: {
            'Content-Type': 'image/svg+xml',
            'X-Served-By': 'ServiceWorker'
        }
    });
}

// ===== 后台同步 =====

// 注册后台同步
self.addEventListener('sync', (event) => {
    console.log('后台同步触发:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    } else if (event.tag === 'cache-update') {
        event.waitUntil(updateCaches());
    }
});

// 执行后台同步
async function doBackgroundSync() {
    try {
        // 同步离线期间的数据
        await syncOfflineData();
        
        // 更新缓存
        await updateCaches();
        
        console.log('后台同步完成');
    } catch (error) {
        console.error('后台同步失败:', error);
        throw error;
    }
}

// 同步离线数据
async function syncOfflineData() {
    // 这里可以实现离线数据的同步逻辑
    // 例如：上传用户在离线时保存的数据
    console.log('同步离线数据...');
}

// 更新缓存
async function updateCaches() {
    const cache = await caches.open(STATIC_CACHE);
    
    // 更新关键资源
    const updatePromises = STATIC_ASSETS.map(async (url) => {
        try {
            const response = await fetch(url, { cache: 'reload' });
            if (response.ok) {
                await cache.put(url, response);
            }
        } catch (error) {
            console.error('更新缓存失败:', url, error);
        }
    });
    
    await Promise.allSettled(updatePromises);
    console.log('缓存更新完成');
}

// ===== 推送通知 =====

self.addEventListener('push', (event) => {
    const options = {
        body: '您有新的通知',
        icon: '/static/images/icon-192x192.png',
        badge: '/static/images/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '查看',
                icon: '/static/images/checkmark.png'
            },
            {
                action: 'close',
                title: '关闭',
                icon: '/static/images/xmark.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('R语言助手', options)
    );
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            self.clients.openWindow('/')
        );
    }
});

console.log('Service Worker 已加载');