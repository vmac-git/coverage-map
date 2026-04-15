const CONFIG = {
    SHEETS_API: "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec",
    SVG_URL: "MapChart_Map.svg"
};

document.addEventListener('DOMContentLoaded', async () => {
    const mapContainer = document.getElementById('map-container');
    const tooltip = document.getElementById('tooltip');

    async function start() {
        try {
            // 1. Carregar o SVG
            const svgRes = await fetch(CONFIG.SVG_URL);
            mapContainer.innerHTML = await svgRes.text();

            // 2. Carregar os Dados da Planilha
            const dataRes = await fetch(CONFIG.SHEETS_API, { redirect: 'follow' });
            const rawData = await dataRes.json();

            // 3. Agrupar dados usando o "Path" como chave
            const coverageMap = {};
            rawData.forEach(row => {
                const pathId = row.Paths; // Pega o valor da coluna "Paths"
                if (!pathId) return;
                
                if (!coverageMap[pathId]) coverageMap[pathId] = [];
                coverageMap[pathId].push(row);
            });

            // 4. Aplicar interatividade usando o seletor de ID ou Title do Path
            Object.keys(coverageMap).forEach(pathId => {
                // Tenta encontrar por ID (ex: id="BR") ou por Title (ex: title="Brazil")
                // Se sua coluna Paths tem o valor do atributo 'id' do SVG:
                let countryElement = document.getElementById(pathId) || 
                                     document.querySelector(`path[title="${pathId}" i]`) ||
                                     document.querySelector(`path[id="${pathId}"]`);

                if (countryElement) {
                    // Estilo de cobertura ativa
                    countryElement.style.setProperty('fill', '#00ff88', 'important');
                    countryElement.style.fillOpacity = "0.4";

                    countryElement.onmouseenter = () => {
                        countryElement.style.fillOpacity = "0.8";
                        countryElement.style.stroke = "#fff";
                        
                        const partners = coverageMap[pathId];
                        // Pega o nome do país da primeira linha encontrada
                        let html = `<div style="font-weight:bold; color:#00ff88; margin-bottom:8px; border-bottom:1px solid #444;">${partners[0].Country.toUpperCase()}</div>`;
                        
                        partners.forEach(p => {
                            html += `
                                <div style="margin-bottom: 10px; text-align: left;">
                                    <strong style="color: #fff;">🚩 ${p['Partner Name']}</strong><br>
                                    <small style="color: #00ff88;">${p.Tech} | VoLTE: ${p.VoLTE}</small><br>
                                    <small style="font-size: 10px; color: #aaa;">Frequencies: ${p.Frequencies}</small>
                                </div>`;
                        });
                        tooltip.innerHTML = html;
                    };

                    countryElement.onmouseleave = () => {
                        countryElement.style.fillOpacity = "0.4";
                        countryElement.style.stroke = "rgba(255, 255, 255, 0.2)";
                        tooltip.innerHTML = "Passe o mouse sobre um país ativo";
                    };
                }
            });

        } catch (error) {
            console.error("Erro:", error);
            tooltip.innerHTML = "Erro ao carregar mapa ou dados.";
        }
    }
    start();
});
