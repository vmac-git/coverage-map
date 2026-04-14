const CONFIG = {
    SHEETS_API: "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec",
    SVG_URL: "MapChart_Map.svg" // Nome do arquivo SVG no seu repositório
};

document.addEventListener('DOMContentLoaded', async () => {
    const mapContainer = document.getElementById('map-container');
    const tooltip = document.getElementById('tooltip');

    async function start() {
        try {
            // 1. Carrega o arquivo SVG dinamicamente
            const svgRes = await fetch(CONFIG.SVG_URL);
            if (!svgRes.ok) throw new Error("Não foi possível carregar o arquivo SVG.");
            const svgText = await svgRes.text();
            mapContainer.innerHTML = svgText;

            // 2. Carrega os dados da Planilha
            tooltip.innerHTML = "Sincronizando parceiros...";
            const dataRes = await fetch(CONFIG.SHEETS_API, { redirect: 'follow' });
            const coverageData = await dataRes.json();

            tooltip.innerHTML = "Passe o mouse sobre um país";

            // 3. Mapeia e pinta os países
            coverageData.forEach(item => {
                const countryName = item.Country; 
                // Busca o path pelo atributo 'title' que o MapChart gera
                const countryPath = document.querySelector(`path[title="${countryName}" i]`);

                if (countryPath) {
                    // Estilo de cobertura ativa
                    countryPath.style.setProperty('fill', '#00ff88', 'important');
                    countryPath.style.fillOpacity = "0.5";

                    countryPath.onmouseenter = () => {
                        tooltip.innerHTML = `
                            <strong>${countryName}</strong> | Parceiro: ${item['Partner Name']}<br>
                            <small>Rede: ${item['Mobile Network']} | Tech: ${item.Tech}</small>
                        `;
                        countryPath.style.fillOpacity = "0.8";
                    };

                    countryPath.onmouseleave = () => {
                        tooltip.innerHTML = "Passe o mouse sobre um país";
                        countryPath.style.fillOpacity = "0.5";
                    };
                }
            });

        } catch (error) {
            console.error("Erro no processo:", error);
            tooltip.innerHTML = "Erro ao carregar mapa ou dados. Verifique o console (F12).";
        }
    }

    start();
});
