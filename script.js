(() => {
  "use strict";

  const KEY = "commoncents_v1";
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };

  const uid = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const peso = (n) => new Intl.NumberFormat("en-PH",{style:"currency",currency:"PHP"}).format(Number(n)||0);
  const escapeHTML = (s) => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const initials = (name) => String(name).trim().split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase() || "?";

  const defaultState = {
    theme: "#38d47a",
    groups: [],
    activeGroup: null
  };

  let state;
  try { state = JSON.parse(localStorage.getItem(KEY)) || structuredClone(defaultState); }
  catch { state = structuredClone(defaultState); }
  if (!Array.isArray(state.groups)) state.groups = [];
  if (!state.groups.length) state.activeGroup = null;
  state.groups.forEach(migrateGroup);

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const activeGroup = () => state.groups.find(g=>g.id===state.activeGroup) || null;

  function save(){
    try{
      localStorage.setItem(KEY, JSON.stringify(state));
    }catch(err){
      console.error("CommonCents: failed to save to Local Storage", err);
      toast("Couldn't save — your browser's local storage may be full or unavailable.");
    }
  }

  function applyTheme(){
    const c = normalizeHex(state.theme || "#38d47a");
    state.theme = c;
    const rgb = hexToRgb(c);
    const lightness = relativeLuminance(rgb.r,rgb.g,rgb.b);
    const contrast = lightness > 0.52 ? "#08110c" : "#ffffff";
    const dark = mix(c, "#000000", .28);
    const root=document.documentElement;

    root.style.setProperty("--primary",c);
    root.style.setProperty("--primary-dark",dark);
    root.style.setProperty("--primary-contrast",contrast);
    root.style.setProperty("--primary-soft",rgba(c,.16));
    root.style.setProperty("--primary-softer",rgba(c,.075));
    root.style.setProperty("--primary-border",rgba(c,.50));
    root.style.setProperty("--primary-glow",rgba(c,.22));
    root.style.setProperty("--surface-accent",rgba(c,.045));
    root.style.setProperty("--border-strong",rgba(c,.34));

    $("#themeColor").value=c;
    $("#themeHex").textContent=c.toUpperCase();
    $("#themeDot").style.background=c;
    $("#themeName").textContent=c.toUpperCase();
    $("#previewAmount").style.color=c;

    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.content=c;

    const logo=makeLogoData(c);
    if($("#brandLogo")) $("#brandLogo").src=logo;
    if($("#mobileBrandLogo")) $("#mobileBrandLogo").src=logo;

    const favicon=document.querySelector('link[rel="icon"]');
    if(favicon) favicon.href=makeFaviconData(c);
  }

  function normalizeHex(value){
    let h=String(value||"").trim().replace("#","");
    if(/^[0-9a-fA-F]{3}$/.test(h)) h=h.split("").map(x=>x+x).join("");
    return /^[0-9a-fA-F]{6}$/.test(h) ? "#"+h.toLowerCase() : "#38d47a";
  }
  function hexToRgb(hex){
    const h=normalizeHex(hex).slice(1);
    return {r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)};
  }
  function relativeLuminance(r,g,b){
    const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};
    return .2126*f(r)+.7152*f(g)+.0722*f(b);
  }
  function mix(a,b,amount){
    const x=hexToRgb(a), y=hexToRgb(b);
    const m=(p,q)=>Math.round(p+(q-p)*amount);
    return "#"+[m(x.r,y.r),m(x.g,y.g),m(x.b,y.b)].map(v=>v.toString(16).padStart(2,"0")).join("");
  }
  function rgba(hex,a){
    const c=hexToRgb(hex);
    return `rgba(${c.r},${c.g},${c.b},${a})`;
  }
  function makeLogoData(color){
    const c=normalizeHex(color);
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
      <rect x="4" y="4" width="120" height="120" rx="28" fill="#11191e" stroke="#050708" stroke-width="8"/>
      <path d="M64 24a40 40 0 1 0 40 40" fill="none" stroke="#eef3f1" stroke-width="15"/>
      <path d="M64 24a40 40 0 0 0-40 40" fill="none" stroke="${c}" stroke-width="15"/>
      <path d="M64 104a40 40 0 0 0 40-40" fill="none" stroke="${c}" stroke-width="15"/>
      <circle cx="64" cy="64" r="22" fill="#11191e" stroke="#050708" stroke-width="4"/>
      <text x="64" y="74" text-anchor="middle" font-family="Times New Roman,serif" font-size="31" font-weight="700" fill="#fff">₱</text>
    </svg>`;
    return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
  }
  function makeFaviconData(color){
    const c=normalizeHex(color);
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="15" fill="#11191e"/>
      <circle cx="32" cy="32" r="21" fill="none" stroke="${c}" stroke-width="9"/>
      <path d="M32 11a21 21 0 0 1 21 21" fill="none" stroke="#f2f5f4" stroke-width="9"/>
      <circle cx="32" cy="32" r="11" fill="#11191e" stroke="#050708" stroke-width="2"/>
      <text x="32" y="39" text-anchor="middle" font-family="Times New Roman,serif" font-size="16" font-weight="700" fill="#fff">₱</text>
    </svg>`;
    return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
  }
  const round2 = (n) => Math.round((Number(n)||0) * 100) / 100;

  // Splits `total` pesos across `n` people as centavo-safe shares that sum exactly to total.
  // Uses the largest-remainder method so no fraction of a centavo is lost or invented.
  function splitEqual(total, n){
    if(!n) return [];
    const totalCentavos = Math.round((Number(total)||0) * 100);
    const base = Math.floor(totalCentavos / n);
    let remainder = totalCentavos - base * n;
    const shares = new Array(n).fill(base);
    for (let i = 0; i < n && remainder > 0; i++, remainder--) shares[i] += 1;
    return shares.map(c => c / 100);
  }

  function personContributionTotal(g, personId){
    return round2((g.contributions||[]).filter(c=>c.personId===personId).reduce((a,c)=>a+(Number(c.amount)||0),0));
  }

  function totalExpense(g){
    if(!g || !Array.isArray(g.expenses)) return 0;
    return round2(g.expenses.reduce((sum,e)=>sum + Math.max(0, Number(e?.amount)||0),0));
  }

  // Return a valid percentage map for the CURRENT people. The map is always
  // normalized to 100% when people exist, and never contains invalid numbers.
  function normalizePercentages(g, source){
    const people = Array.isArray(g?.people) ? g.people : [];
    const result = {};
    if(!people.length) return result;

    let total = 0;
    people.forEach(p=>{
      const n = Number(source?.[p.id]);
      const value = Number.isFinite(n) ? Math.max(0,n) : 0;
      result[p.id] = value;
      total += value;
    });

    if(total <= 0) return equalPercentages(g);
    people.forEach(p=>{ result[p.id] = (result[p.id] / total) * 100; });
    return result;
  }

  function equalPercentages(g){
    const people = Array.isArray(g?.people) ? g.people : [];
    if(!people.length) return {};
    const base = 100 / people.length;
    const result = {};
    people.forEach((p,i)=>{
      result[p.id] = i === people.length - 1
        ? 100 - base * (people.length - 1)
        : base;
    });
    return result;
  }

  // Convert a percentage map to centavo-safe amounts that add to EXACTLY the
  // group's total expense. Largest-remainder rounding prevents lost centavos.
  function percentagesToAmounts(g, percentages){
    const people = Array.isArray(g?.people) ? g.people : [];
    const totalCentavos = Math.round(totalExpense(g) * 100);
    if(!people.length) return {};

    const pct = normalizePercentages(g, percentages);
    const raw = people.map(p => ({
      id:p.id,
      raw: totalCentavos * ((Number(pct[p.id])||0) / 100)
    }));
    const result = {};
    let used = 0;
    raw.forEach(x=>{
      const base = Math.floor(x.raw + 1e-9);
      result[x.id] = base;
      used += base;
      x.fraction = x.raw - base;
    });

    let remainder = totalCentavos - used;
    raw.sort((a,b)=>b.fraction-a.fraction);
    for(let i=0;i<raw.length && remainder>0;i++,remainder--) result[raw[i].id] += 1;
    return Object.fromEntries(people.map(p=>[p.id,(result[p.id]||0)/100]));
  }

  function amountsToPercentages(g, amounts){
    const people = Array.isArray(g?.people) ? g.people : [];
    const totalCentavos = Math.round(totalExpense(g) * 100);
    if(!people.length) return {};
    if(totalCentavos <= 0) return equalPercentages(g);

    const result = {};
    people.forEach(p=>{
      const cents = Math.max(0, Math.round((Number(amounts?.[p.id])||0)*100));
      result[p.id] = (cents / totalCentavos) * 100;
    });
    return normalizePercentages(g,result);
  }

  function redistributePercentages(g, current, lockedId, lockedValue){
    const people = Array.isArray(g?.people) ? g.people : [];
    const result = {};
    if(!people.length) return result;

    const value = Math.max(0, Math.min(100, Number(lockedValue)||0));
    result[lockedId] = value;
    const others = people.filter(p=>p.id!==lockedId);
    if(!others.length){ result[lockedId]=100; return result; }

    const remaining = 100 - value;
    const weights = others.map(p=>Math.max(0,Number(current?.[p.id])||0));
    const weightTotal = weights.reduce((a,b)=>a+b,0);

    if(remaining <= 0){
      others.forEach(p=>result[p.id]=0);
      return result;
    }

    if(weightTotal <= 0){
      const each = remaining / others.length;
      others.forEach((p,i)=>result[p.id]=i===others.length-1 ? remaining-each*(others.length-1) : each);
      return result;
    }

    others.forEach((p,i)=>{
      const share = remaining * (Math.max(0,Number(current?.[p.id])||0) / weightTotal);
      result[p.id] = i===others.length-1
        ? remaining - others.slice(0,-1).reduce((sum,x)=>sum+(result[x.id]||0),0)
        : share;
    });
    return result;
  }

  function redistributeAmounts(g, current, lockedId, lockedValue){
    const people = Array.isArray(g?.people) ? g.people : [];
    const result = {};
    if(!people.length) return result;

    const totalCentavos = Math.max(0,Math.round(totalExpense(g)*100));
    const lockedCentavos = Math.max(0,Math.min(totalCentavos,Math.round((Number(lockedValue)||0)*100)));
    result[lockedId] = lockedCentavos;
    const others = people.filter(p=>p.id!==lockedId);
    if(!others.length){ result[lockedId]=totalCentavos; return Object.fromEntries(people.map(p=>[p.id,(result[p.id]||0)/100])); }

    const remaining = totalCentavos - lockedCentavos;
    if(remaining <= 0){
      others.forEach(p=>result[p.id]=0);
      return Object.fromEntries(people.map(p=>[p.id,(result[p.id]||0)/100]));
    }

    const weights = others.map(p=>Math.max(0,Math.round((Number(current?.[p.id])||0)*100)));
    const weightTotal = weights.reduce((a,b)=>a+b,0);
    if(weightTotal<=0){
      const base=Math.floor(remaining/others.length);
      let rem=remaining-base*others.length;
      others.forEach(p=>{result[p.id]=base; if(rem>0){result[p.id]++;rem--;}});
    } else {
      const raw=others.map((p,i)=>({id:p.id,raw:remaining*(weights[i]/weightTotal)}));
      let used=0;
      raw.forEach(x=>{x.base=Math.floor(x.raw+1e-9);x.frac=x.raw-x.base;result[x.id]=x.base;used+=x.base;});
      let rem=remaining-used;
      raw.sort((a,b)=>b.frac-a.frac);
      for(let i=0;i<raw.length&&rem>0;i++,rem--) result[raw[i].id]++;
    }
    return Object.fromEntries(people.map(p=>[p.id,(result[p.id]||0)/100]));
  }

  function personShareMap(g){
    const total=totalExpense(g);
    if(!g?.people?.length) return {};
    if(g.splitMethod !== "custom") {
      const shares = splitEqual(total, g.people.length);
      const map = {};
      g.people.forEach((p,i)=>{ map[p.id] = shares[i] || 0; });
      return map;
    }
    const percentages=normalizePercentages(g,g.customSplit);
    const amounts=percentagesToAmounts(g,percentages);
    const map={};
    g.people.forEach(p=>map[p.id]=amounts[p.id]||0);
    return map;
  }

  function personStats(g, personId, shareMapOverride){
    const shareMap = shareMapOverride || personShareMap(g);
    const share = shareMap[personId] || 0;
    const contributed = personContributionTotal(g, personId);
    const remaining = round2(Math.max(0, share - contributed));
    const rawPercent = share > 0 ? (contributed / share) * 100 : (contributed > 0 ? 100 : 0);
    const percent = Math.max(0, Math.min(100, Math.round(rawPercent)));
    const status = contributed <= 0 ? "not-paid" : (percent >= 100 ? "fully-paid" : "partially-paid");
    const statusLabel = status === "not-paid" ? "Not Paid" : status === "fully-paid" ? "Fully Paid" : "Partially Paid";
    return {share, contributed, remaining, percent, status, statusLabel};
  }

  function totals(g){
    if(!g) return {total:0,share:0,collected:0,remaining:0,percent:0};
    const total=g.expenses.reduce((a,e)=>a+Math.max(0,Number(e.amount)||0),0);
    const share=g.people.length ? total/g.people.length : 0;
    const collected=round2((g.contributions||[]).reduce((a,c)=>a+(Number(c.amount)||0),0));
    const remaining=round2(Math.max(0,total-collected));
    const percent=total?Math.max(0,Math.min(100,Math.round(collected/total*100))):0;
    return {total,share,collected,remaining,percent};
  }

  // One-time migration: convert legacy boolean `paid` records into a contribution
  // record equal to that person's share at the time of migration, so status keeps working.
  function migrateGroup(g){
    if(!Array.isArray(g.people)) g.people=[];
    if(!Array.isArray(g.expenses)) g.expenses=[];
    if(!g.contributions) g.contributions = [];
    if(g.splitMethod !== "custom") g.splitMethod = "equal";
    if(g.splitMethod === "custom") g.customSplit = normalizePercentages(g,g.customSplit);
    if(g.paid && !g.migratedPaid){
      const shareMap = personShareMap(g);
      Object.keys(g.paid).forEach(personId=>{
        if(g.paid[personId] && g.people.some(p=>p.id===personId)){
          const already = personContributionTotal(g, personId);
          const share = shareMap[personId] || 0;
          if(already <= 0 && share > 0){
            g.contributions.push({id:uid("contrib"),personId,amount:share,date:today(),note:"Migrated from previous version"});
          }
        }
      });
      g.migratedPaid = true;
      delete g.paid;
    }
  }

  function render(){
    applyTheme();
    const g=activeGroup();
    const t=totals(g);
    if(!g){
      $("#dashboardGroupName").textContent="No group yet";
      $("#dashboardGroupMeta").textContent="Create a group to start splitting costs.";
      $("#totalExpenses").textContent=peso(0);
      $("#totalCollected").textContent=peso(0);
      $("#totalRemaining").textContent=peso(0);
      $("#progressPercent").textContent="0%";
      $("#progressLabel").textContent="0% collected";
      $("#progressFill").style.width="0%";
      $("#dashboardPeople").innerHTML=`<div class="empty" style="grid-column:1/-1"><i class="fa-solid fa-users"></i>Create a group, then add the people who will share the costs.</div>`;
      $("#recentExpenses").innerHTML=`<div class="empty"><i class="fa-solid fa-receipt"></i>No expenses yet. Create a group first.</div>`;
      $("#allPeople").innerHTML=`<div class="empty" style="grid-column:1/-1"><i class="fa-solid fa-user-plus"></i>No people yet.</div>`;
      $("#allExpenses").innerHTML=`<div class="empty"><i class="fa-solid fa-receipt"></i>No expenses yet.</div>`;
      $("#contributionHistory").innerHTML=`<div class="empty"><i class="fa-solid fa-hand-holding-dollar"></i>Create a group first.</div>`;
      renderSplitMethodCard(null);
      renderGroups();
      return;
    }
    $("#dashboardGroupName").textContent=g.name;
    $("#dashboardGroupMeta").textContent=`${g.people.length} ${g.people.length===1?"person":"people"} · ${g.expenses.length} ${g.expenses.length===1?"expense":"expenses"}`;
    $("#totalExpenses").textContent=peso(t.total);
    $("#totalCollected").textContent=peso(t.collected);
    $("#totalRemaining").textContent=peso(t.remaining);
    $("#progressPercent").textContent=`${t.percent}%`;
    $("#progressLabel").textContent=`${t.percent}% collected`;
    $("#progressFill").style.width=`${t.percent}%`;
    renderPeople(g,t);
    renderExpenses(g);
    renderContributionHistory(g);
    renderSplitMethodCard(g);
    renderGroups();
  }

  function statusClass(status){
    return status === "fully-paid" ? "" : status === "partially-paid" ? "partial" : "unpaid";
  }

  function renderPeople(g,t){
    const shareMap = personShareMap(g);
    const cards=g.people.map(p=>{
      const s = personStats(g, p.id, shareMap);
      return `
      <article class="person-card">
        <div class="avatar"><i class="fa-solid fa-user"></i></div>
        <h4 title="${escapeHTML(p.name)}">${escapeHTML(p.name)}</h4>
        <span class="share">${peso(s.share)}</span>
        <span class="percent">Contributed ${peso(s.contributed)} · ${s.percent}%</span>
        <div class="person-progress-track"><div class="person-progress-fill ${statusClass(s.status)}" style="width:${s.percent}%"></div></div>
        <span class="status-pill ${statusClass(s.status)}">${s.statusLabel}</span>
        <button class="status-btn ${statusClass(s.status)}" data-contribute="${p.id}" type="button" ${s.remaining<=0?"disabled":""}>
          <i class="fa-solid fa-hand-holding-dollar"></i>
          ${s.remaining<=0?"Fully Paid":"Add Contribution"}
        </button>
      </article>`;
    }).join("");
    $("#dashboardPeople").innerHTML=cards || `<div class="empty" style="grid-column:1/-1"><i class="fa-solid fa-users"></i>Add people to start splitting.</div>`;
    $("#allPeople").innerHTML=g.people.map(p=>{
      const s = personStats(g, p.id, shareMap);
      return `
      <article class="large-person">
        <div class="person-top"><div><div class="avatar"><i class="fa-solid fa-user"></i></div><h3>${escapeHTML(p.name)}</h3></div><span class="expense-status ${statusClass(s.status)==="unpaid"?"pending":statusClass(s.status)==="partial"?"partial":""}">${s.statusLabel}</span></div>
        <div class="big-share">${peso(s.share)}</div>
        <small>Contributed ${peso(s.contributed)} · Remaining ${peso(s.remaining)}</small>
        <div class="person-progress-track"><div class="person-progress-fill ${statusClass(s.status)}" style="width:${s.percent}%"></div></div>
        <small>${s.percent}% of share paid</small>
        <div class="actions">
          <button class="${s.remaining<=0?"secondary-btn":"primary-btn"}" data-contribute="${p.id}" type="button" ${s.remaining<=0?"disabled":""}><i class="fa-solid fa-hand-holding-dollar"></i>${s.remaining<=0?"Fully Paid":"Add Contribution"}</button>
          <button class="danger-btn" data-remove-person="${p.id}" type="button" aria-label="Remove ${escapeHTML(p.name)}"><i class="fa-solid fa-trash"></i></button>
        </div>
      </article>`;
    }).join("") || `<div class="empty" style="grid-column:1/-1"><i class="fa-solid fa-user-plus"></i>No people yet.</div>`;
    $$("[data-contribute]").forEach(b=>b.addEventListener("click",()=>openContributionModal(b.dataset.contribute)));
    $$("[data-remove-person]").forEach(b=>b.addEventListener("click",()=>removePerson(b.dataset.removePerson)));
  }

  function renderContributionHistory(g){
    const list = [...(g.contributions||[])].sort((a,b)=> String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id)));
    $("#contributionHistory").innerHTML = list.map(c=>{
      const person = g.people.find(p=>p.id===c.personId);
      return `<div class="expense-row contribution-row">
        <span class="expense-icon"><i class="fa-solid fa-hand-holding-dollar"></i></span>
        <div class="expense-main"><b>${escapeHTML(person?person.name:"Removed person")}</b><small>${formatDate(c.date)}${c.note?" · "+escapeHTML(c.note):""}</small></div>
        <strong class="expense-amount">${peso(c.amount)}</strong>
        <button class="icon-btn" data-delete-contribution="${c.id}" aria-label="Delete contribution" type="button"><i class="fa-solid fa-trash"></i></button>
      </div>`;
    }).join("") || `<div class="empty"><i class="fa-solid fa-hand-holding-dollar"></i>No contributions recorded yet.</div>`;
    $$("[data-delete-contribution]").forEach(b=>b.addEventListener("click",()=>deleteContribution(b.dataset.deleteContribution)));
  }

  function expenseRow(e,g,editable){
    const t=totals(g), per=g.people.length?t.share:0;
    const shareText = g.splitMethod === "custom" ? "Custom split" : (g.people.length ? peso(per)+" each" : "No people yet");
    const complete = g.people.length>0 && t.remaining<=0;
    const actions = editable ? `
      <div class="expense-row-actions">
        <button class="icon-btn" data-edit-expense="${e.id}" aria-label="Edit ${escapeHTML(e.name)}" type="button"><i class="fa-solid fa-pen"></i></button>
        <button class="icon-btn danger-icon" data-delete-expense="${e.id}" aria-label="Delete ${escapeHTML(e.name)}" type="button"><i class="fa-solid fa-trash"></i></button>
      </div>` : "";
    return `<div class="expense-row">
      <span class="expense-icon"><i class="fa-solid fa-receipt"></i></span>
      <div class="expense-main"><b>${escapeHTML(e.name)}</b><small>${formatDate(e.date)} · ${shareText}</small></div>
      <strong class="expense-amount">${peso(e.amount)}</strong>
      <span class="expense-status ${complete?"":"pending"}">${complete?"Fully Collected":"Collecting"}</span>
      ${actions}
    </div>`;
  }

  function renderExpenses(g){
    const sorted=[...g.expenses].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    $("#recentExpenses").innerHTML=sorted.slice(0,5).map(e=>expenseRow(e,g,false)).join("") || `<div class="empty"><i class="fa-solid fa-receipt"></i>No expenses yet.</div>`;
    $("#allExpenses").innerHTML=sorted.map(e=>expenseRow(e,g,true)).join("") || `<div class="empty"><i class="fa-solid fa-receipt"></i>No expenses yet. Add the first shared cost.</div>`;
    $$("[data-edit-expense]").forEach(b=>b.addEventListener("click",()=>editExpense(b.dataset.editExpense)));
    $$("[data-delete-expense]").forEach(b=>b.addEventListener("click",()=>deleteExpense(b.dataset.deleteExpense)));
  }

  function resetExpenseForm(){
    const form=$("#expenseForm");
    delete form.dataset.editing;
    $("#modalTitle").textContent="Add Expense";
    form.querySelector('button[type="submit"]').textContent="Save Expense";
    form.reset();
    $("#expenseDate").value=today();
  }

  function editExpense(id){
    const g=activeGroup(); if(!g) return;
    const e=g.expenses.find(x=>x.id===id); if(!e) return;
    $("#expenseForm").dataset.editing=id;
    $("#modalTitle").textContent="Edit Expense";
    $("#expenseForm").querySelector('button[type="submit"]').textContent="Save Changes";
    $("#expenseName").value=e.name;
    $("#expenseAmount").value=e.amount;
    $("#expenseDate").value=e.date;
    openModal("#modalBackdrop");
  }

  function deleteExpense(id){
    const g=activeGroup(); if(!g) return;
    const e=g.expenses.find(x=>x.id===id); if(!e) return;
    if(!confirm(`Delete "${e.name}" (${peso(e.amount)})? This will recalculate everyone's share.`)) return;
    g.expenses=g.expenses.filter(x=>x.id!==id);
    save(); render(); toast("Expense deleted");
  }

  function renderGroups(){
    $("#groupsList").innerHTML=state.groups.map(g=>{
      const t=totals(g);
      return `<article class="group-card ${g.id===state.activeGroup?"active":""}" data-group="${g.id}">
        <button class="icon-btn danger-icon group-delete-btn" data-delete-group="${g.id}" aria-label="Delete ${escapeHTML(g.name)}" type="button"><i class="fa-solid fa-trash"></i></button>
        <h3>${escapeHTML(g.name)}</h3><small>${g.people.length} people · ${g.expenses.length} expenses</small>
        <div class="group-total">${peso(t.total)}</div><small>${t.percent}% collected</small>
      </article>`;
    }).join("") || `<div class="empty" style="grid-column:1/-1"><i class="fa-solid fa-layer-group"></i>No groups yet. Create one to get started.</div>`;
    $$("[data-delete-group]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();deleteGroup(b.dataset.deleteGroup);}));
    $$("[data-group]").forEach(el=>el.addEventListener("click",()=>{
      state.activeGroup=el.dataset.group; save(); render(); showView("dashboard"); toast("Group selected");
    }));
  }

  function deleteGroup(id){
    const g=state.groups.find(x=>x.id===id); if(!g) return;
    if(!confirm(`Delete "${g.name}"? All of its people, expenses, and contribution history will be permanently removed.`)) return;
    state.groups=state.groups.filter(x=>x.id!==id);
    if(state.activeGroup===id){
      state.activeGroup=state.groups.length ? state.groups[0].id : null;
    }
    save(); render(); toast("Group deleted");
  }

  function formatDate(v){
    if(!v) return "No date";
    const [y,m,d]=v.split("-").map(Number);
    const date=new Date(Date.UTC(y,m-1,d));
    return new Intl.DateTimeFormat("en-PH",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}).format(date);
  }

  function removePerson(id){
    const g=activeGroup(); if(!g){toast("Create or select a group first.");return}
    const p=g.people.find(x=>x.id===id);
    if(!p) return;
    if(g.people.length<=1){toast("Keep at least one person in the group.");return}
    if(!confirm(`Remove ${p.name} from this group? Their contribution history will also be removed.`)) return;
    if(g.splitMethod === "custom") {
      const before=normalizePercentages(g,g.customSplit);
      const removedShare=Math.max(0,Number(before[id])||0);
      delete before[id];
      g.people=g.people.filter(x=>x.id!==id);
      g.contributions=(g.contributions||[]).filter(c=>c.personId!==id);
      if(g.people.length) {
        const survivors={}; g.people.forEach(x=>survivors[x.id]=before[x.id]||0);
        const survivorTotal=Object.values(survivors).reduce((a,b)=>a+b,0);
        if(survivorTotal<=0) g.customSplit=equalPercentages(g);
        else { g.customSplit={}; g.people.forEach(x=>g.customSplit[x.id]=(survivors[x.id]/survivorTotal)*100); }
      } else g.customSplit={};
    } else {
      g.people=g.people.filter(x=>x.id!==id);
      g.contributions=(g.contributions||[]).filter(c=>c.personId!==id);
    }
    save(); render(); toast("Person removed");
  }

  function openContributionModal(preselectPersonId){
    const g=activeGroup();
    if(!g){toast("Create or select a group first.");return}
    if(!g.people.length){toast("Add a person first.");return}
    const select=$("#contributionPerson");
    select.innerHTML=g.people.map(p=>`<option value="${p.id}">${escapeHTML(p.name)}</option>`).join("");
    if(preselectPersonId && g.people.some(p=>p.id===preselectPersonId)) select.value=preselectPersonId;
    $("#contributionDate").value=today();
    $("#contributionNote").value="";
    $("#contributionAmount").value="";
    updateContributionRemainingInfo();
    openModal("#contributionModalBackdrop");
  }

  function updateContributionRemainingInfo(){
    const g=activeGroup(); if(!g) return;
    const personId=$("#contributionPerson").value;
    const s=personStats(g, personId);
    $("#contributionRemainingAmount").textContent=peso(s.remaining);
    $("#contributionAmount").max = s.remaining>0 ? s.remaining : 0;
    $("#contributionAmount").disabled = s.remaining<=0;
  }

  function deleteContribution(id){
    const g=activeGroup(); if(!g) return;
    if(!confirm("Delete this contribution? This cannot be undone.")) return;
    g.contributions=(g.contributions||[]).filter(c=>c.id!==id);
    save(); render(); toast("Contribution deleted");
  }

  function showView(view){
    $$(".view").forEach(v=>v.classList.remove("active-view"));
    const target=$(`#view-${view}`); if(target) target.classList.add("active-view");
    $$(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.view===view));
    const titles={dashboard:"Dashboard",expenses:"Expenses",people:"People",history:"Contributions",groups:"Groups",settings:"Settings"};
    $("#pageTitle").textContent=titles[view]||"Dashboard";
    $(".sidebar")?.classList.remove("open");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function openModal(id){$(id).hidden=false;setTimeout(()=>$(id).querySelector("input")?.focus(),20)}
  function closeModal(id){$(id).hidden=true}

  let customDraft=null;

  function currentPercentages(g){
    if(g.splitMethod === "custom") return normalizePercentages(g,g.customSplit);
    const amounts=splitEqual(totalExpense(g),g.people.length);
    return amountsToPercentages(g,Object.fromEntries(g.people.map((p,i)=>[p.id,amounts[i]])));
  }

  function splitMethodLabel(g){ return g?.splitMethod === "custom" ? "Custom Split" : "Equal / Fair"; }

  function renderSplitMethodCard(g){
    const card=$("#splitMethodBtn");
    if(!g){
      card.disabled=true;
      card.innerHTML='<span class="method-icon"><i class="fa-solid fa-scale-balanced"></i></span><span><b>Equal / Fair</b><small>Create a group to configure splitting</small></span><i class="fa-solid fa-chevron-right"></i>';
      return;
    }
    card.disabled=false;
    const custom=g.splitMethod === "custom";
    card.innerHTML=`<span class="method-icon"><i class="fa-solid ${custom?"fa-sliders":"fa-scale-balanced"}"></i></span><span><b>${custom?"Custom Split":"Equal / Fair"}</b><small>${custom?"Set each person's percentage or amount":"Everyone pays the same share"}</small></span><i class="fa-solid fa-chevron-right"></i>`;
  }

  function openSplitMethodModal(){
    const g=activeGroup();
    if(!g){toast("Create a group first.");return}
    ensureCustomSplit(g);
    customDraft={method:g.splitMethod||"equal",percentages:normalizePercentages(g,g.customSplit)};
    renderSplitModal();
    openModal("#splitMethodModalBackdrop");
  }

  function ensureCustomSplit(g){
    if(!g.customSplit || typeof g.customSplit!=="object") g.customSplit=currentPercentages(g);
    g.customSplit=normalizePercentages(g,g.customSplit);
    return g.customSplit;
  }

  function renderSplitModal(){
    const g=activeGroup(); if(!g||!customDraft) return;
    const total=totalExpense(g);
    const amounts=percentagesToAmounts(g,customDraft.percentages);
    $("#splitMethodEqual").classList.toggle("selected",customDraft.method==="equal");
    $("#splitMethodCustom").classList.toggle("selected",customDraft.method==="custom");
    $("#customSplitEditor").hidden=customDraft.method!=="custom";
    $("#customSplitTotal").textContent=peso(total);
    $("#customSplitTotalPercent").textContent=`${Math.round(g.people.reduce((a,p)=>a+(Number(customDraft.percentages[p.id])||0),0)*100)/100}%`;
    $("#customSplitRows").innerHTML=g.people.map(p=>`<div class="custom-split-row" data-person-id="${p.id}">
      <div class="custom-split-person"><span class="avatar"><i class="fa-solid fa-user"></i></span><b>${escapeHTML(p.name)}</b></div>
      <label><span>%</span><input class="custom-percent-input" data-id="${p.id}" type="number" min="0" max="100" step="0.01" value="${Number(customDraft.percentages[p.id]||0).toFixed(2)}" aria-label="Percentage for ${escapeHTML(p.name)}"></label>
      <label><span>Amount</span><input class="custom-amount-input" data-id="${p.id}" type="number" min="0" max="${total}" step="0.01" value="${Number(amounts[p.id]||0).toFixed(2)}" aria-label="Amount for ${escapeHTML(p.name)}"></label>
    </div>`).join("") || '<div class="empty">Add people before using Custom Split.</div>';
    const sum=Object.values(amounts).reduce((a,b)=>a+(Number(b)||0),0);
    $("#customSplitTotalAmount").textContent=peso(sum);
  }

  function refreshCustomInputs(){
    const g=activeGroup(); if(!g||!customDraft) return;
    const amounts=percentagesToAmounts(g,customDraft.percentages);
    g.people.forEach(p=>{
      const pct=$(`.custom-percent-input[data-id="${CSS.escape(p.id)}"]`);
      const amt=$(`.custom-amount-input[data-id="${CSS.escape(p.id)}"]`);
      if(pct) pct.value=Number(customDraft.percentages[p.id]||0).toFixed(2);
      if(amt) amt.value=Number(amounts[p.id]||0).toFixed(2);
    });
    $("#customSplitTotalPercent").textContent=`${Math.round(g.people.reduce((a,p)=>a+(Number(customDraft.percentages[p.id])||0),0)*100)/100}%`;
    $("#customSplitTotalAmount").textContent=peso(Object.values(amounts).reduce((a,b)=>a+(Number(b)||0),0));
  }

  function handleCustomPercentageInput(id,value){
    const g=activeGroup(); if(!g||!customDraft) return;
    const n=Math.max(0,Math.min(100,Number(value)||0));
    customDraft.percentages=redistributePercentages(g,customDraft.percentages,id,n);
    refreshCustomInputs();
  }

  function handleCustomAmountInput(id,value){
    const g=activeGroup(); if(!g||!customDraft) return;
    const n=Math.max(0,Math.min(totalExpense(g),Number(value)||0));
    const amounts=percentagesToAmounts(g,customDraft.percentages);
    const nextAmounts=redistributeAmounts(g,amounts,id,n);
    customDraft.percentages=amountsToPercentages(g,nextAmounts);
    refreshCustomInputs();
  }

  function saveSplitMethod(){
    const g=activeGroup(); if(!g||!customDraft) return;
    if(customDraft.method === "custom") {
      g.splitMethod="custom";
      g.customSplit=normalizePercentages(g,customDraft.percentages);
    } else {
      g.splitMethod="equal";
      // Keep the latest custom configuration available if the user switches back later.
      if(g.customSplit) g.customSplit=normalizePercentages(g,g.customSplit);
    }
    save(); render(); closeModal("#splitMethodModalBackdrop"); customDraft=null; toast(`${splitMethodLabel(g)} selected`);
  }

  function toast(msg){
    const el=$("#toast"); el.textContent=msg; el.classList.add("show");
    clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove("show"),2200);
  }

  $$(".nav-item,[data-view]").forEach(el=>{
    el.addEventListener("click",()=>{if(el.dataset.view)showView(el.dataset.view)});
  });
  $("#mobileMenuBtn").addEventListener("click",()=>$(".sidebar").classList.toggle("open"));
  $("#addExpenseTop").addEventListener("click",()=>{if(!activeGroup()){toast("Create a group first.");return} resetExpenseForm(); openModal("#modalBackdrop");});
  $("#addExpenseBtn").addEventListener("click",()=>{if(!activeGroup()){toast("Create a group first.");return} resetExpenseForm(); openModal("#modalBackdrop");});
  $("#addPersonBtn").addEventListener("click",()=>activeGroup()?openModal("#personModalBackdrop"):toast("Create a group first."));
  $("#addGroupBtn").addEventListener("click",()=>openModal("#groupModalBackdrop"));
  $("#splitMethodBtn").addEventListener("click",openSplitMethodModal);
  $("#editGroupBtn").addEventListener("click",()=>{
    const g=activeGroup();
    if(!g){ $("#groupModalTitle").textContent="New Group"; $("#groupName").value=""; delete $("#groupForm").dataset.rename; openModal("#groupModalBackdrop"); return; }
    $("#groupName").value=g.name; $("#groupModalTitle").textContent="Rename Group"; openModal("#groupModalBackdrop"); $("#groupForm").dataset.rename="1";
  });

  $("#closeModal").addEventListener("click",()=>{closeModal("#modalBackdrop");resetExpenseForm();});
  $("#cancelExpense").addEventListener("click",()=>{closeModal("#modalBackdrop");resetExpenseForm();});
  $("#closePersonModal").addEventListener("click",()=>closeModal("#personModalBackdrop"));
  $("#cancelPerson").addEventListener("click",()=>closeModal("#personModalBackdrop"));
  $("#closeGroupModal").addEventListener("click",()=>closeModal("#groupModalBackdrop"));
  $("#cancelGroup").addEventListener("click",()=>closeModal("#groupModalBackdrop"));
  $("#closeContributionModal").addEventListener("click",()=>closeModal("#contributionModalBackdrop"));
  $("#cancelContribution").addEventListener("click",()=>closeModal("#contributionModalBackdrop"));
  $("#addContributionTop").addEventListener("click",()=>activeGroup()?openContributionModal():toast("Create a group first."));
  $("#contributionPerson").addEventListener("change",updateContributionRemainingInfo);
  $$(".modal-backdrop").forEach(b=>b.addEventListener("click",e=>{if(e.target===b){b.hidden=true; if(b.id==="modalBackdrop")resetExpenseForm(); if(b.id==="splitMethodModalBackdrop")customDraft=null;}}));

  document.addEventListener("keydown",e=>{
    if(e.key!=="Escape") return;
    const open=$$(".modal-backdrop").find(b=>!b.hidden);
    if(!open) return;
    open.hidden=true;
    if(open.id==="modalBackdrop") resetExpenseForm();
    if(open.id==="splitMethodModalBackdrop") customDraft=null;
  });

  $("#splitMethodEqual").addEventListener("click",()=>{ if(customDraft){customDraft.method="equal";renderSplitModal();} });
  $("#splitMethodCustom").addEventListener("click",()=>{ const g=activeGroup(); if(!g)return; if(customDraft){customDraft.method="custom"; customDraft.percentages=normalizePercentages(g,customDraft.percentages); renderSplitModal();} });
  $("#customSplitRows").addEventListener("change",e=>{
    const id=e.target.dataset.id; if(!id) return;
    if(e.target.classList.contains("custom-percent-input")) handleCustomPercentageInput(id,e.target.value);
    else if(e.target.classList.contains("custom-amount-input")) handleCustomAmountInput(id,e.target.value);
  });
  $("#saveSplitMethod").addEventListener("click",saveSplitMethod);
  $("#cancelSplitMethod").addEventListener("click",()=>{customDraft=null;closeModal("#splitMethodModalBackdrop")});
  $("#closeSplitMethodModal").addEventListener("click",()=>{customDraft=null;closeModal("#splitMethodModalBackdrop")});

  $("#expenseDate").value=today();
  $("#expenseForm").addEventListener("submit",e=>{
    e.preventDefault();
    const g=activeGroup(), name=$("#expenseName").value.trim(), amount=Number($("#expenseAmount").value), date=$("#expenseDate").value;
    if(!g||!name||!Number.isFinite(amount)||amount<=0||!date){toast("Please enter a valid expense.");return}
    const editingId=e.target.dataset.editing;
    if(editingId){
      const existing=g.expenses.find(x=>x.id===editingId);
      if(existing){ existing.name=name; existing.amount=Math.round(amount*100)/100; existing.date=date; }
      save(); render(); closeModal("#modalBackdrop"); resetExpenseForm(); toast("Expense updated");
      return;
    }
    g.expenses.push({id:uid("expense"),name,amount:Math.round(amount*100)/100,date});
    save(); render(); closeModal("#modalBackdrop"); resetExpenseForm(); toast("Expense added");
  });

  $("#personForm").addEventListener("submit",e=>{
    e.preventDefault(); const g=activeGroup(), name=$("#personName").value.trim();
    if(!g||!name){toast("Enter a person's name.");return}
    if(g.people.some(p=>p.name.toLowerCase()===name.toLowerCase())){toast("That person is already in the group.");return}
    const id=uid("person");
    if(g.splitMethod === "custom") {
      const before=normalizePercentages(g,g.customSplit);
      // Add the new person with zero weight, then redistribute the existing allocation
      // proportionally plus an equal share when there was no usable prior allocation.
      g.people.push({id,name});
      const oldPeople=g.people.filter(p=>p.id!==id);
      const oldTotal=oldPeople.reduce((a,p)=>a+(Number(before[p.id])||0),0);
      g.customSplit={};
      if(oldTotal<=0) g.customSplit=equalPercentages(g);
      else {
        const newShare=100/(oldPeople.length+1);
        oldPeople.forEach(p=>g.customSplit[p.id]=(before[p.id]/oldTotal)*(100-newShare));
        g.customSplit[id]=newShare;
      }
    } else g.people.push({id,name});
    if(!g.contributions) g.contributions=[];
    save(); render(); closeModal("#personModalBackdrop"); e.target.reset(); toast("Person added");
  });

  $("#contributionForm").addEventListener("submit",e=>{
    e.preventDefault();
    const g=activeGroup();
    if(!g){toast("Create or select a group first.");return}
    const personId=$("#contributionPerson").value;
    const person=g.people.find(p=>p.id===personId);
    if(!person){toast("Select a valid person.");return}
    const amount=Number($("#contributionAmount").value);
    const date=$("#contributionDate").value;
    const note=$("#contributionNote").value.trim().slice(0,80);
    if(!Number.isFinite(amount) || amount<=0){toast("Enter a contribution amount greater than ₱0.");return}
    if(!date){toast("Please choose a date.");return}
    const s=personStats(g, personId);
    if(s.remaining<=0){toast(`${person.name} is already fully paid.`);return}
    if(round2(amount) > s.remaining + 0.001){toast(`Only ${peso(s.remaining)} remains for ${person.name}.`);return}
    if(!g.contributions) g.contributions=[];
    g.contributions.push({id:uid("contrib"),personId,amount:round2(amount),date,note});
    save(); render(); closeModal("#contributionModalBackdrop"); e.target.reset(); toast("Contribution added");
  });

  $("#groupForm").addEventListener("submit",e=>{
    e.preventDefault(); const name=$("#groupName").value.trim(); if(!name){toast("Enter a group name.");return}
    const g=activeGroup();
    if(e.target.dataset.rename==="1"){
      if(g){g.name=name; save(); render(); closeModal("#groupModalBackdrop"); e.target.reset(); delete e.target.dataset.rename; $("#groupModalTitle").textContent="New Group"; toast("Group renamed")}
      return;
    }
    const newGroup={id:uid("group"),name,people:[],expenses:[],contributions:[],splitMethod:"equal",customSplit:{}};
    state.groups.push(newGroup); state.activeGroup=newGroup.id; save(); render(); closeModal("#groupModalBackdrop"); e.target.reset(); toast("New group created"); showView("dashboard");
  });

  $("#themeColor").addEventListener("input",e=>{state.theme=normalizeHex(e.target.value);save();applyTheme()});
  $("#clearDataBtn").addEventListener("click",()=>{
    if(!confirm("Clear all CommonCents data saved in this browser?"))return;
    localStorage.removeItem(KEY); state=structuredClone(defaultState); save(); render(); toast("Local data reset");
  });
  $("#resetDemoBtn").addEventListener("click",()=>{
    if(!confirm("Clear all CommonCents data saved in this browser?"))return;
    localStorage.removeItem(KEY); state=structuredClone(defaultState); save(); render(); toast("CommonCents is now empty");
  });

  applyTheme(); render();
})();