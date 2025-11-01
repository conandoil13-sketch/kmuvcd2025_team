(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))p(t);new MutationObserver(t=>{for(const l of t)if(l.type==="childList")for(const o of l.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&p(o)}).observe(document,{childList:!0,subtree:!0});function s(t){const l={};return t.integrity&&(l.integrity=t.integrity),t.referrerPolicy&&(l.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?l.credentials="include":t.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function p(t){if(t.ep)return;t.ep=!0;const l=s(t);fetch(t.href,l)}})();const D=40,q="/kmuvcd2025_team/assets/MyFont.otf",_=/^[A-Za-z0-9\s.,!?_\-@#()\/\[\]&*]/,z={A:"glyphs/a.png",B:"glyphs/b.png",C:"glyphs/c.png",D:"glyphs/d.png",E:"glyphs/e.png",F:"glyphs/f.png",G:"glyphs/g.png",H:"glyphs/h.png",I:"glyphs/i.png",J:"glyphs/j.png",K:"glyphs/k.png",L:"glyphs/l.png",M:"glyphs/m.png",N:"glyphs/n.png",O:"glyphs/o.png",P:"glyphs/p.png",Q:"glyphs/q.png",R:"glyphs/r.png",S:"glyphs/s.png",T:"glyphs/t.png",U:"glyphs/u.png",V:"glyphs/v.png",W:"glyphs/w.png",X:"glyphs/x.png",Y:"glyphs/y.png",Z:"glyphs/z.png",0:"glyphs/0.png",1:"glyphs/1.png",2:"glyphs/2.png",3:"glyphs/3.png",4:"glyphs/4.png",5:"glyphs/5.png",6:"glyphs/6.png",7:"glyphs/7.png",8:"glyphs/8.png",9:"glyphs/9.png","!":"glyphs/exclaim.png","?":"glyphs/question.png",".":"glyphs/period.png",",":"glyphs/comma.png","-":"glyphs/hyphen.png",_:"glyphs/underscore.png","@":"glyphs/at.png","#":"glyphs/hash.png","&":"glyphs/ampersand.png","*":"glyphs/asterisk.png","/":"glyphs/slash.png","(":"glyphs/paren.png",")":"glyphs/paren.png","[":"glyphs/bracket-square.png","]":"glyphs/bracket-square.png"},d=document.getElementById("editor"),v=document.getElementById("adminPanel"),b=document.getElementById("limitInput"),f=document.getElementById("fontSizeInput"),M=document.getElementById("fontSizeLabel"),E=document.getElementById("trackingInput"),L=document.getElementById("leadingInput"),k=document.getElementById("clearBtnTop"),P=document.getElementById("clearBtn"),F=document.getElementById("printOSBtn"),h=document.getElementById("directPrintToggle");let y=D,w=null,N=null,O=!1;function x(e){let r=document.getElementById("typoToast");r||(r=document.createElement("div"),r.id="typoToast",r.style.cssText="position:fixed;left:50%;bottom:28px;transform:translateX(-50%);padding:10px 14px;border-radius:10px;background:rgba(20,20,20,.92);color:#f5f5f5;font:13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial;border:1px solid #2a2a2a;box-shadow:0 6px 24px rgba(0,0,0,.35);opacity:0;pointer-events:none;transition:opacity .18s ease;z-index:9999;white-space:pre-wrap;text-align:center;max-width:min(90vw,680px)",document.body.appendChild(r)),r.textContent=e,requestAnimationFrame(()=>{r.style.opacity="1"}),setTimeout(()=>{r.style.opacity="0"},1400)}async function U(e,r="font/otf"){const s=new Uint8Array(e);let p="";for(let t=0;t<s.length;t++)p+=String.fromCharCode(s[t]);return`data:${r};base64,${btoa(p)}`}async function R(){return w||(w=(async()=>{const e=await fetch(q,{cache:"force-cache"});if(!e.ok)throw new Error("MyFont.otf 로드 실패: "+e.status);const r=await e.arrayBuffer();if(N=await U(r,"font/otf"),!O){const s=new FontFace("MyFont",r);await s.load(),document.fonts.add(s),O=!0}try{await document.fonts.ready}catch{}await new Promise(s=>requestAnimationFrame(()=>requestAnimationFrame(s))),document.body.setAttribute("data-font","ready")})().catch(e=>{throw w=null,e}),w)}const T=(e,r,s)=>Math.max(r,Math.min(s,e)),I=(e,r)=>document.documentElement.style.setProperty(e,r);function B(){return(d.textContent||"").replace(/\r\n?/g,`
`)}function H(){let e=document.getElementById("printFrame");return e||(e=document.createElement("iframe"),e.id="printFrame",e.style.cssText="position:absolute;left:-9999px;width:0;height:0;border:0;",document.body.appendChild(e)),e}function V(e){const r=e.split("?")[0].split("#")[0].split(".").pop().toLowerCase(),s=H(),p=()=>{try{const t=s.contentWindow;setTimeout(()=>{t.focus(),t.print()},60)}catch(t){alert("인쇄 미리보기 호출 실패: "+t.message)}};if(r==="pdf")s.onload=p,s.src=e;else if(["png","jpg","jpeg","gif","webp"].includes(r)){const t=`<!doctype html><html><head><meta charset="utf-8">
<style>@page{size:80mm auto;margin:0}html,body{margin:0}img{display:block;width:72mm;margin:6mm 4mm}</style>
</head><body><img src="${e}" alt=""></body></html>`;s.onload=p,s.src="about:blank",setTimeout(()=>{s.srcdoc=t},0)}else alert("지원하지 않는 인쇄 형식: "+r)}function X(){d.textContent="",d.focus(),b&&(b.value=String(y)),d.addEventListener("beforeinput",o=>{if(o.inputType==="insertParagraph"||o.inputType==="insertLineBreak"){const n=window.getSelection(),i=n&&n.rangeCount?n.getRangeAt(0):null,a=d.textContent||"",c=i?i.toString().length:0;if(a.length-c+1>y){o.preventDefault(),x(`최대 ${y}자까지 입력할 수 있어요.`);return}o.preventDefault(),document.execCommand("insertText",!1,`
`);return}if(typeof o.data=="string"&&o.data.length===1){const n=window.getSelection(),i=n&&n.rangeCount?n.getRangeAt(0):null,a=d.textContent||"",c=i?i.toString().length:0;if(a.length-c+1>y){o.preventDefault(),x(`최대 ${y}자까지 입력할 수 있어요.`);return}_.test(o.data)||(o.preventDefault(),x(`허용된 문자만 입력할 수 있어요.
A–Z, 0–9, 공백, . , ! ? _ - @ # ( ) [ ] / & * % + : ;`))}}),d.addEventListener("paste",o=>{var A;o.preventDefault();const i=(((A=o.clipboardData)==null?void 0:A.getData("text"))||"").replace(/\r\n?/g,`
`);let a="";for(const C of i)(C===`
`||_.test(C))&&(a+=C);const c=window.getSelection();if(!c)return;const g=c.rangeCount?c.getRangeAt(0):null,u=d.textContent||"",m=g?g.toString().length:0;c.deleteFromDocument();const $=Math.max(0,y-(u.length-m)),S=a.slice(0,$);S&&document.execCommand("insertText",!1,S),a.length!==i.length?x("허용된 문자(개행 포함)만 붙여넣을 수 있어요."):S.length||x(`최대 ${y}자까지 입력할 수 있어요.`)});const e=3e3;function r(o,n,i){const a=o.ownerDocument;let c=null;if(a.caretRangeFromPoint)c=a.caretRangeFromPoint(n,i);else if(a.caretPositionFromPoint){const m=a.caretPositionFromPoint(n,i);m&&(c=a.createRange(),c.setStart(m.offsetNode,m.offset),c.collapse(!0))}if(!c)return null;let g=0;const u=a.createTreeWalker(o,NodeFilter.SHOW_TEXT,null);for(;u.nextNode();){const m=u.currentNode;if(m===c.startContainer)return g+=c.startOffset,g;g+=m.nodeValue.length}return null}function s(o,n){const i=r(d,o,n);if(i==null)return;const c=(d.textContent||"")[i];if(!c)return;const g=z[c.toUpperCase()];g&&V(g)}d.addEventListener("dblclick",o=>s(o.clientX,o.clientY));let p=null,t=null;const l=()=>{p&&(clearTimeout(p),p=null),t=null};d.addEventListener("pointerdown",o=>{o.button!==0&&o.pointerType!=="touch"||(t=[o.clientX,o.clientY],l(),p=setTimeout(()=>{var n;(n=o.preventDefault)==null||n.call(o),s(t[0],t[1]),l()},e))},{passive:!0}),["pointerup","pointerleave","pointercancel","scroll"].forEach(o=>d.addEventListener(o,l,{passive:!0}))}function j(){function e(){const t=parseInt((f==null?void 0:f.value)||"160",10),l=T(Number.isFinite(t)?t:160,24,300);I("--fontSizePx",l),M&&(M.textContent=l+"px");try{localStorage.setItem("fontSizePx",String(l))}catch{}}const r=parseInt(localStorage.getItem("fontSizePx")||"160",10);f&&(f.value=Number.isFinite(r)?r:160),e(),f==null||f.addEventListener("input",e),E==null||E.addEventListener("input",()=>I("--tracking",E.value)),L==null||L.addEventListener("input",()=>{const t=T(parseInt(L.value||"100",10),80,200);I("--leading",(t/100).toString())}),b==null||b.addEventListener("change",()=>{const t=parseInt(b.value,10);y=Number.isFinite(t)?T(t,1,200):D});const s=()=>{d.textContent="",d.focus()};k==null||k.addEventListener("click",s),P==null||P.addEventListener("click",s);function p(t){if(!v)return;const l=!v.classList.contains("visible");v.classList.toggle("visible",l),v.setAttribute("aria-hidden",l?"false":"true"),x(`관리자 모드 ${l?"ON":"OFF"}`)}window.addEventListener("keydown",t=>{(t.ctrlKey||t.metaKey)&&t.key==="."&&(t.preventDefault(),p())});try{const t=localStorage.getItem("directPrint")==="1";h&&(h.checked=t)}catch{}h==null||h.addEventListener("change",()=>{try{localStorage.setItem("directPrint",h.checked?"1":"0")}catch{}x(h.checked?"바로 출력: ON":"바로 출력: OFF")})}async function W({pageWidthMM:e=80,printableWidthMM:r=72}={}){await R();const s=N,p=getComputedStyle(document.documentElement),t=parseInt(p.getPropertyValue("--fontSizePx"))||160,l=parseFloat(p.getPropertyValue("--leading"))||1,n=(parseFloat(p.getPropertyValue("--tracking"))||0)/1e3,i=B(),a=document.createElement("iframe");a.setAttribute("aria-hidden","true"),a.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;",document.body.appendChild(a);const c=`<!doctype html><html><head><meta charset="utf-8"><title>Vector Print</title>
<style>
@page { size: ${e}mm auto; margin: 0 }
html, body { margin: 0; padding: 0; background: #fff }
@font-face {
  font-family: "MyFont";
  src: url(${JSON.stringify(s)}) format("opentype");
  font-weight: 400;
  font-style: normal;
}
#wrap {
  width: ${r}mm;
  margin: 0;
  padding: 0;
}
#text {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;

  font-family: "MyFont", system-ui, sans-serif;
  font-size: ${t}px;
  line-height: ${l};
  letter-spacing: ${n}em;

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
      const t = ${JSON.stringify(i)};
      document.getElementById('text').textContent = t;
      setTimeout(function(){ window.focus(); window.print(); }, 10);
      window.onafterprint = function(){ try{ parent.postMessage({__fromPrintFrame:true}, '*'); }catch(e){} };
    })();
  <\/script>
</body></html>`;a.srcdoc=c;function g(u){u&&u.data&&u.data.__fromPrintFrame&&(window.removeEventListener("message",g),setTimeout(()=>{try{a.remove()}catch{}},0))}window.addEventListener("message",g)}const J=(()=>{const e={entries:[],panel:null,open:!1,max:200,origConsoleError:console.error.bind(console)};function r(){if(e.panel)return;const n=document.createElement("div");n.id="bugProbe",n.style.cssText=`
      position:fixed; inset:auto 10px 10px auto; top:56px;
      width:min(560px,92vw); height:min(60vh,560px);
      background:#101114; color:#e8e8e8; border:1px solid #2f2f2f; border-radius:12px;
      z-index:99999; box-shadow:0 18px 60px rgba(0,0,0,.35); display:none; overflow:hidden;
      font:12px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial;`,n.innerHTML=`
      <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid #2a2a2a;background:#15161a;">
        <strong>Bug Report</strong><span id="bpCnt" style="opacity:.7"></span>
        <div style="margin-left:auto;display:flex;gap:6px;">
          <button id="bpCopy" style="padding:4px 8px;border:1px solid #3a3a3a;background:#222;border-radius:6px;color:#eee;cursor:pointer">Copy</button>
          <button id="bpClear" style="padding:4px 8px;border:1px solid #3a3a3a;background:#222;border-radius:6px;color:#eee;cursor:pointer">Clear</button>
          <button id="bpClose" style="padding:4px 8px;border:1px solid #3a3a3a;background:#222;border-radius:6px;color:#eee;cursor:pointer">×</button>
        </div>
      </div>
      <div id="bpList" style="height:calc(100% - 38px);overflow:auto;padding:8px 10px;"></div>`,document.body.appendChild(n),n.querySelector("#bpClose").addEventListener("click",t),n.querySelector("#bpClear").addEventListener("click",()=>{e.entries=[],p()}),n.querySelector("#bpCopy").addEventListener("click",()=>{var a;const i=JSON.stringify({url:location.href,ts:new Date().toISOString(),entries:e.entries},null,2);(a=navigator.clipboard)==null||a.writeText(i).catch(()=>{})}),e.panel=n}function s(n){n.ts=new Date().toISOString(),e.entries.push(n),e.entries.length>e.max&&e.entries.shift(),e.open&&p()}function p(){if(!e.panel)return;const n=e.panel.querySelector("#bpList"),i=e.panel.querySelector("#bpCnt");n.innerHTML="",i.textContent=`${e.entries.length} events`,e.entries.slice().reverse().forEach(a=>{const c=document.createElement("div");c.style.cssText="border:1px solid #2a2a2a;border-radius:10px;padding:8px 10px;margin:8px 0;background:#13151a;",c.innerHTML=`
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="display:inline-block;padding:2px 6px;border-radius:6px;background:#2b2f3a;color:#cbd5ff;">${a.type}</span>
          <code style="white-space:pre-wrap">${l(a.message||"")}</code>
        </div>
        <div style="opacity:.7;margin-top:4px"><time>${a.ts}</time></div>
        ${a.stack?`<pre style="margin:6px 0 0;padding:8px;background:#0f1116;border-radius:8px;white-space:pre-wrap">${l(a.stack)}</pre>`:""}`,n.appendChild(c)})}function t(n){r(),e.open=typeof n=="boolean"?n:!e.open,e.panel.style.display=e.open?"":"none",e.open&&p()}function l(n){return String(n).replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[i])}function o(){window.addEventListener("error",n=>s({type:"error",message:n.message||"Error",stack:n.error&&n.error.stack?String(n.error.stack):null}),!0),window.addEventListener("unhandledrejection",n=>{const i=n.reason;s({type:"promise",message:i&&i.message?i.message:String(i),stack:i&&i.stack?String(i.stack):null})},!0),console.error=(...n)=>{s({type:"console",message:n.map(i=>typeof i=="string"?i:JSON.stringify(i)).join(" ")}),e.origConsoleError(...n)}}return{init:o,toggle:t,addEntry:s}})();async function Y(){J.init();try{await R()}catch(e){console.error(e)}X(),j(),F==null||F.addEventListener("click",async()=>{if(!B().trim()){alert("인쇄할 텍스트가 없습니다.");return}await W({pageWidthMM:80,printableWidthMM:200})})}document.addEventListener("DOMContentLoaded",Y);
