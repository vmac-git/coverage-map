const CONFIG = {
    SHEETS_API: "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec",
    SVG_URL: "MapChart_Map.svg"
};

document.addEventListener('DOMContentLoaded', async () => {
    const mapContainer = document.getElementById('map-container');
    const tooltip = document.getElementById('tooltip');
    let currentActiveCountry = null; // Evita flickering por atualização repetida

    async function start() {
        try {
            // 1. CARREGA MAPA
            const svgRes = await fetch(CONFIG.SVG_URL);
            mapContainer.innerHTML = await svgRes.text();

            // 2. CARREGA DADOS
            const dataRes = await fetch(CONFIG.SHEETS_API, { redirect: 'follow' });
            const rawData = await dataRes.json();

            // 3. ORGANIZA DADOS
            const coverageMap = {};
            rawData.forEach(row => {
                let rawPath = String(row['Paths 2'] || "").trim();
                if (!rawPath) return;

                // Extrai nome do país (antes do " M") e normaliza para o SVG (underline)
                let countryPart = rawPath.split(/ M/)[0].trim();
                let cleanId = countryPart.replace(/\s+/g, '_').toLowerCase();

                if (!coverageMap[cleanId]) coverageMap[cleanId] = [];
                coverageMap[cleanId].push(row);
            });

            // 4. INTERATIVIDADE
            const allPaths = Array.from(document.querySelectorAll('path'));

            Object.keys(coverageMap).forEach(idPlanilha => {
                const el = allPaths.find(p => {
                    const title = (p.getAttribute('title') || "").toLowerCase();
                    const idAttr = (p.id || "").toLowerCase();
                    return title === idPlanilha || idAttr === idPlanilha;
                });

                if (el) {
                    el.classList.add('pais-ativo');
                    
                    el.onmouseenter = () => {
                        // Só processa se o mouse mudar de um país para outro
                        if (currentActiveCountry === idPlanilha) return;
                        currentActiveCountry = idPlanilha;

                        const partners = coverageMap[idPlanilha];
                        const countryDisplay = partners[0].Country || idPlanilha.replace(/_/g, ' ');

                        let html = `<div class="tooltip-title">${countryDisplay.toUpperCase()}</div>`;
                        partners.forEach(p => {
                            html += `
                                <div class="partner-entry">
                                    <span class="partner-name">🚩 ${p['Partner Name'] || 'Parceiro'}</span>
                                    <div class="partner-details">
                                        <b>Rede:</b> ${p['Mobile Network']}<br>
                                        <b>Tech:</b> ${p.Tech} | <b>VoLTE:</b> ${p.VoLTE}
                                    </div>
                                </div>`;
                        });
                        tooltip.innerHTML = html;
                    };

                    el.onmouseleave = () => {
                        currentActiveCountry = null;
                        tooltip.innerHTML = "Passe o mouse sobre um país destacado.";
                    };
                }
            });

            tooltip.innerHTML = "Mapa carregado. Passe o mouse nos países destacados.";

        } catch (error) {
            console.error(error);
            tooltip.innerHTML = "Erro ao carregar dados.";
        }
    }
    start();
});
