# Zenova — Streamer Website

A clean, aesthetic streamer website with automatic YouTube integration.

## Features

- **Auto YouTube Stats** — Subscriber count, total views, video count update automatically
- **Latest Videos** — Pulls your 3 most recent uploads from YouTube
- **Live Badge** — Automatically detects when you're live streaming (checks every 60 seconds)
- **Smart Caching** — Uses localStorage with a 15-minute TTL so your API quota stays nearly zero
- **Scroll Animations** — Gentle fade-in reveals as you scroll

## Setup

1. Open `config.js` and add your YouTube API Key and Channel ID
2. Open `index.html` in a browser (or use VS Code Live Server)
3. Done!

## Deploy to Netlify

1. Push this folder to a GitHub repository
2. Go to [netlify.com](https://netlify.com) and click **"Add new site" → "Import an existing project"**
3. Connect your GitHub account and select the repo
4. Netlify will auto-detect settings from `netlify.toml` — just click **Deploy**
5. Your site will be live at `https://your-site-name.netlify.app`

## Deploy to GitHub Pages

1. Push this folder to a GitHub repository
2. Go to **Settings → Pages**
3. Under "Source", select **Deploy from a branch** → `main` → `/ (root)`
4. Click Save — your site will be live at `https://username.github.io/repo-name`

## API Quota

This site uses **~3 API units per visitor** (vs 200+ before the optimization). With YouTube's free 10,000 daily quota, that's over **3,000 unique visitors per day** for free. Caching reduces this even further.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main page structure |
| `style.css` | All styles and animations |
| `script.js` | YouTube API integration, scroll animations |
| `config.js` | Your API key and Channel ID |
| `profile.jpg` | Your profile photo |
| `netlify.toml` | Netlify deployment config |
