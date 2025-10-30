(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const p of s.addedNodes)p.tagName==="LINK"&&p.rel==="modulepreload"&&o(p)}).observe(document,{childList:!0,subtree:!0});function a(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(n){if(n.ep)return;n.ep=!0;const s=a(n);fetch(n.href,s)}})();const k={w:2560,h:1440},N=40,b=160,O="A–Z, 0–9, 공백, . , ! ? _ - @ # ( ) [ ] / & * % + : ;",L={A:"glyphs/a.png",B:"glyphs/b.png",C:"glyphs/c.png",D:"glyphs/d.png",E:"glyphs/e.png",F:"glyphs/f.png",G:"glyphs/g.png",H:"glyphs/h.png",I:"glyphs/i.png",J:"glyphs/j.png",K:"glyphs/k.png",L:"glyphs/l.png",M:"glyphs/m.png",N:"glyphs/n.png",O:"glyphs/o.png",P:"glyphs/p.png",Q:"glyphs/q.png",R:"glyphs/r.png",S:"glyphs/s.png",T:"glyphs/t.png",U:"glyphs/u.png",V:"glyphs/v.png",W:"glyphs/w.png",X:"glyphs/x.png",Y:"glyphs/y.png",Z:"glyphs/z.png",0:"glyphs/0.png",1:"glyphs/1.png",2:"glyphs/2.png",3:"glyphs/3.png",4:"glyphs/4.png",5:"glyphs/5.png",6:"glyphs/6.png",7:"glyphs/7.png",8:"glyphs/8.png",9:"glyphs/9.png","!":"glyphs/exclaim.png","?":"glyphs/question.png",".":"glyphs/period.png",",":"glyphs/comma.png","-":"glyphs/hyphen.png",_:"glyphs/underscore.png","@":"glyphs/at.png","#":"glyphs/hash.png"};Object.assign(L,{"&":"glyphs/ampersand.png","*":"glyphs/asterisk.png","/":"glyphs/slash.png","(":"glyphs/paren.png",")":"glyphs/paren.png","[":"glyphs/bracket-square.png","]":"glyphs/bracket-square.png"});const P=/^[A-Za-z0-9\s.,!?_\-@#()\/\[\]&*%+:;]$/,M=[],d=e=>document.querySelector(e),i=d("#textInput"),$=d("#limitInput"),H=d("#trackingInput"),q=d("#leadingInput"),T=d("#output"),G=d("#charCount"),W=d("#charLimit"),K=d("#linkedCount"),Y=d("#unsupportedCount"),z=d("#supportedList"),J=d("#clearBtn"),D=d("#printBtn"),S=d("#fontSizeInput"),B=d("#fontSizeLabel");let U=null;function v(e){let t=document.getElementById("typoToast");t||(t=document.createElement("div"),t.id="typoToast",t.style.cssText=`
      position:fixed; left:50%; bottom:28px; transform:translateX(-50%);
      padding:10px 14px; border-radius:10px;
      background:rgba(20,20,20,.92); color:#f5f5f5; font:13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial;
      border:1px solid #2a2a2a; box-shadow:0 6px 24px rgba(0,0,0,.35);
      opacity:0; pointer-events:none; transition:opacity .18s ease;
      z-index:9999; white-space:pre-wrap; text-align:center; max-width:min(90vw,680px);
    `,document.body.appendChild(t)),t.textContent=e,requestAnimationFrame(()=>{t.style.opacity="1"}),clearTimeout(U),U=setTimeout(()=>{t.style.opacity="0"},1400)}let m=N;function Q(){if(i.maxLength=m,W.textContent=m,tt(),i.addEventListener("input",et),$.addEventListener("change",it),H.addEventListener("input",rt),q.addEventListener("input",lt),J.addEventListener("click",()=>{i.value="",C("")}),D&&D.addEventListener("click",gt),i.addEventListener("beforeinput",t=>{if(typeof t.data=="string"&&t.data.length===1){if((i.selectionStart!=null&&i.selectionEnd!=null?i.value.length-(i.selectionEnd-i.selectionStart)+1:i.value.length+1)>m){t.preventDefault(),v(`최대 ${m}자까지 입력할 수 있어요.`);return}P.test(t.data)||(t.preventDefault(),v(`허용된 문자만 입력할 수 있어요.
`+O))}}),i.addEventListener("paste",t=>{t.preventDefault();const a=t.clipboardData||window.clipboardData,o=a&&a.getData("text")||"";let n="";for(const l of o)P.test(l)&&(n+=l);const s=i.selectionStart??i.value.length,p=i.selectionEnd??i.value.length,r=i.value.length-(p-s),y=Math.max(0,m-r),g=n.slice(0,y);g.length&&(i.setRangeText(g,s,p,"end"),i.dispatchEvent(new Event("input",{bubbles:!0}))),n.length!==o.length?v(`허용된 문자만 붙여넣을 수 있어요.
`+O):g.length||v(`최대 ${m}자까지 입력할 수 있어요.`)}),S){const t=parseInt(localStorage.getItem("fontSizePx")||String(b),10);S.value=Number.isFinite(t)?t:b,R(),S.addEventListener("input",R)}else document.documentElement.style.setProperty("--fontSizePx",b);const e=document.getElementById("printOSBtn");e&&e.addEventListener("click",async()=>{try{const t=((i==null?void 0:i.value)||"").trim();if(!t){alert("인쇄할 텍스트가 없습니다.");return}const a=getComputedStyle(document.documentElement),o=parseInt(a.getPropertyValue("--fontSizePx"))||160,n=parseFloat(a.getPropertyValue("--leading"))||1,s=await j(t,{fontFamily:"MyFont",fontSizePx:o,lineHeight:n,maxWidthPx:560,marginX:8,marginY:8,threshold:190});ut(s,{pageWidthMM:80,marginMM:0})}catch(t){console.error(t),alert("미리보기 생성 중 오류: "+((t==null?void 0:t.message)||t))}}),_(),window.addEventListener("resize",_),C(i.value)}document.addEventListener("DOMContentLoaded",Q);function tt(){z.innerHTML="",Object.keys(L).sort().forEach(t=>{const a=document.createElement("li");a.textContent=t+" → "+L[t],z.appendChild(a)})}function et(e){C(e.target.value)}function C(e){G.textContent=e.length,T.innerHTML="";let t=0,a=0;for(const o of e){const n=o.toUpperCase(),s=P.test(o);if(L[n]){const r=document.createElement("a");r.href="#",r.className="char",r.textContent=o,r.setAttribute("role","button"),r.setAttribute("aria-label",`${o} 인쇄`),r.addEventListener("click",y=>{y.preventDefault(),nt(n)}),T.appendChild(r),t++}else{const r=document.createElement("span");r.className="char"+(s||o===" "?"":" unsupported"),r.textContent=o===" "?" ":o,T.appendChild(r),!s&&o!==" "&&a++}}K.textContent=t,Y.textContent=a}function nt(e){const t=L[e];if(!t){v(`인쇄 파일 없음: ${e}`);return}at(t)}function ot(){let e=document.getElementById("printFrame");return e||(e=document.createElement("iframe"),e.id="printFrame",e.style.position="absolute",e.style.left="-9999px",e.style.width="0",e.style.height="0",e.style.border="0",document.body.appendChild(e)),e}function at(e){const t=e.split("?")[0].split("#")[0].split(".").pop().toLowerCase(),a=ot(),o=()=>{try{const n=a.contentWindow;setTimeout(()=>{n.focus(),n.print()},80)}catch(n){alert("인쇄 미리보기 호출 실패: "+n.message)}};if(t==="pdf")a.onload=o,a.src=e;else if(["png","jpg","jpeg","gif","webp"].includes(t)){const n=`
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
  <img src="${e}" alt="">
</body>
</html>`;a.onload=o,a.src="about:blank",setTimeout(()=>{a.srcdoc=n},0)}else t==="txt"?fetch(e).then(n=>n.text()).then(n=>{const s=`
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
<pre>${st(n)}</pre>
</body>
</html>`;a.onload=o,a.src="about:blank",setTimeout(()=>{a.srcdoc=s},0)}).catch(n=>alert("텍스트 로드 실패: "+n.message)):alert("지원하지 않는 인쇄 형식: "+t)}function st(e){return e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function it(){const e=parseInt($.value,10);m=Number.isFinite(e)?Math.max(1,Math.min(200,e)):N,i.maxLength=m,W.textContent=m,i.value.length>m&&(i.value=i.value.slice(0,m),C(i.value))}function rt(){document.documentElement.style.setProperty("--tracking",H.value)}function lt(){const e=Math.max(50,Math.min(300,parseInt(q.value||"100",10)));document.documentElement.style.setProperty("--leading",(e/100).toString())}function R(){const e=S?parseInt(S.value||String(b),10):b,t=Math.max(24,Math.min(300,Number.isFinite(e)?e:b));document.documentElement.style.setProperty("--fontSizePx",t),B&&(B.textContent=t+"px");try{localStorage.setItem("fontSizePx",String(t))}catch{}}function _(){const e=window.innerWidth,t=window.innerHeight,a=e/k.w,o=(t-64)/k.h,n=Math.min(a,o);document.documentElement.style.setProperty("--scale",n.toString())}async function j(e,{fontFamily:t="MyFont",fontSizePx:a=160,lineHeight:o=1,maxWidthPx:n=560,marginX:s=8,marginY:p=8,threshold:r=190}={}){const g=String(e??"").split(`
`);try{await document.fonts.load(`${a}px "${t}"`)}catch{}const l=document.createElement("canvas"),c=l.getContext("2d",{willReadFrequently:!0});c.font=`${a}px "${t}", system-ui, sans-serif`,c.textBaseline="alphabetic";let u=0;for(const h of g){const F=c.measureText(h).width;u=Math.max(u,Math.ceil(F))}const x=Math.min(u,n-s*2),f=Math.ceil(a*o),E=Math.max(f,f*g.length);l.width=Math.min(n,Math.max(1,x+s*2)),l.height=Math.max(1,E+p*2),c.fillStyle="#fff",c.fillRect(0,0,l.width,l.height),c.fillStyle="#000";let A=p+a;for(const h of g)c.fillText(h,s,A),A+=f;const I=c.getImageData(0,0,l.width,l.height),w=I.data;for(let h=0;h<w.length;h+=4){const F=w[h],V=w[h+1],X=w[h+2],Z=.299*F+.587*V+.114*X<r?0:255;w[h]=w[h+1]=w[h+2]=Z,w[h+3]=255}return c.putImageData(I,0,0),l}function ct(e){const t=e.width,a=e.height,o=Math.ceil(t/8),n=new Uint8Array([29,118,48,0,o&255,o>>8&255,a&255,a>>8&255]),p=e.getContext("2d",{willReadFrequently:!0}).getImageData(0,0,t,a).data,r=new Uint8Array(o*a);let y=0;for(let g=0;g<a;g++)for(let l=0;l<o;l++){let c=0;for(let u=0;u<8;u++){const x=l*8+u;let f=0;if(x<t){const E=(g*t+x)*4;f=p[E]===0?1:0}c|=f<<7-u}r[y++]=c}return{header:n,body:r}}async function pt(e){var l,c;if(!("usb"in navigator))throw new Error("이 브라우저는 WebUSB를 지원하지 않습니다. 데스크톱 Chrome + HTTPS를 사용해주세요.");const t=[{classCode:7},{classCode:255}],a=Array.isArray(M)&&M.length?M:t,o=await navigator.usb.requestDevice({filters:a});await o.open(),o.configuration==null&&await o.selectConfiguration(1);let n=null,s=null;for(const u of o.configuration.interfaces){for(const x of u.alternates){const f=(l=x.endpoints)==null?void 0:l.find(E=>E.direction==="out");if(f){n=u.interfaceNumber,s=f.endpointNumber,(((c=u.alternate)==null?void 0:c.alternateSetting)??0)!==(x.alternateSetting??0)&&await o.selectAlternateInterface(u.interfaceNumber,x.alternateSetting??0);break}}if(n!=null)break}if(n==null||s==null)throw new Error("OUT 엔드포인트를 찾지 못했습니다.");await o.claimInterface(n);const p=27,r=29;await o.transferOut(s,new Uint8Array([p,64]));const{header:y,body:g}=ct(e);await o.transferOut(s,y),await o.transferOut(s,g),await o.transferOut(s,new Uint8Array([10,10]));try{await o.transferOut(s,new Uint8Array([r,86,0]))}catch{}}async function dt(e){const t=getComputedStyle(document.documentElement),a=parseInt(t.getPropertyValue("--fontSizePx"))||160,o=parseFloat(t.getPropertyValue("--leading"))||1,n=await j(e,{fontFamily:"MyFont",fontSizePx:a,lineHeight:o,maxWidthPx:560,marginX:8,marginY:8,threshold:190});await pt(n)}async function gt(){try{const e=((i==null?void 0:i.value)||"").trim();if(!e){alert("인쇄할 텍스트가 없습니다.");return}await dt(e),alert("래스터 전송 완료!")}catch(e){console.error(e),alert("프린터 전송 중 문제 발생: "+((e==null?void 0:e.message)||e))}}function ut(e,{pageWidthMM:t=80,marginMM:a=0}={}){const o=window.open("","_blank","noopener,noreferrer,width=720,height=900");if(!o){alert("팝업이 차단되었습니다. 브라우저 팝업 허용을 켜주세요.");return}const n=e.toDataURL("image/png");o.document.open(),o.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Print Preview</title>
<style>
  @page { size: ${t}mm auto; margin: ${a}mm; }
  html, body { margin:0; padding:0; background:#fff; }
  img { display:block; width:100%; height:auto; image-rendering: -webkit-optimize-contrast; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <img id="pp" alt="preview" src="${n}">
  <script>
    // 이미지 로드 후 인쇄
    const img = document.getElementById('pp');
    img.onload = () => { setTimeout(()=>window.print(), 20); };
    // 인쇄 창 자동 닫기 원하면 아래 주석 해제
    // window.onafterprint = () => window.close();
  <\/script>
</body>
</html>`),o.document.close()}
