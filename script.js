const CONFIG = {
    // Certifique-se de que esta URL é a da sua última implantação (Deployment)
    SHEETS_API: "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec",
    SVG_URL: "MapChart_Map.svg"
};

document.addEventListener('DOMContentLoaded', async () => {
    const mapContainer = document.getElementById('map-container');
    const tooltip = document.getElementById('tooltip');

    async function start() {
        try {
            // 1. CARREGAR SVG
            tooltip.innerHTML = "Injetando mapa geográfico...";
            const svgRes = await fetch(CONFIG.SVG_URL);
            if (!svgRes.ok) throw new Error("Arquivo SVG não encontrado.");
            mapContainer.innerHTML = await svgRes.text();

            // 2. CARREGAR DADOS DO GOOGLE SHEETS
            tooltip.innerHTML = "Sincronizando base de dados...";
            const dataRes = await fetch(CONFIG.SHEETS_API, { redirect: 'follow' });
            const rawData = await dataRes.json();

            // 3. PROCESSAR E AGRUPAR DADOS
            const coverageMap = {};
            
            rawData.forEach(row => {
                // Pega o valor da coluna "Paths 2" (ex: "Argentina M612...")
                let rawPath = String(row['Paths 2'] || "").trim();
                if (!rawPath) return;

                // LIMPEZA: Pega apenas o texto antes do código de desenho " M"
                // Ex: "Costa Rica M469..." vira "Costa Rica"
                let countryPart = rawPath.split(/ M/)[0].trim();

                // NORMALIZAÇÃO: Troca espaços por underline para bater com o SVG do MapChart
                // Ex: "Costa Rica" vira "Costa_Rica"
                let cleanId = countryPart.replace(/\s+/g, '_').toLowerCase();

                if (!coverageMap[cleanId]) coverageMap[cleanId] = [];
                coverageMap[cleanId].push(row);
            });

            // 4. APLICAR INTERATIVIDADE NO MAPA
            const allPaths = Array.from(document.querySelectorAll('path'));
            let activeCount = 0;

            Object.keys(coverageMap).forEach(idPlanilha => {
                // Busca o país no SVG comparando com o 'title' ou 'id'
                const el = allPaths.find(p => {
                    const title = (p.getAttribute('title') || "").toLowerCase();
                    const idAttr = (p.id || "").toLowerCase();
                    return title === idPlanilha || idAttr === idPlanilha;
                });

                if (el) {
                    activeCount++;
                    el.classList.add('pais-ativo'); // Estilo definido no CSS
                    
                    // Eventos de Mouse
                    el.onmouseenter = () => {
                        const partners = coverageMap[idPlanilha];
                        // Pega o nome real do país da primeira linha do grupo
                        const countryDisplay = partners[0].Country || idPlanilha.replace(/_/g, ' ');

                        let html = `<div class="tooltip-title">${countryDisplay.toUpperCase()}</div>`;
                        
                        partners.forEach(p => {
                            html += `
                                <div class="partner-entry">
                                    <span class="partner-name">🚩 ${p['Partner Name'] || 'Partner'}</span>
                                    <div class="partner-details">
                                        <b>Rede:</b> ${p['Mobile Network'] || 'N/A'}<br>
                                        <b>Tech:</b> ${p.Tech || 'N/A'} | <b>VoLTE:</b> ${p.VoLTE || 'N/A'}<br>
                                        <small style="color:#888;">Freq: ${p.Frequencies || 'N/A'}</small>
                                    </div>
                                </div>`;
                        });
                        tooltip.innerHTML = html;
                    };

                    el.onmouseleave = () => {
                        tooltip.innerHTML = "Passe o mouse sobre um país destacado.";
                    };
                } else {
                    console.warn(`Não foi possível vincular o país: ${idPlanilha}`);
                }
            });

            // Mensagem final de carregamento
            tooltip.innerHTML = activeCount > 0 
                ? "Mapa atualizado! Passe o mouse sobre os países verdes." 
                : "Aviso: Verifique se os nomes na coluna 'Paths 2' coincidem com o mapa.";

        } catch (error) {
            console.error("Erro técnico:", error);
            tooltip.innerHTML = `<span style="color:#ff4444;">❌ Erro: ${error.message}</span>`;
        }
    }

    start();
});
