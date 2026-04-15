const CONFIG = {
    SHEETS_API: "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec",
    SVG_URL: "MapChart_Map.svg"
};

document.addEventListener('DOMContentLoaded', async () => {
    const mapContainer = document.getElementById('map-container');
    const tooltip = document.getElementById('tooltip');

    async function start() {
        try {
            // 1. Carrega o SVG do MapChart
            const svgRes = await fetch(CONFIG.SVG_URL);
            if (!svgRes.ok) throw new Error("Erro ao carregar SVG");
            mapContainer.innerHTML = await svgRes.text();

            // 2. Carrega os dados do Google Sheets
            tooltip.innerHTML = "Sincronizando base de dados...";
            const dataRes = await fetch(CONFIG.SHEETS_API, { redirect: 'follow' });
            const rawData = await dataRes.json();

            // 3. AGRUPAMENTO: Transforma a lista em um dicionário de países
            const coverageMap = rawData.reduce((acc, row) => {
                const country = row.Country;
                if (!acc[country]) acc[country] = [];
                acc[country].push(row);
                return acc;
            }, {});

            tooltip.innerHTML = "Passe o mouse sobre um país para ver os parceiros";

            // 4. APLICAÇÃO NO MAPA
            Object.keys(coverageMap).forEach(countryName => {
                const partners = coverageMap[countryName];
                // Busca o elemento no SVG pelo atributo 'title'
                const countryPath = document.querySelector(`path[title="${countryName}" i]`);

                if (countryPath) {
                    // Pinta o país que tem cobertura
                    countryPath.style.setProperty('fill', '#00ff88', 'important');
                    countryPath.style.fillOpacity = "0.4";

                    countryPath.onmouseenter = () => {
                        countryPath.style.fillOpacity = "0.8";
                        
                        // CONSTRUÇÃO DO CONTEÚDO DO TOOLTIP
                        let html = `<div class="tooltip-header">${countryName}</div>`;
                        
                        partners.forEach(p => {
                            html += `
                                <div class="partner-row">
                                    <span class="partner-name">${p['Partner Name']}</span>
                                    <span class="partner-info">${p.Tech} | VoLTE: ${p.VoLTE}</span>
                                </div>
                            `;
                        });

                        tooltip.innerHTML = html;
                    };

                    countryPath.onmouseleave = () => {
                        countryPath.style.fillOpacity = "0.4";
                        tooltip.innerHTML = "Passe o mouse sobre um país";
                    };
                }
            });

        } catch (error) {
            console.error("Erro técnico:", error);
            tooltip.innerHTML = "Erro ao conectar com a planilha ou carregar mapa.";
        }
    }

    start();
});
