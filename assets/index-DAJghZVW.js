(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))o(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const d of s.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&o(d)}).observe(document,{childList:!0,subtree:!0});function a(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerPolicy&&(s.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?s.credentials="include":n.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(n){if(n.ep)return;n.ep=!0;const s=a(n);fetch(n.href,s)}})();const N={w:2560,h:1440},Z=40,L=160,$="A–Z, 0–9, 공백, . , ! ? _ - @ # ( ) [ ] / & * % + : ;",T={A:"glyphs/a.png",B:"glyphs/b.png",C:"glyphs/c.png",D:"glyphs/d.png",E:"glyphs/e.png",F:"glyphs/f.png",G:"glyphs/g.png",H:"glyphs/h.png",I:"glyphs/i.png",J:"glyphs/j.png",K:"glyphs/k.png",L:"glyphs/l.png",M:"glyphs/m.png",N:"glyphs/n.png",O:"glyphs/o.png",P:"glyphs/p.png",Q:"glyphs/q.png",R:"glyphs/r.png",S:"glyphs/s.png",T:"glyphs/t.png",U:"glyphs/u.png",V:"glyphs/v.png",W:"glyphs/w.png",X:"glyphs/x.png",Y:"glyphs/y.png",Z:"glyphs/z.png",0:"glyphs/0.png",1:"glyphs/1.png",2:"glyphs/2.png",3:"glyphs/3.png",4:"glyphs/4.png",5:"glyphs/5.png",6:"glyphs/6.png",7:"glyphs/7.png",8:"glyphs/8.png",9:"glyphs/9.png","!":"glyphs/exclaim.png","?":"glyphs/question.png",".":"glyphs/period.png",",":"glyphs/comma.png","-":"glyphs/hyphen.png",_:"glyphs/underscore.png","@":"glyphs/at.png","#":"glyphs/hash.png"};Object.assign(T,{"&":"glyphs/ampersand.png","*":"glyphs/asterisk.png","/":"glyphs/slash.png","(":"glyphs/paren.png",")":"glyphs/paren.png","[":"glyphs/bracket-square.png","]":"glyphs/bracket-square.png"});const _=/^[A-Za-z0-9\s.,!?_\-@#()\/\[\]&*%+:;]$/,k=[],g=e=>document.querySelector(e),i=g("#textInput"),G=g("#limitInput"),J=g("#trackingInput"),K=g("#leadingInput"),I=g("#output"),at=g("#charCount"),Y=g("#charLimit"),st=g("#linkedCount"),it=g("#unsupportedCount"),H=g("#supportedList"),rt=g("#clearBtn"),q=g("#printBtn"),F=g("#fontSizeInput"),V=g("#fontSizeLabel");let W=null;function C(e){let t=document.getElementById("typoToast");t||(t=document.createElement("div"),t.id="typoToast",t.style.cssText=`
      position:fixed; left:50%; bottom:28px; transform:translateX(-50%);
      padding:10px 14px; border-radius:10px;
      background:rgba(20,20,20,.92); color:#f5f5f5; font:13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial;
      border:1px solid #2a2a2a; box-shadow:0 6px 24px rgba(0,0,0,.35);
      opacity:0; pointer-events:none; transition:opacity .18s ease;
      z-index:9999; white-space:pre-wrap; text-align:center; max-width:min(90vw,680px);
    `,document.body.appendChild(t)),t.textContent=e,requestAnimationFrame(()=>{t.style.opacity="1"}),clearTimeout(W),W=setTimeout(()=>{t.style.opacity="0"},1400)}let m=Z;function lt(){if(i.maxLength=m,Y.textContent=m,ct(),i.addEventListener("input",pt),G.addEventListener("change",ht),J.addEventListener("input",yt),K.addEventListener("input",ft),rt.addEventListener("click",()=>{i.value="",P("")}),q&&q.addEventListener("click",vt),i.addEventListener("beforeinput",t=>{if(typeof t.data=="string"&&t.data.length===1){if((i.selectionStart!=null&&i.selectionEnd!=null?i.value.length-(i.selectionEnd-i.selectionStart)+1:i.value.length+1)>m){t.preventDefault(),C(`최대 ${m}자까지 입력할 수 있어요.`);return}_.test(t.data)||(t.preventDefault(),C(`허용된 문자만 입력할 수 있어요.
`+$))}}),i.addEventListener("paste",t=>{t.preventDefault();const a=t.clipboardData||window.clipboardData,o=a&&a.getData("text")||"";let n="";for(const l of o)_.test(l)&&(n+=l);const s=i.selectionStart??i.value.length,d=i.selectionEnd??i.value.length,r=i.value.length-(d-s),c=Math.max(0,m-r),u=n.slice(0,c);u.length&&(i.setRangeText(u,s,d,"end"),i.dispatchEvent(new Event("input",{bubbles:!0}))),n.length!==o.length?C(`허용된 문자만 붙여넣을 수 있어요.
`+$):u.length||C(`최대 ${m}자까지 입력할 수 있어요.`)}),F){const t=parseInt(localStorage.getItem("fontSizePx")||String(L),10);F.value=Number.isFinite(t)?t:L,j(),F.addEventListener("input",j)}else document.documentElement.style.setProperty("--fontSizePx",L);const e=document.getElementById("printOSBtn");e&&e.addEventListener("click",async()=>{try{const t=((i==null?void 0:i.value)||"").trim();if(!t){alert("인쇄할 텍스트가 없습니다.");return}const a=getComputedStyle(document.documentElement),o=parseInt(a.getPropertyValue("--fontSizePx"))||160,n=parseFloat(a.getPropertyValue("--leading"))||1,s=await Q(t,{fontFamily:"MyFont",fontSizePx:o,lineHeight:n,maxWidthPx:576,marginX:8,marginY:8,threshold:190});St(s,{pageWidthMM:80,marginMM:0})}catch(t){console.error(t),alert("미리보기 생성 중 오류: "+((t==null?void 0:t.message)||t))}}),X(),window.addEventListener("resize",X),P(i.value)}document.addEventListener("DOMContentLoaded",lt);function ct(){H.innerHTML="",Object.keys(T).sort().forEach(t=>{const a=document.createElement("li");a.textContent=t+" → "+T[t],H.appendChild(a)})}function pt(e){P(e.target.value)}function P(e){at.textContent=e.length,I.innerHTML="";let t=0,a=0;for(const o of e){const n=o.toUpperCase(),s=_.test(o);if(T[n]){const r=document.createElement("a");r.href="#",r.className="char",r.textContent=o,r.setAttribute("role","button"),r.setAttribute("aria-label",`${o} 인쇄`),r.addEventListener("click",c=>{c.preventDefault(),dt(n)}),I.appendChild(r),t++}else{const r=document.createElement("span");r.className="char"+(s||o===" "?"":" unsupported"),r.textContent=o===" "?" ":o,I.appendChild(r),!s&&o!==" "&&a++}}st.textContent=t,it.textContent=a}function dt(e){const t=T[e];if(!t){C(`인쇄 파일 없음: ${e}`);return}gt(t)}function ut(){let e=document.getElementById("printFrame");return e||(e=document.createElement("iframe"),e.id="printFrame",e.style.position="absolute",e.style.left="-9999px",e.style.width="0",e.style.height="0",e.style.border="0",document.body.appendChild(e)),e}function gt(e){const t=e.split("?")[0].split("#")[0].split(".").pop().toLowerCase(),a=ut(),o=()=>{try{const n=a.contentWindow;setTimeout(()=>{n.focus(),n.print()},80)}catch(n){alert("인쇄 미리보기 호출 실패: "+n.message)}};if(t==="pdf")a.onload=o,a.src=e;else if(["png","jpg","jpeg","gif","webp"].includes(t)){const n=`
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
<pre>${mt(n)}</pre>
</body>
</html>`;a.onload=o,a.src="about:blank",setTimeout(()=>{a.srcdoc=s},0)}).catch(n=>alert("텍스트 로드 실패: "+n.message)):alert("지원하지 않는 인쇄 형식: "+t)}function mt(e){return e.replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function ht(){const e=parseInt(G.value,10);m=Number.isFinite(e)?Math.max(1,Math.min(200,e)):Z,i.maxLength=m,Y.textContent=m,i.value.length>m&&(i.value=i.value.slice(0,m),P(i.value))}function yt(){document.documentElement.style.setProperty("--tracking",J.value)}function ft(){const e=Math.max(50,Math.min(300,parseInt(K.value||"100",10)));document.documentElement.style.setProperty("--leading",(e/100).toString())}function j(){const e=F?parseInt(F.value||String(L),10):L,t=Math.max(24,Math.min(300,Number.isFinite(e)?e:L));document.documentElement.style.setProperty("--fontSizePx",t),V&&(V.textContent=t+"px");try{localStorage.setItem("fontSizePx",String(t))}catch{}}function X(){const e=window.innerWidth,t=window.innerHeight,a=e/N.w,o=(t-64)/N.h,n=Math.min(a,o);document.documentElement.style.setProperty("--scale",n.toString())}async function xt(e="MyFont",t=160){const a=Math.max(1,window.devicePixelRatio||1),o=async s=>{try{await document.fonts.load(`normal ${Math.round(s)}px "${e}"`)}catch{}};await Promise.all([o(t),o(t*a),o(1),o(16),o(48)]);try{await document.fonts.ready}catch{}const n=document.createElement("span");n.textContent="Aa가각123!?",n.style.cssText=`
    position:absolute;left:-9999px;top:-9999px;
    font:${t}px "${e}", system-ui, sans-serif;
    white-space:nowrap; user-select:none;`,document.body.appendChild(n),await new Promise(s=>requestAnimationFrame(()=>requestAnimationFrame(s)));try{n.remove()}catch{}}async function Q(e,{fontFamily:t="MyFont",fontSizePx:a=160,lineHeight:o=1,maxWidthPx:n=576,marginX:s=8,marginY:d=8,threshold:r=190}={}){const c=Math.max(1,window.devicePixelRatio||1);await xt(t,a);const u=document.createElement("canvas"),l=u.getContext("2d",{willReadFrequently:!0}),E=getComputedStyle(document.documentElement),h=parseFloat(E.getPropertyValue("--tracking"))||0,f=a*h/1e3,x=`${a*c}px "${t}", system-ui, sans-serif`;l.font=x;const v=String(e??"").split(/(\s+)/),A=[],tt=n-s*2,et=p=>{if(!p)return 0;const y=l.measureText(p).width/c,b=Math.max(0,p.length-1)*f;return y+b};let S="";for(let p=0;p<v.length;p++){const y=S+v[p];et(y)>tt&&S?(A.push(S),S=v[p].trimStart()):S=y}S&&A.push(S);const O=a*o,D=Math.ceil(n*c),R=Math.ceil((d*2+O*A.length)*c);u.width=D,u.height=R,l.fillStyle="#fff",l.fillRect(0,0,D,R),l.textBaseline="alphabetic",l.fillStyle="#000",l.font=x,l.globalAlpha=.001,l.fillText("warmup",-9999,-9999),l.globalAlpha=1;let B=d*c+a*c;const nt=s*c;for(const p of A){let y=nt;for(let b=0;b<p.length;b++){const M=p[b];l.fillText(M,y,B);const z=l.measureText(M).width+f*c;y+=z}B+=O*c}const U=l.getImageData(0,0,u.width,u.height),w=U.data;for(let p=0;p<w.length;p+=4){const y=w[p],b=w[p+1],M=w[p+2],ot=.299*y+.587*b+.114*M<r?0:255;w[p]=w[p+1]=w[p+2]=ot,w[p+3]=255}return l.putImageData(U,0,0),u}function wt(e){const t=e.width,a=e.height,o=Math.ceil(t/8),n=new Uint8Array([29,118,48,0,o&255,o>>8&255,a&255,a>>8&255]),d=e.getContext("2d",{willReadFrequently:!0}).getImageData(0,0,t,a).data,r=new Uint8Array(o*a);let c=0;for(let u=0;u<a;u++)for(let l=0;l<o;l++){let E=0;for(let h=0;h<8;h++){const f=l*8+h;let x=0;if(f<t){const v=(u*t+f)*4;x=d[v]===0?1:0}E|=x<<7-h}r[c++]=E}return{header:n,body:r}}async function bt(e){var E;if(!("usb"in navigator))throw new Error("이 브라우저는 WebUSB를 지원하지 않습니다. 데스크톱 Chrome + HTTPS를 사용해주세요.");const t=[{classCode:7},{classCode:255}],a=Array.isArray(k)&&k.length?k:t,o=await navigator.usb.requestDevice({filters:a});await o.open(),o.configuration==null&&await o.selectConfiguration(1);let n=null,s=null,d=0;for(const h of o.configuration.interfaces){for(const f of h.alternates){const x=(E=f.endpoints)==null?void 0:E.find(v=>v.direction==="out");if(x){n=h.interfaceNumber,s=x.endpointNumber,d=f.alternateSetting??0;break}}if(n!=null)break}if(n==null||s==null)throw new Error("OUT 엔드포인트를 찾지 못했습니다.");await o.claimInterface(n);try{await o.selectAlternateInterface(n,d)}catch{}const r=27,c=29;await o.transferOut(s,new Uint8Array([r,64]));const{header:u,body:l}=wt(e);await o.transferOut(s,u),await o.transferOut(s,l),await o.transferOut(s,new Uint8Array([10,10]));try{await o.transferOut(s,new Uint8Array([c,86,0]))}catch{}}async function Et(e){const t=getComputedStyle(document.documentElement),a=parseInt(t.getPropertyValue("--fontSizePx"))||160,o=parseFloat(t.getPropertyValue("--leading"))||1,n=await Q(e,{fontFamily:"MyFont",fontSizePx:a,lineHeight:o,maxWidthPx:560,marginX:8,marginY:8,threshold:190});await bt(n)}async function vt(){try{const e=((i==null?void 0:i.value)||"").trim();if(!e){alert("인쇄할 텍스트가 없습니다.");return}await Et(e),alert("래스터 전송 완료!")}catch(e){console.error(e),alert("프린터 전송 중 문제 발생: "+((e==null?void 0:e.message)||e))}}function St(e,{pageWidthMM:t=80,marginMM:a=0,autoRemoveDelay:o=2e3}={}){const n=document.createElement("iframe");n.setAttribute("aria-hidden","true"),n.style.cssText="position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;",document.body.appendChild(n);const s=e.toDataURL("image/png"),d=`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Print</title>
<style>
  @page { size: ${t}mm auto; margin: ${a}mm; }
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
      img.src = ${JSON.stringify(s)};
      window.onafterprint = function(){
        try { parent.postMessage({ __fromPrintFrame: true }, '*'); } catch(e){}
      };
    })();
  <\/script>
</body>
</html>`;n.srcdoc=d;const r=c=>{c&&c.data&&c.data.__fromPrintFrame&&(window.removeEventListener("message",r),setTimeout(()=>{try{n.remove()}catch{}},0))};window.addEventListener("message",r),setTimeout(()=>{try{n.remove()}catch{}},o)}
