/* =========================
 * Config
 * ========================= */
const BASE_CANVAS = { w: 2560, h: 1440 }; // 27" iMac 기준 캔버스
const DEFAULT_MAX_CHARS = 40;
const DEFAULT_FONT_SIZE = 160; // 글자 크기 슬라이더 기본값(px)

// 입력 허용 안내(토스트에 노출될 문자열)
const ALLOWED_HINT = "A–Z, 0–9, 공백, . , ! ? _ - @ # ( ) [ ] / & * ";

// 링크 매핑: 문자 → 하위페이지 경로
// 필요에 따라 추가/수정하세요. (대소문자 모두 커버)
const LETTER_LINKS = {
    // 알파벳
    "A": "glyphs/a.html", "B": "glyphs/b.html", "C": "glyphs/c.html",
    "D": "glyphs/d.html", "E": "glyphs/e.html", "F": "glyphs/f.html",
    "G": "glyphs/g.html", "H": "glyphs/h.html", "I": "glyphs/i.html",
    "J": "glyphs/j.html", "K": "glyphs/k.html", "L": "glyphs/l.html",
    "M": "glyphs/m.html", "N": "glyphs/n.html", "O": "glyphs/o.html",
    "P": "glyphs/p.html", "Q": "glyphs/q.html", "R": "glyphs/r.html",
    "S": "glyphs/s.html", "T": "glyphs/t.html", "U": "glyphs/u.html",
    "V": "glyphs/v.html", "W": "glyphs/w.html", "X": "glyphs/x.html",
    "Y": "glyphs/y.html", "Z": "glyphs/z.html",
    // 숫자
    "0": "glyphs/0.html", "1": "glyphs/1.html", "2": "glyphs/2.html",
    "3": "glyphs/3.html", "4": "glyphs/4.html", "5": "glyphs/5.html",
    "6": "glyphs/6.html", "7": "glyphs/7.html", "8": "glyphs/8.html",
    "9": "glyphs/9.html",
    // 특수문자 예시
    "!": "glyphs/exclaim.html",
    "?": "glyphs/question.html",
    ".": "glyphs/period.html",
    ",": "glyphs/comma.html",
    "-": "glyphs/hyphen.html",
    "_": "glyphs/underscore.html",
    "@": "glyphs/at.html",
    "#": "glyphs/hash.html"
};

// ▶ 추가 매핑 (& * / ( ) [ ] : 닫는 괄호는 여는 괄호와 동일 페이지)
Object.assign(LETTER_LINKS, {
    "&": "glyphs/ampersand.html",
    "*": "glyphs/asterisk.html",
    "/": "glyphs/slash.html",
    "(": "glyphs/paren.html",
    ")": "glyphs/paren.html",
    "[": "glyphs/bracket-square.html",
    "]": "glyphs/bracket-square.html"
});

// 어떤 문자를 “지원 문자”로 취급할지 (링크 유무와 별개)
// ▶ 허용 문자 전체: 영숫자, 공백, . , ! ? _ - @ # ( ) [ ] / & * % + : ;
const SUPPORTED_CHAR_REGEX = /^[A-Za-z0-9\s.,!?_\-@#()/\[\]&*]$/;

// WebUSB(vendor/product) 필터(예시). 실제 프린터로 교체 필요.
const USB_FILTERS = [
    // { vendorId: 0x04b8, productId: 0x0e15 }, // 예시
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
const printBtn = $("#printBtn");

// ★ 글자 크기 슬라이더 요소 추가
const fontSizeEl = $("#fontSizeInput");
const fontSizeLabelEl = $("#fontSizeLabel");

/* =========================
 * Toast (임시 알림)
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
    // 초기 제한값 동기화
    inputEl.maxLength = MAX_CHARS;
    charLimitEl.textContent = MAX_CHARS;

    // 지원 문자 리스트 표시 (LETTER_LINKS 키를 기준으로)
    renderSupportedList();

    // 이벤트 바인딩
    inputEl.addEventListener("input", handleInput);
    limitEl.addEventListener("change", handleLimitChange);
    trackingEl.addEventListener("input", handleTrackingChange);
    leadingEl.addEventListener("input", handleLeadingChange);
    clearBtn.addEventListener("click", () => { inputEl.value = ""; renderText(""); });
    printBtn.addEventListener("click", handleUsbPrint);

    // ★ 허용 외 문자는 "입력 단계에서" 차단 (타이핑)
    inputEl.addEventListener("beforeinput", (ev) => {
        // 조합 입력/삭제/붙여넣기 등은 제외하고 단일 문자만 검사
        if (typeof ev.data === "string" && ev.data.length === 1) {
            // 길이 초과 사전 차단(붙여넣기 외)
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

    // ★ 붙여넣기 전처리: 허용 문자만 남기고, 남은 자리만큼만 삽입
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
            // 수동 트리거로 렌더 갱신
            inputEl.dispatchEvent(new Event("input", { bubbles: true }));
        }

        if (filtered.length !== text.length) {
            showToast("허용된 문자만 붙여넣을 수 있어요.\n" + ALLOWED_HINT);
        } else if (!toInsert.length) {
            showToast(`최대 ${MAX_CHARS}자까지 입력할 수 있어요.`);
        }
    });

    // ★ 폰트 크기 초기화 & 이벤트 바인딩
    if (fontSizeEl) {
        const savedFontSize = parseInt(localStorage.getItem("fontSizePx") || String(DEFAULT_FONT_SIZE), 10);
        fontSizeEl.value = isFinite(savedFontSize) ? savedFontSize : DEFAULT_FONT_SIZE;
        handleFontSizeChange(); // 라벨/변수 동기화
        fontSizeEl.addEventListener("input", handleFontSizeChange);
    } else {
        // 슬라이더가 없어도 기본값을 변수에 세팅
        document.documentElement.style.setProperty("--fontSizePx", DEFAULT_FONT_SIZE);
    }

    // 초기 스케일 적용 & 리사이즈 반영
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
    const keys = Object.keys(LETTER_LINKS);
    keys.sort().forEach(k => {
        const li = document.createElement("li");
        li.textContent = k + " → " + LETTER_LINKS[k];
        supportedListEl.appendChild(li);
    });
}

function handleInput(e) {
    const value = e.target.value;
    renderText(value);
}

function renderText(str) {
    // 글자수 카운트
    charCountEl.textContent = str.length;

    // 문자별 분해 -> 링크/일반/미지원 표시
    outputEl.innerHTML = "";
    let linked = 0;
    let unsupported = 0;

    for (const ch of str) {
        const upper = ch.toUpperCase();
        const isSupported = SUPPORTED_CHAR_REGEX.test(ch);
        const link = LETTER_LINKS[upper]; // 링크가 있을 때만 a 태그

        if (link) {
            const a = document.createElement("a");
            a.href = link;
            a.target = "_self";
            a.rel = "noopener";
            a.className = "char";
            a.textContent = ch;
            a.setAttribute("aria-label", `${ch} 글리프 설명 페이지로 이동`);
            outputEl.appendChild(a);
            linked++;
        } else {
            const span = document.createElement("span");
            span.className = "char" + (isSupported || ch === " " ? "" : " unsupported");
            // 공백은 줄바꿈 방지용 nbsp로
            span.textContent = ch === " " ? "\u00A0" : ch;
            outputEl.appendChild(span);
            if (!isSupported && ch !== " ") unsupported++;
        }
    }

    linkedCountEl.textContent = linked;
    unsupportedCountEl.textContent = unsupported;
}

/* =========================
 * Controls
 * ========================= */
function handleLimitChange() {
    const n = parseInt(limitEl.value, 10);
    MAX_CHARS = isFinite(n) ? Math.max(1, Math.min(200, n)) : DEFAULT_MAX_CHARS;
    inputEl.maxLength = MAX_CHARS;
    charLimitEl.textContent = MAX_CHARS;

    // 길이 초과시 자동 컷
    if (inputEl.value.length > MAX_CHARS) {
        inputEl.value = inputEl.value.slice(0, MAX_CHARS);
        renderText(inputEl.value);
    }
}

function handleTrackingChange() {
    // 1000단위 기준 (letter-spacing = (value * 1em / 1000))
    document.documentElement.style.setProperty("--tracking", trackingEl.value);
}

function handleLeadingChange() {
    const v = Math.max(50, Math.min(300, parseInt(leadingEl.value || "100", 10)));
    document.documentElement.style.setProperty("--leading", (v / 100).toString());
}

// ★ 글자 크기 슬라이더 핸들러
function handleFontSizeChange() {
    const raw = fontSizeEl ? parseInt(fontSizeEl.value || String(DEFAULT_FONT_SIZE), 10) : DEFAULT_FONT_SIZE;
    const v = Math.max(24, Math.min(300, isFinite(raw) ? raw : DEFAULT_FONT_SIZE)); // 24~300px 가드
    document.documentElement.style.setProperty("--fontSizePx", v);
    if (fontSizeLabelEl) fontSizeLabelEl.textContent = v + "px";
    try { localStorage.setItem("fontSizePx", String(v)); } catch (e) { }
}

/* =========================
 * Autoscale (27" 기준 → 현재 뷰에 맞춤)
 * ========================= */
function autoScale() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sx = vw / BASE_CANVAS.w;
    const sy = (vh - 64) / BASE_CANVAS.h; // 상단바 고려
    const scale = Math.min(sx, sy);
    document.documentElement.style.setProperty("--scale", scale.toString());
}

/* =========================
 * WebUSB Thermal Print (ESC/POS 예시)
 * ========================= */
async function handleUsbPrint() {
    try {
        if (!("usb" in navigator)) {
            alert("이 브라우저는 WebUSB를 지원하지 않습니다. 데스크톱 Chrome + HTTPS를 사용해주세요.");
            return;
        }

        // 사용자 제스처로 장치 선택
        const device = await navigator.usb.requestDevice({ filters: USB_FILTERS.length ? USB_FILTERS : undefined });
        await device.open();
        if (device.configuration === null) {
            await device.selectConfiguration(1);
        }
        // 일반적으로 인터페이스 0번이 프린터이나 기기마다 다릅니다.
        await device.claimInterface(0);

        // 간단한 ESC/POS 인쇄 예시 (텍스트 + 라인피드)
        const encoder = new TextEncoder();
        const ESC = 0x1B, GS = 0x1D;

        const bytes = [
            ESC, 0x40,                   // Initialize
            ESC, 0x4D, 0x00,             // Font A
            ESC, 0x21, 0x00,             // Normal mode
            ...encoder.encode("Typo Archive — Live Glyph Output\n"),
            ...encoder.encode("------------------------------\n"),
            ...encoder.encode(inputEl.value + "\n\n"),
            GS, 0x56, 0x00               // Full cut (기기에 따라 무시될 수 있음)
        ];

        // 일부 장치는 endpoint 번호가 1 또는 2일 수 있음. 필요하면 바꾸세요!
        await device.transferOut(1, new Uint8Array(bytes));
        alert("전송 완료! (모델에 따라 커맨드 수정 필요)");
    } catch (err) {
        console.error(err);
        alert("프린터 전송 중 문제 발생: " + err.message);
    }
}
// 네 입력박스에서 텍스트만 뽑아 인쇄 영역에 넣고 OS 인쇄창 호출
document.getElementById('printOSBtn').addEventListener('click', () => {
    const text = (document.querySelector('#textInput')?.value || '').trim();
    if (!text) { alert('인쇄할 텍스트가 없습니다.'); return; }

    // 필요 시 전/후 머리말/꼬리말 넣기
    const ticket = [
        'Typo Archive',
        '------------------------------',
        text,
        ''
    ].join('\n');

    const area = document.getElementById('printArea');
    area.textContent = ticket;

    // 약간의 렌더 타임 후 인쇄
    requestAnimationFrame(() => window.print());
});
