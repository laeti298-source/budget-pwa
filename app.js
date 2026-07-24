const STORAGE_KEY = "budget_depenses_v2";

// Utilitaires
function $(id){ return document.getElementById(id); }
function safeNum(v){ const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }
function fmtEUR(n){
  const x = Math.round(n * 100) / 100;
  return x.toLocaleString("fr-FR") + " €";
}

function getNowFrenchMonthKey(){
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function loadDepenses(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveDepenses(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function sumByCategory(depenses, mois){
  const out = {};
  depenses.filter(d => d.mois === mois).forEach(d => {
    out[d.categorie] = (out[d.categorie] || 0) + d.montant;
  });
  return out;
}

function totalDepensesVariable(depenses, mois){
  return depenses
    .filter(d => d.mois === mois)
    .reduce((acc, d) => acc + (Number(d.montant) || 0), 0);
}

function renderDepenses(depenses){
  const mois = $("moisSel").value;
  const totals = sumByCategory(depenses, mois);

  const categories = [
    "Courses",
    "Loisirs",
    "Médecins",
    "Restaurant",
    "Vacances",
    "Autres"
  ];

  $("depensesResult").innerHTML = "";

  let globalTotal = 0;

  categories.forEach(cat => {
    const t = totals[cat] || 0;
    globalTotal += t;

    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div style="font-weight:700">${cat}</div>
      <div>${fmtEUR(t)}</div>
    `;
    $("depensesResult").appendChild(row);
  });

  const totalRow = document.createElement("div");
  totalRow.className = "row";
  totalRow.innerHTML = `
    <div style="font-weight:800">Total dépenses variables (${mois})</div>
    <div style="font-weight:800">${fmtEUR(globalTotal)}</div>
  `;
  $("depensesResult").appendChild(totalRow);
}

function calculerReste(){
  const depenses = loadDepenses();
  const mois = $("moisSel").value;

  const salaire = safeNum($("salaire").value);
  const pension = safeNum($("pension").value);
  const caf = safeNum($("caf").value);
  const loyer = safeNum($("loyer").value);
  const epargne = safeNum($("epargne").value);

  const revenus = salaire + pension + caf;

  // Fixes (loyer + épargne)
  const chargesFixes = loyer + epargne;

  // Courses "fixes" (tu avais 250 €/mois)
  const coursesFixes = 250;

  // Dépenses variables ajoutées par toi pour le mois sélectionné
  const variables = totalDepensesVariable(depenses, mois);

  const totalDepenses = chargesFixes + coursesFixes + variables;
  const reste = revenus - totalDepenses;

  const badge = reste >= 0
    ? `<span class="badge ok">OK</span>`
    : `<span class="badge bad">Déficit</span>`;

  $("resultat").innerHTML = `
    <div style="margin-bottom:8px;">${badge}</div>
    <div>Reste après charges + épargne + dépenses variables (${mois})</div>
    <div style="font-size:22px; font-weight:900; margin-top:6px;">${fmtEUR(reste)}</div>
  `;

  return reste;
}

function buildUI(){
  $("app").innerHTML = `
    <h2>Tableau de Bord</h2>

    <div id="cardSimu" class="card">
      <div class="sub-title">Simulateur Budget</div>

      <label>Salaire : <input type="number" id="salaire" value="2006" step="0.01"></label>
      <label>Pension : <input type="number" id="pension" value="180" step="0.01"></label>
      <label>CAF : <input type="number" id="caf" value="355" step="0.01"></label>
      <label>Loyer : <input type="number" id="loyer" value="605" step="0.01"></label>
      <label>Épargne : <input type="number" id="epargne" value="500" step="0.01"></label>

      <label>Mois (pour dépenses variables) :
        <input type="month" id="moisSel" value="${getNowFrenchMonthKey()}">
      </label>

      <button class="primary" id="btnCalculer">Calculer</button>

      <div id="resultat" class="result"></div>
    </div>

    <div style="height:18px;"></div>

    <div id="cardDepenses" class="card">
      <div class="sub-title">Dépenses (variables)</div>

      <label>Montant (€) : <input type="number" id="mDepense" step="0.01"></label>

      <label>Catégorie :
        <select id="catDepense">
          <option>Courses</option>
          <option>Loisirs</option>
          <option>Médecins</option>
          <option>Restaurant</option>
          <option>Vacances</option>
          <option>Autres</option>
        </select>
      </label>

      <button class="primary" id="btnAjouterDepense">Ajouter</button>

      <div class="spacer"></div>

      <div class="sub-title">Totaux mensuels (par catégorie)</div>
      <div id="depensesResult" class="resultRows"></div>

      <div class="spacer"></div>

      <button class="secondary" id="btnMaj">Mettre à jour le simulateur</button>
    </div>
  `;

  const depCss = `
    .card{ margin-top:12px; padding:16px; background:#fff; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.06); }
    .sub-title{ font-weight:900; margin-bottom:10px; }
    .primary{ width:100%; padding:12px; background:#2563eb; color:#fff; border:none; border-radius:10px; font-size:16px; cursor:pointer; margin-top:12px; }
    .secondary{ width:100%; padding:12px; background:#e5e7eb; color:#111; border:none; border-radius:10px; font-size:16px; cursor:pointer; margin-top:12px; }
    .result{ margin-top:14px; padding:14px; background:#e0f2fe; border-radius:10px; color:#075985; text-align:center; font-weight:800; }
    .spacer{ height:14px; }
    .resultRows{ margin-top:8px; background:#f9fafb; border-radius:10px; padding:10px; }
    .row{ display:flex; justify-content:space-between; gap:12px; padding:8px 4px; border-bottom:1px solid #eef2f7; }
    .row:last-child{ border-bottom:none; }
    .badge{ padding:6px 10px; border-radius:999px; font-weight:900; font-size:12px; display:inline-block; }
    .badge.ok{ background:#dcfce7; color:#14532d; }
    .badge.bad{ background:#fee2e2; color:#7f1d1d; }
    select, input[type="number"], input[type="month"]{
      width: 100%;
      margin-top:6px;
      padding:8px 10px;
      border:1px solid #e5e7eb;
      border-radius:10px;
      background:#fff;
      box-sizing:border-box;
    }
  `;

  const styleEl = document.createElement("style");
  styleEl.innerHTML = depCss;
  document.head.appendChild(styleEl);
}

function wireEvents(){
  $("btnCalculer").addEventListener("click", () => {
    calculerReste();
  });

  $("btnMaj").addEventListener("click", () => {
    renderDepenses(loadDepenses());
    calculerReste();
  });

  $("moisSel").addEventListener("change", () => {
    renderDepenses(loadDepenses());
    calculerReste();
  });

  $("btnAjouterDepense").addEventListener("click", () => {
    const montant = safeNum($("mDepense").value);
    const categorie = $("catDepense").value;
    const mois = $("moisSel").value;

    if (!montant || montant <= 0){
      alert("Entrez un montant supérieur à 0.");
      return;
    }
    if (!mois){
      alert("Choisissez un mois.");
      return;
    }

    const depenses = loadDepenses();
    depenses.push({
      id: (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
      montant,
      categorie,
      mois,
      dateAjout: new Date().toISOString()
    });
    saveDepenses(depenses);

    $("mDepense").value = "";
    renderDepenses(depenses);
    calculerReste();
  });
}

function start(){
  buildUI();
  wireEvents();
  const depenses = loadDepenses();
  renderDepenses(depenses);
  calculerReste();
}

document.addEventListener("DOMContentLoaded", start);
