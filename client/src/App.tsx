import { useState, useRef, useEffect } from 'react';
// @ts-ignore
import { useWebHaptics } from 'web-haptics/react';
import './App.css';

function App() {
  const { trigger } = useWebHaptics();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [percentage, setPercentage] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [scale, setScale] = useState(1);
  const [greenSpringLoading, setGreenSpringLoading] = useState(false);
  const [flyingText, setFlyingText] = useState('');
  const [flyingTextLaunched, setFlyingTextLaunched] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');

  const placeholders = [
    "Paste URL",
    "Paste YouTube",
    "Paste TikTok",
    "Paste Instagram",
    "Paste Vimeo",
    "Paste Twitch",
    "Paste Twitter",
    "Paste X"
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const githubUrl = import.meta.env.VITE_GITHUB_URL || "https://github.com/anthonyluong/clip-grab";

  // Rotate input placeholder when the input is empty and not focused
  useEffect(() => {
    if (url || isFocused || greenSpringLoading) return;

    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [url, isFocused, greenSpringLoading]);

  // Reset placeholder to "Paste URL" when url is empty
  useEffect(() => {
    if (!url) {
      setPlaceholderIndex(0);
    }
  }, [url]);

  // Tracks window resize to calculate elastic viewport-proportional scaling factor (width & height)
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      let calculatedScale = Math.min(1, width / 1920, height / 1080);

      if (width <= 480) {
        calculatedScale = Math.max(0.48, calculatedScale); // Minimum scale of 0.48 on mobile portrait
      } else if (width <= 1024) {
        calculatedScale = Math.max(0.65, calculatedScale); // Increased scale to 0.65 for tablet (including iPad Pro) portrait mode
      } else {
        // Reduce the overall scaling factor on desktop by 15% to make everything compact
        calculatedScale = calculatedScale * 0.85;
      }

      setScale(calculatedScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Force scrollLeft back to 0 so pasted URLs never visually hide the start "https://"
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.scrollLeft = 0;
      // Re-apply on requestAnimationFrame to ensure browser cursor placement doesn't shift it
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.scrollLeft = 0;
        }
      });
    }
  }, [url]);

  // Handles simulating a realistic, progressive loading percentage
  useEffect(() => {
    let interval: any;
    if (loading) {
      // Wait 1.5s (1500ms) for the plunger launch animation to fully finish
      const delayTimeout = setTimeout(() => {
        setPercentage(0);
        interval = setInterval(() => {
          setPercentage((prev) => {
            if (prev === null) return 0;
            if (prev >= 98) {
              clearInterval(interval);
              return prev;
            }
            // Slowly decelerating progression to keep it active without feeling frozen
            const step = prev < 40 ? 5 : prev < 70 ? 2 : prev < 90 ? 0.8 : prev < 95 ? 0.2 : 0.05;
            return prev + step;
          });
        }, 250);
      }, 1500);

      return () => {
        clearTimeout(delayTimeout);
        if (interval) clearInterval(interval);
      };
    } else {
      setPercentage(null);
    }
  }, [loading]);

  // Log message state changes for diagnostic debugging
  useEffect(() => {
    if (message) {
      console.log(`[Clip Grab Status]: ${message}`);
    }
  }, [message]);

  // Validate URL to toggle download button color/activation (restrict to accepted video platforms like YouTube, TikTok, Instagram, Vimeo, Twitch, and Twitter/X)
  const isValidUrl = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|vimeo\.com|twitch\.tv|twitter\.com|x\.com)\/.+$/i.test(url);

  // Fetch video title metadata automatically when valid URL is entered
  useEffect(() => {
    if (!isValidUrl) {
      setVideoTitle('');
      return;
    }

    let isCurrent = true;
    const fetchTitle = async () => {
      try {
        const fullUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
        const apiBase = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;
        const response = await fetch(`${apiBase}/api/info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: fullUrl })
        });
        if (response.ok) {
          const data = await response.json();
          if (isCurrent && data.title) {
            setVideoTitle(data.title);
          }
        }
      } catch (err) {
        console.error('Failed to fetch video title:', err);
      }
    };

    fetchTitle();

    return () => {
      isCurrent = false;
    };
  }, [url, isValidUrl]);



  const handleGreenColumnClick = () => {
    if (!url || loading || greenSpringLoading) return;

    const textToFly = videoTitle || url;
    setFlyingText(textToFly);

    // 1. Immediately clear the input values so the "Save" text transitions out (disappears) first
    setUrl('');
    setVideoTitle('');

    // 2. Wait for the "Save" text to transition out/disappear before launching the green column recoil and text fly animations
    setTimeout(() => {
      setFlyingTextLaunched(true);
      setGreenSpringLoading(true);

      try {
        trigger();
      } catch (hapticErr) {}

      setTimeout(() => {
        try {
          trigger([
            { duration: 35 },
          ], { intensity: 1 });
        } catch (hapticErr) {}
      }, 720);

      setTimeout(() => {
        setGreenSpringLoading(false);
        setFlyingText('');
        setFlyingTextLaunched(false);
      }, 1500);
    }, 350); // 350ms delay lets the "Save" text fully disappear before the green launch starts
  };

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !isValidUrl) return;

    // 1. Initial haptic trigger for the spring load compression windup
    try {
      trigger();
    } catch (hapticErr) {
      // Safe fallback if web-haptics is unsupported
    }

    // 2. Delayed haptic trigger for the explosive projectile launch (around 720ms)
    setTimeout(() => {
      try {
        trigger([
          { duration: 35 },
        ], { intensity: 1 });
      } catch (hapticErr) {}
    }, 720);

    setLoading(true);
    setMessage('Downloading... this may take a minute for high resolution video.');

    try {
      const fullUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
      const apiBase = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`;
      const response = await fetch(`${apiBase}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fullUrl })
      });

      const data = await response.json();

      if (response.ok) {
        // 1. Immediately paint 100% success state & trigger haptic feedback
        setPercentage(100);
        setMessage(`Success! Downloading ${data.filename} to your device...`);
        try {
          trigger([
            { duration: 80, intensity: 0.8 },
            { delay: 80, duration: 50, intensity: 0.3 },
          ]);
        } catch (hapticErr) {}

        // Wait a brief window (150ms) to let the browser paint the 100% UI and play the haptics before download suspension
        await new Promise((resolve) => setTimeout(resolve, 150));

        // 2. Trigger the native mobile/desktop browser download
        const downloadUrl = `${apiBase}/api/file/${data.uuid}/${encodeURIComponent(data.filename)}`;

        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Wait the remaining 650ms before clearing state
        await new Promise((resolve) => setTimeout(resolve, 650));
        setUrl('');
        setVideoTitle('');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      // In Demo mode (e.g. deployed without backend), run full 100% progress animation then prompt to download via GitHub
      setPercentage(100);
      try {
        trigger([
          { duration: 80, intensity: 0.8 },
          { delay: 80, duration: 50, intensity: 0.3 },
        ]);
      } catch (hapticErr) {}
      await new Promise((resolve) => setTimeout(resolve, 800));
      setShowGithubModal(true);
      setUrl('');
      setVideoTitle('');
    } finally {
      setLoading(false);
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 480;
  const threshold = 9; // Only trigger physics after 9 characters are entered
  const displayVal = isFocused || !videoTitle ? url : videoTitle;
  const activeLength = Math.max(0, (flyingText || displayVal).length - threshold);
  const dynamicGrowth = isMobile ? 0 : Math.min(5000, activeLength * 38); // Disable physical growth on mobile; set rate to 38
  const dynamicCol7Height = Math.max(isMobile ? 0 : 550, 1150 - (dynamicGrowth * 0.7)); // Reduced base height to 1150px for ideal proportion, keeping min visible height of 550px on desktop
  const baseInputBottom = isMobile ? -335 : -400; // Shifted an additional 40px to the left on mobile (55px total leftward shift)
  const dynamicInputBottom = baseInputBottom - (dynamicGrowth * (isMobile ? 0.58 : 0.5)); // Symmetrical shift to keep starting spacing constant
  const dynamicInputWidth = (isMobile ? 550 : 680) + dynamicGrowth; // Snug, balanced default widths: 550px on mobile, 680px on desktop

  const baseCol8Height = 1100;
  const getDynamicTargetHeight = () => {
    if (typeof window === 'undefined') return isMobile ? 1800 : 2800;
    const w = window.innerWidth;
    const h = window.innerHeight;
    return Math.max(isMobile ? 1400 : 2000, Math.ceil(Math.max(w, h) / scale));
  };
  const targetCol8Height = getDynamicTargetHeight();

  const dynamicCol8Height = percentage !== null
    ? baseCol8Height + ((targetCol8Height - baseCol8Height) * (percentage / 100))
    : baseCol8Height;



  return (
    <div className="app-layout">
      <div className="diagonal-author">Made by <a href="https://anthonyluong.com" target="_blank" rel="noopener noreferrer" className="author-link">Anthony Luong</a> • Inspired by <a href="https://en.wikipedia.org/wiki/George_Tscherny" target="_blank" rel="noopener noreferrer" className="author-link">George Tscherny</a></div>
      <div
        className="diagonal-brand"
        style={{
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center center'
        }}
      >
        <div className="diagonal-columns">
          <div className="column col-0"></div>
          <div className="column col-1"></div>
          <div className="column col-2"></div>
          <div className="column col-3"></div>
          <div className="column col-4"></div>
          <div className="column col-5"></div>
          <form onSubmit={handleDownload} style={{ display: 'contents' }}>
            <div
              className={`column col-8 ${loading && percentage === null ? 'spring-launch' : ''} ${isValidUrl && !loading ? 'clickable-row' : ''}`}
              style={{ height: `${dynamicCol8Height}px` }}
              onClick={(e) => {
                // If clicked directly on the column and not on the button, trigger the button's click event
                if (e.target instanceof Element && !e.target.closest('button') && isValidUrl && !loading) {
                  const btn = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement | null;
                  if (btn && !btn.disabled) {
                    btn.click();
                  }
                }
              }}
            >
              {percentage !== null && (
                <div className="diagonal-percentage">
                  {Math.floor(percentage)}%
                </div>
              )}
              <button
                type="submit"
                className={`diagonal-download-btn ${loading ? 'launched' : ''} ${isValidUrl ? 'valid-active' : ''} ${url && !isValidUrl ? 'invalid-active' : ''}`}
                disabled={!isValidUrl}
              >
                <span key={url && !isValidUrl ? 'invalid' : 'valid'} className="download-text-label">{url && !isValidUrl ? 'Invalid' : 'Save'}</span>
                <span className={isValidUrl ? "download-dot active-blink" : "download-dot"}>●</span>
              </button>
            </div>
            <div
              className={`column col-7 ${greenSpringLoading ? 'spring-launch' : ''} ${url.length > 0 && !loading && !greenSpringLoading ? 'clickable-row' : ''}`}
              style={{ height: `${dynamicCol7Height}px`, '--start-height': `${dynamicCol7Height}px` } as React.CSSProperties}
              onClick={(e) => {
                // Trigger launch to clear input if clicked on the green column space and not on the input itself
                if (url.length > 0 && !loading && !greenSpringLoading) {
                  if (e.target instanceof Element && !e.target.closest('input')) {
                    handleGreenColumnClick();
                  }
                }
              }}
            >
              <div
                className={`diagonal-input-container ${flyingTextLaunched ? 'launched' : ''}`}
                style={{
                  width: `${dynamicInputWidth}px`,
                  bottom: `${dynamicInputBottom}px`
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  className="diagonal-input"
                  value={isFocused || !videoTitle ? url : videoTitle}
                  onChange={(e) => {
                    const cleanedVal = e.target.value.replace(/^(https?:\/\/)?(www\.)?/, '');
                    setUrl(cleanedVal);
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder=""
                  required
                  disabled={loading}
                  autoComplete="off"
                />
                {!url && !isFocused && !greenSpringLoading && !flyingText && (
                  <div className="diagonal-placeholder-overlay">
                    <span>Paste </span>
                    <span
                      key={placeholderIndex}
                      className="diagonal-placeholder-dynamic"
                    >
                      {placeholders[placeholderIndex].replace("Paste ", "")}
                    </span>
                  </div>
                )}
                {flyingText && (
                  <div className={`diagonal-flying-text ${flyingTextLaunched ? 'launched' : ''}`}>
                    {flyingText}
                  </div>
                )}
              </div>
            </div>
          </form>
          <div className="column col-6">
            <h1 className="diagonal-logo">Clip Grab</h1>
          </div>
          <div className="column col-9"></div>
          <div className="column col-10"></div>
          <div className="column col-11"></div>
          <div className="column col-12"></div>
          <div className="column col-13"></div>
          <div className="column col-14"></div>
          <div className="column col-15"></div>
        </div>
      </div>

      {showGithubModal && (
        <div className="demo-modal-overlay" onClick={() => setShowGithubModal(false)}>
          <div className="demo-modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="demo-modal-title">Thanks for trying! 🙂</h2>
            <p className="demo-modal-desc">
              High-resolution downloads require the full app. View the source and setup on GitHub.
            </p>
            <div className="demo-modal-actions">
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="demo-modal-btn primary"
              >
                View on GitHub
              </a>
              <button
                type="button"
                className="demo-modal-btn secondary"
                onClick={() => setShowGithubModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
