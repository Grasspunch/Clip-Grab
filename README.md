![Clip Grab](./public/clipgrab.png)

# Clip Grab

> A mobile-first video downloader exploring motion, haptics, and playful interaction.

**[View Live Demo](https://clipgrab.vercel.app)**

---

**Clip Grab** is a mobile-first video downloader for YouTube, TikTok, Instagram, and other supported platforms. It uses `yt-dlp` and `ffmpeg` to handle video extraction and processing, wrapped in a custom interface exploring motion, haptics, and playful interaction.

I built it as a simpler alternative to downloaders filled with rate limits, subscription prompts, popups, and unreliable redirects. The project also became an experiment in using motion and haptic feedback as part of the interface itself rather than as decoration.

---

## About the Project

The visual direction was inspired by George Tscherny's 1972 *Servicio El Borincano de Pan Am* poster.

I was drawn to its repeated color bands and the sense of movement created through a minimal composition. Rather than using the poster only as a visual reference, I treated its shapes as interactive components.

As a user enters a valid URL, the Save control appears within the composition. Pressing it compresses the interface like a spring before launching the ball off-screen and moving the downloader into its next state.

On supported mobile devices, haptic feedback is timed to key moments in the animation so movement and physical feedback feel like one interaction.

---

## Features

- Download videos from supported platforms using `yt-dlp`
- Process and merge media using `ffmpeg`
- Mobile-first responsive interface
- Multi-stage animations tied to component states
- Browser-based haptic feedback on supported devices
- Visual feedback for input, downloading, and completion
- Works across mobile and desktop

---

## Tech Stack

- React
- TypeScript
- Vite
- CSS
- Node.js
- Express
- `yt-dlp`
- `ffmpeg`
- `web-haptics`

---

## Running Locally

High-resolution downloads require the app to run locally.

### Prerequisites

Install Node.js 18+, `yt-dlp`, and `ffmpeg`.

```bash
brew install yt-dlp ffmpeg
```

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/anthonyluong/clip-grab.git
   cd clip-grab
   ```

2. **Install all dependencies**:
   ```bash
   npm run install:all
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

---

## Credits

- Designed and built by [Anthony Luong](https://anthonyluong.com)
- Visual system inspired by George Tscherny's 1972 *Servicio El Borincano de Pan Am* poster

---

## License

MIT License © 2026 Anthony Luong
