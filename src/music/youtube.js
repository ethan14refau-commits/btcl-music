'use strict';

const { spawn } = require('child_process');
const YouTube = require('youtube-sr').default;
const path = require('path');
const fs = require('fs');

const YT_DLP_PATH = path.join(__dirname, '../../yt-dlp.exe');
const COOKIES_PATH = path.join(__dirname, '../../cookies.txt');

async function ensureYtDlp() {
  if (fs.existsSync(YT_DLP_PATH)) return;
  console.log('[yt-dlp] Téléchargement de yt-dlp.exe...');
  const fetch = require('node-fetch');
  const res = await fetch('https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe');
  if (!res.ok) throw new Error('Impossible de télécharger yt-dlp.exe');
  const buffer = await res.buffer();
  fs.writeFileSync(YT_DLP_PATH, buffer);
  console.log('[yt-dlp] Téléchargé !');
}

async function searchYoutube(query) {
  try {
    if (query.startsWith('http')) {
      const video = await YouTube.getVideo(query);
      if (!video) return null;
      return {
        title: video.title,
        url: video.url,
        thumbnail: video.thumbnail?.url || null,
        duration: video.durationFormatted || 'Inconnue',
      };
    }
    const video = await YouTube.searchOne(query);
    if (!video) return null;
    return {
      title: video.title,
      url: video.url,
      thumbnail: video.thumbnail?.url || null,
      duration: video.durationFormatted || 'Inconnue',
    };
  } catch (err) {
    console.error('[YouTube] Search error:', err.message);
    return null;
  }
}

async function getStream(url) {
  await ensureYtDlp();
  const ffmpegPath = require('ffmpeg-static');
  console.log('[yt-dlp] Stream for:', url);

  // Build yt-dlp args
  const ytdlpArgs = [
    '-f', 'bestaudio/best',
    '--no-playlist',
    '-o', '-',
    '--quiet',
  ];

  // Use cookies if available
  if (fs.existsSync(COOKIES_PATH)) {
    ytdlpArgs.push('--cookies', COOKIES_PATH);
    console.log('[yt-dlp] Using cookies.txt');
  }

  ytdlpArgs.push(url);

  return new Promise((resolve, reject) => {
    const ytdlp = spawn(YT_DLP_PATH, ytdlpArgs);

    const ffmpeg = spawn(ffmpegPath, [
      '-i', 'pipe:0',
      '-f', 's16le',
      '-ar', '48000',
      '-ac', '2',
      '-loglevel', 'error',
      'pipe:1',
    ]);

    ytdlp.stdout.pipe(ffmpeg.stdin, { end: true });

    ytdlp.stdout.on('error', () => {});
    ytdlp.stdin?.on('error', () => {});
    ffmpeg.stdin.on('error', () => {});
    ffmpeg.stdout.on('error', () => {});

    ytdlp.stderr.on('data', (d) => {
      const msg = d.toString().trim();
      if (msg && !msg.includes('WARNING')) console.error('[yt-dlp]', msg);
    });

    ffmpeg.stderr.on('data', (d) => {
      const msg = d.toString().trim();
      if (msg) console.error('[ffmpeg]', msg);
    });

    ytdlp.on('error', (err) => {
      console.error('[yt-dlp] Spawn error:', err.message);
      reject(err);
    });

    ffmpeg.on('error', (err) => {
      console.error('[ffmpeg] Spawn error:', err.message);
      reject(err);
    });

    // Timeout
    const timeout = setTimeout(() => {
      ytdlp.kill('SIGKILL');
      ffmpeg.kill('SIGKILL');
      reject(new Error('Stream timeout'));
    }, 20_000);

    // Resolve once ffmpeg starts producing audio
    ffmpeg.stdout.once('data', () => {
      clearTimeout(timeout);
      resolve(ffmpeg.stdout);
    });

    ytdlp.on('close', (code) => {
      if (code !== 0 && code !== null) {
        console.warn('[yt-dlp] Exit code:', code);
      }
    });
  });
}

module.exports = { searchYoutube, getStream, ensureYtDlp };
