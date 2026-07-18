function w(t,n=""){return new Intl.NumberFormat("en-US").format(Math.round(t))+n}function E(t){if(t.dataset.hasAnimated==="true")return;t.dataset.hasAnimated="true";const n=Number(t.dataset.target||0),a=t.dataset.suffix||"",o=Number(t.dataset.duration||1200),e=performance.now();function r(i){const c=i-e,d=Math.min(c/o,1),s=1-Math.pow(1-d,3),l=n*s;t.textContent=w(l,a),d<1?requestAnimationFrame(r):t.textContent=w(n,a)}requestAnimationFrame(r)}function q(){const t=document.querySelector("[data-tally-section]");if(!t||t.dataset.hasAnimated==="true")return;const n=t.querySelectorAll("[data-tally-number]");function a(){t.dataset.hasAnimated!=="true"&&(t.dataset.hasAnimated="true",t.classList.add("is-visible"),n.forEach(e=>E(e)))}new IntersectionObserver((e,r)=>{e.some(c=>c.isIntersecting)&&(a(),r.disconnect())},{threshold:.35}).observe(t)}function C(){const t=document.querySelector("[data-donation-options]");if(!t)return{};try{return JSON.parse(t.textContent||"{}")}catch{return{}}}function F(){const t=document.querySelector("[data-donation-modal]");if(!t)return;const n=C(),a=t.querySelector("[data-modal-title]"),o=t.querySelector("[data-modal-image]"),e=t.querySelector("[data-modal-link]"),r=t.querySelectorAll("[data-modal-close]"),i=document.querySelectorAll("[data-donation-option]");function c(s){const l=n[s];l&&(a.textContent=`${l.title} QR Code`,o.src=l.qrSrc,o.alt=`${l.title} donation QR code`,e.href=l.link,e.textContent=l.linkText,t.classList.add("is-open"),t.setAttribute("aria-hidden","false"),document.body.classList.add("modal-open"))}function d(){t.classList.remove("is-open"),t.setAttribute("aria-hidden","true"),document.body.classList.remove("modal-open")}i.forEach(s=>{s.addEventListener("click",()=>{c(s.dataset.donationOption)})}),r.forEach(s=>{s.addEventListener("click",d)}),t.addEventListener("click",s=>{s.target===t&&d()}),document.addEventListener("keydown",s=>{s.key==="Escape"&&t.classList.contains("is-open")&&d()})}function L(){const t=document.querySelector("[data-calendar-data]");if(!t)return null;try{return JSON.parse(t.textContent||"{}")}catch{return null}}const S={monthsBack:0,monthsForward:11};function D(t){const[n,a,o]=t.split("-").map(Number);return new Date(n,a-1,o)}function f(t){const n=t.getFullYear(),a=String(t.getMonth()+1).padStart(2,"0"),o=String(t.getDate()).padStart(2,"0");return`${n}-${a}-${o}`}function p(t,n){return new Date(t.getFullYear(),t.getMonth()+n,1)}function v(t,n){return new Date(t,n+1,0).getDate()}function A(t,n,a,o){const e=new Date(t,n,1);return 1+(a-e.getDay()+7)%7+(o-1)*7}function k(t=new Date){const n=new Date(t.getFullYear(),t.getMonth(),1),a=p(n,-0),o=S.monthsBack+S.monthsForward+1,e=p(a,o);return{startMonth:a,endMonth:e,monthCount:o}}function I(t,n,a){const o=[];return t.forEach(e=>{if(e.type==="dates"){e.dates.forEach(r=>{o.push({...e,date:r})});return}for(let r=new Date(n);r<a;r=p(r,1)){const i=r.getFullYear(),c=r.getMonth();if(e.type==="weekly"){const d=v(i,c);for(let s=1;s<=d;s+=1){const l=new Date(i,c,s);l.getDay()===e.weekday&&o.push({...e,date:f(l)})}}if(e.type==="monthlyNthWeekday"){const d=A(i,c,e.weekday,e.nth),s=v(i,c);d<=s&&o.push({...e,date:f(new Date(i,c,d))})}}}),o.filter(e=>{const r=D(e.date);return r>=n&&r<a}).sort((e,r)=>e.date.localeCompare(r.date)||e.title.localeCompare(r.title))}function T(t){return t.reduce((n,a)=>(n[a.date]=n[a.date]||[],n[a.date].push(a),n),{})}function x(t){return new Intl.DateTimeFormat("en-US",{month:"long",year:"numeric"}).format(t)}function N(t){return new Intl.DateTimeFormat("en-US",{weekday:"short",month:"short",day:"numeric"}).format(D(t))}function B(t,n){const a=t.getFullYear(),o=t.getMonth(),e=new Date(a,o,1).getDay(),r=v(a,o),i=[];for(let c=0;c<e;c+=1)i.push('<div class="calendar-day calendar-day-empty" aria-hidden="true"></div>');for(let c=1;c<=r;c+=1){const d=f(new Date(a,o,c)),s=n[d]||[],l=s.map(u=>`
          <li>
            <span class="calendar-event-name">${u.title}</span>
            <span class="calendar-event-time">${u.time}</span>
          </li>
        `).join("");i.push(`
      <div class="calendar-day${s.length?" has-events":""}">
        <span class="calendar-date">${c}</span>
        ${s.length?`<ul class="calendar-events">${l}</ul>`:""}
      </div>
    `)}return`
    <article class="calendar-month" aria-label="${x(t)} events">
      <div class="calendar-weekdays" aria-hidden="true">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>
      <div class="calendar-grid">
        ${i.join("")}
      </div>
    </article>
  `}function O(t,n,a){const o=a===0,{monthCount:e}=k(),r=a===e-1;return`
    <div class="calendar-toolbar">
      <button type="button" class="calendar-nav-button" data-calendar-prev aria-label="View previous month" ${o?"disabled":""}>
        &lt;
      </button>
      <h2>${x(t)}</h2>
      <button type="button" class="calendar-nav-button" data-calendar-next aria-label="View next month" ${r?"disabled":""}>
        &gt;
      </button>
    </div>
    ${B(t,n)}
  `}function Y(t){const a=f(new Date),o=t.filter(e=>e.date>=a&&e.type!=="weekly").slice(0,8);return o.length?o.map(e=>`
        <article class="upcoming-event">
          <div>
            <span class="upcoming-date">${N(e.date)}</span>
            <h3>${e.title}</h3>
            <p>${e.description}</p>
          </div>
          <span class="upcoming-time">${e.time}</span>
        </article>
      `).join(""):'<p class="muted center">No upcoming special events are posted right now. Please check back soon.</p>'}function U(){const t=L();if(!t)return;const n=t.events||[],a=t.foodBoxFormUrl||"#",o=document.querySelector("[data-events-calendar]"),e=document.querySelector("[data-upcoming-events]");if(document.querySelectorAll("[data-food-box-form-link]").forEach(u=>{u.href=a}),!o&&!e)return;const{startMonth:i,endMonth:c,monthCount:d}=k(),s=I(n,i,c);if(e&&(e.innerHTML=Y(s)),o){let h=function(){o.innerHTML=O(y[m],u,m),o.querySelector("[data-calendar-prev]")?.addEventListener("click",()=>{m=Math.max(0,m-1),h()}),o.querySelector("[data-calendar-next]")?.addEventListener("click",()=>{m=Math.min(y.length-1,m+1),h()})};var l=h;const u=T(s),y=Array.from({length:d},(g,$)=>p(i,$)),b=new Date,M=y.findIndex(g=>g.getFullYear()===b.getFullYear()&&g.getMonth()===b.getMonth());let m=M>=0?M:0;h()}}q();F();U();
