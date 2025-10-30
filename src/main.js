/* =========================
 * Config
 * ========================= */
const BASE_CANVAS = { w: 2560, h: 1440 }; // 27" iMac 기준 캔버스
const DEFAULT_MAX_CHARS = 40;
const DEFAULT_FONT_SIZE = 160; // 글자 크기 슬라이더 기본값(px)

// 입력 허용 안내(토스트에 노출될 문자열) — 정규식과 내용 일치
const ALLOWED_HINT = "A–Z, 0–9, 공백, . , ! ? _ - @ # ( ) [ ] / & * % + : ;";

// 링크 매핑: 문자 → 하위페이지 경로 (대소문자 모두 커버)
const LETTER_PRINTS = {
    // 알파벳
    "A": "glyphs/a.png", "B": "glyphs/b.png", "C": "glyphs/c.png",
    "D": "glyphs/d.png", "E": "glyphs/e.png", "F": "glyphs/f.png",
    "G": "glyphs/g.png", "H": "glyphs/h.png", "I": "glyphs/i.png",
    "J": "glyphs/j.png", "K": "glyphs/k.png", "L": "glyphs/l.png",
    "M": "glyphs/m.png", "N": "glyphs/n.png", "O": "glyphs/o.png",
    "P": "glyphs/p.png", "Q": "glyphs/q.png", "R": "glyphs/r.png",
    "S": "glyphs/s.png", "T": "glyphs/t.png", "U": "glyphs/u.png",
    "V": "glyphs/v.png", "W": "glyphs/w.png", "X": "glyphs/x.png",
    "Y": "glyphs/y.png", "Z": "glyphs/z.png",
    // 숫자
    "0": "glyphs/0.png", "1": "glyphs/1.png", "2": "glyphs/2.png",
    "3": "glyphs/3.png", "4": "glyphs/4.png", "5": "glyphs/5.png",
    "6": "glyphs/6.png", "7": "glyphs/7.png", "8": "glyphs/8.png",
    "9": "glyphs/9.png",
    // 특수문자 예시
    "!": "glyphs/exclaim.png",
    "?": "glyphs/question.png",
    ".": "glyphs/period.png",
    ",": "glyphs/comma.png",
    "-": "glyphs/hyphen.png",
    "_": "glyphs/underscore.png",
    "@": "glyphs/at.png",
    "#": "glyphs/hash.png"
};
// ▶ 추가 매핑 (& * / ( ) [ ] : 닫는 괄호는 여는 괄호와 동일 페이지)
Object.assign(LETTER_PRINTS, {
    "&": "glyphs/ampersand.png",
    "*": "glyphs/asterisk.png",
    "/": "glyphs/slash.png",
    "(": "glyphs/paren.png",
    ")": "glyphs/paren.png",
    "[": "glyphs/bracket-square.png",
    "]": "glyphs/bracket-square.png"
});

// 어떤 문자를 “지원 문자”로 취급할지 (링크 유무와 별개)
const SUPPORTED_CHAR_REGEX = /^[A-Za-z0-9\s.,!?_\-@#()\/\[\]&*%+:;]$/;

// WebUSB(vendor/product) 필터(예시). 실제 프린터로 교체 필요.
const USB_FILTERS = [
    // { vendorId: 0x04b8, productId: 0x0e15 },
];

/* =========================
 * Elements
 * ========================= */
const $ = sel => document.querySelector(sel);
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
const printBtn = $("#printBtn"); // (없어도 안전)
const fontSizeEl = $("#fontSizeInput");
const fontSizeLabelEl = $("#fontSizeLabel");

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
      position:fixed; left:50%; bottom:28px; transform:translateX(-50%);
      padding:10px 14px; border-radius:10px;
      background:rgba(20,20,20,.92); color:#f5f5f5; font:13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial;
      border:1px solid #2a2a2a; box-shadow:0 6px 24px rgba(0,0,0,.35);
      opacity:0; pointer-events:none; transition:opacity .18s ease;
      z-index:9999; white-space:pre-wrap; text-align:center; max-width:min(90vw,680px);
    `;
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

/* =========================
 * Init
 * ========================= */
function init() {
    // 제한값 동기화
    inputEl.maxLength = MAX_CHARS;
    charLimitEl.textContent = MAX_CHARS;

    renderSupportedList();

    // 입력 이벤트
    inputEl.addEventListener("input", handleInput);
    limitEl.addEventListener("change", handleLimitChange);
    trackingEl.addEventListener("input", handleTrackingChange);
    leadingEl.addEventListener("input", handleLeadingChange);
    clearBtn.addEventListener("click", () => { inputEl.value = ""; renderText(""); });

    // 버튼 null 가드
    if (printBtn) printBtn.addEventListener("click", handleUsbPrint);

    // 허용 외 문자 타이핑 차단
    inputEl.addEventListener("beforeinput", (ev) => {
        if (typeof ev.data === "string" && ev.data.length === 1) {
            const willLen = inputEl.selectionStart != null && inputEl.selectionEnd != null
                ? inputEl.value.length - (inputEl.selectionEnd - inputEl.selectionStart) + 1
                : inputEl.value.length + 1;
            if (willLen > MAX_CHARS) {
                ev.preventDefault();
                showToast(`최대 ${MAX_CHARS}자까지 입력할 수 있어요.`);
                return;
            }
            if (!SUPPORTED_CHAR_REGEX.test(ev.data)) {
                ev.preventDefault();
                showToast("허용된 문자만 입력할 수 있어요.\n" + ALLOWED_HINT);
            }
        }
    });

    // 붙여넣기 전처리
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

        if (filtered.length !== text.length) {
            showToast("허용된 문자만 붙여넣을 수 있어요.\n" + ALLOWED_HINT);
        } else if (!toInsert.length) {
            showToast(`최대 ${MAX_CHARS}자까지 입력할 수 있어요.`);
        }
    });

    // 폰트 크기 초기화
    if (fontSizeEl) {
        const savedFontSize = parseInt(localStorage.getItem("fontSizePx") || String(DEFAULT_FONT_SIZE), 10);
        fontSizeEl.value = Number.isFinite(savedFontSize) ? savedFontSize : DEFAULT_FONT_SIZE;
        handleFontSizeChange();
        fontSizeEl.addEventListener("input", handleFontSizeChange);
    } else {
        document.documentElement.style.setProperty("--fontSizePx", DEFAULT_FONT_SIZE);
    }

    // 운영체제 인쇄(드라이버 미리보기) — 숨은 iframe 방식(팝업 없이)
    const printOSBtn = document.getElementById('printOSBtn');
    if (printOSBtn) {
        printOSBtn.addEventListener('click', async () => {
            try {
                const text = (inputEl?.value || '').trim();
                if (!text) { alert('인쇄할 텍스트가 없습니다.'); return; }

                // 화면 CSS 변수 읽어 동일 타이포로 렌더
                const cs = getComputedStyle(document.documentElement);
                const fontSizePx = parseInt(cs.getPropertyValue('--fontSizePx')) || 160;
                const lineHeight = parseFloat(cs.getPropertyValue('--leading')) || 1.0;

                const canvas = await renderTextToCanvasBitmap(text, {
                    fontFamily: "MyFont",
                    fontSizePx,
                    lineHeight,
                    maxWidthPx: 576,  // 프린터 폭에 맞춰 조정 (512/554/576/832 등)
                    marginX: 8,
                    marginY: 8,
                    threshold: 190
                });

                // 바로 드라이버 대화상자
                printViaHiddenFrameFromCanvas(canvas, {
                    pageWidthMM: 80, // 58mm 프린터면 58로
                    marginMM: 0
                });
            } catch (e) {
                console.error(e);
                alert('미리보기 생성 중 오류: ' + (e?.message || e));
            }
        });
    }

    // 스케일 적용
    autoScale();
    window.addEventListener("resize", autoScale);

    // 초기 렌더
    renderText(inputEl.value);
}
document.addEventListener("DOMContentLoaded", init);

/* =========================
 * Rendering
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
function handleInput(e) { renderText(e.target.value); }

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
            a.addEventListener("click", (e) => {
                e.preventDefault();
                printForChar(upper);
            });
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

function printForChar(upperChar) {
    const url = LETTER_PRINTS[upperChar];
    if (!url) { showToast(`인쇄 파일 없음: ${upperChar}`); return; }
    printAsset(url);
}

// 숨은 iframe 확보
function ensurePrintFrame() {
    let f = document.getElementById("printFrame");
    if (!f) {
        f = document.createElement("iframe");
        f.id = "printFrame";
        f.style.position = "absolute";
        f.style.left = "-9999px";
        f.style.width = "0";
        f.style.height = "0";
        f.style.border = "0";
        document.body.appendChild(f);
    }
    return f;
}

// 파일 유형별 인쇄(링크된 개별 자산용)
function printAsset(url) {
    const ext = url.split("?")[0].split("#")[0].split(".").pop().toLowerCase();
    const frame = ensurePrintFrame();

    const doPrint = () => {
        try {
            const w = frame.contentWindow;
            setTimeout(() => { w.focus(); w.print(); }, 80);
        } catch (e) {
            alert("인쇄 미리보기 호출 실패: " + e.message);
        }
    };

    if (ext === "pdf") {
        frame.onload = doPrint;
        frame.src = url;
    } else if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
        const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: 80mm auto; margin: 0; }
  html,body { margin:0; padding:0; }
  body { display:block; }
  img { display:block; width:72mm; margin:6mm 4mm; }
</style>
</head>
<body>
  <img src="${url}" alt="">
</body>
</html>`;
        frame.onload = doPrint;
        frame.src = "about:blank";
        setTimeout(() => { frame.srcdoc = html; }, 0);
    } else if (ext === "txt") {
        fetch(url).then(r => r.text()).then(text => {
            const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { size: 80mm auto; margin: 0; }
  html,body { margin:0; padding:0; }
  pre {
    font-family: "MyFont", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    font-size: 14pt; line-height: 1.25;
    white-space: pre-wrap; word-break: break-word;
    width:72mm; margin:6mm 4mm; color:#000;
  }
  @font-face {
    font-family: "MyFont";
    src: url("/kmuvcd2025_team/assets/MyFont.otf") format("opentype");
  }
</style>
</head>
<body>
<pre>${escapeHtml(text)}</pre>
</body>
</html>`;
            frame.onload = doPrint;
            frame.src = "about:blank";
            setTimeout(() => { frame.srcdoc = html; }, 0);
        }).catch(err => alert("텍스트 로드 실패: " + err.message));
    } else {
        alert("지원하지 않는 인쇄 형식: " + ext);
    }
}
function escapeHtml(s) {
    return s.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

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
        renderText(inputEl.value);
    }
}
function handleTrackingChange() {
    document.documentElement.style.setProperty("--tracking", trackingEl.value);
}
function handleLeadingChange() {
    const v = Math.max(50, Math.min(300, parseInt(leadingEl.value || "100", 10)));
    document.documentElement.style.setProperty("--leading", (v / 100).toString());
}
function handleFontSizeChange() {
    const raw = fontSizeEl ? parseInt(fontSizeEl.value || String(DEFAULT_FONT_SIZE), 10) : DEFAULT_FONT_SIZE;
    const v = Math.max(24, Math.min(300, Number.isFinite(raw) ? raw : DEFAULT_FONT_SIZE));
    document.documentElement.style.setProperty("--fontSizePx", v);
    if (fontSizeLabelEl) fontSizeLabelEl.textContent = v + "px";
    try { localStorage.setItem("fontSizePx", String(v)); } catch { /* ignore */ }
}

/* =========================
 * Autoscale
 * ========================= */
function autoScale() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sx = vw / BASE_CANVAS.w;
    const sy = (vh - 64) / BASE_CANVAS.h; // 상단바 고려
    const scale = Math.min(sx, sy);
    document.documentElement.style.setProperty("--scale", scale.toString());
}

/* =========================================================
 * 폰트 로딩 보장 + 텍스트 → 캔버스(래스터) + 인쇄 유틸
 * ========================================================= */

/* 1) 커스텀 폰트 로딩 보장(강화판) */
async function ensureMyFontLoaded(fontFamily = "MyFont", sizePx = 160) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const tryLoad = async sz => { try { await document.fonts.load(`normal ${Math.round(sz)}px "${fontFamily}"`); } catch { } };

    await Promise.all([tryLoad(sizePx), tryLoad(sizePx * dpr), tryLoad(1), tryLoad(16), tryLoad(48)]);
    try { await document.fonts.ready; } catch { }

    const span = document.createElement('span');
    span.textContent = 'Aa가각123!?';
    span.style.cssText = `
    position:absolute;left:-9999px;top:-9999px;
    font:${sizePx}px "${fontFamily}", system-ui, sans-serif;
    white-space:nowrap; user-select:none;`;
    document.body.appendChild(span);

    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    try { span.remove(); } catch { }
}

/* 2) 텍스트 → 캔버스 비트맵(자간/행간 반영, 1비트화 포함) */
async function renderTextToCanvasBitmap(
    text,
    {
        fontFamily = "MyFont",
        fontSizePx = 160,
        lineHeight = 1.0,
        maxWidthPx = 576,
        marginX = 8,
        marginY = 8,
        threshold = 190,
    } = {}
) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    await ensureMyFontLoaded(fontFamily, fontSizePx);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // CSS 변수에서 자간 읽기 (1000분율 → px)
    const rs = getComputedStyle(document.documentElement);
    const tracking = parseFloat(rs.getPropertyValue("--tracking")) || 0;
    const trackingPx = (fontSizePx * tracking) / 1000;

    // 폰트 지정
    const cssFont = `${fontSizePx * dpr}px "${fontFamily}", system-ui, sans-serif`;
    ctx.font = cssFont;

    // 단어단위 줄바꿈
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
        } else {
            line = testLine;
        }
    }
    if (line) lines.push(line);

    // 캔버스 크기
    const lineH = fontSizePx * lineHeight;
    const width = Math.ceil(maxWidthPx * dpr);
    const height = Math.ceil((marginY * 2 + lineH * lines.length) * dpr);
    canvas.width = width;
    canvas.height = height;

    // 배경/폰트 재지정 (크기 바뀌면 다시 지정하는 게 안전)
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#000";
    ctx.font = cssFont;

    // 웜업 드로우(폴백 방지)
    ctx.globalAlpha = 0.001;
    ctx.fillText("warmup", -9999, -9999);
    ctx.globalAlpha = 1;

    // 실제 그리기 (자간 수동 적용)
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

    // 1비트 임계 변환
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const bit = lum < threshold ? 0 : 255;
        data[i] = data[i + 1] = data[i + 2] = bit;
        data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);

    return canvas;
}

/* 3) Canvas → ESC/POS 래스터(GS v 0) */
function canvasToEscPosRaster(canvas) {
    const w = canvas.width, h = canvas.height;
    const rowBytes = Math.ceil(w / 8);
    const header = new Uint8Array([
        0x1D, 0x76, 0x30, 0x00,            // GS v 0 m=0
        rowBytes & 0xFF, (rowBytes >> 8) & 0xFF,
        h & 0xFF, (h >> 8) & 0xFF
    ]);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const rgba = ctx.getImageData(0, 0, w, h).data;
    const body = new Uint8Array(rowBytes * h);

    let p = 0;
    for (let y = 0; y < h; y++) {
        for (let xb = 0; xb < rowBytes; xb++) {
            let byte = 0;
            for (let bit = 0; bit < 8; bit++) {
                const x = xb * 8 + bit;
                let on = 0; // 1=검정 점
                if (x < w) {
                    const idx = (y * w + x) * 4;
                    on = (rgba[idx] === 0) ? 1 : 0; // 0=검정(앞서 1비트화)
                }
                byte |= (on << (7 - bit));
            }
            body[p++] = byte;
        }
    }
    return { header, body };
}

/* 4) WebUSB: 인터페이스/엔드포인트 탐색 + 전송 */
async function usbPrintRaster(canvas) {
    if (!('usb' in navigator)) {
        throw new Error('이 브라우저는 WebUSB를 지원하지 않습니다. 데스크톱 Chrome + HTTPS를 사용해주세요.');
    }
    const fallbackFilters = [{ classCode: 0x07 }, { classCode: 0xFF }];
    const filters = (Array.isArray(USB_FILTERS) && USB_FILTERS.length) ? USB_FILTERS : fallbackFilters;

    const device = await navigator.usb.requestDevice({ filters });
    await device.open();
    if (device.configuration == null) await device.selectConfiguration(1);

    // OUT 엔드포인트 탐색
    let ifaceNumber = null, outEp = null, altSet = 0;
    for (const iface of device.configuration.interfaces) {
        for (const alt of iface.alternates) {
            const ep = alt.endpoints?.find(e => e.direction === 'out');
            if (ep) {
                ifaceNumber = iface.interfaceNumber;
                outEp = ep.endpointNumber;
                altSet = alt.alternateSetting ?? 0;
                break;
            }
        }
        if (ifaceNumber != null) break;
    }
    if (ifaceNumber == null || outEp == null) throw new Error('OUT 엔드포인트를 찾지 못했습니다.');

    await device.claimInterface(ifaceNumber);
    try { await device.selectAlternateInterface(ifaceNumber, altSet); } catch { }

    // 초기화 → 래스터 전송 → 줄피드/컷
    const ESC = 0x1B, GS = 0x1D;
    await device.transferOut(outEp, new Uint8Array([ESC, 0x40])); // Initialize
    const { header, body } = canvasToEscPosRaster(canvas);
    await device.transferOut(outEp, header);
    await device.transferOut(outEp, body);
    await device.transferOut(outEp, new Uint8Array([0x0A, 0x0A])); // LF x2
    try { await device.transferOut(outEp, new Uint8Array([GS, 0x56, 0x00])); } catch { }
}

/* 5) 입력 텍스트 → 캔버스 → WebUSB 래스터 인쇄 */
async function usbPrintCanvasText(text) {
    const cs = getComputedStyle(document.documentElement);
    const fontSizePx = parseInt(cs.getPropertyValue('--fontSizePx')) || 160;
    const lineHeight = parseFloat(cs.getPropertyValue('--leading')) || 1.0;

    const canvas = await renderTextToCanvasBitmap(text, {
        fontFamily: "MyFont",
        fontSizePx,
        lineHeight,
        maxWidthPx: 560,   // 장비폭에 맞춰 조정
        marginX: 8,
        marginY: 8,
        threshold: 190
    });
    await usbPrintRaster(canvas);
}

/* 6) 기존 핸들러 대체: 드라이버 출력(WebUSB) */
async function handleUsbPrint() {
    try {
        const text = (inputEl?.value || '').trim();
        if (!text) { alert('인쇄할 텍스트가 없습니다.'); return; }
        await usbPrintCanvasText(text);
        alert('래스터 전송 완료!');
    } catch (err) {
        console.error(err);
        alert('프린터 전송 중 문제 발생: ' + (err?.message || err));
    }
}

/* =========================
 * OS Print Dialog(브라우저 프린트) 유틸
 * ========================= */
function printViaHiddenFrameFromCanvas(canvas, {
    pageWidthMM = 80,
    marginMM = 0,
    autoRemoveDelay = 2000,
} = {}) {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';
    document.body.appendChild(frame);

    const dataURL = canvas.toDataURL('image/png');
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Print</title>
<style>
  @page { size: ${pageWidthMM}mm auto; margin: ${marginMM}mm; }
  html, body { margin: 0; padding: 0; background: #fff; }
  img { display: block; width: 100%; height: auto; image-rendering: -webkit-optimize-contrast; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <img id="pp" alt="">
  <script>
    (function(){
      const img = document.getElementById('pp');
      img.onload = function () {
        setTimeout(function(){
          window.focus();
          window.print();
        }, 20);
      };
      img.src = ${JSON.stringify(dataURL)};
      window.onafterprint = function(){
        try { parent.postMessage({ __fromPrintFrame: true }, '*'); } catch(e){}
      };
    })();
  </script>
</body>
</html>`;
    frame.srcdoc = html;

    const onMsg = (ev) => {
        if (ev && ev.data && ev.data.__fromPrintFrame) {
            window.removeEventListener('message', onMsg);
            setTimeout(() => { try { frame.remove(); } catch (_) { } }, 0);
        }
    };
    window.addEventListener('message', onMsg);
    setTimeout(() => { try { frame.remove(); } catch (_) { } }, autoRemoveDelay);
}
