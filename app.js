const STORAGE_KEY = "budget_depenses_v1";

// Utilitaires
function $(id){ return document.getElementById(id); }
function safeNum(v){ const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }
function fmtEUR(n){
  const x = Math.round(n * 100) / 100;
  return x.toLocaleString("fr-FR") + " €";
}

function getNowFrenchMonthKey(){
  // YYYY-MM
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function loadDepenses(){
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveDepenses(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function sumByCategory(depenses, mois){
  // renvoie { cat: total }
  const out = {};
  depenses
    .filter(d => d.mois === mois)
    .forEach(d => {
      out[d.categorie] = (out[d.categorie] || 0) + d.montant;
    });
  return out;
}

function renderDepenses(depenses){
  const mois = $("moisSel").value;

  const totals = sumByCategory(depenses, mois);
  const categories = Object.keys(totals).length
    ? Object.keys(totals)
    : ["Courses", "Loisirs", "Médecins", "Restaurant", "Vacances", "Autres"];

  $("depensesResult").innerHTML = "";

  let globalTotal = 0;
  categories.forEach(cat => {
    const t = totals[cat] || 0;
    globalTotal += t;

    // Pour l’instant: pas de budget mensuel par catégorie (donc statut vide).
    // On affiche seulement le total, comme tu l’as demandé.
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
    <div style="font-weight:800">Total</div>
    <div style="font-weight:800">${fmtEUR(globalTotal)}</div>
  `;
  $("depensesResult").appendChild(totalRow);
}

function buildUI(){
  $("app").innerHTML = `
    <h2>Simulateur Budget</h2>

    <div class="card" id="cardSimu">
      <div class="sub-title">Revenus et charges</div>
      <div class="grid">
        <label>Salaire : <input type="number" id="salaire" value="2006" step="0.01"></label>
        <label>Pension : <input type="number" id="pension" value="180" step="0.01"></label>
        <label>CAF : <input type="number" id="caf" value="355" step="0.01"></label>
        <label>Loyer : <input type="number" id="loyer" value="605" step="0.01"></label>
        <label>Épargne : <input type="number" id="epargne" value="500" step="0.01"></label>
      </div>

      <button class="primary" id="btnCalculer">Calculer</button>
      <div id="resultat" class="result"></div>

      <div class="spacer"></div>
      <button class="secondary" id="btnGoDepenses">Aller aux Dépenses</button>
    </div>

    <h2 style="margin-top:28px;">Dépenses</h2>

    <div class="card" id="cardDepenses" style="display:none;">
      <div class="sub-title">Ajouter une dépense</div>

      <div class="grid">
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

        <label>Mois :
          <input type="month" id="moisSel" value="${getNowFrenchMonthKey()}">
        </label>
      </div>

      <button class="primary" id="btnAjouterDepense">Ajouter</button>

      <div class="spacer"></div>
      <div class="sub-title">Totaux mensuels (par catégorie)</div>
      <div id="depensesResult" class="resultRows"></div>

      <div class="spacer"></div>
      <button class="secondary" id="btnRetourSimu">Retour Simulateur</button>
    </div>
  `;
}

function wireEvents(){
  // simulateur
  $("btnCalculer").addEventListener("click", () => {
    const salaire = safeNum($("salaire").value);
    const pension = safeNum($("pension").value);
    const caf = safeNum($("caf").value);
    const loyer = safeNum($("loyer").value);
    const epargne = safeNum($("epargne").value);
    const courses = 250;

    const revenus = salaire + pension + caf;
    const depenses = loyer + epargne + courses;
    const reste = revenus - depenses;

    $("resultat").innerHTML = `Reste après charges et épargne : <b>${fmtEUR(reste)}</b>`;
  });

  // navigation
  $("btnGoDepenses").addEventListener("click", () => {
    $("cardSimu").style.display = "none";
    $("cardDepenses").style.display = "block";

    const depenses = loadDepenses();
    renderDepenses(depenses);
  });

  $("btnRetourSimu").addEventListener("click", () => {
    $("cardDepenses").style.display = "none";
    $("cardSimu").style.display = "block";
  });

  // ajouter depense
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
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      montant,
      categorie,
      mois,
      dateAjout: new Date().toISOString()
    });
    saveDepenses(depenses);

    // reset champs simples
    $("mDepense").value = "";
    renderDepenses(depenses);
  });

  // change mois
  $("moisSel").addEventListener("change", () => {
    const depenses = loadDepenses();
    renderDepenses(depenses);
  });
}

function start(){
  // injection UI
  buildUI();

  // style additions (au cas où)
  // (on évite de toucher style.css pour l’instant)
  const depCss = `
    .card{ margin-top:12px; padding:16px; background:#fff; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.06); }
    .sub-title{ font-weight:800; margin-bottom:10px; }
    .grid{ display:flex; flex-direction:column; gap:12px; }
    .primary{ width:100%; padding:12px; background:#2563eb; color:#fff; border:none; border-radius:10px; font-size:16px; cursor:pointer; }
    .secondary{ width:100%; padding:12px; background:#e5e7eb; color:#111; border:none; border-radius:10px; font-size:16px; cursor:pointer; }
    .result{ margin-top:14px; padding:14px; background:#e0f2fe; border-radius:10px; color:#075985; text-align:center; font-weight:700; }
    .spacer{ height:14px; }
    .resultRows{ margin-top:8px; background:#f9fafb; border-radius:10px; padding:10px; }
    .row{ display:flex; justify-content:space-between; gap:12px; padding:8px 4px; border-bottom:1px solid #eef2f7; }
    .row:last-child{ border-bottom:none; }
  `;
  const styleEl = document.createElement("style");
  styleEl.innerHTML = depCss;
  document.head.appendChild(styleEl);

  wireEvents();

  // initial render
  $("cardDepenses").style.display = "none";
}

document.addEventListener("DOMContentLoaded", start);
