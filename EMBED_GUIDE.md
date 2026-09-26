# ClipGrab Iframe Integration & Portfolio Case Study Guide

This guide details how to embed the **ClipGrab** video downloader component into any external website or portfolio case study (e.g., Webflow, WordPress, Squarespace, or a custom React/HTML site).

---

## Embed URL & Basic Usage

- **Embed Route**: `/embed` or `/`
- **Example URL**: `https://clipgrabapp.vercel.app/embed`

### Standard HTML Embed Snippet

Paste the following `<iframe>` tag into your portfolio HTML or case study container:

```html
<iframe 
  id="clipgrab-iframe"
  src="https://clipgrabapp.vercel.app/embed" 
  width="100%" 
  height="600px" 
  frameborder="0" 
  allowfullscreen 
  style="border: 0; width: 100%; border-radius: 8px; overflow: hidden;"
></iframe>
```

---

## Dynamic Height Auto-Resizing (`postMessage`)

The embed page automatically measures its layout height and communicates with the host website to prevent double scrollbars.

### How It Works

1. **Automatic Height Monitoring**: Uses a browser `ResizeObserver` to detect any layout height adjustments (e.g., when the input expands, downloading progress updates, or window resizes).
2. **PostMessage Dispatch**: Continuously dispatches a message object to `window.parent` with event type `'CLIPGRAB_RESIZE'` and the exact pixel `height`.

### How to Receive It in Your Portfolio Case Study

On your portfolio website (where you embed the iframe), add this small JavaScript listener script to auto-adjust the `<iframe>` element height dynamically:

```html
<script>
  window.addEventListener('message', (event) => {
    // Check for the ClipGrab resize message type
    if (event.data && event.data.type === 'CLIPGRAB_RESIZE') {
      const iframe = document.getElementById('clipgrab-iframe');
      if (iframe && event.data.height) {
        iframe.style.height = event.data.height + 'px';
      }
    }
  });
</script>
```

---

## Custom Themes & Parameters

Customize the embed appearance and default states by adding query parameters to the iframe `src` URL.

### 1. Dark / Light Theme (`theme=dark` or `theme=light`)
- **URL**: `https://clipgrabapp.vercel.app/embed?theme=dark`
- **Effect**: Customizes background colors to match dark portfolio themes.

### 2. Compact Mode (`compact=true`)
- **URL**: `https://clipgrabapp.vercel.app/embed?compact=true`
- **Effect**: Scales down container height and padding for tight portfolio grid columns or embedded cards.

### Combined Options Example

```html
<iframe 
  id="clipgrab-iframe"
  src="https://clipgrabapp.vercel.app/embed?compact=true&theme=dark" 
  width="100%" 
  height="500px" 
  frameborder="0" 
  style="border: 0; width: 100%;"
></iframe>
```
