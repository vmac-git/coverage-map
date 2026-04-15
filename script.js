const CONFIG = {
    SHEETS_API: "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec",
    SVG_URL: "MapChart_Map.svg"
};

document.addEventListener('DOMContentLoaded', async () => {
    const mapContainer = document.getElementById('map-container');
    const tooltip = document.getElementById('tooltip');

    async function start() {
        try {
            // 1. Carregar SVG com timeout e log
            tooltip.innerHTML = "Carregando componentes visuais...";
            const svgRes = await fetch(CONFIG.SVG_URL);
            if (!svgRes.ok) throw new Error("SVG não encontrado. Verifique se o nome do arquivo está correto no GitHub.");
            
            const svgText = await svgRes.text();
            mapContainer.innerHTML = svgText;
            console.log("SVG Injetado.");

            // 2. Carregar Dados da Planilha
            tooltip.innerHTML = "Conectando à base de dados...";
            const dataRes = await fetch(CONFIG.SHEETS_API, { redirect: 'follow' });
            
            if (!dataRes.ok) throw new Error("Erro na rede ao acessar o Google Sheets.");
            const rawData = await dataRes.json();
            console.log("Dados carregados:", rawData.length, "linhas encontradas.");

            // 3. Processar Dados
            const coverageMap = {};
            rawData.forEach(row => {
                const id = String(row.Paths).trim();
                if (!id) return;
                if (!coverageMap[id]) coverageMap[id] = [];
                coverageMap[id].push(row);
            });

            // 4. Aplicar Interatividade
            let count = 0;
            Object.keys(coverageMap).forEach(id => {
                // Busca por ID, por Title ou por Data-Name (MapChart varia)
                const el = document.getElementById(id) || 
                           document.querySelector(`path[title="${id}" i]`) ||
                           document.querySelector(`path[id="${id}" i]`);

                if (el) {
                    count++;
                    el.classList.add('pais-ativo');

                    el.onmouseenter = () => {
                        const partners = coverageMap[id];
                        let html = `<span class="tooltip-title">${partners[0].Country}</span>`;
                        
                        partners.forEach(p => {
                            html += `
                                <div class="partner-entry">
                                    <span class="partner-name">🚩 ${p['Partner Name']}</span>
                                    <span class="partner-details">${p.Tech} | VoLTE: ${p.VoLTE}</span>
                                </div>`;
                        });
                        tooltip.innerHTML = html;
                    };

                    el.onmouseleave = () => {
                        tooltip.innerHTML = "Passe o mouse sobre um país destacado.";
                    };
                }
            });

            tooltip.innerHTML = count > 0 ? "Passe o mouse sobre os países destacados." : "Aviso: Nenhum país da planilha foi encontrado no mapa.";

        } catch (error) {
            console.error("ERRO:", error);
            tooltip.innerHTML = `<span style="color: #ff4444;">❌ Erro: ${error.message}</span><br><small>Verifique o console (F12)</small>`;
        }
    }

    start();
});
