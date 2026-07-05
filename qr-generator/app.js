(() => {
  // ── Elements ──────────────────────────────────────────────────────────────
  const urlInput      = document.getElementById('url-input');
  const urlPrefix     = document.getElementById('url-prefix');
  const urlLabel      = document.getElementById('url-label');
  const fgColor       = document.getElementById('fg-color');
  const bgColor       = document.getElementById('bg-color');
  const qrSize        = document.getElementById('qr-size');
  const sizeLabel     = document.getElementById('size-label');
  const qrMargin      = document.getElementById('qr-margin');
  const marginLabel   = document.getElementById('margin-label');
  const errorLevel    = document.getElementById('error-level');
  const qrOutput      = document.getElementById('qr-output');
  const dlPng         = document.getElementById('dl-png');
  const dlJpg         = document.getElementById('dl-jpg');
  const dlSvg         = document.getElementById('dl-svg');
  const dlPdf         = document.getElementById('dl-pdf');
  const copyBtn       = document.getElementById('copy-btn');
  const autoLogoChk   = document.getElementById('auto-logo');
  const logoUpload    = document.getElementById('logo-upload');
  const logoSizeRange = document.getElementById('logo-size');
  const logoSizeLabel = document.getElementById('logo-size-label');
  const pdfLabel      = document.getElementById('pdf-label');
  const historyList   = document.getElementById('history-list');
  const clearHistory  = document.getElementById('clear-history');

  // WiFi elements
  const wifiSsid      = document.getElementById('wifi-ssid');
  const wifiPass      = document.getElementById('wifi-pass');
  const wifiSecurity  = document.getElementById('wifi-security');
  const wifiHidden    = document.getElementById('wifi-hidden');
  const wifiPdfLabel  = document.getElementById('wifi-pdf-label');
  const togglePassBtn = document.getElementById('toggle-pass');
  const socialModeEl  = document.getElementById('social-mode');
  const wifiModeEl    = document.getElementById('wifi-mode');

  // WhatsApp elements
  const waPhone       = document.getElementById('wa-phone');
  const waMessage     = document.getElementById('wa-message');
  const waPdfLabel    = document.getElementById('wa-pdf-label');
  const waModeEl      = document.getElementById('whatsapp-mode');

  // Email elements
  const emailTo       = document.getElementById('email-to');
  const emailSubject  = document.getElementById('email-subject');
  const emailBody     = document.getElementById('email-body');
  const emailPdfLabel = document.getElementById('email-pdf-label');
  const emailModeEl   = document.getElementById('email-mode');

  // vCard elements
  const vcFirst       = document.getElementById('vc-first');
  const vcLast        = document.getElementById('vc-last');
  const vcOrg         = document.getElementById('vc-org');
  const vcTitle       = document.getElementById('vc-title');
  const vcPhone       = document.getElementById('vc-phone');
  const vcEmail       = document.getElementById('vc-email');
  const vcUrl         = document.getElementById('vc-url');
  const vcPdfLabel    = document.getElementById('vc-pdf-label');
  const vcModeEl      = document.getElementById('vcard-mode');

  const modePanels = { social: socialModeEl, wifi: wifiModeEl, whatsapp: waModeEl, email: emailModeEl, vcard: vcModeEl };

  // ── State ─────────────────────────────────────────────────────────────────
  let activePreset    = null;
  let activeIcon      = null;
  let customLogoUrl   = null;
  let dotStyle        = 'square';
  let debounceTimer   = null;
  let qrInstance      = null;
  let currentMode     = 'social';
  let history         = JSON.parse(localStorage.getItem('qr_history') || '[]');

  const dlBtns = [dlPng, dlJpg, dlSvg, dlPdf, copyBtn];

  // ── Init ──────────────────────────────────────────────────────────────────
  renderHistory();
  dlBtns.forEach(b => b.disabled = true);

  // ── Mode tabs ─────────────────────────────────────────────────────────────
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMode = tab.dataset.mode;

      // Show only the active panel
      Object.entries(modePanels).forEach(([key, el]) => {
        el.classList.toggle('hidden', key !== currentMode);
      });

      // Set default PDF labels
      const defaults = { wifi: 'Scan to connect to WiFi', whatsapp: 'Scan to WhatsApp me', email: 'Scan to send me an email', vcard: 'Scan to save my contact' };
      if (defaults[currentMode]) {
        const labelEl = { wifi: wifiPdfLabel, whatsapp: waPdfLabel, email: emailPdfLabel, vcard: vcPdfLabel }[currentMode];
        if (labelEl && !labelEl.value) labelEl.value = defaults[currentMode];
      }

      qrOutput.innerHTML = '<p class="placeholder-text">Your QR code will appear here</p>';
      qrOutput.classList.remove('has-qr');
      dlBtns.forEach(b => b.disabled = true);
      qrInstance = null;
    });
  });

  // ── WiFi inputs ───────────────────────────────────────────────────────────
  wifiSsid.addEventListener('input', scheduleLive);
  wifiPass.addEventListener('input', scheduleLive);
  wifiSecurity.addEventListener('change', scheduleLive);
  wifiHidden.addEventListener('change', scheduleLive);

  // ── WhatsApp inputs ───────────────────────────────────────────────────────
  waPhone.addEventListener('input', scheduleLive);
  waMessage.addEventListener('input', scheduleLive);

  // ── Email inputs ──────────────────────────────────────────────────────────
  emailTo.addEventListener('input', scheduleLive);
  emailSubject.addEventListener('input', scheduleLive);
  emailBody.addEventListener('input', scheduleLive);

  // ── vCard inputs ──────────────────────────────────────────────────────────
  [vcFirst, vcLast, vcOrg, vcTitle, vcPhone, vcEmail, vcUrl].forEach(el => el.addEventListener('input', scheduleLive));

  // Show/hide password toggle
  togglePassBtn.addEventListener('click', () => {
    const isText = wifiPass.type === 'text';
    wifiPass.type = isText ? 'password' : 'text';
    togglePassBtn.querySelector('svg').innerHTML = isText
      ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
      : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>';
  });

  // ── Range labels ──────────────────────────────────────────────────────────
  qrSize.addEventListener('input', () => { sizeLabel.textContent = qrSize.value + 'px'; scheduleLive(); });
  qrMargin.addEventListener('input', () => { marginLabel.textContent = qrMargin.value; scheduleLive(); });
  logoSizeRange.addEventListener('input', () => { logoSizeLabel.textContent = logoSizeRange.value + '%'; scheduleLive(); });

  // ── Preset buttons ────────────────────────────────────────────────────────
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const platform = btn.dataset.platform;
      activePreset    = btn.dataset.base;
      activeIcon      = btn.dataset.icon;

      urlPrefix.textContent = activePreset;
      urlPrefix.classList.remove('hidden');
      urlInput.placeholder  = 'username';
      urlLabel.textContent  = `Enter your ${platform} username`;
      urlInput.value        = '';

      if (pdfLabel.value === '' || pdfLabel.dataset.auto) {
        pdfLabel.value      = `Scan to find me on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`;
        pdfLabel.dataset.auto = '1';
      }

      urlInput.focus();
      scheduleLive();
    });
  });

  // Clear auto flag when user manually edits pdf label
  pdfLabel.addEventListener('input', () => delete pdfLabel.dataset.auto);

  // ── Dot style buttons ─────────────────────────────────────────────────────
  document.querySelectorAll('.dot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.dot-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dotStyle = btn.dataset.style;
      scheduleLive();
    });
  });

  // ── Live inputs ───────────────────────────────────────────────────────────
  urlInput.addEventListener('input', scheduleLive);
  fgColor.addEventListener('input', scheduleLive);
  bgColor.addEventListener('input', scheduleLive);
  errorLevel.addEventListener('change', scheduleLive);
  autoLogoChk.addEventListener('change', scheduleLive);

  // ── Custom logo upload ────────────────────────────────────────────────────
  logoUpload.addEventListener('change', () => {
    const file = logoUpload.files[0];
    if (!file) { customLogoUrl = null; scheduleLive(); return; }
    const reader = new FileReader();
    reader.onload = e => { customLogoUrl = e.target.result; scheduleLive(); };
    reader.readAsDataURL(file);
  });

  // ── Live preview debounce ─────────────────────────────────────────────────
  function scheduleLive() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(generate, 300);
  }

  // ── Build content string ──────────────────────────────────────────────────
  function buildUrl() {
    if (currentMode === 'wifi') {
      const ssid = wifiSsid.value.trim();
      if (!ssid) return null;
      const pass = wifiPass.value;
      const sec  = wifiSecurity.value;
      const hide = wifiHidden.checked ? 'true' : 'false';
      const esc  = s => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/"/g, '\\"').replace(/:/g, '\\:');
      return `WIFI:T:${sec};S:${esc(ssid)};P:${esc(pass)};H:${hide};;`;
    }

    if (currentMode === 'whatsapp') {
      const phone = waPhone.value.trim().replace(/\s+/g, '');
      if (!phone) return null;
      const msg = waMessage.value.trim();
      const base = `https://wa.me/${phone.replace(/^\+/, '')}`;
      return msg ? `${base}?text=${encodeURIComponent(msg)}` : base;
    }

    if (currentMode === 'email') {
      const to = emailTo.value.trim();
      if (!to) return null;
      const params = [];
      if (emailSubject.value.trim()) params.push(`subject=${encodeURIComponent(emailSubject.value.trim())}`);
      if (emailBody.value.trim())    params.push(`body=${encodeURIComponent(emailBody.value.trim())}`);
      return `mailto:${to}${params.length ? '?' + params.join('&') : ''}`;
    }

    if (currentMode === 'vcard') {
      const first = vcFirst.value.trim();
      const last  = vcLast.value.trim();
      if (!first && !last) return null;
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${last};${first};;;`,
        `FN:${[first, last].filter(Boolean).join(' ')}`,
      ];
      if (vcOrg.value.trim())   lines.push(`ORG:${vcOrg.value.trim()}`);
      if (vcTitle.value.trim()) lines.push(`TITLE:${vcTitle.value.trim()}`);
      if (vcPhone.value.trim()) lines.push(`TEL;TYPE=CELL:${vcPhone.value.trim()}`);
      if (vcEmail.value.trim()) lines.push(`EMAIL:${vcEmail.value.trim()}`);
      if (vcUrl.value.trim())   lines.push(`URL:${vcUrl.value.trim()}`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }

    const val = urlInput.value.trim();
    if (!val) return null;
    return activePreset ? activePreset + val : val;
  }

  // ── Resolve logo image URL ────────────────────────────────────────────────
  const INLINE_LOGOS = {
    linkedin: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230A66C2'><path d='M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'/></svg>`,
  };

  function resolveLogoUrl() {
    if (!autoLogoChk.checked && customLogoUrl) return customLogoUrl;
    if (autoLogoChk.checked) {
      if (customLogoUrl) return customLogoUrl; // custom overrides
      if (activeIcon) {
        // Check inline fallbacks first (e.g. LinkedIn removed from simpleicons CDN)
        if (INLINE_LOGOS[activeIcon]) return INLINE_LOGOS[activeIcon];
        return `https://cdn.simpleicons.org/${activeIcon}`;
      }
    }
    return null;
  }

  // ── Generate ──────────────────────────────────────────────────────────────
  function generate() {
    const content = buildUrl();
    if (!content) return;

    const size      = parseInt(qrSize.value);
    const margin    = parseInt(qrMargin.value);
    const logoRatio = parseInt(logoSizeRange.value) / 100;
    // No logo in non-social modes (they get mode icons instead)
    const logoUrl = currentMode === 'social' ? resolveLogoUrl() : null;

    const options = {
      width:  size,
      height: size,
      data:   content,
      margin: margin,
      qrOptions: {
        errorCorrectionLevel: currentMode === 'social' ? errorLevel.value : 'M',
      },
      dotsOptions: {
        color: fgColor.value,
        type:  dotStyle,
      },
      backgroundOptions: {
        color: bgColor.value,
      },
      cornersSquareOptions: {
        color: fgColor.value,
        type: dotStyle === 'dots' ? 'dot' : 'square',
      },
      cornersDotOptions: {
        color: fgColor.value,
        type: dotStyle === 'dots' ? 'dot' : 'square',
      },
    };

    if (logoUrl) {
      options.image = logoUrl;
      options.imageOptions = { crossOrigin: 'anonymous', margin: 4, imageSize: logoRatio };
    }

    // Mode-specific center icons
    const modeIcons = {
      wifi:      `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M5 12.55a11 11 0 0 1 14.08 0'/><path d='M1.42 9a16 16 0 0 1 21.16 0'/><path d='M8.53 16.11a6 6 0 0 1 6.95 0'/><circle cx='12' cy='20' r='1' fill='%23000000'/></svg>`,
      whatsapp:  `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2325D366'><path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z'/></svg>`,
      email:     `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234f46e5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'/><polyline points='22,6 12,13 2,6'/></svg>`,
      vcard:     `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230ea5e9' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='4' width='20' height='16' rx='2'/><circle cx='8' cy='10' r='2'/><path d='M4 20v-1a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v1'/><line x1='16' y1='10' x2='20' y2='10'/><line x1='16' y1='14' x2='20' y2='14'/></svg>`,
    };

    if (modeIcons[currentMode]) {
      options.image = modeIcons[currentMode];
      options.imageOptions = { crossOrigin: 'anonymous', margin: 6, imageSize: 0.25 };
    }

    qrOutput.innerHTML = '';
    qrOutput.classList.add('has-qr');

    qrInstance = new QRCodeStyling(options);
    qrInstance.append(qrOutput);

    dlBtns.forEach(b => b.disabled = false);

    // Wait longer for qr-code-styling to finish rendering before grabbing thumb
    setTimeout(() => addToHistory(content), 600);
  }

  // ── Downloads ─────────────────────────────────────────────────────────────
  dlPng.addEventListener('click', () => qrInstance?.download({ name: 'qrcode', extension: 'png' }));
  dlSvg.addEventListener('click', () => qrInstance?.download({ name: 'qrcode', extension: 'svg' }));

  dlJpg.addEventListener('click', async () => {
    if (!qrInstance) return;
    const canvas = await getCanvas();
    if (!canvas) return;
    const c = document.createElement('canvas');
    c.width = canvas.width; c.height = canvas.height;
    const ctx = c.getContext('2d');
    ctx.fillStyle = bgColor.value;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(canvas, 0, 0);
    download(c.toDataURL('image/jpeg', 0.95), 'qrcode.jpg');
  });

  dlPdf.addEventListener('click', async () => {
    if (!qrInstance) return;
    const canvas = await getCanvas();
    if (!canvas) return;

    const { jsPDF } = window.jspdf;
    const size   = parseInt(qrSize.value);
    const mmSize = size * 0.2646;
    const marg   = 15;
    const label  = { social: pdfLabel, wifi: wifiPdfLabel, whatsapp: waPdfLabel, email: emailPdfLabel, vcard: vcPdfLabel }[currentMode]?.value.trim() || '';
    const pageW  = mmSize + marg * 2;
    const pageH  = mmSize + marg * 2 + (label ? 12 : 0);

    const doc = new jsPDF({ unit: 'mm', format: [pageW, pageH] });
    doc.setFillColor(bgColor.value);
    doc.rect(0, 0, pageW, pageH, 'F');
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', marg, marg, mmSize, mmSize);

    if (label) {
      doc.setFontSize(11);
      doc.setTextColor(fgColor.value);
      doc.text(label, pageW / 2, marg + mmSize + 8, { align: 'center' });
    }

    doc.save('qrcode.pdf');
  });

  // ── Copy to clipboard ─────────────────────────────────────────────────────
  copyBtn.addEventListener('click', async () => {
    if (!qrInstance) return;
    const canvas = await getCanvas();
    if (!canvas) return;
    canvas.toBlob(async blob => {
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        copyBtn.textContent = '✓ Copied!';
        copyBtn.classList.add('copied');
        setTimeout(() => { copyBtn.textContent = 'Copy Image'; copyBtn.classList.remove('copied'); }, 2000);
      } catch {
        alert('Clipboard access denied. Try downloading instead.');
      }
    });
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  async function getCanvas() {
    // qr-code-styling renders SVG by default — use getRawData to get a PNG blob
    try {
      const blob = await qrInstance.getRawData('png');
      if (!blob) return null;
      const img = new Image();
      const url = URL.createObjectURL(blob);
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      return c;
    } catch {
      return null;
    }
  }

  function download(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl; a.download = filename; a.click();
  }

  // ── History ───────────────────────────────────────────────────────────────
  async function addToHistory(url) {
    const canvas  = await getCanvas();
    const thumb   = canvas ? canvas.toDataURL('image/png') : null;

    const displayMap = {
      wifi:      '📶 ' + (wifiSsid.value.trim() || 'WiFi Network'),
      whatsapp:  '💬 ' + (waPhone.value.trim() || 'WhatsApp'),
      email:     '✉️ '  + (emailTo.value.trim() || 'Email'),
      vcard:     '👤 '  + [vcFirst.value.trim(), vcLast.value.trim()].filter(Boolean).join(' ') || 'Contact',
    };
    const display = displayMap[currentMode] || url;

    history = history.filter(h => h.url !== url);
    history.unshift({ url, display, thumb, mode: currentMode, time: Date.now() });
    if (history.length > 8) history = history.slice(0, 8);

    localStorage.setItem('qr_history', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    if (!history.length) {
      historyList.innerHTML = '<p class="placeholder-text">No history yet</p>';
      return;
    }
    historyList.innerHTML = history.map((h, i) => `
      <div class="history-item" data-index="${i}">
        ${h.thumb ? `<img src="${h.thumb}" alt="QR preview" />` : '<div style="width:40px;height:40px;background:#3a3a5a;border-radius:4px"></div>'}
        <div class="history-item-info">
          <div class="history-item-url">${h.display || h.url}</div>
          <div class="history-item-time">${timeAgo(h.time)}</div>
        </div>
      </div>
    `).join('');

    historyList.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        const item = history[el.dataset.index];
        loadFromHistory(item);
      });
    });
  }

  function switchToMode(mode) {
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.mode-tab[data-mode="${mode}"]`).classList.add('active');
    currentMode = mode;
    Object.entries(modePanels).forEach(([key, el]) => el.classList.toggle('hidden', key !== mode));
  }

  function loadFromHistory(item) {
    const mode = item.mode || (item.isWifi ? 'wifi' : 'social');
    switchToMode(mode);

    if (mode === 'wifi') {
      const full = item.url.match(/WIFI:T:([^;]*);S:((?:[^;\\]|\\.)*);P:((?:[^;\\]|\\.)*);H:([^;]*);;/);
      if (full) {
        wifiSecurity.value = full[1] || 'WPA';
        wifiSsid.value     = unescapeWifi(full[2]);
        wifiPass.value     = unescapeWifi(full[3]);
        wifiHidden.checked = full[4] === 'true';
      }
    } else if (mode === 'whatsapp') {
      // Extract phone from wa.me URL
      const m = item.url.match(/wa\.me\/(\d+)(?:\?text=(.*))?/);
      if (m) { waPhone.value = '+' + m[1]; waMessage.value = m[2] ? decodeURIComponent(m[2]) : ''; }
    } else if (mode === 'email') {
      const m = item.url.match(/^mailto:([^?]+)(?:\?(.*))?$/);
      if (m) {
        emailTo.value = m[1];
        const p = new URLSearchParams(m[2] || '');
        emailSubject.value = p.get('subject') || '';
        emailBody.value    = p.get('body') || '';
      }
    } else if (mode === 'vcard') {
      const get = (key) => { const m = item.url.match(new RegExp(`^${key}:(.*)$`, 'm')); return m ? m[1].trim() : ''; };
      const n = item.url.match(/^N:([^;]*);([^;]*)/m);
      if (n) { vcLast.value = n[1]; vcFirst.value = n[2]; }
      vcOrg.value   = get('ORG');
      vcTitle.value = get('TITLE');
      vcPhone.value = get('TEL;TYPE=CELL');
      vcEmail.value = get('EMAIL');
      vcUrl.value   = get('URL');
    } else {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      activePreset = null; activeIcon = null;
      urlPrefix.classList.add('hidden');
      urlLabel.textContent = 'Enter URL or text';
      urlInput.placeholder = 'https://example.com';
      urlInput.value       = item.url;
    }
    scheduleLive();
  }

  function unescapeWifi(s) {
    return s.replace(/\\([\\;,":])/, '$1');
  }

  clearHistory.addEventListener('click', () => {
    history = [];
    localStorage.removeItem('qr_history');
    renderHistory();
  });

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60)  return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

})();
