const CONFIG = {
    SHEETS_API: "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec",
    SVG_URL: "MapChart_Map.svg"
};

// FUNÇÃO TRADUTORA: Ajusta o nome da planilha para o formato do SVG
function normalizeCountryName(name) {
    if (!name) return "";
    let n = name.trim();

    // Dicionário de exceções (Planilha : SVG)
    const manualFixes = {
        "United States": "United_States_of_America",
        "Antigua & Barbuda": "Antigua_and_Barbuda",
        "Curacao": "CuraÃ§ao", // Ajustado para o caractere estranho do seu SVG
        "St. Kitts & Nevis": "St_Kitts_and_Nevis",
        "St. Lucia": "St_Lucia",
        "St. Vincent & Grenadines": "St_Vincent_and_the_Grenadines",
        "Trinidad & Tobago": "Trinidad_and_Tobago",
        "British Virgin Islands": "British_Virgin_Islands",
        "Turks & Caicos Islands": "Turks_and_Caicos_Islands",
        "French Guiana": "French_Guiana",
        "Costa Rica": "Costa_Rica",
        "El Salvador": "El_Salvador",
        "Dominican Republic": "Dominican_Republic"
    };

    if (manualFixes[n]) return manualFixes[n];

    // Regra geral: Troca espaços por underlines para os demais
    return n.replace(/\s+/g, '_');
}

document.addEventListener('DOMContentLoaded', async () => {
    const mapContainer = document.getElementById('map-container');
    const tooltip = document.getElementById('tooltip');

    async function start() {
        try {
            const svgRes = await fetch(CONFIG.SVG_URL);
            mapContainer.innerHTML = await svgRes.text();

            const dataRes = await fetch(CONFIG.SHEETS_API, { redirect: 'follow' });
            const rawData = await dataRes.json();

            // Agrupa os dados
            const coverageMap = {};
            rawData.forEach(row => {
                const sheetName = row.Country;
                const svgName = normalizeCountryName(sheetName);
                
                if (!coverageMap[svgName]) coverageMap[svgName] = [];
                coverageMap[svgName].push(row);
            });

            // Aplica interatividade
            Object.keys(coverageMap).forEach(svgName => {
                // Tenta encontrar o path pelo title exato do SVG
                const countryPath = document.querySelector(`path[title="${svgName}"]`);

                if (countryPath) {
                    countryPath.style.setProperty('fill', '#00ff88', 'important');
                    countryPath.style.fillOpacity = "0.4";

                    countryPath.onmouseenter = () => {
                        countryPath.style.fillOpacity = "0.8";
                        const partners = coverageMap[svgName];
                        // Exibe o nome original da planilha no título do tooltip
                        let html = `<div style="font-weight:bold; color:#00ff88; border-bottom:1px solid #444; margin-bottom:8px;">${partners[0].Country}</div>`;
                        
                        partners.forEach(p => {
                            html += `
                                <div style="margin-bottom: 8px; font-size: 13px;">
                                    <strong>${p['Partner Name']}</strong><br>
                                    <small>${p.Tech} | VoLTE: ${p.VoLTE}</small>
                                </div>`;
                        });
                        tooltip.innerHTML = html;
                    };

                    countryPath.onmouseleave = () => {
                        countryPath.style.fillOpacity = "0.4";
                        tooltip.innerHTML = "Passe o mouse sobre um país";
                    };
                } else {
                    console.warn(`Não linkado: ${svgName}`);
                }
            });

        } catch (error) {
            tooltip.innerHTML = "Erro ao carregar dados.";
        }
    }
    start();
});
