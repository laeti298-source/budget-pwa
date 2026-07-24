document.getElementById('app').innerHTML = `
    <h2>Simulateur Budget</h2>
    <label>Salaire : <input type="number" id="salaire" value="2006"></label>
    <label>Pension : <input type="number" id="pension" value="180"></label>
    <label>CAF : <input type="number" id="caf" value="355"></label>
    <label>Loyer : <input type="number" id="loyer" value="605"></label>
    <label>Épargne : <input type="number" id="epargne" value="500"></label>
    <button onclick="calculer()">Calculer</button>
    <div id="resultat" style="margin-top:20px; font-weight:bold;"></div>
`;

function calculer() {
    const s = parseFloat(document.getElementById('salaire').value);
    const p = parseFloat(document.getElementById('pension').value);
    const c = parseFloat(document.getElementById('caf').value);
    const l = parseFloat(document.getElementById('loyer').value);
    const e = parseFloat(document.getElementById('epargne').value);
    
    const totalRevenus = s + p + c;
    const totalDepenses = l + e + 250;
    const reste = totalRevenus - totalDepenses;
    
    document.getElementById('resultat').innerHTML = 'Reste après charges et épargne : ' + reste + ' €';
}
