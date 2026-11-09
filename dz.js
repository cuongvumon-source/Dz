// ==UserScript==
// @name         Link4m Bypass (Custom UI & Pro Features)
// @namespace    https://link4m.com/
// @version      1.0.0
// @description  Tự động OCR domain, giải widget nhiệm vụ và lấy link đích Link4m (Mã nguồn mở, dễ tùy chỉnh UI & tích hợp tính năng nâng cao)
// @match        https://link4m.net/*
// @match        https://link4m.com/*
// @match        https://*.link4m.net/*
// @match        https://*.link4m.com/*
// @match        https://link4m.org/*
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlHttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_setClipboard
// @connect      *
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  /* ==========================================================================
   * 1. CẤU HÌNH GIAO DIỆN & TÍNH NĂNG (DỄ DÀNG CHỈNH SỬA TẠI ĐÂY)
   * ========================================================================== */
  const CONFIG = {
    title: 'Link4m (Bypass Pro)',
    showCustomLinks: false, // Đặt true nếu muốn hiện 2 nút liên kết bên dưới
    customLinks: {
      storeText: 'My Store',
      storeUrl: 'https://robuxvien.com/home',
      serverText: 'My Server',
      serverUrl: 'https://discord.gg/rcRBbzTfqB',
    },
    defaultSettings: {
      autoCopy: true,      // Tự động copy URL đích khi hoàn tất
      autoRedirect: false, // Tự động mở/chuyển hướng tới URL đích khi hoàn tất
      soundAlert: true,    // Phát âm báo khi cần giải reCaptcha hoặc khi xong
      theme: 'cyan',       // 'cyan' | 'purple' | 'emerald' | 'rose'
    },
    ocrApiKeys: [
      'helloworld',
      'K89899142388957',
      'K81724188988957',
    ],
  };

  const THEMES = {
    cyan: {
      accent: '#6fd8f5',
      accentGrad: 'linear-gradient(135deg, #7de0ff, #3a9fd8)',
      borderGrad: 'linear-gradient(160deg, rgba(125,216,245,.75), rgba(150,235,255,.3) 45%, rgba(125,216,245,.5))',
      glow: 'rgba(88,196,236,.32)',
    },
    purple: {
      accent: '#c084fc',
      accentGrad: 'linear-gradient(135deg, #c084fc, #6366f1)',
      borderGrad: 'linear-gradient(160deg, rgba(192,132,252,.75), rgba(129,140,248,.3) 45%, rgba(192,132,252,.5))',
      glow: 'rgba(168,85,247,.32)',
    },
    emerald: {
      accent: '#34d399',
      accentGrad: 'linear-gradient(135deg, #6ee7b7, #10b981)',
      borderGrad: 'linear-gradient(160deg, rgba(52,211,153,.75), rgba(16,185,129,.3) 45%, rgba(52,211,153,.5))',
      glow: 'rgba(16,185,129,.32)',
    },
    rose: {
      accent: '#fb7185',
      accentGrad: 'linear-gradient(135deg, #fda4af, #f43f5e)',
      borderGrad: 'linear-gradient(160deg, rgba(251,113,133,.75), rgba(244,63,94,.3) 45%, rgba(251,113,133,.5))',
      glow: 'rgba(244,63,94,.32)',
    },
  };

  /* ==========================================================================
   * 2. DANH SÁCH TLD & DOMAIN LOẠI TRỪ (GIỮ NGUYÊN TỪ FILE GỐC)
   * ========================================================================== */
  const TLD_LIST = [
    'com.vn', 'net.vn', 'edu.vn', 'org.vn', 'gov.vn', 'info.vn', 'pro.vn', 'ac.vn', 'health.vn', 'name.vn',
    'co.uk', 'org.uk', 'com.au', 'com.sg', 'com.my', 'com.ph', 'co.jp', 'co.kr', 'co.id', 'co.th', 'com.br',
    'vn', 'com', 'net', 'org', 'io', 'co', 'me', 'xyz', 'app', 'dev', 'top', 'site', 'online', 'store',
    'club', 'pro', 'tv', 'cc', 'gg', 'asia', 'biz', 'us', 'uk', 'ca', 'de', 'jp', 'kr', 'sg', 'id', 'th',
    'my', 'ph', 'lat', 'icu', 'fun', 'space', 'tech', 'website', 'lol', 'click', 'link', 'live', 'news',
    'blog', 'shop', 'vip', 'win', 'work', 'world', 'zone', 'ai', 'to', 'sh', 'fm', 'ly', 'gl', 'it', 'es',
    'fr', 'ru', 'br', 'in', 'au', 'nl', 'se', 'no', 'pl', 'cz', 'ch', 'at', 'be', 'dk', 'fi', 'gr', 'hk',
    'tw', 'nz', 'za', 'mx', 'ar', 'cl', 'pe', 've', 'ua', 'ro', 'hu', 'tr', 'sa', 'ae', 'pk', 'bd', 'lk',
    'np', 'mm', 'kh', 'la', 'bn', 'mobi', 'name', 'page', 'life', 'today', 'cloud', 'digital', 'media',
    'network', 'systems', 'solutions', 'services', 'games', 'game', 'apk', 'download',
  ];
  const TLD_SET = Object.create(null);
  for (const tld of TLD_LIST) TLD_SET[tld] = true;

  const IGNORED_HOST_RE = /^(?:www\.)?(?:google\.[a-z.]+|link4m\.[a-z.]+|gstatic\.com|googleapis\.com|googleusercontent\.com|cloudflare\.com|youtube\.com|youtu\.be|facebook\.com|fb\.com|chrome\.google\.com|android\.com|apple\.com|microsoft\.com|w3\.org|schema\.org|example\.com)$/i;

  /* ==========================================================================
   * 3. BIẾN TRẠNG THÁI & LƯU TRỮ CÀI ĐẶT
   * ========================================================================== */
  const ui = {
    root: null,
    shadow: null,
    panel: null,
    fab: null,
    status: null,
    statusText: null,
    spin: null,
    input: null,
    go: null,
    urlwrap: null,
    store: null,
    server: null,
    open: true,
    result: null,
    rurl: null,
    rCopy: null,
    rOpen: null,
    cdfill: null,
    notice: null,
    iform: null,
    historyList: null,
  };

  let currentStatusText = 'Đang khởi tạo…';
  let currentStatusType = '';
  let isSpinning = true;
  let isRunningTask = false;
  let isOcrRunning = false;
  let tesseractPromise = null;
  const activeTimers = Object.create(null);

  function loadStore(key, fallback) {
    try {
      if (typeof GM_getValue === 'function') {
        const raw = GM_getValue(key, null);
        if (raw !== null && raw !== undefined) return JSON.parse(raw);
      }
    } catch (_) {}
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return fallback;
  }

  function saveStore(key, value) {
    const str = JSON.stringify(value);
    try {
      if (typeof GM_setValue === 'function') {
        GM_setValue(key, str);
        return;
      }
    } catch (_) {}
    try {
      localStorage.setItem(key, str);
    } catch (_) {}
  }

  const userSettings = Object.assign({}, CONFIG.defaultSettings, loadStore('_l4m_custom_settings_', {}));
  const linkHistory = loadStore('_l4m_link_history_', []);

  /* ==========================================================================
   * 4. TIỆN ÍCH ÂM BÁO, CLIPBOARD, TRÌNH DUYỆT & MẠNG
   * ========================================================================== */
  function playBeep(type = 'ok') {
    if (!userSettings.soundAlert) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'notice') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      } else {
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.setValueAtTime(987.77, ctx.currentTime + 0.1); // B5
      }
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch (_) {}
  }

  function copyTextToClipboard(text, silent = false) {
    if (!text) return;
    const onDone = (ok) => {
      if (!silent) {
        updateStatus(ok ? '✓ Đã copy' : '✗ Copy thất bại', false, ok ? 'ok' : 'err');
      }
    };
    try {
      if (typeof GM_setClipboard === 'function') {
        GM_setClipboard(text);
        onDone(true);
        return;
      }
    } catch (_) {}
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(() => onDone(true)).catch(() => fallbackCopy(text, onDone));
    } else {
      fallbackCopy(text, onDone);
    }
  }

  function fallbackCopy(text, cb) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      cb(ok);
    } catch (_) {
      cb(false);
    }
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"]/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
    }[ch] || ch));
  }

  function truncateStr(str, maxLen = 80) {
    if (!str) return '';
    const s = String(str);
    return s.length > maxLen ? s.slice(0, maxLen) + '…' : s;
  }

  function stripHtml(html) {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = String(html);
    return (div.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function sleep(ms) {
    return new Promise((resolve) => {
      const end = Date.now() + Math.max(0, ms);
      let timer = null;
      const check = () => {
        const rem = end - Date.now();
        if (rem <= 0) {
          cleanup();
          resolve();
        } else {
          clearTimeout(timer);
          timer = setTimeout(check, Math.min(rem, 250));
        }
      };
      const onVis = () => {
        if (!document.hidden) check();
      };
      const cleanup = () => {
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', onVis);
        window.removeEventListener('focus', check);
      };
      document.addEventListener('visibilitychange', onVis);
      window.addEventListener('focus', check);
      check();
    });
  }

  async function sleepWithCountdown(ms, key, label) {
    const dur = Math.max(1, ms);
    activeTimers[key] = {
      label: label || '',
      end: Date.now() + dur,
      dur,
    };
    renderStatusAndTimers();
    try {
      await sleep(ms);
    } finally {
      delete activeTimers[key];
      renderStatusAndTimers();
    }
  }

  function waitForOnline(timeoutMs = 120000) {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      let timer = null;
      const done = (val) => {
        window.removeEventListener('online', onOnline);
        clearTimeout(timer);
        resolve(val);
      };
      const onOnline = () => done(true);
      window.addEventListener('online', onOnline);
      timer = setTimeout(() => done(false), Math.max(0, timeoutMs));
    });
  }

  function httpRequest(url, options = {}) {
    const method = String(options.method || 'GET').toUpperCase();
    const timeout = options.timeout == null ? 25000 : options.timeout;
    const headers = options.headers || {};
    const data = options.data;
    const responseType = options.responseType;
    const withCredentials = Boolean(options.withCredentials);

    const gmReq =
      (typeof GM !== 'undefined' && GM && typeof GM.xmlHttpRequest === 'function' && GM.xmlHttpRequest.bind(GM)) ||
      (typeof GM_xmlhttpRequest === 'function' && GM_xmlhttpRequest);

    if (gmReq) {
      return new Promise((resolve, reject) => {
        gmReq({
          method,
          url,
          headers,
          data,
          timeout,
          responseType,
          anonymous: !withCredentials,
          onload: (res) => resolve(res),
          onerror: (err) => reject(new Error('Lỗi mạng: ' + (err && err.statusText ? err.statusText : 'network error'))),
          ontimeout: () => reject(new Error('Hết thời gian chờ (' + timeout / 1000 + 's)')),
          onabort: () => reject(new Error('Request bị hủy')),
        });
      });
    }

    return fetch(url, {
      method,
      headers,
      body: method === 'GET' ? undefined : data,
      credentials: withCredentials ? 'include' : 'omit',
    }).then(async (res) => {
      if (responseType === 'arraybuffer') {
        const buf = await res.arrayBuffer();
        return { status: res.status, response: buf, finalUrl: res.url };
      }
      const text = await res.text();
      return { status: res.status, responseText: text, finalUrl: res.url };
    });
  }

  /* ==========================================================================
   * 5. QUẢN LÝ TRẠNG THÁI GIAO DIỆN (UI HELPERS)
   * ========================================================================== */
  function setPanelOpen(isOpen) {
    ui.open = Boolean(isOpen);
    if (ui.panel) ui.panel.style.display = ui.open ? '' : 'none';
    if (ui.fab) ui.fab.style.display = ui.open ? 'none' : '';
  }

  function updateStatus(text, spinning, type = '') {
    currentStatusText = String(text || '');
    if (typeof spinning === 'boolean') isSpinning = spinning;
    currentStatusType = type || '';
    renderStatusAndTimers();
  }

  function renderStatusAndTimers() {
    if (!ui.statusText) return;
    if (ui.spin) {
      ui.spin.className = 'spin' + (isSpinning ? ' on' : '');
    }
    const now = Date.now();
    const keys = Object.keys(activeTimers);
    let activeCd = null;
    for (const k of keys) {
      const item = activeTimers[k];
      if (item && item.end > now) {
        if (!activeCd || item.end < activeCd.end) activeCd = item;
      } else {
        delete activeTimers[k];
      }
    }

    if (activeCd) {
      const remSec = Math.max(0, Math.ceil((activeCd.end - now) / 1000));
      const mm = Math.floor(remSec / 60);
      const ss = remSec % 60;
      const timeStr = mm > 0 ? `${mm}:${String(ss).padStart(2, '0')}` : `${ss}s`;
      const baseText = activeCd.label || currentStatusText;
      ui.statusText.innerHTML =
        escapeHtml(baseText) +
        ` <span class="cd${remSec <= 10 ? ' urgent' : ''}"><i class="cddot"></i>${timeStr}</span>`;
      if (ui.cdfill) {
        const pct = activeCd.dur > 0 ? Math.min(100, Math.max(0, ((now - (activeCd.end - activeCd.dur)) / activeCd.dur) * 100)) : 0;
        ui.cdfill.style.width = pct.toFixed(1) + '%';
      }
    } else {
      ui.statusText.textContent = currentStatusText;
      if (ui.cdfill) ui.cdfill.style.width = '0%';
    }
    ui.statusText.className = 'stx' + (currentStatusType ? ' ' + currentStatusType : '');
  }

  function hideNotice() {
    if (ui.notice) ui.notice.classList.remove('on');
  }

  function setFormVisible(visible) {
    const show = Boolean(visible);
    if (ui.urlwrap) ui.urlwrap.style.display = show ? '' : 'none';
    if (ui.go) ui.go.style.display = show ? '' : 'none';
    if (ui.status) ui.status.style.borderBottom = show ? '' : 'none';
  }

  function updateControlsState() {
    const busy = isRunningTask || isOcrRunning;
    if (ui.input) ui.input.disabled = busy;
    if (ui.go) {
      ui.go.disabled = busy;
      ui.go.textContent = isRunningTask ? 'Đang chạy…' : isOcrRunning ? 'Đang OCR…' : 'Bắt đầu';
    }
  }

  function addLinkToHistory(url) {
    if (!url) return;
    const entry = { url, time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) };
    if (linkHistory.length === 0 || linkHistory[0].url !== url) {
      linkHistory.unshift(entry);
      if (linkHistory.length > 5) linkHistory.length = 5;
      saveStore('_l4m_link_history_', linkHistory);
    }
    renderHistory();
  }

  function renderHistory() {
    if (!ui.historyList) return;
    if (!linkHistory.length) {
      ui.historyList.innerHTML = '<div class="hempty">Chưa có lịch sử vượt link</div>';
      return;
    }
    ui.historyList.innerHTML = linkHistory
      .map(
        (item, idx) => `
        <div class="hitem">
          <span class="htime">${escapeHtml(item.time)}</span>
          <a class="hlink" href="${escapeHtml(item.url)}" target="_blank" rel="noopener" title="${escapeHtml(item.url)}">${escapeHtml(truncateStr(item.url, 38))}</a>
          <button class="hcopy" data-idx="${idx}" title="Copy link">⧉</button>
        </div>`
      )
      .join('');
  }

  /* ==========================================================================
   * 6. LOGIC TRÍCH XUẤT DOMAIN & OCR TỰ ĐỘNG (OCR.SPACE + TESSERACT)
   * ========================================================================== */
  function isIgnoredDomain(domain) {
    if (!domain) return true;
    const clean = String(domain)
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '');
    return IGNORED_HOST_RE.test(clean) || /link4m|google|gstatic|recaptcha|cloudflare/i.test(clean);
  }

  function isValidDomainName(domain) {
    if (!domain) return false;
    const parts = String(domain).toLowerCase().replace(/^\.+|\.+$/g, '').split('.');
    if (parts.length < 2) return false;
    for (const part of parts) {
      if (!part || !/^[a-z0-9-]+$/.test(part) || /^-|-$/.test(part)) return false;
    }
    const twoLevelTld = parts.slice(-2).join('.');
    const oneLevelTld = parts[parts.length - 1];
    if (TLD_SET[twoLevelTld]) {
      return parts.length >= 3 && parts[parts.length - 3].length >= 2;
    }
    if (TLD_SET[oneLevelTld]) {
      return parts[parts.length - 2].length >= 2;
    }
    return false;
  }

  function escapeRegex(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function parseGuideWrapper(wrapper) {
    const result = { directDomains: [], masks: [] };
    if (!wrapper) return result;
    const rawText = (wrapper.innerText || wrapper.textContent || '').replace(/\s+/g, ' ');
    const step3Match = rawText.match(/Bước\s*3\s*[:.\-]?([\s\S]*?)(?:Bước\s*4|$)/i);
    const segments = [];
    if (step3Match && step3Match[1]) segments.push(step3Match[1]);
    segments.push(rawText);

    const seenMasks = Object.create(null);
    const seenDirect = Object.create(null);

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const maskRe = /(?:https?:\/\/)?([a-z0-9.\-]*\*+[a-z0-9.*\-]*\.[a-z]{2,}(?:\.[a-z]{2,})?)/gi;
      let m;
      while ((m = maskRe.exec(seg)) !== null) {
        const raw = m[1].toLowerCase().replace(/^www\./, '').replace(/^\.+|\.+$/g, '');
        if (!seenMasks[raw]) {
          seenMasks[raw] = true;
          const firstStar = raw.indexOf('*');
          const lastStar = raw.lastIndexOf('*');
          const prefix = raw.slice(0, firstStar);
          const suffix = raw.slice(lastStar + 1);
          const pattern = '^' + raw.split(/\*+/).map(escapeRegex).join('[a-z0-9.-]+') + '$';
          try {
            result.masks.push({ raw, prefix, suffix, regex: new RegExp(pattern, 'i') });
          } catch (_) {}
        }
      }
      if (i === 0 && result.masks.length > 0) continue;

      const directRe = /(?:https?:\/\/)?((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:\.[a-z]{2,})?)\b/gi;
      while ((m = directRe.exec(seg)) !== null) {
        const d = m[1].toLowerCase().replace(/^www\./, '');
        if (!seenDirect[d] && isValidDomainName(d) && !isIgnoredDomain(d)) {
          seenDirect[d] = true;
          result.directDomains.push(d);
        }
      }
    }
    return result;
  }

  function collectGuideImages(wrapper) {
    const candidates = [];
    const byUrl = Object.create(null);

    const addCandidate = (rawUrl, priority, el) => {
      if (!rawUrl || typeof rawUrl !== 'string') return;
      let url = rawUrl.trim();
      if (!url || /^about:|^javascript:/i.test(url)) return;
      if (/^\/\//.test(url)) url = 'https:' + url;
      else if (/^\//.test(url)) url = location.origin + url;
      if (!/^https?:\/\/|^data:image\/|^blob:/i.test(url)) return;
      if (/google|gstatic|recaptcha|logo|icon|avatar|favicon|banner|spinner|loading|\.svg(?:\?|$)/i.test(url)) return;

      if (!byUrl[url]) {
        const entry = { url, priority, el: el || null };
        byUrl[url] = entry;
        candidates.push(entry);
      } else if (priority < byUrl[url].priority) {
        byUrl[url].priority = priority;
      }
    };

    if (wrapper) {
      const imgs = wrapper.querySelectorAll('img');
      for (let i = 0; i < imgs.length; i++) {
        const img = imgs[i];
        const src =
          img.currentSrc ||
          img.src ||
          img.getAttribute('data-src') ||
          img.getAttribute('data-lazy-src') ||
          img.getAttribute('data-original') ||
          '';
        if (!src) continue;
        let prio = 20 + i;
        if (/\/uploads\/advertiser\//i.test(src) || /img\.link4m\./i.test(src)) {
          prio = /\/1_[^/]+\.[a-z]+$/i.test(src) ? 1 : 5 + i;
        }
        try {
          const parent = img.parentElement;
          const prev = img.previousElementSibling || (parent && parent.previousElementSibling);
          const nearText = (prev && prev.textContent) || (parent && parent.textContent) || '';
          if (/Bước\s*3|website|trang\s*web/i.test(nearText)) {
            prio = Math.min(prio, 2);
          }
        } catch (_) {}
        addCandidate(src, prio, img);
      }

      const canvases = wrapper.querySelectorAll('canvas');
      for (let i = 0; i < canvases.length; i++) {
        try {
          const c = canvases[i];
          if (c.width > 80 && c.height > 25) {
            const dataUrl = c.toDataURL('image/png');
            if (dataUrl && dataUrl.length > 200) addCandidate(dataUrl, 3 + i, null);
          }
        } catch (_) {}
      }

      const allEls = wrapper.querySelectorAll('*');
      for (let i = 0; i < allEls.length; i++) {
        try {
          const bg = window.getComputedStyle(allEls[i]).backgroundImage || '';
          const m = bg.match(/url\(["']?([^"')]+)["']?\)/i);
          if (m && m[1]) {
            const prio = /\/1_[^/]+\.[a-z]+$/i.test(m[1]) ? 1 : 15 + i;
            addCandidate(m[1], prio, null);
          }
        } catch (_) {}
      }
    }

    try {
      if (window.performance && typeof performance.getEntriesByType === 'function') {
        const resources = performance.getEntriesByType('resource') || [];
        for (let i = 0; i < resources.length; i++) {
          const name = String((resources[i] && resources[i].name) || '');
          if (
            /\/uploads\/advertiser\/|img\.link4m\./i.test(name) &&
            /\.(?:jpe?g|png|webp|gif|bmp)(?:\?|$)/i.test(name)
          ) {
            const prio = /\/1_[^/]+\.[a-z]+(?:\?|$)/i.test(name) ? 1 : 8 + i;
            addCandidate(name, prio, null);
          }
        }
      }
    } catch (_) {}

    candidates.sort((a, b) => a.priority - b.priority);
    return candidates;
  }

  async function waitForGuideImages(wrapper, maxWaitMs = 6000) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const w = wrapper || document.getElementById('advertise-html-wrapper');
      const list = collectGuideImages(w);
      if (list.length > 0) return list;
      await sleep(300);
    }
    return collectGuideImages(wrapper || document.getElementById('advertise-html-wrapper'));
  }

  function uint8ToBase64(bytes) {
    let binary = '';
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  async function imageCandidateToDataUrl(candidate) {
    if (!candidate || !candidate.url) return null;
    if (/^data:image\//i.test(candidate.url)) return candidate.url;
    try {
      const res = await httpRequest(candidate.url, {
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          referer: location.href,
        },
      });
      if (res && res.response && res.response.byteLength > 100) {
        const bytes = new Uint8Array(res.response);
        let mime = 'image/png';
        if (bytes[0] === 0xff && bytes[1] === 0xd8) mime = 'image/jpeg';
        else if (bytes[0] === 0x52 && bytes[1] === 0x49) mime = 'image/webp';
        return `data:${mime};base64,${uint8ToBase64(bytes)}`;
      }
    } catch (_) {}

    try {
      const el = candidate.el;
      if (el && el.complete && el.naturalWidth > 0) {
        const c = document.createElement('canvas');
        c.width = el.naturalWidth;
        c.height = el.naturalHeight;
        c.getContext('2d').drawImage(el, 0, 0);
        return c.toDataURL('image/png');
      }
    } catch (_) {}
    return null;
  }

  function createPreprocessedImageVariants(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const w = img.naturalWidth || img.width || 600;
          const h = img.naturalHeight || img.height || 150;
          const scale = w < 900 ? 2 : 1;
          const c1 = document.createElement('canvas');
          c1.width = Math.round(w * scale);
          c1.height = Math.round(h * scale);
          const ctx1 = c1.getContext('2d');
          ctx1.fillStyle = '#ffffff';
          ctx1.fillRect(0, 0, c1.width, c1.height);
          ctx1.imageSmoothingEnabled = true;
          ctx1.imageSmoothingQuality = 'high';
          ctx1.filter = 'contrast(1.25) brightness(1.02)';
          ctx1.drawImage(img, 0, 0, c1.width, c1.height);
          const variants = [c1.toDataURL('image/jpeg', 0.92)];

          if (h > 70) {
            const cropH = Math.round(h * 0.6);
            const c2 = document.createElement('canvas');
            c2.width = Math.round(w * 2.5);
            c2.height = Math.round(cropH * 2.5);
            const ctx2 = c2.getContext('2d');
            ctx2.fillStyle = '#ffffff';
            ctx2.fillRect(0, 0, c2.width, c2.height);
            ctx2.imageSmoothingEnabled = true;
            ctx2.imageSmoothingQuality = 'high';
            ctx2.filter = 'contrast(1.35)';
            ctx2.drawImage(img, 0, 0, w, cropH, 0, 0, c2.width, c2.height);
            variants.push(c2.toDataURL('image/jpeg', 0.92));
          }
          resolve(variants);
        } catch (_) {
          resolve([dataUrl]);
        }
      };
      img.onerror = () => resolve([dataUrl]);
      img.src = dataUrl;
    });
  }

  async function callOcrSpace(base64Image, engine = 2, apiKey = 'helloworld') {
    const params = new URLSearchParams();
    params.set('base64Image', base64Image);
    params.set('language', 'eng');
    params.set('isOverlayRequired', 'false');
    params.set('scale', 'true');
    params.set('OCREngine', String(engine || 2));
    params.set('detectOrientation', 'false');

    const res = await httpRequest('https://api.ocr.space/parse/image', {
      method: 'POST',
      timeout: 18000,
      headers: {
        apikey: apiKey || 'helloworld',
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: params.toString(),
    });
    const json = JSON.parse(res.responseText || '{}');
    if (!Array.isArray(json.ParsedResults) || !json.ParsedResults.length) return '';
    return json.ParsedResults.map((r) => (r && r.ParsedText ? r.ParsedText.trim() : '')).join('\n');
  }

  async function callTesseractFallback(base64Image) {
    if (!window.Tesseract) {
      if (!tesseractPromise) {
        tesseractPromise = new Promise((resolve) => {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
          s.onload = () => resolve(Boolean(window.Tesseract));
          s.onerror = () => resolve(false);
          (document.head || document.documentElement).appendChild(s);
        });
      }
      const loaded = await tesseractPromise;
      if (!loaded) return '';
    }
    try {
      if (window.Tesseract && typeof window.Tesseract.recognize === 'function') {
        const res = await window.Tesseract.recognize(base64Image, 'eng');
        return String((res && res.data && res.data.text) || '').trim();
      }
    } catch (_) {}
    return '';
  }

  function levenshteinDistance(a, b) {
    const s1 = String(a || '').toLowerCase();
    const s2 = String(b || '').toLowerCase();
    const m = s1.length;
    const n = s2.length;
    if (!m) return n;
    if (!n) return m;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }
    return dp[m][n];
  }

  function extractBestDomainFromOcrText(rawText, guideInfo) {
    if (!rawText) return null;
    const masks = (guideInfo && guideInfo.masks) || [];
    const scores = Object.create(null);

    const scoreCandidate = (cand, baseScore = 10) => {
      if (!cand) return;
      const d = String(cand)
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/[/›><"'(),;:\s].*$/, '')
        .replace(/^\.+|\.+$/g, '');
      if (!d || d.length < 4 || isIgnoredDomain(d) || !isValidDomainName(d)) return;

      if (!scores[d]) scores[d] = { domain: d, score: 0, count: 0 };
      scores[d].count += 1;
      scores[d].score += baseScore;

      for (const mask of masks) {
        if (mask.regex && mask.regex.test(d)) {
          scores[d].score += 1000;
        } else if (mask.suffix && d.slice(-mask.suffix.length) === mask.suffix) {
          scores[d].score += 60;
          if (mask.prefix && d.indexOf(mask.prefix) === 0) {
            scores[d].score += 500;
          }
        }
      }
    };

    const cleaned = String(rawText)
      .replace(/https?\s*:\s*\/\s*\//gi, 'https://')
      .replace(/([a-z0-9])\s*[,\uff0c]\s*(com\.vn|net\.vn|edu\.vn|org\.vn|vn|com|net|org|io|info|co|me|xyz|app|dev|top|site|online|store|club|pro|tv|cc|gg|asia|biz)\b/gi, '$1.$2')
      .replace(/([a-z0-9])\s+\.\s+(com\.vn|net\.vn|edu\.vn|org\.vn|vn|com|net|org|io|info|co|me|xyz|app|dev|top|site|online|store|club|pro|tv|cc|gg|asia|biz)\b/gi, '$1.$2')
      .replace(/([a-z0-9])\.\s+(com\.vn|net\.vn|edu\.vn|org\.vn|vn|com|net|org|io|info|co|me|xyz|app|dev|top|site|online|store|club|pro|tv|cc|gg|asia|biz)\b/gi, '$1.$2')
      .replace(/([a-z0-9])\s+\.(com\.vn|net\.vn|edu\.vn|org\.vn|vn|com|net|org|io|info|co|me|xyz|app|dev|top|site|online|store|club|pro|tv|cc|gg|asia|biz)\b/gi, '$1.$2');

    let m;
    const urlRe = /https?:\/\/([a-z0-9][a-z0-9.\-]{1,61}\.[a-z]{2,}(?:\.[a-z]{2,})?)/gi;
    while ((m = urlRe.exec(cleaned)) !== null) {
      scoreCandidate(m[1], 50);
    }

    const lines = cleaned.split(/\r?\n/);
    const domRe = /\b((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:\.[a-z]{2,})?)\b/gi;
    for (let i = 0; i < lines.length; i++) {
      const lineWeight = i < 3 ? 30 : 15;
      domRe.lastIndex = 0;
      while ((m = domRe.exec(lines[i])) !== null) {
        scoreCandidate(m[1], lineWeight);
      }
    }

    for (const mask of masks) {
      const prefix = mask.prefix || '';
      const suffix = mask.suffix || '';
      const tldClean = suffix.replace(/^\./, '');
      for (const d of Object.keys(scores)) {
        if (suffix && d.slice(-suffix.length) === suffix && prefix.length >= 3) {
          const dist = levenshteinDistance(d.slice(0, prefix.length), prefix);
          if (dist > 0 && dist <= 2) {
            scoreCandidate(prefix + d.slice(prefix.length), 800);
          }
        }
      }
      if (prefix.length >= 3 && tldClean.length >= 2) {
        const wordRe = /\b([a-z0-9-]{5,40})\b/gi;
        while ((m = wordRe.exec(cleaned)) !== null) {
          const w = m[1].toLowerCase();
          if (w.length > prefix.length + tldClean.length && w.slice(-tldClean.length) === tldClean) {
            const head = w.slice(0, prefix.length);
            if (head === prefix || (prefix.length >= 4 && levenshteinDistance(head, prefix) <= 1)) {
              const mid = w.slice(prefix.length, w.length - tldClean.length);
              if (/^[a-z0-9-]+$/.test(mid)) {
                scoreCandidate(`${prefix}${mid}.${tldClean}`, 700);
              }
            }
          }
        }
      }
    }

    let best = null;
    for (const d of Object.keys(scores)) {
      if (!best || scores[d].score > best.score) best = scores[d];
    }
    return best ? best.domain : null;
  }

  async function ocrImageCandidate(candidate, guideInfo) {
    const dataUrl = await imageCandidateToDataUrl(candidate);
    if (!dataUrl) return null;
    const variants = await createPreprocessedImageVariants(dataUrl);
    const allTexts = [];

    for (let vIdx = 0; vIdx < Math.min(variants.length, 2); vIdx++) {
      for (let kIdx = 0; kIdx < CONFIG.ocrApiKeys.length; kIdx++) {
        try {
          const text = await callOcrSpace(variants[vIdx], 2, CONFIG.ocrApiKeys[kIdx]);
          if (text) {
            allTexts.push(text);
            const domain = extractBestDomainFromOcrText(allTexts.join('\n'), guideInfo);
            if (domain) return domain;
            break;
          }
        } catch (_) {}
      }
    }

    try {
      const text1 = await callOcrSpace(variants[0], 1, CONFIG.ocrApiKeys[0]);
      if (text1) {
        allTexts.push(text1);
        const domain = extractBestDomainFromOcrText(allTexts.join('\n'), guideInfo);
        if (domain) return domain;
      }
    } catch (_) {}

    updateStatus('Đang OCR dự phòng (Tesseract)…', true, 'info');
    try {
      const tessText = await callTesseractFallback(variants[0]);
      if (tessText) {
        allTexts.push(tessText);
        const domain = extractBestDomainFromOcrText(allTexts.join('\n'), guideInfo);
        if (domain) return domain;
      }
    } catch (_) {}

    return extractBestDomainFromOcrText(allTexts.join('\n'), guideInfo);
  }

  async function autoDetectAndRunBypass() {
    if (isRunningTask || isOcrRunning) return;
    isOcrRunning = true;
    updateControlsState();
    try {
      const wrapper = document.getElementById('advertise-html-wrapper');
      const guideInfo = parseGuideWrapper(wrapper);

      if (guideInfo.directDomains.length > 0) {
        const domain = guideInfo.directDomains[0];
        const fullUrl = 'https://' + domain;
        if (ui.input) ui.input.value = fullUrl;
        isOcrRunning = false;
        updateControlsState();
        updateStatus('✓ Đã lấy domain: ' + domain, true, 'ok');
        await executeBypassForUrl(fullUrl);
        return;
      }

      updateStatus('Đang lấy ảnh hướng dẫn…', true, 'info');
      const images = await waitForGuideImages(wrapper, 6000);
      if (!images || !images.length) {
        updateStatus('⊘ Không tìm thấy ảnh hướng dẫn — hãy nhập URL', false, 'warn');
        return;
      }

      const maxImgs = Math.min(images.length, 3);
      let foundDomain = null;
      for (let i = 0; i < maxImgs; i++) {
        updateStatus(`Đang OCR ảnh (${i + 1}/${maxImgs})…`, true, 'info');
        foundDomain = await ocrImageCandidate(images[i], guideInfo);
        if (foundDomain) break;
      }

      if (!foundDomain) {
        updateStatus('⊘ Không OCR được domain — hãy nhập tay', false, 'warn');
        return;
      }

      const fullUrl = 'https://' + foundDomain;
      if (ui.input) ui.input.value = fullUrl;
      isOcrRunning = false;
      updateControlsState();
      updateStatus(`✓ Đã OCR: ${foundDomain} — bắt đầu giải…`, true, 'ok');
      await executeBypassForUrl(fullUrl);
    } catch (_) {
      updateStatus('⊘ Lỗi tự động OCR — hãy nhập URL tay', false, 'warn');
    } finally {
      isOcrRunning = false;
      updateControlsState();
    }
  }

  /* ==========================================================================
   * 7. LOGIC GIẢI WIDGET NHIỆM VỤ & LẤY LINK ĐÍCH LINK4M
   * ========================================================================== */
  function unescapeHex(str) {
    if (!str) return str;
    return str.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }

  function matchStringVar(jsCode, varName) {
    const m = jsCode.match(new RegExp(`var\\s+${varName}\\s*=\\s*['"]([^'"]+)['"]`));
    return m ? unescapeHex(m[1]) : null;
  }

  function matchNumberVar(jsCode, varName) {
    const m = jsCode.match(new RegExp(`var\\s+${varName}\\s*=\\s*['"]?(-?[0-9]+(?:\\.[0-9]+)?)['"]?`));
    return m ? parseFloat(m[1]) : null;
  }

  function evalClientJsResponse(jsCode, initialJscd) {
    const code = String(jsCode || '').trim();
    if (!code) return { ok: true, empty: true, value: null, jscd: initialJscd };
    try {
      const fnBody = `var jscd = ${JSON.stringify(initialJscd || {})};\nvar __r = eval(${JSON.stringify(code)});\nreturn { r: __r, jscd: (typeof jscd !== 'undefined' ? jscd : null) };`;
      const out = new Function(fnBody).call(window);
      return { ok: true, value: out.r, jscd: out.jscd };
    } catch (err) {
      return { ok: false, err: err.message, jscd: initialJscd };
    }
  }

  function generateUuidV4() {
    let d = new Date().getTime();
    if (window.performance && typeof window.performance.now === 'function') {
      d += performance.now();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = ((d + Math.random() * 16) % 16) | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function getOrCreateTrafficClientId(suffix) {
    const key = '_traffic_cid_' + (suffix || 'default');
    try {
      if (typeof GM_getValue === 'function') {
        const existing = GM_getValue(key, null);
        if (existing) return existing;
      }
      const cid = generateUuidV4();
      if (typeof GM_setValue === 'function') GM_setValue(key, cid);
      return cid;
    } catch (_) {
      return generateUuidV4();
    }
  }

  function detectBrowserAndOs() {
    const ua = navigator.userAgent || '';
    const appVer = navigator.appVersion || '';
    let browser = navigator.appName || 'Chrome';
    let version = String(parseFloat(appVer));
    let offset;

    if ((offset = ua.indexOf('OPR')) !== -1) {
      browser = 'Opera';
      version = ua.substring(offset + 4);
    } else if ((offset = ua.indexOf('Opera')) !== -1) {
      browser = 'Opera';
      version = ua.substring(offset + 6);
      if ((offset = ua.indexOf('Version')) !== -1) version = ua.substring(offset + 8);
    } else if ((offset = ua.indexOf('MSIE')) !== -1) {
      browser = 'Microsoft Internet Explorer';
      version = ua.substring(offset + 5);
    } else if ((offset = ua.indexOf('Chrome')) !== -1) {
      browser = 'Chrome';
      version = ua.substring(offset + 7);
    } else if ((offset = ua.indexOf('Safari')) !== -1) {
      browser = 'Safari';
      version = ua.substring(offset + 7);
      if ((offset = ua.indexOf('Version')) !== -1) version = ua.substring(offset + 8);
    } else if ((offset = ua.indexOf('Firefox')) !== -1) {
      browser = 'Firefox';
      version = ua.substring(offset + 8);
    } else if (ua.indexOf('Trident/') !== -1) {
      browser = 'Microsoft Internet Explorer';
      version = ua.substring(ua.indexOf('rv:') + 3);
    }

    version = version.split(';')[0].split(' ')[0].split(')')[0];
    let major = parseInt(version, 10);
    if (isNaN(major)) {
      version = String(parseFloat(appVer));
      major = parseInt(appVer, 10);
    }

    const mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(appVer);
    let os = 'Windows';
    let osVersion = '10';
    if (/Android/i.test(ua)) {
      os = 'Android';
      const m = ua.match(/Android\s+([\d.]+)/i);
      osVersion = m ? m[1] : '';
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      os = 'iOS';
      osVersion = '';
    } else if (/Mac OS X/i.test(ua)) {
      os = 'Mac OS X';
      osVersion = '';
    } else if (/Linux/i.test(ua)) {
      os = 'Linux';
      osVersion = '-';
    }

    return { browser, browserVersion: version, browserMajorVersion: major, mobile, os, osVersion };
  }

  function buildClientJscd(taskUrl, uuidName) {
    const u = new URL(taskUrl);
    const info = detectBrowserAndOs();
    return {
      screen: `${screen.width} x ${screen.height}`,
      browser: info.browser,
      browserVersion: info.browserVersion,
      browserMajorVersion: info.browserMajorVersion,
      mobile: info.mobile,
      os: info.os,
      osVersion: info.osVersion,
      cookies: true,
      flashVersion: 'no check',
      lang: 'vi',
      client_id: getOrCreateTrafficClientId(uuidName),
      pathname: u.pathname,
      href: u.href,
      hostname: u.hostname,
    };
  }

  function parseServiceJsVariables(jsText) {
    const source = { key: '-', code: '-', session: '-', domain: '-' };
    const uuidName = matchStringVar(jsText, 'uuid_name');

    let domain = matchStringVar(jsText, 'traffic_domain');
    if (domain) {
      source.domain = 'traffic_domain';
    } else {
      const m = jsText.match(/["']https?:\/\/["']\s*\+\s*([A-Za-z_$][\w$]*)\s*\+\s*["']\/widget\//);
      if (m) {
        domain = matchStringVar(jsText, m[1]);
        if (domain) source.domain = m[1];
      }
    }

    let key = null;
    const keyMatch = jsText.match(/[?&]key=["']\s*\+\s*([A-Za-z_$][\w$]*)/);
    if (keyMatch) {
      key = matchStringVar(jsText, keyMatch[1]);
      if (key) source.key = keyMatch[1];
    }
    if (!key) {
      key = matchStringVar(jsText, 'traffic_key');
      if (key) source.key = 'traffic_key';
    }

    let code = null;
    const codeMatch = jsText.match(/[?&]code=["']\s*\+\s*([A-Za-z_$][\w$]*)/);
    if (codeMatch) {
      code = matchStringVar(jsText, codeMatch[1]);
      if (code) source.code = codeMatch[1];
    }
    if (!code) {
      code = matchStringVar(jsText, 'traffic_id');
      if (code) source.code = 'traffic_id';
    }

    let session = null;
    const sessMatch = jsText.match(/traffic_session=["']\s*\+\s*([A-Za-z_$][\w$]*)/);
    if (sessMatch) {
      session = matchStringVar(jsText, sessMatch[1]);
      if (session) source.session = sessMatch[1];
    }
    if (!session) {
      session = matchStringVar(jsText, 'traffic_session');
      if (session) source.session = 'traffic_session';
    }
    if (!session) {
      const vMatch = jsText.match(/var\s+(v[a-f0-9]{5,})\s*=\s*['"]([^'"]+)['"]/i);
      if (vMatch) {
        session = unescapeHex(vMatch[2]);
        source.session = vMatch[1];
      }
    }
    if (!session) {
      const hexMatch = jsText.match(/var\s+([A-Za-z_$][\w$]*)\s*=\s*['"]([0-9a-f]{24})['"]/i);
      if (hexMatch) {
        session = hexMatch[2];
        source.session = 'hex24:' + hexMatch[1];
      }
    }

    return { key, code, session, domain, uuidName, source };
  }

  function analyzeServiceJs(jsText) {
    if (!/var\s+get_code\s*=\s*true\s*;/i.test(jsText)) {
      return { ok: false, reason: 'get_code != true' };
    }
    const refDomains = [];
    const listRe = /var\s+ref_domain_list\s*=\s*\[([^\]]*)\]/g;
    let m;
    while ((m = listRe.exec(jsText)) !== null) {
      const itemRe = /["']([^"']+)["']/g;
      let im;
      while ((im = itemRe.exec(m[1])) !== null) {
        refDomains.push(im[1]);
      }
    }
    const googleRefs = refDomains.filter((d) => /google/i.test(d));
    if (googleRefs.length === 0) {
      return { ok: false, reason: `không có ref google (${refDomains.length})` };
    }

    const endpoints = [];
    const seenEp = Object.create(null);
    const epRe = /(?:get_code\.html|get_quest_code\.html)/g;
    while ((m = epRe.exec(jsText)) !== null) {
      if (!seenEp[m[0]]) {
        seenEp[m[0]] = true;
        endpoints.push(m[0]);
      }
    }
    if (endpoints.length === 0) {
      return { ok: false, reason: 'không có endpoint' };
    }

    const roles = parseServiceJsVariables(jsText);
    if (!roles.key || !roles.code || !roles.session || !roles.domain) {
      return { ok: false, reason: 'thiếu key/code/session/domain' };
    }
    const totalStep = endpoints[0] === 'get_quest_code.html' ? '2' : '1';
    return { ok: true, endpoints, roles, totalStep };
  }

  async function fetchAndValidateWidget(widget, taskOrigin) {
    try {
      const res = await httpRequest(widget.link, {
        method: 'GET',
        headers: {
          accept: '*/*',
          'accept-language': 'vi,en;q=0.9,en-US;q=0.8',
          'cache-control': 'no-cache',
          pragma: 'no-cache',
          referer: taskOrigin,
        },
      });
      if (!res || res.status < 200 || res.status >= 400) return null;
      const body = res.responseText || '';
      const v = analyzeServiceJs(body);
      return v.ok ? { body, v } : null;
    } catch (_) {
      return null;
    }
  }

  async function runWidgetSteps(widget, prefetchedCtx, taskUrl) {
    const taskOrigin = new URL(taskUrl).origin + '/';
    const getHeaders = () => ({
      accept: '*/*',
      'accept-language': 'vi,en;q=0.9,en-US;q=0.8',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      referer: taskOrigin,
    });
    const postHeaders = () => ({
      accept: '*/*',
      'accept-language': 'vi,en;q=0.9,en-US;q=0.8',
      'cache-control': 'no-cache',
      'content-type': 'application/x-www-form-urlencoded',
      pragma: 'no-cache',
      referer: taskOrigin,
    });

    let currentStep = 1;
    let totalStep = '1';
    let stage = 'page';
    let retryCount = 0;
    let savedJscd = null;
    let savedId = null;
    let prefetchPromise = null;
    let ctx = prefetchedCtx;

    let body = '';
    let parsed = null;
    let endpoint = '';
    let roles = null;
    let wait1 = null;
    let wait2 = null;
    let clientPostData = '';
    let waitSec = 0;
    let queryParams = null;

    const stepLabel = () => `${Math.min(currentStep, parseInt(totalStep, 10) || 1)}/${totalStep}`;

    while (true) {
      try {
        if (stage === 'page') {
          if (ctx) {
            body = ctx.body;
            parsed = ctx.v;
            ctx = null;
          } else {
            const res = await httpRequest(widget.link, { method: 'GET', headers: getHeaders() });
            body = res.responseText || '';
            parsed = analyzeServiceJs(body);
            if (!parsed.ok) return null;
          }

          totalStep = parsed.totalStep;
          endpoint = parsed.endpoints[0];
          roles = parsed.roles;
          wait1 = matchNumberVar(body, 'traffic_wait_time');
          wait2 = totalStep === '2' ? matchNumberVar(body, 'traffic_step_2_wait_time') : null;

          const baseJscd = savedJscd
            ? Object.assign({}, savedJscd)
            : buildClientJscd(taskUrl, roles.uuidName);
          const jscdParams = new URLSearchParams(baseJscd).toString();
          clientPostData = `traffic_session=${encodeURIComponent(roles.session)}&key=${encodeURIComponent(roles.key)}&${jscdParams}`;
          waitSec = savedJscd && wait2 != null ? wait2 : wait1;
          stage = 'client';
        }

        if (stage === 'client') {
          const clientRes = await httpRequest(`https://${roles.domain}/widget/client.js`, {
            method: 'POST',
            data: clientPostData,
            headers: postHeaders(),
          });
          retryCount = 0;
          const evalOut = evalClientJsResponse(clientRes.responseText || '', buildClientJscd(taskUrl, roles.uuidName));
          const activeJscd = evalOut.jscd || buildClientJscd(taskUrl, roles.uuidName);

          if (totalStep === '2' && !savedJscd) {
            if (!prefetchPromise) {
              prefetchPromise = httpRequest(widget.link, { method: 'GET', headers: getHeaders() })
                .then((r) => {
                  const b = r.responseText || '';
                  const v = analyzeServiceJs(b);
                  return v.ok ? { body: b, v } : null;
                })
                .catch(() => null);
            }
          }

          const sec = parseFloat(waitSec);
          if (!isNaN(sec) && sec > 0) {
            await sleepWithCountdown(Math.round(sec * 1000), 'step', `Chờ bước (${stepLabel()})`);
          }

          queryParams = new URLSearchParams();
          if (savedId) queryParams.set('id', savedId);
          queryParams.set('code', roles.code);
          queryParams.set('traffic_session', roles.session);
          Object.keys(activeJscd).forEach((k) => {
            if (k !== 'id') queryParams.append(k, activeJscd[k]);
          });
          savedJscd = activeJscd;
          stage = 'endpoint';
        }

        if (stage === 'endpoint') {
          const epUrl = `https://${roles.domain}/widget/${endpoint}?${queryParams.toString()}`;
          const epRes = await httpRequest(epUrl, { method: 'GET', headers: getHeaders() });
          retryCount = 0;
          stage = 'page';

          let data = null;
          try {
            const parsedJson = JSON.parse((epRes.responseText || '').trim());
            data = Array.isArray(parsedJson) ? parsedJson[0] : parsedJson;
          } catch (_) {
            return null;
          }
          if (!data) return null;

          if (data.id) {
            savedId = data.id;
            currentStep = Math.min(currentStep + 1, parseInt(totalStep, 10) || 2);
            updateStatus('Qua bước 2…', true, 'info');
            if (prefetchPromise) {
              const pre = await prefetchPromise;
              prefetchPromise = null;
              if (pre) ctx = pre;
            }
            continue;
          }

          if (data.html) {
            const questCode = stripHtml(data.html);
            updateStatus('✓ Đã có mã', false, 'ok');
            return questCode || null;
          }
          return null;
        }
      } catch (_) {
        if (retryCount >= 5) return null;
        retryCount += 1;
        const backoff = Math.min(1000 * Math.pow(2, retryCount - 1), 16000);
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          updateStatus(`⚠ Mất mạng — chờ kết nối lại để tiếp tục bước ${stepLabel()}`, true, 'warn');
          await waitForOnline(120000);
        } else {
          await sleep(backoff);
        }
      }
    }
  }

  function getFormInputValue(name) {
    const el =
      document.querySelector(`input[name="${name}"]`) ||
      document.querySelector(`textarea[name="${name}"]`);
    return el && el.value ? String(el.value).trim() : '';
  }

  function getRecaptchaToken() {
    const els = document.querySelectorAll('[name="g-recaptcha-response"], textarea#g-recaptcha-response');
    for (let i = 0; i < els.length; i++) {
      const val = (els[i].value || '').trim();
      if (val) return val;
    }
    try {
      if (window.grecaptcha && typeof window.grecaptcha.getResponse === 'function') {
        for (let i = 0; i < 4; i++) {
          try {
            const r = (window.grecaptcha.getResponse(i) || '').trim();
            if (r) return r;
          } catch (_) {}
        }
      }
    } catch (_) {}
    return '';
  }

  function triggerInvisibleRecaptcha() {
    try {
      const g = window.grecaptcha;
      if (!g || typeof g.execute !== 'function') return false;
      const ids = [null, 0, 1, 2];
      for (const id of ids) {
        try {
          const p = id === null ? g.execute() : g.execute(id);
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch (_) {}
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  async function waitForRecaptchaSolution() {
    const key = 'recaptcha';
    activeTimers[key] = { label: '', end: Date.now() + 300000, dur: 300000 };
    updateStatus('Đang chờ giải reCaptcha…', true, 'warn');
    playBeep('notice');
    const start = Date.now();
    try {
      while (Date.now() - start < 300000) {
        const token = getRecaptchaToken();
        if (token) return token;
        await sleep(500);
      }
      return null;
    } finally {
      delete activeTimers[key];
      renderStatusAndTimers();
    }
  }

  function detectLink4mApiHost() {
    try {
      const m = document.documentElement.innerHTML.match(/https:\/\/[a-z0-9-]+\.link4m\.app/gi);
      if (m && m[0]) return m[0];
    } catch (_) {}
    return 'https://s1.link4m.app';
  }

  async function submitQuestCodeToLink4m(questCode) {
    const alias = getFormInputValue('alias');
    const campaignId = getFormInputValue('campaign_id');
    const displayId = getFormInputValue('display_id');
    const prefix = getFormInputValue('prefix') || questCode;

    if (!alias || !campaignId || !displayId) {
      updateStatus('⊘ Không tìm thấy form lấy mã', false, 'warn');
      return;
    }

    const apiHost = detectLink4mApiHost();
    const hasRecaptcha = Boolean(
      document.querySelector('[name="g-recaptcha-response"], .g-recaptcha, iframe[src*="recaptcha"], iframe[src*="google.com/recaptcha"]')
    );

    let recaptchaToken = '';
    if (hasRecaptcha) {
      if (ui.notice) ui.notice.classList.add('on');
      triggerInvisibleRecaptcha();
      recaptchaToken = (await waitForRecaptchaSolution()) || '';
      hideNotice();
      if (!recaptchaToken) {
        updateStatus('✗ Chờ reCaptcha quá 5 phút', false, 'err');
        return;
      }
    }

    updateStatus('Đang lấy URL…', true, 'info');
    const postData =
      `password=${encodeURIComponent(questCode)}` +
      `&alias=${encodeURIComponent(alias)}` +
      `&campaign_id=${encodeURIComponent(campaignId)}` +
      `&display_id=${encodeURIComponent(displayId)}` +
      `&prefix=${encodeURIComponent(prefix)}` +
      `&g-recaptcha-response=${encodeURIComponent(recaptchaToken)}`;

    let res;
    try {
      res = await httpRequest(`${apiHost}/links/get-link-info`, {
        method: 'POST',
        data: postData,
        timeout: 30000,
        headers: {
          accept: '*/*',
          'accept-language': 'vi,en;q=0.9,en-US;q=0.8',
          'cache-control': 'no-cache',
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          pragma: 'no-cache',
          referer: location.href,
        },
      });
    } catch (_) {
      updateStatus('✗ Lấy URL thất bại', false, 'err');
      return;
    }

    let json = null;
    try {
      json = JSON.parse((res.responseText || '').trim());
    } catch (_) {}

    if (!json || !json.success || !json.url) {
      updateStatus('✗ Lấy URL thất bại', false, 'err');
      return;
    }

    const finalUrl = json.url;
    if (ui.rurl) ui.rurl.textContent = finalUrl;
    if (ui.result) ui.result.classList.add('on');
    updateStatus('✓ Lấy URL thành công', false, 'ok');
    playBeep('ok');
    addLinkToHistory(finalUrl);

    if (userSettings.autoCopy) {
      copyTextToClipboard(finalUrl, true);
    }
    if (userSettings.autoRedirect) {
      setTimeout(() => {
        window.location.href = finalUrl;
      }, 600);
    }

    try {
      const clickData = `campaign_id=${encodeURIComponent(campaignId)}&display_id=${encodeURIComponent(displayId)}&code=${encodeURIComponent( prefix )}`;
      httpRequest(`${apiHost}/widget/click.html`, {
        method: 'POST',
        data: clickData,
        timeout: 30000,
        headers: {
          accept: '*/*',
          'accept-language': 'vi,en;q=0.9,en-US;q=0.8',
          'cache-control': 'no-cache',
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          pragma: 'no-cache',
          referer: location.href,
        },
      }).catch(() => {});
    } catch (_) {}
  }

  function validateTaskInputUrl(raw) {
    let s = String(raw || '').trim();
    if (!s) return { err: 'empty' };
    if (!/^[a-zA-Z][a-zA-Z0-9+.\-]*:\/\//.test(s)) {
      s = 'https://' + s;
    }
    try {
      const u = new URL(s);
      if (u.protocol === 'http:') u.protocol = 'https:';
      if (u.protocol !== 'https:' || !u.hostname) return { err: 'invalid' };
      if (/^([a-z0-9\-]+\.)*link4m\.(com|net|org)$/i.test(u.hostname)) {
        return { err: 'link4m' };
      }
      return { url: u.href };
    } catch (_) {
      return { err: 'invalid' };
    }
  }

  function extractWidgetsFromHtml(html) {
    const list = [];
    const scriptRe = /<script[^>]+src=["'](?:https?:)?\/\/([^/"']+)\/widget\/(service(?:-v\d+)?\.js)\?([^"']*)["']/gi;
    let m;
    while ((m = scriptRe.exec(html || '')) !== null) {
      const keyMatch = (m[3] || '').match(/(?:^|&)key=([^&"'\s]+)/);
      if (keyMatch) {
        list.push({
          host: m[1],
          key: keyMatch[1],
          file: m[2],
          link: `https://${m[1]}/widget/${m[2]}?key=${keyMatch[1]}`,
        });
      }
    }
    return list;
  }

  async function executeBypassForUrl(rawUrl) {
    if (isRunningTask) return;
    const validated = validateTaskInputUrl(rawUrl);
    if (validated.err === 'link4m') {
      updateStatus('✗ Đừng nhập URL "Link4m" — hãy nhập URL nhiệm vụ', false, 'err');
      return;
    }
    if (validated.err === 'empty') {
      updateStatus('✗ Chưa nhập URL', false, 'err');
      return;
    }
    if (validated.err) {
      updateStatus('✗ URL không hợp lệ', false, 'err');
      return;
    }

    isRunningTask = true;
    if (ui.result) ui.result.classList.remove('on');
    if (ui.rurl) ui.rurl.textContent = '';
    hideNotice();
    updateControlsState();

    try {
      let targetUrl = validated.url;
      updateStatus('Đang tải trang…', true, 'info');
      let pageRes = null;
      try {
        pageRes = await httpRequest(targetUrl, {
          method: 'GET',
          timeout: 30000,
          headers: {
            accept: '*/*',
            'accept-language': 'vi,en;q=0.9,en-US;q=0.8',
            'cache-control': 'no-cache',
            pragma: 'no-cache',
            referer: 'https://www.google.com/',
          },
        });
      } catch (_) {}

      if (!pageRes || pageRes.status < 200 || pageRes.status >= 400) {
        updateStatus('✗ Không truy cập được trang', false, 'err');
        return;
      }

      const finalUrl = pageRes.finalUrl || pageRes.responseURL;
      if (finalUrl && finalUrl !== targetUrl) targetUrl = finalUrl;

      const widgets = extractWidgetsFromHtml(pageRes.responseText || '');
      if (widgets.length === 0) {
        updateStatus('✗ Không tìm thấy widget nào', false, 'err');
        return;
      }

      const validWidgets = [];
      const origin = new URL(targetUrl).origin + '/';
      for (const w of widgets) {
        const ctx = await fetchAndValidateWidget(w, origin);
        if (ctx) validWidgets.push({ w, ctx });
      }

      if (validWidgets.length === 0) {
        updateStatus('⊘ Không có widget hợp lệ', false, 'warn');
        return;
      }

      updateStatus(`Đang chạy ${validWidgets.length} widget…`, true, 'info');
      const codes = await Promise.all(validWidgets.map((item) => runWidgetSteps(item.w, item.ctx, targetUrl)));
      const questCode = codes.find((c) => Boolean(c)) || null;

      if (questCode) {
        await submitQuestCodeToLink4m(questCode);
      } else {
        updateStatus('⊘ Không lấy được mã từ widget', false, 'warn');
      }
    } catch (_) {
      updateStatus('✗ Có lỗi xảy ra', false, 'err');
    } finally {
      isRunningTask = false;
      updateControlsState();
    }
  }

  /* ==========================================================================
   * 8. KHỞI TẠO GIAO DIỆN SHADOW DOM & SỰ KIỆN KÉO THẢ / TÙY CHỈNH
   * ========================================================================== */
  function buildPanelCss(themeKey) {
    const t = THEMES[themeKey] || THEMES.cyan;
    return `
* { box-sizing: border-box; margin: 0; padding: 0;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
.panel { position: relative; width: min(378px, calc(100vw - 24px)); border-radius: 20px; overflow: hidden;
  color: #e9f4fa; line-height: 1.5; border: 1px solid transparent;
  background: linear-gradient(180deg, #0c141d, #05080d 62%) padding-box, ${t.borderGrad} border-box;
  box-shadow: 0 18px 44px rgba(0,0,0,.55), 0 0 26px ${t.glow}, inset 0 1px 0 rgba(255,255,255,.05);
  animation: l4m-pop .26s cubic-bezier(.2,.85,.3,1.1); }
.panel::before { content: ""; position: absolute; top: -70px; right: -60px; width: 190px; height: 190px; border-radius: 50%;
  background: radial-gradient(circle, ${t.glow}, transparent 68%); pointer-events: none; }
.panel > * { position: relative; z-index: 1; }
.head { display: flex; align-items: center; gap: 8px; padding: 11px 14px;
  border-bottom: 1px solid rgba(255,255,255,.06); cursor: move; user-select: none; }
.title { flex: 1; min-width: 0; font-size: 14.5px; font-weight: 800; letter-spacing: .2px; color: #e9f4fa;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ver { flex: none; font-size: 10px; font-weight: 700; letter-spacing: .5px; color: ${t.accent};
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.15); padding: 2px 7px; border-radius: 999px; }
.iconbtn { flex: none; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  background: transparent; border: 1px solid transparent; border-radius: 8px; color: #93a0b8; font-size: 15px; cursor: pointer;
  transition: background .15s, color .15s, border-color .15s; }
.iconbtn:hover { background: rgba(255,255,255,.08); color: #e9f4fa; border-color: rgba(255,255,255,.08); }
.status { position: relative; display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 11px 14px;
  font-size: 13.5px; color: #c7dde8; border-bottom: 1px solid rgba(255,255,255,.06); }
#statusText { flex: 1; min-width: 0; word-break: break-word; line-height: 1.5; font-weight: 600; }
.stx.ok { color: #83d6a6; } .stx.err { color: #f2837a; } .stx.warn { color: #efc67a; } .stx.info { color: ${t.accent}; }
.spin { display: none; width: 12px; height: 12px; flex: none;
  border: 2px solid rgba(255,255,255,.12); border-top-color: ${t.accent}; border-radius: 50%;
  animation: l4m-rot .8s linear infinite; }
.spin.on { display: inline-block; filter: drop-shadow(0 0 5px ${t.glow}); }
@keyframes l4m-rot { to { transform: rotate(360deg) } }
.cdline { position: absolute; left: 0; right: 0; bottom: -1px; height: 3px; background: rgba(255,255,255,.05); pointer-events: none; }
.cdline i { display: block; height: 100%; width: 0%; background: ${t.accentGrad}; transition: width .25s linear; }
.cd { display: inline-flex; align-items: center; gap: 6px; margin-left: 8px; padding: 2px 10px; border-radius: 999px; font-size: 12px;
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.22); color: #e9f4fa;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-weight: 700; }
.cd .cddot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${t.accent}; }
.cd.urgent { border-color: rgba(233,106,92,.5); color: #ffc4bd; }
.cd.urgent .cddot { background: #f07a6b; }
.notice { display: none; margin: 12px 14px 0; padding: 10px 12px; align-items: center; gap: 10px; border-radius: 12px;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.2); }
.notice.on { display: flex; }
.nico { flex: none; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;
  font-size: 14px; border-radius: 8px; background: rgba(255,255,255,.1); }
.ntx { min-width: 0; font-size: 13px; font-weight: 700; color: #e9f4fa; }
.toggles { display: flex; gap: 6px; padding: 10px 14px 0; flex-wrap: wrap; }
.tchip { flex: 1; min-width: 82px; padding: 5px 8px; border-radius: 9px; font-size: 11.5px; font-weight: 700;
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.1); color: #93a0b8;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; transition: all .15s; }
.tchip.on { background: rgba(255,255,255,.12); border-color: ${t.accent}; color: #e9f4fa; }
.inputrow { display: flex; flex-direction: column; gap: 10px; padding: 11px 14px 13px; }
.urlwrap { display: flex; align-items: center; gap: 8px; background: rgba(7,11,20,.75);
  border: 1px solid rgba(255,255,255,.1); border-radius: 12px; padding: 0 12px; }
.urlwrap:focus-within { border-color: ${t.accent}; }
.uic { flex: none; font-size: 13px; opacity: .6; }
.url { flex: 1; min-width: 0; background: transparent; border: none; outline: none; color: #e9f4fa; padding: 11px 0; font-size: 13.5px; }
.url::placeholder { color: #55607a; }
.url:disabled { opacity: .5; }
.go { width: 100%; min-height: 42px; border: none; border-radius: 12px; cursor: pointer;
  background: ${t.accentGrad}; color: #071120; font-size: 14px; font-weight: 800; letter-spacing: .3px;
  box-shadow: 0 6px 18px ${t.glow}; transition: transform .12s, filter .15s, opacity .15s; }
.go:hover:not(:disabled) { filter: brightness(1.07); }
.go:active:not(:disabled) { transform: scale(.98); }
.go:disabled { opacity: .4; cursor: not-allowed; box-shadow: none; }
.links { display: ${CONFIG.showCustomLinks ? 'flex' : 'none'}; gap: 8px; width: 100%; }
.lbtn { flex: 1; min-height: 38px; border-radius: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.14); color: #dce2ff; }
.lbtn:hover { background: rgba(255,255,255,.12); }
.result { margin: 0 14px 12px; display: none; border-radius: 14px; overflow: hidden;
  background: linear-gradient(165deg, rgba(88,171,125,.16), rgba(88,171,125,.05));
  border: 1px solid rgba(116,199,149,.32); }
.result.on { display: block; }
.rtag { padding: 10px 12px 0; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: #8fd8ac; }
.rurl { margin: 8px 10px 0; padding: 9px 11px; background: rgba(4,10,7,.55);
  border: 1px solid rgba(116,199,149,.18); border-radius: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px; line-height: 1.55; color: #c4e8d2; word-break: break-all; max-height: 80px; overflow-y: auto; }
.rbtns { display: flex; gap: 8px; padding: 10px 10px 11px; }
.rbtn { flex: 1; min-height: 40px; border: none; border-radius: 11px; cursor: pointer; font-size: 13px; font-weight: 800; }
.rbtn.copy { background: linear-gradient(135deg, #66bd90, #4aa274); color: #05130b; }
.rbtn.open { background: rgba(116,199,149,.12); color: #a4dcbd; border: 1px solid rgba(116,199,149,.32); }
.hbox { margin: 0 14px 12px; display: none; border-top: 1px solid rgba(255,255,255,.06); padding-top: 9px; }
.hbox.on { display: block; }
.htitle { font-size: 11px; font-weight: 700; color: #93a0b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .6px; }
.hitem { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 4px 0; }
.htime { color: #64748b; font-size: 11px; flex: none; }
.hlink { color: ${t.accent}; text-decoration: none; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hlink:hover { text-decoration: underline; }
.hcopy { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); color: #e9f4fa; border-radius: 6px; padding: 2px 6px; cursor: pointer; font-size: 11px; }
.hempty { font-size: 12px; color: #64748b; font-style: italic; }
.fab { width: 52px; height: 52px; border-radius: 16px; cursor: pointer; border: 1px solid rgba(255,255,255,.22);
  background: linear-gradient(160deg, #0e1c26, #070d13); color: ${t.accent}; font-size: 20px; font-weight: 800;
  box-shadow: 0 8px 24px rgba(0,0,0,.5), 0 0 16px ${t.glow}; }
@keyframes l4m-pop { from { opacity: 0; transform: translateY(10px) scale(.97) } to { opacity: 1; transform: none } }
`;
  }

  function enableDragging(hostEl, handleEl) {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let initRight = 14;
    let initBottom = 14;

    const savedPos = loadStore('_l4m_panel_pos_', null);
    if (savedPos && typeof savedPos.right === 'number' && typeof savedPos.bottom === 'number') {
      hostEl.style.right = Math.max(6, Math.min(window.innerWidth - 80, savedPos.right)) + 'px';
      hostEl.style.bottom = Math.max(6, Math.min(window.innerHeight - 60, savedPos.bottom)) + 'px';
    }

    handleEl.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = hostEl.getBoundingClientRect();
      initRight = window.innerWidth - rect.right;
      initBottom = window.innerHeight - rect.bottom;
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newRight = Math.max(6, Math.min(window.innerWidth - 80, initRight - dx));
      const newBottom = Math.max(6, Math.min(window.innerHeight - 60, initBottom - dy));
      hostEl.style.right = newRight + 'px';
      hostEl.style.bottom = newBottom + 'px';
    });

    window.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      saveStore('_l4m_panel_pos_', {
        right: parseFloat(hostEl.style.right) || 14,
        bottom: parseFloat(hostEl.style.bottom) || 14,
      });
    });
  }

  function mountPanel() {
    if (ui.root) return;
    const host = document.createElement('div');
    host.id = 'l4m-bypass-host';
    host.style.cssText = 'position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:2147483647;';
    const shadow = host.attachShadow({ mode: 'open' });

    let scriptVer = '1.0';
    try {
      const info = (typeof GM_info !== 'undefined' && GM_info) || (typeof GM !== 'undefined' && GM && GM.info);
      if (info && info.script && info.script.version) scriptVer = info.script.version;
    } catch (_) {}

    shadow.innerHTML = `
      <style id="themeStyle">${buildPanelCss(userSettings.theme)}</style>
      <div class="panel" id="panel">
        <div class="head" id="dragHead" title="Giữ chuột để kéo thả vị trí bảng">
          <span class="title">${escapeHtml(CONFIG.title)}</span>
          <span class="ver">v${escapeHtml(scriptVer)}</span>
          <button class="iconbtn" id="btnTheme" title="Đổi màu giao diện">🎨</button>
          <button class="iconbtn" id="btnHist" title="Lịch sử link đã vượt">🕘</button>
          <button class="iconbtn" id="btnMin" title="Thu nhỏ">−</button>
        </div>
        <div class="status" id="status">
          <span class="spin on" id="spin"></span>
          <span id="statusText">Đang khởi tạo…</span>
          <span class="cdline" id="cdline"><i id="cdfill"></i></span>
        </div>
        <div class="notice" id="notice">
          <span class="nico">🔓</span>
          <span class="ntx">Hãy giải reCaptcha…</span>
        </div>
        <div class="toggles">
          <button type="button" class="tchip ${userSettings.autoCopy ? 'on' : ''}" id="tgCopy" title="Tự động copy khi có link">📋 Tự copy</button>
          <button type="button" class="tchip ${userSettings.autoRedirect ? 'on' : ''}" id="tgOpen" title="Tự động chuyển hướng khi có link">🚀 Tự mở</button>
          <button type="button" class="tchip ${userSettings.soundAlert ? 'on' : ''}" id="tgSound" title="Bật/tắt âm báo">🔔 Âm báo</button>
        </div>
        <form class="inputrow" id="iform" novalidate>
          <div class="urlwrap" id="urlwrap">
            <span class="uic">🔗</span>
            <input class="url" id="url" type="url" inputmode="url" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Nhập URL nhiệm vụ (vd: example.com)" disabled>
          </div>
          <button class="go" id="go" type="submit" disabled>Bắt đầu</button>
          <div class="links">
            <button class="lbtn store" id="btnStore" type="button">${escapeHtml(CONFIG.customLinks.storeText)}</button>
            <button class="lbtn server" id="btnServer" type="button">${escapeHtml(CONFIG.customLinks.serverText)}</button>
          </div>
        </form>
        <div class="result" id="result">
          <div class="rtag">✓ URL của bạn</div>
          <div class="rurl" id="rurl"></div>
          <div class="rbtns">
            <button class="rbtn copy" id="rCopy" type="button">⧉ Copy URL</button>
            <button class="rbtn open" id="rOpen" type="button">↗ Mở URL</button>
          </div>
        </div>
        <div class="hbox" id="hbox">
          <div class="htitle">Lịch sử vượt link gần đây</div>
          <div id="historyList"></div>
        </div>
      </div>
      <button class="fab" id="fab" title="Mở Link4m (Bypass)" aria-label="Mở Link4m (Bypass)">⚡</button>
    `;

    (document.body || document.documentElement).appendChild(host);
    ui.root = host;
    ui.shadow = shadow;
    ui.panel = shadow.getElementById('panel');
    ui.fab = shadow.getElementById('fab');
    ui.status = shadow.getElementById('status');
    ui.statusText = shadow.getElementById('statusText');
    ui.spin = shadow.getElementById('spin');
    ui.input = shadow.getElementById('url');
    ui.go = shadow.getElementById('go');
    ui.urlwrap = shadow.getElementById('urlwrap');
    ui.store = shadow.getElementById('btnStore');
    ui.server = shadow.getElementById('btnServer');
    ui.result = shadow.getElementById('result');
    ui.cdfill = shadow.getElementById('cdfill');
    ui.notice = shadow.getElementById('notice');
    ui.rurl = shadow.getElementById('rurl');
    ui.rCopy = shadow.getElementById('rCopy');
    ui.rOpen = shadow.getElementById('rOpen');
    ui.iform = shadow.getElementById('iform');
    ui.historyList = shadow.getElementById('historyList');

    enableDragging(host, shadow.getElementById('dragHead'));
    renderHistory();

    shadow.getElementById('btnMin').addEventListener('click', () => setPanelOpen(false));
    ui.fab.addEventListener('click', () => setPanelOpen(true));

    const themeOrder = Object.keys(THEMES);
    shadow.getElementById('btnTheme').addEventListener('click', () => {
      const idx = (themeOrder.indexOf(userSettings.theme) + 1) % themeOrder.length;
      userSettings.theme = themeOrder[idx];
      saveStore('_l4m_custom_settings_', userSettings);
      shadow.getElementById('themeStyle').textContent = buildPanelCss(userSettings.theme);
    });

    const hbox = shadow.getElementById('hbox');
    shadow.getElementById('btnHist').addEventListener('click', () => {
      hbox.classList.toggle('on');
    });

    ui.historyList.addEventListener('click', (e) => {
      const btn = e.target.closest('.hcopy');
      if (!btn) return;
      const item = linkHistory[Number(btn.dataset.idx)];
      if (item && item.url) copyTextToClipboard(item.url);
    });

    const bindToggle = (id, key) => {
      const btn = shadow.getElementById(id);
      btn.addEventListener('click', () => {
        userSettings[key] = !userSettings[key];
        btn.classList.toggle('on', userSettings[key]);
        saveStore('_l4m_custom_settings_', userSettings);
      });
    };
    bindToggle('tgCopy', 'autoCopy');
    bindToggle('tgOpen', 'autoRedirect');
    bindToggle('tgSound', 'soundAlert');

    ui.iform.addEventListener('submit', (e) => {
      e.preventDefault();
      executeBypassForUrl(ui.input ? ui.input.value : '');
    });

    ui.input.addEventListener('keydown', (e) => {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        executeBypassForUrl(ui.input ? ui.input.value : '');
      }
    });

    ui.rCopy.addEventListener('click', () => {
      const text = ui.rurl && ui.rurl.textContent ? ui.rurl.textContent : '';
      if (text) copyTextToClipboard(text);
    });

    ui.rOpen.addEventListener('click', () => {
      const text = ui.rurl && ui.rurl.textContent ? ui.rurl.textContent : '';
      if (text) window.open(text, '_blank', 'noopener');
    });

    ui.store.addEventListener('click', () => window.open(CONFIG.customLinks.storeUrl, '_blank', 'noopener'));
    ui.server.addEventListener('click', () => window.open(CONFIG.customLinks.serverUrl, '_blank', 'noopener'));

    setInterval(renderStatusAndTimers, 250);
    setPanelOpen(true);
    updateControlsState();
  }

  /* ==========================================================================
   * 9. KIỂM TRA TRANG LINK4M VÀ KHỞI CHẠY TỰ ĐỘNG
   * ========================================================================== */
  function isCloudflareChallenge() {
    const title = (document.title || '').trim().toLowerCase().replace(/[.…]+/g, '');
    return title === 'chờ một chút' || title === 'just a moment';
  }

  async function waitForCloudflareClear() {
    if (!isCloudflareChallenge()) return;
    updateStatus('⏳ Chờ Cloudflare…', true, 'info');
    while (isCloudflareChallenge()) {
      await sleep(500);
    }
  }

  function hasLandingCaptchaPrompt(root) {
    const h4s = (root || document).querySelectorAll('h4');
    for (let i = 0; i < h4s.length; i++) {
      const txt = (h4s[i].textContent || '').replace(/\s+/g, ' ');
      if (/check captcha để tiếp tục tới trang đích|check the captcha to continue to the landing page/i.test(txt)) {
        return true;
      }
    }
    return false;
  }

  async function waitForGuideWrapperReady() {
    const key = 'wrapper';
    activeTimers[key] = { label: 'Chờ nội dung trang', end: Date.now() + 60000, dur: 60000 };
    updateStatus('Chờ nội dung hướng dẫn…', true, 'info');
    const start = Date.now();
    let wrapper = null;
    let onlyCaptcha = false;

    try {
      while (Date.now() - start < 60000) {
        const el = document.getElementById('advertise-html-wrapper');
        if (el && (el.innerHTML || '').trim() !== '') {
          if (hasLandingCaptchaPrompt(el)) {
            onlyCaptcha = true;
            wrapper = null;
            break;
          }
          wrapper = el;
          break;
        }
        if (hasLandingCaptchaPrompt(document)) {
          onlyCaptcha = true;
          break;
        }
        await sleep(300);
      }
    } finally {
      delete activeTimers[key];
      renderStatusAndTimers();
    }

    if (onlyCaptcha) {
      updateStatus('Chưa có nhiệm vụ — hãy giải reCaptcha để tiếp tục', false, 'warn');
      setFormVisible(false);
      return false;
    }
    if (!wrapper) {
      updateStatus('⛔ Dừng — không có nội dung hướng dẫn', false, 'err');
      setFormVisible(false);
      return false;
    }

    updateStatus('Đang kiểm tra hướng dẫn…', true, 'info');
    const checkStart = Date.now();
    let guideH4 = null;
    while (Date.now() - checkStart < 10000) {
      const h4 = (document.getElementById('advertise-html-wrapper') || wrapper).querySelector('h4');
      if (h4 && /HƯỚNG\s*DẪN\s*LẤY\s*MÃ/i.test(h4.textContent || '')) {
        guideH4 = h4;
        break;
      }
      await sleep(250);
    }

    if (guideH4) {
      const links = (document.getElementById('advertise-html-wrapper') || wrapper).querySelectorAll('a[href]');
      for (let i = 0; i < links.length; i++) {
        if (/google\.com/i.test(links[i].getAttribute('href') || '')) {
          return true;
        }
      }
    }
    return true;
  }

  function waitForDocumentLoad() {
    if (document.readyState === 'complete') return Promise.resolve('already');
    return new Promise((resolve) => {
      let done = false;
      const finish = (tag) => {
        if (done) return;
        done = true;
        clearInterval(iv);
        resolve(tag);
      };
      const iv = setInterval(() => {
        if (document.readyState === 'complete') finish('load');
      }, 400);
      window.addEventListener('load', () => finish('load'), { once: true });
      setTimeout(() => finish('fallback'), 30000);
    });
  }

  async function startFlow() {
    await waitForCloudflareClear();
    await waitForDocumentLoad();
    const ok = await waitForGuideWrapperReady();
    if (!ok) return;
    isRunningTask = false;
    updateControlsState();
    setFormVisible(true);
    await autoDetectAndRunBypass();
  }

  function init() {
    if (/^\/go\/not-found/.test(location.pathname)) return;
    if (document.body) {
      mountPanel();
      startFlow();
    } else {
      document.addEventListener('DOMContentLoaded', init, { once: true });
    }
  }

  init();
})();