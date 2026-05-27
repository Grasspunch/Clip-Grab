import express from 'express';
import cors from 'cors';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
// Save downloads to a 'downloads' folder in the root of the project
const DOWNLOAD_DIR = path.join(__dirname, '../downloads');

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

import crypto from 'crypto';

app.post('/api/download', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const ytdlpPath = '/opt/homebrew/bin/yt-dlp';
  
  // Create a unique folder for this download so we can easily find the exact file it produced
  const uuid = crypto.randomUUID();
  const folderPath = path.join(DOWNLOAD_DIR, uuid);
  fs.mkdirSync(folderPath, { recursive: true });

  const args = [
    '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
    '--merge-output-format', 'mp4',
    '--paths', folderPath,
    '-o', '%(title)s.%(ext)s',
    url
  ];

  console.log(`Starting download for: ${url}`);
  
  execFile(ytdlpPath, args, (error, stdout, stderr) => {
    if (error) {
      console.error('Download error:', stderr);
      return res.status(500).json({ error: 'Failed to download video.' });
    }
    
    // Read the unique folder to find the exact filename that yt-dlp generated
    const files = fs.readdirSync(folderPath);
    if (files.length === 0) {
      return res.status(500).json({ error: 'Video downloaded but file was not found.' });
    }
    
    const filename = files[0];
    console.log(`Download finished: ${filename}`);
    res.json({ success: true, uuid, filename });
  });
});

app.post('/api/info', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const ytdlpPath = '/opt/homebrew/bin/yt-dlp';
  const args = ['--print', '%(title)s', url];

  console.log(`Fetching metadata for: ${url}`);

  execFile(ytdlpPath, args, (error, stdout, stderr) => {
    if (error) {
      console.error('Info fetching error:', stderr);
      return res.status(500).json({ error: 'Failed to fetch video info.' });
    }
    const title = stdout.trim();
    console.log(`Fetched title: "${title}"`);
    res.json({ title });
  });
});

app.get('/api/file/:uuid/:filename', (req, res) => {
  const { uuid, filename } = req.params;
  const filePath = path.join(DOWNLOAD_DIR, uuid, filename);
  
  if (fs.existsSync(filePath)) {
    // Force the browser to download the file instead of playing it
    res.download(filePath, filename);
  } else {
    res.status(404).send('File not found');
  }
});

app.listen(PORT, () => {
  console.log(`YT GO Server running on http://localhost:${PORT}`);
});
