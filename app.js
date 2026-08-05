const STORAGE_KEY = "budget_depenses_v2";
const STORAGE_KEY_BASE = "budget_base_v1";
const STORAGE_KEY_SOLDES = "budget_soldes_v1";

// Valeurs par défaut (utilisées uniquement si rien n'a encore été enregistré)
const DEFAULT_BASE = {
  salaire: 2006,
  pension: 180,
  caf: 355,
  loyer: 605,
  prelevements: 154.78,
  epargne: 500
};

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

// Renvoie la clé "YYYY-MM" du mois précédent celui passé en paramètre
function getPrevMonthKey(moisKey){
  const [y, m] = moisKey.split("-").map(Number);
  let py = y, pm = m - 1;
  if (pm === 0){ pm = 12; py = y - 1; }
  return `${py}-${String(pm).padStart(2, "0")}`;
}

// ---- Dépenses variables ----
function loadDepenses(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveDepenses(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// ---- Montants de base (salaire, loyer, etc.) ----
function loadBase(){
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_BASE) || "null");
    return Object.assign({}, DEFAULT_BASE, saved || {});
  } catch {
    return Object.assign({}, DEFAULT_BASE);
  }
}
function saveBase(base){
  localStorage.setItem(STORAGE_KEY_BASE, JSON.stringify(base));
}
function saveBaseFromInputs(){
  const base = {
    salaire: safeNum($("salaire").value),
    pension: safeNum($("pension").value),
    caf: safeNum($("caf").value),
    loyer: safeNum($("loyer").value),
    prelevements: safeNum($("prelevements").value),
    epargne: safeNum($("epargne").value)
  };
  saveBase(base);
}

// ---- Soldes mensuels (pour le report d'un mois sur l'autre) ----
function loadSoldes(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_SOLDES) || "{}"); }
  catch { return {}; }
}
function saveSoldes(soldes){
  localStorage.setItem(STORAGE_KEY_SOLDES, JSON.stringify(soldes));
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
  // On sauvegarde toujours les montants de base au moment du calcul,
  // pour ne jamais perdre ce qui a été saisi.
  saveBaseFromInputs();

  const depenses = loadDepenses();
  const mois = $("moisSel").value;

  const salaire = safeNum($("salaire").value);
  const pension = safeNum($("pension").value);
  const caf = safeNum($("caf").value);
  const loyer = safeNum($("loyer").value);
  const prelevements = safeNum($("prelevements").value);
  const epargne = safeNum($("epargne").value);

  const revenus = salaire + pension + caf;

  // Fixes (loyer + prélèvements)
  const chargesFixes = loyer + prelevements;

  // Courses "fixes" (tu avais 250 €/mois)
  const coursesFixes = 250;

  // Dépenses variables ajoutées par toi pour le mois sélectionné
  const variables = totalDepensesVariable(depenses, mois);

  // Total = chargesFixes + épargne + coursesFixes + variables
  const totalDepenses = chargesFixes + epargne + coursesFixes + variables;

  const resteBrut = revenus - totalDepenses;

  // Report du solde du mois précédent (déficit ou excédent)
  const soldes = loadSoldes();
  const moisPrecedent = getPrevMonthKey(mois);
  const report = soldes[moisPrecedent] !== undefined ? soldes[moisPrecedent] : 0;

  const reste = resteBrut + report;

  // On enregistre le solde de ce mois pour qu'il puisse être repris par le mois suivant
  soldes[mois] = reste;
  saveSoldes(soldes);

  const badge = reste >= 0
    ? `<span class="badge ok">OK</span>`
    : `<span class="badge bad">Déficit</span>`;

  const ligneReport = report !== 0
    ? `<div style="font-size:13px; margin-top:4px; opacity:0.8;">
         Dont report du mois précédent : ${report >= 0 ? "+" : ""}${fmtEUR(report)}
       </div>`
    : "";

  $("resultat").innerHTML = `
    <div style="margin-bottom:8px;">${badge}</div>
    <div>Reste après charges + épargne + dépenses variables (${mois})</div>
    <div style="font-size:22px; font-weight:900; margin-top:6px;">${fmtEUR(reste)}</div>
    ${ligneReport}
  `;

  return reste;
}

function buildUI(){
  const base = loadBase();

  $("app").innerHTML = `
    <h2>Tableau de Bord</h2>

    <div id="cardSimu" class="card">
      <div class="sub-title">Simulateur Budget</div>

      <label>Salaire : <input type="number" id="salaire" value="${base.salaire}" step="0.01"></label>
      <label>Pension : <input type="number" id="pension" value="${base.pension}" step="0.01"></label>
      <label>CAF : <input type="number" id="caf" value="${base.caf}" step="0.01"></label>
      <label>Loyer : <input type="number" id="loyer" value="${base.loyer}" step="0.01"></label>

      <label>Prélèvements : <input type="number" id="prelevements" value="${base.prelevements}" step="0.01"></label>

      <label>Épargne : <input type="number" id="epargne" value="${base.epargne}" step="0.01"></label>

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

  // Sauvegarde automatique des montants de base dès qu'un champ est modifié,
  // pour qu'ils ne se réinitialisent plus jamais.
  ["salaire", "pension", "caf", "loyer", "prelevements", "epargne"].forEach(id => {
    $(id).addEventListener("input", () => {
      saveBaseFromInputs();
    });
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

start();
