const CONFIG = {
    SHEETS_API: "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec", // COLOQUE SUA URL AQUI
    SVG_URL: "MapChart_Map.svg"
};

document.addEventListener('DOMContentLoaded', async () => {
    const mapContainer = document.getElementById('map-container');
    const tooltip = document.getElementById('tooltip');

    async function start() {
        try {
            // 1. Carregar SVG
            console.log("Tentando carregar o SVG...");
            const svgRes = await fetch(CONFIG.SVG_URL);
            if (!svgRes.ok) throw new Error("Arquivo SVG não encontrado no GitHub.");
            mapContainer.innerHTML = await svgRes.text();
            console.log("SVG carregado com sucesso.");

            // 2. Carregar Dados
            console.log("Tentando buscar dados do Google Sheets...");
            const dataRes = await fetch(CONFIG.SHEETS_API, { redirect: 'follow' });
            if (!dataRes.ok) throw new Error("Erro ao acessar a API do Google Sheets.");
            const rawData = await dataRes.json();
            console.log("Dados recebidos:", rawData);

            // 3. Agrupar Dados pela coluna "Paths"
            const coverageMap = {};
            rawData.forEach(row => {
                const id = row.Paths; 
                if (!id) return;
                if (!coverageMap[id]) coverageMap[id] = [];
                coverageMap[id].push(row);
            });

            tooltip.innerHTML = "Passe o mouse sobre os países destacados.";

            // 4. Aplicar nos Paths
            Object.keys(coverageMap).forEach(id => {
                // Tenta buscar por ID ou por TITLE (MapChart usa title como ID as vezes)
                const el = document.getElementById(id) || document.querySelector(`path[title="${id}" i]`);

                if (el) {
                    el.classList.add('pais-ativo'); // Aplica a cor do CSS

                    el.onmouseenter = () => {
                        el.style.fillOpacity = "1";
                        const partners = coverageMap[id];
                        let html = `<strong style="font-size:1.1rem; color:#00ff88;">${partners[0].Country}</strong><hr style="opacity:0.2">`;
                        
                        partners.forEach(p => {
                            html += `
                                <div style="margin-bottom:8px;">
                                    <strong>${p['Partner Name']}</strong><br>
                                    <small>${p.Tech} | VoLTE: ${p.VoLTE}</small>
                                </div>`;
                        });
                        tooltip.innerHTML = html;
                    };

                    el.onmouseleave = () => {
                        el.style.fillOpacity = "0.6";
                        tooltip.innerHTML = "Passe o mouse sobre os países destacados.";
                    };
                } else {
                    console.warn(`Atenção: O Path "${id}" da planilha não existe no SVG.`);
                }
            });

        } catch (error) {
            console.error("ERRO DETALHADO:", error);
            tooltip.innerHTML = `❌ Erro: ${error.message}`;
        }
    }

    start();
});
