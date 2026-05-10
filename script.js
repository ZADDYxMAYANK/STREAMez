document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Icons
    lucide.createIcons();

    // 2. Highlight Current Day in Schedule
    highlightCurrentDay();

    // 3. Load YouTube Videos & Live Status
    initYouTubeIntegration();

    // 4. Scroll-reveal animations
    initScrollReveal();

    // 5. Nav scroll effect
    initNavScroll();

    // 6. Dark/Light mode toggle
    initThemeToggle();

    // 7. Live badge click handler
    initLiveBadgeClick();
});

// ===========================
// Live Badge Click Handler
// ===========================
function initLiveBadgeClick() {
    const liveBadge = document.getElementById('live-badge');
    const channelUrl = typeof CONFIG !== 'undefined' ? CONFIG.YOUTUBE_CHANNEL_URL : null;

    if (!liveBadge || !channelUrl) return;

    liveBadge.addEventListener('click', () => {
        window.open(channelUrl, '_blank');
    });
}

// ===========================
// Theme Toggle (Dark / Light)
// ===========================
function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    // Load saved preference (or default to light)
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    toggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
        // Re-render icons so the sun/moon swap works
        lucide.createIcons();
    });
}

// ===========================
// Scroll Reveal (gentle fade-in)
// ===========================
function initScrollReveal() {
    const reveals = document.querySelectorAll('[data-reveal]');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Stagger the reveal slightly for multiple items
                setTimeout(() => {
                    entry.target.classList.add('revealed');
                }, index * 80);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => observer.observe(el));
}

// ===========================
// Nav background on scroll
// ===========================
function initNavScroll() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }, { passive: true });
}

// ===========================
// Highlight current day
// ===========================
function highlightCurrentDay() {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDayName = days[new Date().getDay()];

    document.querySelectorAll('.schedule-day').forEach(el => el.classList.remove('active'));

    const element = document.getElementById(`schedule-${currentDayName}`);
    if (element) {
        element.classList.add('active');
    } else {
        document.getElementById('schedule-wed')?.classList.add('active');
    }
}

// ===========================
// Number formatting helpers
// ===========================
function formatNumberShort(numStr) {
    if (!numStr) return '0';
    const num = parseInt(numStr);
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
}

function formatViews(views) {
    if (!views) return '0 views';
    const num = parseInt(views);
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M views';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K views';
    return num + ' views';
}

function timeSince(dateStr) {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
}

function formatDuration(isoDuration) {
    const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return "00:00";
    const hours = (match[1] || "").replace("H", "");
    const minutes = (match[2] || "").replace("M", "") || "0";
    const seconds = (match[3] || "").replace("S", "") || "0";
    let result = "";
    if (hours) result += `${hours}:`;
    result += `${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    return result;
}

// ===========================
// LocalStorage Cache (15 min TTL)
// ===========================
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function getCached(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp > CACHE_TTL) {
            localStorage.removeItem(key);
            return null;
        }
        return parsed.data;
    } catch { return null; }
}

function setCache(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch { /* storage full — ignore */ }
}

// ===========================
// YouTube Integration
// ===========================
async function initYouTubeIntegration() {
    const apiKey = typeof CONFIG !== 'undefined' ? CONFIG.YOUTUBE_API_KEY : 'YOUR_API_KEY_HERE';
    const channelId = typeof CONFIG !== 'undefined' ? CONFIG.CHANNEL_ID : 'YOUR_CHANNEL_ID_HERE';

    if (apiKey === 'YOUR_API_KEY_HERE' || channelId === 'YOUR_CHANNEL_ID_HERE') {
        console.warn("YouTube API Key or Channel ID missing. Using placeholder data.");
        renderPlaceholderVideos();
        scheduleMockLiveStatus();
        return;
    }

    // All fetches use caching to save quota
    fetchChannelStats(apiKey, channelId);
    fetchLatestVideos(apiKey, channelId);
    checkLiveStatus(apiKey, channelId);
    setInterval(() => checkLiveStatus(apiKey, channelId), 60000);
}

// ===========================
// Channel Stats (1 unit per call)
// ===========================
async function fetchChannelStats(apiKey, channelId) {
    const cacheKey = `yt_stats_${channelId}`;
    const cached = getCached(cacheKey);

    if (cached) {
        applyStats(cached);
        return;
    }

    try {
        const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const stats = data.items[0].statistics;
            setCache(cacheKey, stats);
            applyStats(stats);
        }
    } catch (error) {
        console.error("Error fetching channel stats:", error);
    }
}

function applyStats(stats) {
    document.getElementById('stat-subs').textContent = formatNumberShort(stats.subscriberCount);
    document.getElementById('stat-views').textContent = formatNumberShort(stats.viewCount);
    document.getElementById('stat-videos').textContent = formatNumberShort(stats.videoCount);
}

// ===========================
// Latest Videos — uses playlistItems (1 unit!) instead of search (100 units!)
// ===========================
async function fetchLatestVideos(apiKey, channelId) {
    const container = document.getElementById('video-container');
    const cacheKey = `yt_videos_${channelId}`;
    const cached = getCached(cacheKey);

    if (cached) {
        renderVideos(container, cached);
        return;
    }

    try {
        // Derive uploads playlist ID: replace "UC" prefix with "UU"
        const uploadsPlaylistId = 'UU' + channelId.substring(2);

        // playlistItems endpoint = 1 unit (vs search = 100 units!)
        const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=3&key=${apiKey}`;
        const playlistResponse = await fetch(playlistUrl);
        const playlistData = await playlistResponse.json();

        if (playlistData.error) throw new Error(playlistData.error.message);
        if (!playlistData.items || playlistData.items.length === 0) {
            container.innerHTML = "<p>No videos found for this channel.</p>";
            return;
        }

        // Get video IDs for stats + duration (1 more unit)
        const videoIds = playlistData.items.map(item => item.snippet.resourceId.videoId).join(',');
        const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${apiKey}`;
        const statsResponse = await fetch(statsUrl);
        const statsData = await statsResponse.json();

        // Build video data array
        const videos = playlistData.items.map((item, index) => {
            const videoDetails = statsData.items[index] || {};
            return {
                videoId: item.snippet.resourceId.videoId,
                title: item.snippet.title,
                thumbnailUrl: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
                publishDate: item.snippet.publishedAt,
                viewCount: videoDetails.statistics?.viewCount,
                duration: videoDetails.contentDetails?.duration || "PT0M0S"
            };
        });

        setCache(cacheKey, videos);
        renderVideos(container, videos);

    } catch (error) {
        console.error("Error fetching YouTube videos:", error);
        container.innerHTML = `<p style="color:#b85c5c;">Failed to load videos: ${error.message}</p>`;
    }
}

function renderVideos(container, videos) {
    container.innerHTML = '';

    videos.forEach(item => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <a href="https://youtube.com/watch?v=${item.videoId}" target="_blank" class="video-thumb">
                <img src="${item.thumbnailUrl}" alt="${item.title}" loading="lazy">
                <div class="play-icon-overlay">
                    <i data-lucide="play" fill="currentColor"></i>
                </div>
                <div class="duration-badge">${formatDuration(item.duration)}</div>
            </a>
            <a href="https://youtube.com/watch?v=${item.videoId}" target="_blank" class="video-title">
                ${item.title}
            </a>
            <div class="video-meta">
                ${formatViews(item.viewCount)} · ${timeSince(item.publishDate)}
            </div>
        `;
        container.appendChild(card);
    });

    lucide.createIcons();
}

// ===========================
// Live Status Check
// ===========================
async function checkLiveStatus(apiKey, channelId) {
    const liveBadge = document.getElementById('live-badge');
    const cacheKey = `yt_live_${channelId}`;
    const cached = getCached(cacheKey);

    // Use shorter cache for live status (60 seconds)
    if (cached !== null) {
        liveBadge.classList.toggle('is-live', cached);
        return;
    }

    try {
        const liveUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=live&key=${apiKey}`;
        const response = await fetch(liveUrl);
        const data = await response.json();

        const isLive = data.items && data.items.length > 0;
        // Cache live status for 60 seconds only
        try {
            localStorage.setItem(cacheKey, JSON.stringify({ data: isLive, timestamp: Date.now() }));
        } catch {}

        liveBadge.classList.toggle('is-live', isLive);
    } catch (error) {
        console.error("Error checking live status:", error);
    }
}

// ===========================
// Placeholder / Demo Mode
// ===========================
function renderPlaceholderVideos() {
    const container = document.getElementById('video-container');
    container.innerHTML = '';

    const dummies = [
        { title: "This game broke me in the best way possible", views: "188K views", date: "2 days ago", duration: "22:14", color: "#DDC8B7" },
        { title: "Solo ranked but I'm surprisingly calm", views: "97K views", date: "5 days ago", duration: "16:50", color: "#9FAC9D" },
        { title: "Hidden gem RPG nobody talks about", views: "74K views", date: "1 week ago", duration: "31:07", color: "#D0BFB0" }
    ];

    dummies.forEach(item => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <a href="#" class="video-thumb" style="background-color:${item.color};">
                <div class="play-icon-overlay">
                    <i data-lucide="play" fill="currentColor"></i>
                </div>
                <div class="duration-badge">${item.duration}</div>
            </a>
            <a href="#" class="video-title">${item.title}</a>
            <div class="video-meta">${item.views} · ${item.date}</div>
        `;
        container.appendChild(card);
    });

    lucide.createIcons();
}

function scheduleMockLiveStatus() {
    const liveBadge = document.getElementById('live-badge');
    liveBadge.classList.add('is-live');
}
