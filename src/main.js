/* =========================
 * Config
 * ========================= */
const BASE_CANVAS = { w: 2560, h: 1440 };
const DEFAULT_MAX_CHARS = 40;
const DEFAULT_FONT_SIZE = 160;
const ALLOWED_HINT = "A–Z, 0–9, 공백, . , ! ? _ - @ # ( ) [ ] / & * % + : ;";

// 프로젝트 루트에 맞게 경로 확인!
const MYFONT_URL = "/kmuvcd2025_team/assets/MyFont.otf";

const LETTER_PRINTS = {
    "A": "glyphs/a.png", "B": "glyphs/b.png", "C": "glyphs/c.png", "D": "glyphs/d.png", "E": "glyphs/e.png", "F": "glyphs/f.png",
    "G": "glyphs/g.png", "H": "glyphs/h.png", "I": "glyphs/i.png", "J": "glyphs/j.png", "K": "glyphs/k.png", "L": "glyphs/l.png",
    "M": "glyphs/m.png", "N": "glyphs/n.png", "O": "glyphs/o.png", "P": "glyphs/p.png", "Q": "glyphs/q.png", "R": "glyphs/r.png",
    "S": "glyphs/s.png", "T": "glyphs/t.png", "U": "glyphs/u.png", "V": "glyphs/v.png", "W": "glyphs/w.png", "X": "glyphs/x.png",
    "Y": "glyphs/y.png", "Z": "glyphs/z.png",
    "0": "glyphs/0.png", "1": "glyphs/1.png", "2": "glyphs/2.png", "3": "glyphs/3.png", "4": "glyphs/4.png",
    "5": "glyphs/5.png", "6": "glyphs/6.png", "7": "glyphs/7.png", "8": "glyphs/8.png", "9": "glyphs/9.png",
    "!": "glyphs/exclaim.png", "?": "glyphs/question.png", ".": "glyphs/period.png", ",": "glyphs/comma.png",
    "-": "glyphs/hyphen.png", "_": "glyphs/underscore.png", "@": "glyphs/at.png", "#": "glyphs/hash.png",
    "&": "glyphs/ampersand.png", "*": "glyphs/asterisk.png", "/": "glyphs/slash.png",
    "(": "glyphs/paren.png", ")": "glyphs/paren.png", "[": "glyphs/bracket-square.png", "]": "glyphs/bracket-square.png"
};

const SUPPORTED_CHAR_REGEX = /^[A-Za-z0-9\s.,!?_\-@#()\/\[\]&*%+:;]$/;
const USB_FILTERS = []; // 필요 시 vendorId/productId 추가

/* =========================
 * Elements
 * ========================= */
const $ = s => document.querySelector(s);
const inputEl = $("#textInput");
const limitEl = $("#limitInput");
const trackingEl = $("#trackingInput");
const leadingEl = $("#leadingInput");
const outputEl = $("#output");
const charCountEl = $("#charCount");
const charLimitEl = $("#charLimit");
const linkedCountEl = $("#linkedCount");
const unsupportedCountEl = $("#unsupportedCount");
const supportedListEl = $("#supportedList");
const clearBtn = $("#clearBtn");
const printBtn = $("#printBtn");
const fontSizeEl = $("#fontSizeInput");
const fontSizeLabelEl = $("#fontSizeLabel");

// 드라이버풍 화면 미리보기 컨트롤(관리자용)
const previewToggleEl = document.getElementById('driverPreviewToggle');
const previewScaleEl = document.getElementById('previewScaleInput');
const previewScaleLbl = document.getElementById('previewScaleLabel');
const previewScaleBox = document.getElementById('previewScaleBox');

/* =========================
 * Toast
 * ========================= */
let __toastTimer = null;
function showToast(msg) {
    let t = document.getElementById("typoToast");
    if (!t) {
        t = document.createElement("div");
        t.id = "typoToast";
        t.style.cssText = `
      position:fixed;left:50%;bottom:28px;transform:translateX(-50%);
      padding:10px 14px;border-radius:10px;background:rgba(20,20,20,.92);
      color:#f5f5f5;font:13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial;
      border:1px solid #2a2a2a;box-shadow:0 6px 24px rgba(0,0,0,.35);
      opacity:0;pointer-events:none;transition:opacity .18s ease;z-index:9999;
      white-space:pre-wrap;text-align:center;max-width:min(90vw,680px);`;
        document.body.appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(() => { t.style.opacity = "1"; });
    clearTimeout(__toastTimer);
    __toastTimer = setTimeout(() => { t.style.opacity = "0"; }, 1400);
}

/* =========================
 * State
 * ========================= */
let MAX_CHARS = DEFAULT_MAX_CHARS;
let PREVIEW_DRIVER_MODE = false; // 드라이버 배열 미리보기
let PREVIEW_SCALE = 1.0;         // 1.0 = 100%

/* =========================
 * Admin panel show/hide
 * ========================= */
// 관리자 패널 표시/숨김 + 전역 플래그 + 버그패널 동기화
let ADMIN_MODE = false;
function setAdminVisible(v) {
    const on = !!v;
    ADMIN_MODE = on;              // ← 전역 관리자 플래그
    if (limitEl) limitEl.closest('.field')?.style && (limitEl.closest('.field').style.display = on ? '' : 'none');
    if (previewToggleEl) previewToggleEl.closest('.field')?.style && (previewToggleEl.closest('.field').style.display = on ? '' : 'none');
    if (previewScaleBox) previewScaleBox.style.display = on ? '' : 'none';
    BugProbe.updateVisibility?.(); // ← 버그패널 표시 상태 동기화
}

/* =========================================================
 * Font loading — ROBUST
 * ========================================================= */
let __fontReady = null;         // Promise<void>
let __fontDataUrl = null;       // "data:font/otf;base64,...."
let __fontFaceAdded = false;

async function arrayBufferToDataURL(buf, mime = "font/otf") {
    const bytes = new Uint8Array(buf);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin);
    return `data:${mime};base64,${b64}`;
}

async function ensureFontFaceLoaded() {
    if (__fontReady) return __fontReady;
    __fontReady = (async () => {
        // 1) fetch OTF
        const res = await fetch(MYFONT_URL, { cache: "force-cache" });
        if (!res.ok) throw new Error("MyFont.otf 로드 실패: " + res.status);
        const buf = await res.arrayBuffer();

        // 2) cache data URL for iframe embedding
        __fontDataUrl = await arrayBufferToDataURL(buf, "font/otf");

        // 3) register FontFace explicitly
        if (!__fontFaceAdded) {
            const ff = new FontFace("MyFont", buf);
            await ff.load();
            (document.fonts || {}).add(ff);
            __fontFaceAdded = true;
        }

        // 4) extra safety: CSS Font Loading API wait
        try { await document.fonts.ready; } catch { }
        // small paint delay to be 100% sure on Safari
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    })().catch(err => {
        __fontReady = null; // let next call retry
        throw err;
    });
    return __fontReady;
}

/* =========================
 * Init
 * ========================= */
function init() {
    // 관리자 UI는 기본 숨김
    setAdminVisible(false);

    // 제한/표시값
    inputEl.maxLength = MAX_CHARS;
    charLimitEl.textContent = MAX_CHARS;
    renderSupportedList();

    // 입력/컨트롤 이벤트
    inputEl.addEventListener("input", e => renderOutputAccordingToMode(e.target.value));
    limitEl.addEventListener("change", handleLimitChange);
    trackingEl.addEventListener("input", handleTrackingChange);
    leadingEl.addEventListener("input", handleLeadingChange);
    clearBtn.addEventListener("click", () => { inputEl.value = ""; renderOutputAccordingToMode(""); });

    if (printBtn) printBtn.addEventListener("click", handleUsbPrint);

    // 허용 외 문자 차단
    inputEl.addEventListener("beforeinput", (ev) => {
        if (typeof ev.data === "string" && ev.data.length === 1) {
            const willLen = inputEl.selectionStart != null && inputEl.selectionEnd != null
                ? inputEl.value.length - (inputEl.selectionEnd - inputEl.selectionStart) + 1
                : inputEl.value.length + 1;
            if (willLen > MAX_CHARS) { ev.preventDefault(); showToast(`최대 ${MAX_CHARS}자까지 입력할 수 있어요.`); return; }
            if (!SUPPORTED_CHAR_REGEX.test(ev.data)) { ev.preventDefault(); showToast("허용된 문자만 입력할 수 있어요.\n" + ALLOWED_HINT); }
        }
    });

    // 붙여넣기 필터
    inputEl.addEventListener("paste", (ev) => {
        ev.preventDefault();
        const dt = ev.clipboardData || window.clipboardData;
        const text = (dt && dt.getData("text")) || "";
        let filtered = "";
        for (const ch of text) if (SUPPORTED_CHAR_REGEX.test(ch)) filtered += ch;

        const start = inputEl.selectionStart ?? inputEl.value.length;
        const end = inputEl.selectionEnd ?? inputEl.value.length;
        const currentLen = inputEl.value.length - (end - start);
        const remain = Math.max(0, MAX_CHARS - currentLen);
        const toInsert = filtered.slice(0, remain);

        if (toInsert.length) {
            inputEl.setRangeText(toInsert, start, end, "end");
            inputEl.dispatchEvent(new Event("input", { bubbles: true }));
        }
        if (filtered.length !== text.length) showToast("허용된 문자만 붙여넣을 수 있어요.\n" + ALLOWED_HINT);
        else if (!toInsert.length) showToast(`최대 ${MAX_CHARS}자까지 입력할 수 있어요.`);
    });

    // 관리자: 드라이버풍 미리보기/배율
    if (previewToggleEl) {
        previewToggleEl.addEventListener('change', async () => {
            PREVIEW_DRIVER_MODE = previewToggleEl.checked;
            previewScaleBox.style.display = PREVIEW_DRIVER_MODE ? '' : 'none';
            await renderOutputAccordingToMode(inputEl.value);
        });
    }
    if (previewScaleEl) {
        previewScaleEl.addEventListener('input', () => {
            const v = Math.max(50, Math.min(300, parseInt(previewScaleEl.value || '100', 10)));
            PREVIEW_SCALE = v / 100;
            if (previewScaleLbl) previewScaleLbl.textContent = v + '%';
            const cv = outputEl.querySelector('canvas.preview');
            if (cv) cv.style.transform = `scale(${PREVIEW_SCALE})`;
        });
    }

    // 폰트 크기
    if (fontSizeEl) {
        const savedFontSize = parseInt(localStorage.getItem("fontSizePx") || String(DEFAULT_FONT_SIZE), 10);
        fontSizeEl.value = Number.isFinite(savedFontSize) ? savedFontSize : DEFAULT_FONT_SIZE;
        handleFontSizeChange();
        fontSizeEl.addEventListener("input", handleFontSizeChange);
    } else {
        document.documentElement.style.setProperty("--fontSizePx", DEFAULT_FONT_SIZE);
    }

    // OS 인쇄 버튼
    const printOSBtn = document.getElementById('printOSBtn');
    if (printOSBtn) {
        printOSBtn.addEventListener('click', async () => {
            try {
                const text = (inputEl?.value || '').trim();
                if (!text) { alert('인쇄할 텍스트가 없습니다.'); return; }
                const cs = getComputedStyle(document.documentElement);
                const fontSizePx = parseInt(cs.getPropertyValue('--fontSizePx')) || 160;
                const lineHeight = parseFloat(cs.getPropertyValue('--leading')) || 1.0;
                // 폰트 확보
                await ensureFontFaceLoaded();
                const canvas = await renderTextToCanvasBitmap(text, {
                    fontFamily: "MyFont", fontSizePx, lineHeight,
                    maxWidthPx: 576, marginX: 8, marginY: 8, threshold: 190
                });
                await printViaHiddenFrameFromCanvas(canvas, { pageWidthMM: 80, marginMM: 0 });
            } catch (e) { console.error(e); alert('미리보기 생성 중 오류: ' + (e?.message || e)); }
        });
    }

    // 단축키: Ctrl/⌘ + . → 관리자 패널 토글
    window.addEventListener('keydown', (e) => {
        const isMeta = e.ctrlKey || e.metaKey;
        if (isMeta && e.key === '.') {
            e.preventDefault();
            const box = previewToggleEl?.closest('.field') || previewScaleBox || null;
            const hidden = box && getComputedStyle(box).display === 'none';
            setAdminVisible(hidden);
            showToast(`관리자 모드 ${hidden ? 'ON' : 'OFF'}`);
        }
    });

    // 레이아웃 스케일
    autoScale();
    window.addEventListener("resize", autoScale);

    // 초기 렌더 (폰트 보장 후 그리기)
    (async () => {
        try { await ensureFontFaceLoaded(); } catch (e) { console.warn(e); }
        renderOutputAccordingToMode(inputEl.value);
    })();
}
document.addEventListener("DOMContentLoaded", init);

/* =========================
 * Rendering (DOM 텍스트 모드)
 * ========================= */
function renderSupportedList() {
    supportedListEl.innerHTML = "";
    const keys = Object.keys(LETTER_PRINTS);
    keys.sort().forEach(k => {
        const li = document.createElement("li");
        li.textContent = k + " → " + LETTER_PRINTS[k];
        supportedListEl.appendChild(li);
    });
}

function renderText(str) {
    charCountEl.textContent = str.length;
    outputEl.innerHTML = "";
    let linked = 0, unsupported = 0;

    for (const ch of str) {
        const upper = ch.toUpperCase();
        const isSupported = SUPPORTED_CHAR_REGEX.test(ch);
        const printUrl = LETTER_PRINTS[upper];

        if (printUrl) {
            const a = document.createElement("a");
            a.href = "#";
            a.className = "char";
            a.textContent = ch;
            a.setAttribute("role", "button");
            a.setAttribute("aria-label", `${ch} 인쇄`);
            a.addEventListener("click", (e) => { e.preventDefault(); printForChar(upper); });
            outputEl.appendChild(a);
            linked++;
        } else {
            const span = document.createElement("span");
            span.className = "char" + (isSupported || ch === " " ? "" : " unsupported");
            span.textContent = ch === " " ? "\u00A0" : ch;
            outputEl.appendChild(span);
            if (!isSupported && ch !== " ") unsupported++;
        }
    }
    linkedCountEl.textContent = linked;
    unsupportedCountEl.textContent = unsupported;
}

/* =========================
 * Driver-like Preview (Canvas)
 * ========================= */
async function renderDriverLikePreview(text) {
    const cs = getComputedStyle(document.documentElement);
    const fontSizePx = parseInt(cs.getPropertyValue('--fontSizePx')) || 160;
    const lineHeight = parseFloat(cs.getPropertyValue('--leading')) || 1.0;

    await ensureFontFaceLoaded(); // ✅ 폰트 확실히 로드
    const canvas = await renderTextToCanvasBitmap(String(text || ''), {
        fontFamily: "MyFont", fontSizePx, lineHeight,
        maxWidthPx: 576, marginX: 8, marginY: 8, threshold: 190
    });

    outputEl.innerHTML = '';
    canvas.className = 'preview';
    canvas.style.transformOrigin = 'top left';
    canvas.style.transform = `scale(${PREVIEW_SCALE})`;
    canvas.style.imageRendering = 'pixelated';
    outputEl.appendChild(canvas);

    charCountEl.textContent = (text || '').length;
    linkedCountEl.textContent = 0;
    unsupportedCountEl.textContent = 0;
}

async function renderOutputAccordingToMode(str) {
    if (PREVIEW_DRIVER_MODE) return renderDriverLikePreview(str);
    return renderText(str);
}

/* =========================
 * 링크된 개별 자산 인쇄
 * ========================= */
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
    const doPrint = () => {
        try { const w = frame.contentWindow; setTimeout(() => { w.focus(); w.print(); }, 80); }
        catch (e) { alert("인쇄 미리보기 호출 실패: " + e.message); }
    };
    if (ext === "pdf") {
        frame.onload = doPrint; frame.src = url;
    } else if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
        const html = `<!doctype html><html><head><meta charset="utf-8">
<style>@page{size:80mm auto;margin:0}html,body{margin:0;padding:0}img{display:block;width:72mm;margin:6mm 4mm}</style>
</head><body><img src="${url}" alt=""></body></html>`;
        frame.onload = doPrint; frame.src = "about:blank"; setTimeout(() => { frame.srcdoc = html; }, 0);
    } else if (ext === "txt") {
        fetch(url).then(r => r.text()).then(text => {
            const html = `<!doctype html><html><head><meta charset="utf-8">
<style>@page{size:80mm auto;margin:0}html,body{margin:0;padding:0}
@font-face{font-family:"MyFont";src:url(${JSON.stringify(MYFONT_URL)}) format("opentype");}
pre{font-family:"MyFont",system-ui,sans-serif;font-size:14pt;line-height:1.25;white-space:pre-wrap;word-break:break-word;width:72mm;margin:6mm 4mm;color:#000}
</style></head><body><pre>${escapeHtml(text)}</pre></body></html>`;
            frame.onload = doPrint; frame.src = "about:blank"; setTimeout(() => { frame.srcdoc = html; }, 0);
        }).catch(err => alert("텍스트 로드 실패: " + err.message));
    } else { alert("지원하지 않는 인쇄 형식: " + ext); }
}
function printForChar(upperChar) {
    const url = LETTER_PRINTS[upperChar];
    if (!url) { showToast(`인쇄 파일 없음: ${upperChar}`); return; }
    printAsset(url);
}
function escapeHtml(s) { return s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }

/* =========================
 * Controls
 * ========================= */
function handleLimitChange() {
    const n = parseInt(limitEl.value, 10);
    MAX_CHARS = Number.isFinite(n) ? Math.max(1, Math.min(200, n)) : DEFAULT_MAX_CHARS;
    inputEl.maxLength = MAX_CHARS;
    charLimitEl.textContent = MAX_CHARS;
    if (inputEl.value.length > MAX_CHARS) {
        inputEl.value = inputEl.value.slice(0, MAX_CHARS);
        renderOutputAccordingToMode(inputEl.value);
    }
}
function handleTrackingChange() { document.documentElement.style.setProperty("--tracking", trackingEl.value); }
function handleLeadingChange() {
    const v = Math.max(50, Math.min(300, parseInt(leadingEl.value || "100", 10)));
    document.documentElement.style.setProperty("--leading", (v / 100).toString());
    renderOutputAccordingToMode(inputEl.value);
}
function handleFontSizeChange() {
    const raw = fontSizeEl ? parseInt(fontSizeEl.value || String(DEFAULT_FONT_SIZE), 10) : DEFAULT_FONT_SIZE;
    const v = Math.max(24, Math.min(300, Number.isFinite(raw) ? raw : DEFAULT_FONT_SIZE));
    document.documentElement.style.setProperty("--fontSizePx", v);
    if (fontSizeLabelEl) fontSizeLabelEl.textContent = v + "px";
    try { localStorage.setItem("fontSizePx", String(v)); } catch { }
    renderOutputAccordingToMode(inputEl.value);
}

/* =========================
 * Autoscale
 * ========================= */
function autoScale() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const sx = vw / BASE_CANVAS.w;
    const sy = (vh - 64) / BASE_CANVAS.h;
    const scale = Math.min(sx, sy);
    document.documentElement.style.setProperty("--scale", scale.toString());
}

/* =========================================================
 * Font load + Text → Canvas (raster) + trim
 * ========================================================= */
function trimCanvas(src, white = 255) {
    const w = src.width, h = src.height;
    const ctx = src.getContext('2d', { willReadFrequently: true });
    const data = ctx.getImageData(0, 0, w, h).data;

    let top = h, left = w, right = -1, bottom = -1;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            if (data[i] !== white) {
                if (x < left) left = x;
                if (x > right) right = x;
                if (y < top) top = y;
                if (y > bottom) bottom = y;
            }
        }
    }
    if (right < 0) return src;

    const cw = Math.max(1, right - left + 1);
    const ch = Math.max(1, bottom - top + 1);
    const out = document.createElement('canvas');
    out.width = cw; out.height = ch;
    out.getContext('2d').drawImage(src, left, top, cw, ch, 0, 0, cw, ch);
    return out;
}

async function renderTextToCanvasBitmap(text, {
    fontFamily = "MyFont", fontSizePx = 160, lineHeight = 1.0,
    maxWidthPx = 576, marginX = 8, marginY = 8, threshold = 190
} = {}) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    // ✅ 폰트 로드 강제 대기
    await ensureFontFaceLoaded();

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const rs = getComputedStyle(document.documentElement);
    const tracking = parseFloat(rs.getPropertyValue("--tracking")) || 0;
    const trackingPx = (fontSizePx * tracking) / 1000;

    const cssFont = `${fontSizePx * dpr}px "${fontFamily}", system-ui, sans-serif`;
    ctx.font = cssFont;

    // 단어 단위 줄바꿈
    const words = String(text ?? "").split(/(\s+)/);
    const lines = [];
    const maxTextWidth = maxWidthPx - marginX * 2;
    const measure = (s) => {
        if (!s) return 0;
        const base = ctx.measureText(s).width / dpr;
        const extra = Math.max(0, s.length - 1) * trackingPx;
        return base + extra;
    };
    let line = "";
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i];
        const w = measure(testLine);
        if (w > maxTextWidth && line) {
            lines.push(line);
            line = words[i].trimStart();
        } else line = testLine;
    }
    if (line) lines.push(line);

    const lineH = fontSizePx * lineHeight;
    const width = Math.ceil(maxWidthPx * dpr);
    const height = Math.ceil((marginY * 2 + lineH * lines.length) * dpr);
    canvas.width = width; canvas.height = height;

    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, width, height);
    ctx.textBaseline = "alphabetic"; ctx.fillStyle = "#000"; ctx.font = cssFont;

    // 드로우 (수동 자간)
    let y = marginY * dpr + fontSizePx * dpr;
    const x0 = marginX * dpr;
    for (const ln of lines) {
        let x = x0;
        for (let i = 0; i < ln.length; i++) {
            const ch = ln[i];
            ctx.fillText(ch, x, y);
            const adv = ctx.measureText(ch).width + trackingPx * dpr;
            x += adv;
        }
        y += lineH * dpr;
    }

    // 1비트화
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const bit = lum < threshold ? 0 : 255;
        data[i] = data[i + 1] = data[i + 2] = bit; data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);

    return trimCanvas(canvas);
}

/* =========================
 * Canvas → ESC/POS & WebUSB
 * ========================= */
function canvasToEscPosRaster(canvas) {
    const w = canvas.width, h = canvas.height;
    const rowBytes = Math.ceil(w / 8);
    const header = new Uint8Array([0x1D, 0x76, 0x30, 0x00, rowBytes & 0xFF, (rowBytes >> 8) & 0xFF, h & 0xFF, (h >> 8) & 0xFF]);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const rgba = ctx.getImageData(0, 0, w, h).data;
    const body = new Uint8Array(rowBytes * h);
    let p = 0;
    for (let y = 0; y < h; y++) {
        for (let xb = 0; xb < rowBytes; xb++) {
            let byte = 0;
            for (let bit = 0; bit < 8; bit++) {
                const x = xb * 8 + bit;
                let on = 0;
                if (x < w) { const idx = (y * w + x) * 4; on = (rgba[idx] === 0) ? 1 : 0; }
                byte |= (on << (7 - bit));
            }
            body[p++] = byte;
        }
    }
    return { header, body };
}

async function usbPrintRaster(canvas) {
    if (!('usb' in navigator)) throw new Error('이 브라우저는 WebUSB를 지원하지 않습니다. 데스크톱 Chrome + HTTPS를 사용해주세요.');
    const fallbackFilters = [{ classCode: 0x07 }, { classCode: 0xFF }];
    const filters = USB_FILTERS.length ? USB_FILTERS : fallbackFilters;

    const device = await navigator.usb.requestDevice({ filters });
    await device.open();
    if (device.configuration == null) await device.selectConfiguration(1);

    let ifaceNumber = null, outEp = null, altSet = 0;
    for (const iface of device.configuration.interfaces) {
        for (const alt of iface.alternates) {
            const ep = alt.endpoints?.find(e => e.direction === 'out');
            if (ep) { ifaceNumber = iface.interfaceNumber; outEp = ep.endpointNumber; altSet = alt.alternateSetting ?? 0; break; }
        }
        if (ifaceNumber != null) break;
    }
    if (ifaceNumber == null || outEp == null) throw new Error('OUT 엔드포인트를 찾지 못했습니다.');
    await device.claimInterface(ifaceNumber);
    try { await device.selectAlternateInterface(ifaceNumber, altSet); } catch { }

    const ESC = 0x1B, GS = 0x1D;
    await device.transferOut(outEp, new Uint8Array([ESC, 0x40]));
    const { header, body } = canvasToEscPosRaster(canvas);
    await device.transferOut(outEp, header);
    await device.transferOut(outEp, body);
    await device.transferOut(outEp, new Uint8Array([0x0A, 0x0A]));
    try { await device.transferOut(outEp, new Uint8Array([GS, 0x56, 0x00])); } catch { }
}

async function usbPrintCanvasText(text) {
    const cs = getComputedStyle(document.documentElement);
    const fontSizePx = parseInt(cs.getPropertyValue('--fontSizePx')) || 160;
    const lineHeight = parseFloat(cs.getPropertyValue('--leading')) || 1.0;
    await ensureFontFaceLoaded();
    const canvas = await renderTextToCanvasBitmap(text, {
        fontFamily: "MyFont", fontSizePx, lineHeight, maxWidthPx: 560, marginX: 8, marginY: 8, threshold: 190
    });
    await usbPrintRaster(canvas);
}
async function handleUsbPrint() {
    try {
        const text = (inputEl?.value || '').trim();
        if (!text) { alert('인쇄할 텍스트가 없습니다.'); return; }
        await usbPrintCanvasText(text);
        alert('래스터 전송 완료!');
    } catch (err) { console.error(err); alert('프린터 전송 중 문제 발생: ' + (err?.message || err)); }
}

/* =========================
 * OS Print Dialog (hidden iframe) — INLINE FONT
 * ========================= */
async function printViaHiddenFrameFromCanvas(canvas, { pageWidthMM = 80, marginMM = 0, autoRemoveDelay = 2000 } = {}) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const CSSPX_PER_MM = 96 / 25.4;
    const imgWidthMM = (canvas.width / (dpr * CSSPX_PER_MM));
    const imgHeightMM = (canvas.height / (dpr * CSSPX_PER_MM));

    // 프린트 문서에도 폰트 임베드 (data URL)
    await ensureFontFaceLoaded();
    const fontDataUrl = __fontDataUrl; // already prepared

    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';
    document.body.appendChild(frame);

    const dataURL = canvas.toDataURL('image/png');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Print</title>
<style>
@page{size:${pageWidthMM}mm auto;margin:${marginMM}mm}
html,body{margin:0;padding:0;background:#fff}
@font-face{font-family:"MyFont";src:url(${JSON.stringify(fontDataUrl)}) format("opentype");font-weight:normal;font-style:normal;}
img{display:block;width:${imgWidthMM}mm;height:${imgHeightMM}mm;image-rendering:-webkit-optimize-contrast}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head>
<body>
<img id="pp" alt="">
<script>(function(){
 const img=document.getElementById('pp');
 img.onload=function(){setTimeout(function(){window.focus();window.print();},20);};
 img.src=${JSON.stringify(dataURL)};
 window.onafterprint=function(){try{parent.postMessage({__fromPrintFrame:true},'*');}catch(e){}};
})();<\/script>
</body></html>`;

    frame.srcdoc = html;

    const onMsg = (ev) => {
        if (ev && ev.data && ev.data.__fromPrintFrame) {
            window.removeEventListener('message', onMsg);
            setTimeout(() => { try { frame.remove(); } catch { } }, 0);
        }
    };
    window.addEventListener('message', onMsg);
    setTimeout(() => { try { frame.remove(); } catch { } }, autoRemoveDelay);
}
/* =========================================================
 * BugProbe — 관리자모드 전용 버그 리포트 패널
 * - window.onerror / unhandledrejection / console.error 훅
 * - 파일이 동일 출처면 코드 프레임(라인 하이라이트)까지 표시
 * - JSON 내보내기 / 클립보드 복사 지원
 * ========================================================= */
const BugProbe = (() => {
    const state = {
        entries: [],          // {type,message,file,line,col,stack,ts,codeFrame}
        max: 100,
        panel: null,
        badge: null,
        open: false,
    };

    function init() {
        // 배지(오른쪽 상단 점) & 패널 DOM
        ensureBadge();
        ensurePanel();
        // 에러/경고 훅
        window.addEventListener('error', onWindowError, true);
        window.addEventListener('unhandledrejection', onRejection, true);
        const origError = console.error.bind(console);
        console.error = (...args) => { addEntry({ type: 'console', message: stringify(args) }); origError(...args); };

        // 로드 직후는 숨김(관리자모드에서만 보이게)
        updateVisibility();
    }

    function updateVisibility() {
        const show = (typeof ADMIN_MODE !== 'undefined' ? ADMIN_MODE : false);
        if (state.badge) state.badge.style.display = show ? '' : 'none';
        if (!show && state.panel) state.panel.style.display = 'none';
    }

    // ===== DOM =====
    function ensureBadge() {
        if (state.badge) return;
        const b = document.createElement('button');
        b.id = 'bugBadge';
        b.textContent = 'BUG';
        b.title = '버그 패널 열기/닫기';
        b.style.cssText = `
      position:fixed; top:10px; right:10px; z-index:99999;
      padding:6px 10px; border-radius:8px; border:1px solid #333;
      background:#ffdad6; color:#111; font:12px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial;
      cursor:pointer; box-shadow:0 4px 14px rgba(0,0,0,.18); display:none;
    `;
        b.addEventListener('click', togglePanel);
        document.body.appendChild(b);
        state.badge = b;
        renderBadgeCount();
    }

    function ensurePanel() {
        if (state.panel) return;
        const wrap = document.createElement('div');
        wrap.id = 'bugPanel';
        wrap.style.cssText = `
      position:fixed; inset:auto 10px 10px auto; top:44px; width:min(560px, 90vw); height:min(60vh, 560px);
      background:#101114; color:#e8e8e8; border:1px solid #2f2f2f; border-radius:12px; z-index:99999;
      box-shadow:0 18px 60px rgba(0,0,0,.35); display:none; overflow:hidden;
      font:12px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial;
    `;
        wrap.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid #2a2a2a;background:#15161a;">
        <strong style="font-size:12px;">Bug Report</strong>
        <span id="bugCnt" style="opacity:.7"></span>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button id="bugExport" style="padding:4px 8px;border:1px solid #3a3a3a;background:#222;border-radius:6px;color:#eee;cursor:pointer">Export JSON</button>
          <button id="bugCopy"   style="padding:4px 8px;border:1px solid #3a3a3a;background:#222;border-radius:6px;color:#eee;cursor:pointer">Copy</button>
          <button id="bugClear"  style="padding:4px 8px;border:1px solid #3a3a3a;background:#222;border-radius:6px;color:#eee;cursor:pointer">Clear</button>
          <button id="bugClose"  style="padding:4px 8px;border:1px solid #3a3a3a;background:#222;border-radius:6px;color:#eee;cursor:pointer">×</button>
        </div>
      </div>
      <div id="bugList" style="height: calc(100% - 38px); overflow:auto; padding:8px 10px;"></div>
    `;
        document.body.appendChild(wrap);
        wrap.querySelector('#bugClose').addEventListener('click', togglePanel);
        wrap.querySelector('#bugClear').addEventListener('click', () => { state.entries = []; render(); renderBadgeCount(); });
        wrap.querySelector('#bugCopy').addEventListener('click', () => copyToClipboard(JSON.stringify(dump(), null, 2)));
        wrap.querySelector('#bugExport').addEventListener('click', downloadJson);
        state.panel = wrap;
    }

    function togglePanel() {
        state.open = !state.open;
        if (state.panel) state.panel.style.display = state.open ? '' : 'none';
        if (state.open) render();
    }

    function renderBadgeCount() {
        if (!state.badge) return;
        const n = state.entries.length;
        state.badge.textContent = n ? `BUG (${n})` : 'BUG';
    }

    // ===== 수집/렌더 =====
    function onWindowError(ev) {
        addEntry({
            type: 'error',
            message: ev.message || 'Error',
            file: ev.filename || null,
            line: ev.lineno || null,
            col: ev.colno || null,
            stack: (ev.error && ev.error.stack) ? String(ev.error.stack) : null,
        });
    }
    function onRejection(ev) {
        const reason = ev.reason;
        addEntry({
            type: 'promise',
            message: (reason && reason.message) ? reason.message : stringify([reason]),
            file: null, line: null, col: null,
            stack: reason && reason.stack ? String(reason.stack) : null,
        });
    }

    function addEntry(e) {
        e.ts = new Date().toISOString();
        state.entries.push(e);
        if (state.entries.length > state.max) state.entries.shift();
        renderBadgeCount();
        if (state.open) render();
    }

    function render() {
        const box = state.panel?.querySelector('#bugList');
        const cnt = state.panel?.querySelector('#bugCnt');
        if (!box) return;
        box.innerHTML = '';
        cnt && (cnt.textContent = `${state.entries.length} errors`);

        state.entries.slice().reverse().forEach((it, idx) => {
            const card = document.createElement('div');
            card.style.cssText = `border:1px solid #2a2a2a;border-radius:10px;padding:8px 10px;margin:8px 0;background:#13151a;`;
            const head = document.createElement('div');
            head.innerHTML = `
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="display:inline-block;padding:2px 6px;border-radius:6px;background:#2b2f3a;color:#cbd5ff;">${it.type}</span>
          <code style="white-space:pre-wrap">${escapeHtml(it.message || '')}</code>
        </div>
        <div style="opacity:.7;margin-top:4px">
          <code>${escapeHtml(it.file || '')}</code>${it.line != null ? `:${it.line}` : ''}${it.col != null ? `:${it.col}` : ''} • <time>${it.ts}</time>
        </div>
      `;
            card.appendChild(head);

            // 버튼들
            const btns = document.createElement('div');
            btns.style.cssText = 'display:flex;gap:6px;margin-top:6px;flex-wrap:wrap';
            const btnStack = makeBtn('Stack', () => modalText(it.stack || '(no stack)'));
            const btnFrame = makeBtn('Code frame', () => codeFrameFor(it).then(frame => modalText(frame || '(unavailable)')));
            const btnCopy = makeBtn('Copy entry', () => copyToClipboard(JSON.stringify(it, null, 2)));
            btns.append(btnStack, btnFrame, btnCopy);
            card.appendChild(btns);

            box.appendChild(card);
        });
    }

    // ===== 유틸 =====
    function stringify(args) { try { return args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '); } catch { return String(args); } }
    function escapeHtml(s) { return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
    function makeBtn(label, onclick) {
        const b = document.createElement('button');
        b.textContent = label;
        b.style.cssText = 'padding:4px 8px;border:1px solid #3a3a3a;background:#1f2128;border-radius:6px;color:#eee;cursor:pointer';
        b.addEventListener('click', onclick);
        return b;
    }

    function modalText(text) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
      position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:100000; display:flex; align-items:center; justify-content:center; padding:20px;
    `;
        const panel = document.createElement('div');
        panel.style.cssText = `max-width:min(90vw,1000px); max-height:min(80vh,800px); background:#0f1116; color:#eee; border:1px solid #2b2b2b; border-radius:12px; overflow:auto;`;
        panel.innerHTML = `<pre style="margin:0;padding:16px 18px;white-space:pre-wrap;font:12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;">${escapeHtml(text || '')}</pre>`;
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
    }

    async function codeFrameFor(entry, context = 6) {
        try {
            if (!entry.file) return null;
            const url = new URL(entry.file, location.href);
            if (url.origin !== location.origin) return 'Cross-origin 소스 — 코드 프레임 불가';
            const res = await fetch(url.href, { cache: 'no-cache' });
            if (!res.ok) return `소스 로드 실패: ${res.status}`;
            const text = await res.text();
            const lines = text.split(/\r?\n/);
            const L = Math.max(1, (entry.line || 1) | 0);
            const a = Math.max(1, L - context), b = Math.min(lines.length, L + context);
            let out = `${url.pathname}:${L}${entry.col ? `:${entry.col}` : ''}\n\n`;
            for (let i = a; i <= b; i++) {
                const mark = (i === L) ? '▶' : ' ';
                out += `${mark} ${String(i).padStart(String(b).length, ' ')} | ${lines[i - 1]}\n`;
            }
            return out;
        } catch (e) {
            return `코드 프레임 생성 실패: ${e?.message || e}`;
        }
    }

    function copyToClipboard(text) {
        navigator.clipboard?.writeText(text).then(() => { }).catch(() => {
            const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy'); } finally { ta.remove(); }
        });
    }

    function dump() {
        return {
            url: location.href,
            ua: navigator.userAgent,
            ts: new Date().toISOString(),
            admin: !!(typeof ADMIN_MODE !== 'undefined' && ADMIN_MODE),
            entries: state.entries,
        };
    }

    function downloadJson() {
        const blob = new Blob([JSON.stringify(dump(), null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `bug-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }

    // 자동 초기화
    document.addEventListener('DOMContentLoaded', init);

    return { init, updateVisibility, addEntry };
})();