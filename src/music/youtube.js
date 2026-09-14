'use strict';

const { spawn } = require('child_process');
const YouTube = require('youtube-sr').default;
const path = require('path');
const fs = require('fs');
const https = require('https');

const YT_DLP_PATH = path.join(__dirname, '../../yt-dlp');
const COOKIES_PATH = path.join(__dirname, '../../cookies.txt');

async function ensureYtDlp() {
  if (fs.existsSync(YT_DLP_PATH)) return;

  console.log('[yt-dlp] Downloading yt-dlp for Linux...');
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(YT_DLP_PATH);
    https.get('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp', (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        https.get(res.headers.location, (res2) => {
          res2.pipe(file);
          file.on('finish', () => {
            file.close();
            fs.chmodSync(YT_DLP_PATH, '755');
            console.log('[yt-dlp] Downloaded!');
            resolve();
          });
        }).on('error', reject);
      } else {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          fs.chmodSync(YT_DLP_PATH, '755');
          console.log('[yt-dlp] Downloaded!');
          resolve();
        });
      }
    }).on('error', reject);
  });
}

async function searchYoutube(query) {
  try {
    if (query.startsWith('http')) {
      const video = await YouTube.getVideo(query).catch(() => null);
      if (video) {
        return { title: video.title, url: video.url, thumbnail: video.thumbnail?.url || null, duration: video.durationFormatted || 'Inconnue' };
      }
    }
    const video = await YouTube.searchOne(query);
    if (!video) return null;
    return { title: video.title, url: video.url, thumbnail: video.thumbnail?.url || null, duration: video.durationFormatted || 'Inconnue' };
  } catch (err) {
    console.error('[YouTube] Search error:', err.message);
    return null;
  }
}

async function getStream(url) {
  await ensureYtDlp();
  const ffmpegPath = require('ffmpeg-static');
  console.log('[yt-dlp] Stream for:', url);

  const ytdlpArgs = [
    '-f', 'bestaudio/best',
    '--no-playlist',
    '-o', '-',
    '--quiet',
    '--no-warnings',
  ];

  if (fs.existsSync(COOKIES_PATH)) {
    ytdlpArgs.push('--cookies', COOKIES_PATH);
  }

  ytdlpArgs.push(url);

  return new Promise((resolve, reject) => {
    const ytdlp = spawn(YT_DLP_PATH, ytdlpArgs);
    const ffmpeg = spawn(ffmpegPath, [
      '-i', 'pipe:0',
      '-analyzeduration', '0',
      '-loglevel', 'error',
      '-f', 's16le',
      '-ar', '48000',
      '-ac', '2',
      'pipe:1',
    ]);

    ytdlp.stdout.pipe(ffmpeg.stdin);
    ytdlp.stdout.on('error', () => {});
    ytdlp.stdin?.on('error', () => {});
    ffmpeg.stdin.on('error', () => {});
    ffmpeg.stdout.on('error', () => {});

    ytdlp.stderr.on('data', (d) => {
      const msg = d.toString().trim();
      if (msg) console.error('[yt-dlp]', msg);
    });
    ffmpeg.stderr.on('data', (d) => {
      const msg = d.toString().trim();
      if (msg) console.error('[ffmpeg]', msg);
    });

    ytdlp.on('error', reject);
    ffmpeg.on('error', reject);

    const timeout = setTimeout(() => {
      ytdlp.kill('SIGKILL');
      ffmpeg.kill('SIGKILL');
      reject(new Error('Stream timeout'));
    }, 20_000);

    ffmpeg.stdout.once('data', () => {
      clearTimeout(timeout);
      resolve(ffmpeg.stdout);
    });

    ytdlp.on('close', (code) => {
      if (code !== 0 && code !== null) console.warn('[yt-dlp] Exit code:', code);
    });
  });
}

module.exports = { searchYoutube, getStream, ensureYtDlp };
