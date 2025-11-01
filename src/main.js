/* ============================================================
 * Typo Archive — Live Glyph Viewer (FULL JS)
 *  - A코드의 텍스트 생성/렌더 방식을 유지
 *  - B코드의 입력·출력 일체형(contenteditable) 에디터 UI와 연동
 *  - 엔터 = 실제 '\n' 보존 (인쇄 드라이버에서도 그대로 출력)
 *  - 기본 인쇄는 "벡터(무손실)" 경로 사용(@font-face DataURL 임베드)
 * ============================================================ */

/* ---------- Config ---------- */
const DEFAULT_MAX_CHARS = 40;
const MYFONT_URL = "/kmuvcd2025_team/assets/MyFont.otf";
const SUPPORTED_CHAR_REGEX = /^[A-Za-z0-9\s.,!?_\-@#()\/\[\]&*]/;

/* (선택) 단일 글자 → 자산 인쇄 매핑 */
const LETTER_PRINTS = {
    "A": "glyphs/a.png", "B": "glyphs/b.png", "C": "glyphs/c.png", "D": "glyphs/d.png", "E": "glyphs/e.png", "F": "glyphs/f.png",
    "G": "glyphs/g.png", "H": "glyphs/h.png", "I": "glyphs/i.png", "J": "glyphs/j.png", "K": "glyphs/k.png", "L": "glyphs/l.png",
    "M": "glyphs/m.png", "N": "glyphs/n.png", "O": "glyphs/o.png", "P": "glyphs/p.png", "Q": "glyphs/q.png", "R": "glyphs/r.png",
    "S": "glyphs/s.png", "T": "glyphs/t.png", "U": "glyphs/u.png", "V": "glyphs/v.png", "W": "glyphs/w.png", "X": "glyphs/x.png",
    "Y": "glyphs/y.png", "Z": "glyphs/z.png",
    "0": "glyphs/0.png", "1": "glyphs/1.png", "2": "glyphs/2.png", "3": "glyphs/3.png", "4": "glyphs/4.png", "5": "glyphs/5.png",
    "6": "glyphs/6.png", "7": "glyphs/7.png", "8": "glyphs/8.png", "9": "glyphs/9.png",
    "!": "glyphs/exclaim.png", "?": "glyphs/question.png", ".": "glyphs/period.png", ",": "glyphs/comma.png",
    "-": "glyphs/hyphen.png", "_": "glyphs/underscore.png", "@": "glyphs/at.png", "#": "glyphs/hash.png",
    "&": "glyphs/ampersand.png", "*": "glyphs/asterisk.png", "/": "glyphs/slash.png",
    "(": "glyphs/paren.png", ")": "glyphs/paren.png", "[": "glyphs/bracket-square.png", "]": "glyphs/bracket-square.png"
};

/* ---------- Elements (B 레이아웃의 id들과 일치) ---------- */
const editor = document.getElementById('editor');
const admin = document.getElementById('adminPanel');
const limitEl = document.getElementById('limitInput');
const fontSizeEl = document.getElementById('fontSizeInput');
const fontSizeLabelEl = document.getElementById('fontSizeLabel');
const trackingEl = document.getElementById('trackingInput');
const leadingEl = document.getElementById('leadingInput');
const clearBtnTop = document.getElementById('clearBtnTop');
const clearBtn = document.getElementById('clearBtn');
const printOSBtn = document.getElementById('printOSBtn');
const directToggle = document.getElementById('directPrintToggle'); // (옵션)

/* ---------- State ---------- */
let MAX_CHARS = DEFAULT_MAX_CHARS;
let __fontReady = null, __fontDataUrl = null, __fontFaceAdded = false;

/* ---------- Toast ---------- */
function showToast(msg) {
    let t = document.getElementById('typoToast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'typoToast';
        t.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);padding:10px 14px;border-radius:10px;background:rgba(20,20,20,.92);color:#f5f5f5;font:13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial;border:1px solid #2a2a2a;box-shadow:0 6px 24px rgba(0,0,0,.35);opacity:0;pointer-events:none;transition:opacity .18s ease;z-index:9999;white-space:pre-wrap;text-align:center;max-width:min(90vw,680px)';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => { t.style.opacity = '1'; });
    setTimeout(() => { t.style.opacity = '0'; }, 1400);
}

/* ---------- Font loading (DataURL 임베드) ---------- */
async function arrayBufferToDataURL(buf, mime = 'font/otf') {
    const bytes = new Uint8Array(buf); let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return `data:${mime};base64,${btoa(bin)}`;
}
async function ensureFontFaceLoaded() {
    if (__fontReady) return __fontReady;
    __fontReady = (async () => {
        const res = await fetch(MYFONT_URL, { cache: 'force-cache' });
        if (!res.ok) throw new Error('MyFont.otf 로드 실패: ' + res.status);
        const buf = await res.arrayBuffer();
        __fontDataUrl = await arrayBufferToDataURL(buf, 'font/otf');

        if (!__fontFaceAdded) {
            const ff = new FontFace('MyFont', buf);
            await ff.load();
            document.fonts.add(ff);
            __fontFaceAdded = true;
        }
        try { await document.fonts.ready; } catch { }
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        document.body.setAttribute('data-font', 'ready');
    })().catch(e => { __fontReady = null; throw e; });
    return __fontReady;
}

/* ---------- Utils ---------- */
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const setVar = (k, v) => document.documentElement.style.setProperty(k, v);

/* contenteditable → '\n' 포함 텍스트 */
function getEditorTextWithNewlines() {
    // 기본적으로 editor.textContent가 '\n'을 포함하도록 beforeinput에서 강제 처리
    return (editor.textContent || '').replace(/\r\n?/g, '\n');
}

/* ---------- Asset print (개별 글자 더블클릭/롱프레스) ---------- */
function ensurePrintFrame() {
    let f = document.getElementById("printFrame");
    if (!f) {
        f = document.createElement("iframe");
        f.id = "printFrame";
        f.style.cssText = "position:absolute;left:-9999px;width:0;height:0;border:0;";
        document.body.appendChild(f);
    }
    return f;
}
function printAsset(url) {
    const ext = url.split("?")[0].split("#")[0].split(".").pop().toLowerCase();
    const frame = ensurePrintFrame();
    const doPrint = () => { try { const w = frame.contentWindow; setTimeout(() => { w.focus(); w.print(); }, 60); } catch (e) { alert("인쇄 미리보기 호출 실패: " + e.message); } };
    if (ext === "pdf") { frame.onload = doPrint; frame.src = url; }
    else if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
        const html = `<!doctype html><html><head><meta charset="utf-8">
<style>@page{size:80mm auto;margin:0}html,body{margin:0}img{display:block;width:72mm;margin:6mm 4mm}</style>
</head><body><img src="${url}" alt=""></body></html>`;
        frame.onload = doPrint; frame.src = "about:blank"; setTimeout(() => { frame.srcdoc = html; }, 0);
    } else alert("지원하지 않는 인쇄 형식: " + ext);
}

/* ---------- Editor (입력 제한/엔터/붙여넣기/롱프레스) ---------- */
function initEditor() {
    editor.textContent = '';
    editor.focus();
    if (limitEl) limitEl.value = String(MAX_CHARS);

    // Enter → 실제 '\n' 삽입 (Chrome OK)
    editor.addEventListener('beforeinput', (ev) => {
        if (ev.inputType === 'insertParagraph' || ev.inputType === 'insertLineBreak') {
            const sel = window.getSelection(); const rng = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
            const current = editor.textContent || ''; const selectedLen = rng ? rng.toString().length : 0;
            const willLen = current.length - selectedLen + 1;
            if (willLen > MAX_CHARS) { ev.preventDefault(); showToast(`최대 ${MAX_CHARS}자까지 입력할 수 있어요.`); return; }
            ev.preventDefault(); document.execCommand('insertText', false, '\n'); return;
        }
        // 단일 문자 필터/제한
        if (typeof ev.data === 'string' && ev.data.length === 1) {
            const sel = window.getSelection(); const rng = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
            const current = editor.textContent || ''; const selectedLen = rng ? rng.toString().length : 0;
            const willLen = current.length - selectedLen + 1;
            if (willLen > MAX_CHARS) { ev.preventDefault(); showToast(`최대 ${MAX_CHARS}자까지 입력할 수 있어요.`); return; }
            if (!SUPPORTED_CHAR_REGEX.test(ev.data)) { ev.preventDefault(); showToast('허용된 문자만 입력할 수 있어요.\nA–Z, 0–9, 공백, . , ! ? _ - @ # ( ) [ ] / & * % + : ;'); }
        }
    });

    // 붙여넣기: 허용문자 + 개행만
    editor.addEventListener('paste', (ev) => {
        ev.preventDefault();
        const raw = ev.clipboardData?.getData('text') || '';
        const normalized = raw.replace(/\r\n?/g, '\n');
        let filtered = '';
        for (const ch of normalized) { if (ch === '\n' || SUPPORTED_CHAR_REGEX.test(ch)) filtered += ch; }

        const sel = window.getSelection(); if (!sel) return;
        const rng = sel.rangeCount ? sel.getRangeAt(0) : null;
        const current = editor.textContent || ''; const selectedLen = rng ? rng.toString().length : 0;
        sel.deleteFromDocument();

        const remain = Math.max(0, MAX_CHARS - (current.length - selectedLen));
        const to = filtered.slice(0, remain);
        if (to) document.execCommand('insertText', false, to);

        if (filtered.length !== normalized.length) showToast('허용된 문자(개행 포함)만 붙여넣을 수 있어요.');
        else if (!to.length) showToast(`최대 ${MAX_CHARS}자까지 입력할 수 있어요.`);
    });

    // 더블클릭/롱프레스 → 해당 위치 글자에 매핑된 자산 인쇄
    const LONG_PRESS_MS = 3000;
    function getCharIndexAtPoint(root, x, y) {
        const doc = root.ownerDocument; let range = null;
        if (doc.caretRangeFromPoint) range = doc.caretRangeFromPoint(x, y);
        else if (doc.caretPositionFromPoint) {
            const pos = doc.caretPositionFromPoint(x, y);
            if (pos) { range = doc.createRange(); range.setStart(pos.offsetNode, pos.offset); range.collapse(true); }
        }
        if (!range) return null;
        let index = 0; const tw = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        while (tw.nextNode()) {
            const node = tw.currentNode;
            if (node === range.startContainer) { index += range.startOffset; return index; }
            index += node.nodeValue.length;
        }
        return null;
    }
    function handleCharActionAt(x, y) {
        const idx = getCharIndexAtPoint(editor, x, y); if (idx == null) return;
        const text = editor.textContent || ''; const ch = text[idx]; if (!ch) return;
        const url = LETTER_PRINTS[ch.toUpperCase()]; if (url) printAsset(url);
    }
    editor.addEventListener('dblclick', e => handleCharActionAt(e.clientX, e.clientY));
    let __pressTimer = null, __pressXY = null;
    const cancelLong = () => { if (__pressTimer) { clearTimeout(__pressTimer); __pressTimer = null; } __pressXY = null; };
    editor.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 && e.pointerType !== 'touch') return;
        __pressXY = [e.clientX, e.clientY]; cancelLong();
        __pressTimer = setTimeout(() => { e.preventDefault?.(); handleCharActionAt(__pressXY[0], __pressXY[1]); cancelLong(); }, LONG_PRESS_MS);
    }, { passive: true });
    ['pointerup', 'pointerleave', 'pointercancel', 'scroll'].forEach(t => editor.addEventListener(t, cancelLong, { passive: true }));
}

/* ---------- Admin (B 스타일 패널과 CSS 변수 동기화) ---------- */
function initAdmin() {
    function updateFontSize() {
        const raw = parseInt(fontSizeEl?.value || '160', 10);
        const v = clamp(Number.isFinite(raw) ? raw : 160, 24, 300);
        setVar('--fontSizePx', v);
        if (fontSizeLabelEl) fontSizeLabelEl.textContent = v + 'px';
        try { localStorage.setItem('fontSizePx', String(v)); } catch { }
    }
    const saved = parseInt(localStorage.getItem('fontSizePx') || '160', 10);
    if (fontSizeEl) fontSizeEl.value = Number.isFinite(saved) ? saved : 160;
    updateFontSize();
    fontSizeEl?.addEventListener('input', updateFontSize);

    trackingEl?.addEventListener('input', () => setVar('--tracking', trackingEl.value));
    leadingEl?.addEventListener('input', () => {
        const v = clamp(parseInt(leadingEl.value || '100', 10), 80, 200);
        setVar('--leading', (v / 100).toString());
    });
    limitEl?.addEventListener('change', () => {
        const n = parseInt(limitEl.value, 10);
        MAX_CHARS = Number.isFinite(n) ? clamp(n, 1, 200) : DEFAULT_MAX_CHARS;
    });

    const clearEditor = () => { editor.textContent = ''; editor.focus(); };
    clearBtnTop?.addEventListener('click', clearEditor);
    clearBtn?.addEventListener('click', clearEditor);

    // 관리자 토글 (Ctrl/⌘ + .)
    function toggleAdmin(force) {
        if (!admin) return;
        const on = (typeof force === 'boolean') ? force : !admin.classList.contains('visible');
        admin.classList.toggle('visible', on);
        admin.setAttribute('aria-hidden', on ? 'false' : 'true');
        showToast(`관리자 모드 ${on ? 'ON' : 'OFF'}`);
    }
    window.addEventListener('keydown', (e) => {
        const meta = e.ctrlKey || e.metaKey;
        if (meta && e.key === '.') { e.preventDefault(); toggleAdmin(); }
    });

    // 바로출력 체크(저장)
    try {
        const savedDirect = localStorage.getItem('directPrint') === '1';
        if (directToggle) directToggle.checked = savedDirect;
    } catch { }
    directToggle?.addEventListener('change', () => {
        try { localStorage.setItem('directPrint', directToggle.checked ? '1' : '0'); } catch { }
        showToast(directToggle.checked ? '바로 출력: ON' : '바로 출력: OFF');
    });
}

/* ---------- (무손실) 벡터 인쇄 ---------- */
async function printVectorFromEditor({
    pageWidthMM = 80,       // 전체 용지 폭(롤지)
    printableWidthMM = 72   // 유효폭(프린터 실제 가로 인쇄폭)
} = {}) {
    await ensureFontFaceLoaded();
    const fontDataUrl = __fontDataUrl;

    // 화면과 동일한 타이포 파라미터를 CSS 변수에서 가져옴
    const cs = getComputedStyle(document.documentElement);
    const fontSizePx = parseInt(cs.getPropertyValue('--fontSizePx')) || 160;
    const lineH = parseFloat(cs.getPropertyValue('--leading')) || 1.0;
    const trackingVal = parseFloat(cs.getPropertyValue('--tracking')) || 0; // 1000em 기준
    const letterSpacingEm = trackingVal / 1000;

    const text = getEditorTextWithNewlines();

    // 프린트 프레임
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';
    document.body.appendChild(frame);

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Vector Print</title>
<style>
@page { size: ${pageWidthMM}mm auto; margin: 0 }
html, body { margin: 0; padding: 0; background: #fff }
@font-face {
  font-family: "MyFont";
  src: url(${JSON.stringify(fontDataUrl)}) format("opentype");
  font-weight: 400;
  font-style: normal;
}
#wrap {
  width: ${printableWidthMM}mm;
  margin: 0;
  padding: 0;
}
#text {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;

  font-family: "MyFont", system-ui, sans-serif;
  font-size: ${fontSizePx}px;
  line-height: ${lineH};
  letter-spacing: ${letterSpacingEm}em;

  color: #000;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;

  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
}
</style>
</head>
<body>
  <div id="wrap"><div id="text"></div></div>
  <script>
    (function(){
      const t = ${JSON.stringify(text)};
      document.getElementById('text').textContent = t;
      setTimeout(function(){ window.focus(); window.print(); }, 10);
      window.onafterprint = function(){ try{ parent.postMessage({__fromPrintFrame:true}, '*'); }catch(e){} };
    })();
  <\/script>
</body></html>`;

    frame.srcdoc = html;

    function onMsg(ev) {
        if (ev && ev.data && ev.data.__fromPrintFrame) {
            window.removeEventListener('message', onMsg);
            setTimeout(() => { try { frame.remove(); } catch { } }, 0);
        }
    }
    window.addEventListener('message', onMsg);
}

/* ---------- (옵션) 라스터 경로: 필요 시 유지 ----------
   - A코드의 캔버스/이진화/오버샘플 방식이 필요할 때 써도 됨
   - 기본 인쇄는 printVectorFromEditor() 를 사용 */
function getLinesByDOMLayout(text, {
    fontFamily = 'MyFont', fontSizePx = 160, lineHeight = 1.0,
    letterSpacingEm = 0, widthPx = null
} = {}) {
    const probe = document.createElement('div');
    probe.style.cssText = [
        'position:fixed', 'left:-9999px', 'top:-9999px', 'visibility:hidden',
        'white-space:pre-wrap', 'word-break:break-word', 'overflow-wrap:anywhere',
        `font-family:"${fontFamily}", system-ui, sans-serif`,
        `font-size:${fontSizePx}px`,
        `line-height:${lineHeight}`,
        `letter-spacing:${letterSpacingEm}em`,
        'padding:0', 'margin:0', 'border:0'
    ].join(';');

    const editorRect = editor.getBoundingClientRect();
    const px = (typeof widthPx === 'number' && widthPx > 0) ? widthPx : editorRect.width;
    probe.style.width = `${px}px`;

    const paras = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
    document.body.appendChild(probe);

    const lines = [];
    const range = document.createRange();

    for (let p = 0; p < paras.length; p++) {
        const para = paras[p];
        if (para.length === 0) { lines.push(''); continue; }

        const node = document.createTextNode(para);
        probe.textContent = ''; probe.appendChild(node);

        let start = 0; let prevTop = null;
        for (let i = 0; i < para.length; i++) {
            range.setStart(node, 0); range.setEnd(node, i + 1);
            const rects = range.getClientRects(); const last = rects[rects.length - 1];
            const top = last ? last.top : prevTop;
            if (prevTop === null) { prevTop = top; continue; }
            if (top > prevTop + 0.5) { lines.push(para.slice(start, i)); start = i; prevTop = top; }
        }
        lines.push(para.slice(start));
    }
    probe.remove();
    return lines;
}

async function renderTextToCanvasBitmap(text, {
    fontFamily = 'MyFont', fontSizePx = 160, lineHeight = 1.0,
    marginX = 8, marginY = 8, threshold = 190, oversample = 2
} = {}) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    await ensureFontFaceLoaded();

    const rs = getComputedStyle(document.documentElement);
    const trackingVal = parseFloat(rs.getPropertyValue('--tracking')) || 0;
    const letterSpacingEm = trackingVal / 1000;

    const editorWidthPx = editor.getBoundingClientRect().width;
    const lines = getLinesByDOMLayout(text, { fontFamily, fontSizePx, lineHeight, letterSpacingEm, widthPx: editorWidthPx });

    const S = Math.max(1, oversample | 0);
    const osFontPx = fontSizePx * S * dpr;
    const lineH = fontSizePx * lineHeight;
    const osLineH = lineH * S * dpr;

    const contentWidthPx = Math.ceil(editorWidthPx);
    const osWidth = Math.ceil((contentWidthPx + marginX * 2) * S * dpr);
    const osHeight = Math.ceil((marginY * 2 + lineH * lines.length) * S * dpr);

    const os = document.createElement('canvas');
    os.width = osWidth; os.height = osHeight;
    const octx = os.getContext('2d', { willReadFrequently: true });
    octx.fillStyle = '#fff'; octx.fillRect(0, 0, osWidth, osHeight);
    octx.font = `${osFontPx}px "${fontFamily}", system-ui, sans-serif`;
    octx.textBaseline = 'alphabetic'; octx.fillStyle = '#000';

    const trackingPxAt1x = fontSizePx * letterSpacingEm;
    const trackingPxOS = trackingPxAt1x * S * dpr;

    let y = (marginY * S * dpr) + (fontSizePx * S * dpr); const x0 = marginX * S * dpr;
    for (const ln of lines) {
        if (!ln) { y += osLineH; continue; }
        if (Math.abs(trackingVal) < 0.0001) {
            octx.fillText(ln, x0, y);
        } else {
            let x = x0;
            for (let i = 0; i < ln.length; i++) {
                const ch = ln[i];
                octx.fillText(ch, x, y);
                const adv = octx.measureText(ch).width + trackingPxOS;
                x += adv;
            }
        }
        y += osLineH;
    }

    const tgtW = Math.ceil((contentWidthPx + marginX * 2) * dpr);
    const tgtH = Math.ceil((marginY * 2 + lineH * lines.length) * dpr);
    const canvas = document.createElement('canvas');
    canvas.width = tgtW; canvas.height = tgtH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(os, 0, 0, osWidth, osHeight, 0, 0, tgtW, tgtH);

    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const bit = lum < threshold ? 0 : 255;
        data[i] = data[i + 1] = data[i + 2] = bit; data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);

    return canvas;
}

/* ---------- BugProbe (경량 로그 패널) ---------- */
const BugProbe = (() => {
    const S = { entries: [], panel: null, open: false, max: 200, origConsoleError: console.error.bind(console) };

    function ensurePanel() {
        if (S.panel) return;
        const wrap = document.createElement('div');
        wrap.id = 'bugProbe';
        wrap.style.cssText = `
      position:fixed; inset:auto 10px 10px auto; top:56px;
      width:min(560px,92vw); height:min(60vh,560px);
      background:#101114; color:#e8e8e8; border:1px solid #2f2f2f; border-radius:12px;
      z-index:99999; box-shadow:0 18px 60px rgba(0,0,0,.35); display:none; overflow:hidden;
      font:12px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial;`;
        wrap.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid #2a2a2a;background:#15161a;">
        <strong>Bug Report</strong><span id="bpCnt" style="opacity:.7"></span>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button id="bpCopy" style="padding:4px 8px;border:1px solid #3a3a3a;background:#222;border-radius:6px;color:#eee;cursor:pointer">Copy</button>
          <button id="bpClear" style="padding:4px 8px;border:1px solid #3a3a3a;background:#222;border-radius:6px;color:#eee;cursor:pointer">Clear</button>
          <button id="bpClose" style="padding:4px 8px;border:1px solid #3a3a3a;background:#222;border-radius:6px;color:#eee;cursor:pointer">×</button>
        </div>
      </div>
      <div id="bpList" style="height:calc(100% - 38px);overflow:auto;padding:8px 10px;"></div>`;
        document.body.appendChild(wrap);
        wrap.querySelector('#bpClose').addEventListener('click', toggle);
        wrap.querySelector('#bpClear').addEventListener('click', () => { S.entries = []; render(); });
        wrap.querySelector('#bpCopy').addEventListener('click', () => {
            const blob = JSON.stringify({ url: location.href, ts: new Date().toISOString(), entries: S.entries }, null, 2);
            navigator.clipboard?.writeText(blob).catch(() => { });
        });
        S.panel = wrap;
    }
    function addEntry(e) { e.ts = new Date().toISOString(); S.entries.push(e); if (S.entries.length > S.max) S.entries.shift(); if (S.open) render(); }
    function render() {
        if (!S.panel) return;
        const list = S.panel.querySelector('#bpList'); const cnt = S.panel.querySelector('#bpCnt');
        list.innerHTML = ''; cnt.textContent = `${S.entries.length} events`;
        S.entries.slice().reverse().forEach(it => {
            const card = document.createElement('div');
            card.style.cssText = 'border:1px solid #2a2a2a;border-radius:10px;padding:8px 10px;margin:8px 0;background:#13151a;';
            card.innerHTML = `
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="display:inline-block;padding:2px 6px;border-radius:6px;background:#2b2f3a;color:#cbd5ff;">${it.type}</span>
          <code style="white-space:pre-wrap">${escapeHtml(it.message || '')}</code>
        </div>
        <div style="opacity:.7;margin-top:4px"><time>${it.ts}</time></div>
        ${it.stack ? `<pre style="margin:6px 0 0;padding:8px;background:#0f1116;border-radius:8px;white-space:pre-wrap">${escapeHtml(it.stack)}</pre>` : ''}`;
            list.appendChild(card);
        });
    }
    function toggle(force) { ensurePanel(); S.open = (typeof force === 'boolean') ? force : !S.open; S.panel.style.display = S.open ? '' : 'none'; if (S.open) render(); }
    function escapeHtml(s) { return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m])); }
    function init() {
        window.addEventListener('error', (ev) => addEntry({ type: 'error', message: ev.message || 'Error', stack: ev.error && ev.error.stack ? String(ev.error.stack) : null }), true);
        window.addEventListener('unhandledrejection', (ev) => { const r = ev.reason; addEntry({ type: 'promise', message: (r && r.message) ? r.message : String(r), stack: r && r.stack ? String(r.stack) : null }); }, true);
        console.error = (...args) => { addEntry({ type: 'console', message: args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ') }); S.origConsoleError(...args); };
    }
    return { init, toggle, addEntry };
})();

/* ---------- Boot ---------- */
async function init() {
    BugProbe.init();
    try { await ensureFontFaceLoaded(); } catch (e) { console.error(e); }

    initEditor();
    initAdmin();

    // 인쇄 버튼 → 벡터(무손실) 인쇄
    printOSBtn?.addEventListener('click', async () => {
        const txt = getEditorTextWithNewlines().trim();
        if (!txt) { alert('인쇄할 텍스트가 없습니다.'); return; }
        await printVectorFromEditor({ pageWidthMM: 80, printableWidthMM: 200 });
    });
}
document.addEventListener('DOMContentLoaded', init);
