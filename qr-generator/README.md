# QR Code Generator

A fully client-side QR code generator — no backend, no installs. Just open `index.html` in a browser.

## Modes

**Social / URL**
Generate a QR for any URL or pick a social media preset (YouTube, TikTok, Instagram, X, LinkedIn, GitHub, Facebook, Twitch). Type your username and the full profile URL is built automatically.

**WiFi**
Enter your network name, password, and security type. The QR encodes the standard `WIFI:` format — Android and iOS can scan it to connect automatically, no typing required.

**WhatsApp**
Enter a phone number (with country code) and an optional pre-filled message. Scanning opens WhatsApp with the chat ready to go.

**Email**
Fill in the recipient, subject, and body. Scanning opens the device mail app with everything pre-filled.

**vCard**
Enter name, organisation, job title, phone, email, and website. Scanning saves the contact directly to the phone's address book.

## Customisation

- Foreground and background color pickers
- QR size slider (128px – 512px)
- Margin control
- Error correction level (Low / Medium / Quartile / High)
- 6 dot styles: Square, Rounded, Dots, Classy, Classy Rounded, Extra Rounded
- Center logo — auto-pulled from the active social preset, or upload your own image
- Adjustable logo size

## Export

| Format | Notes |
|--------|-------|
| PNG    | Lossless, best for digital use |
| JPG    | Smaller file size |
| SVG    | Vector, scales to any size |
| PDF    | Includes optional caption label below the QR |

Copy to clipboard button also available for quick pasting.

## History

The last 8 generated QR codes are saved in `localStorage`. Each entry shows a thumbnail, the URL or label, and a timestamp. Clicking any item restores the mode and fields so you can re-generate or tweak it.

## Usage

```
qr-generator/
├── index.html   — markup and layout
├── style.css    — dark theme styles
├── app.js       — all logic, no framework
└── README.md
```

Open `index.html` directly in any modern browser. No build step or server needed.
