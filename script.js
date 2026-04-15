const CONFIG = {
    SHEETS_API: "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec",
    SVG_URL: "MapChart_Map.svg"
};

document.addEventListener('DOMContentLoaded', async () => {
    const mapContainer = document.getElementById('map-container');
    const tooltip = document.getElementById('tooltip');

    async function start() {
        try {
            // 1. CARREGAR SVG
            const svgRes = await fetch(CONFIG.SVG_URL);
            mapContainer.innerHTML = await svgRes.text();

            // 2. CARREGAR DADOS
            const dataRes = await fetch(CONFIG.SHEETS_API, { redirect: 'follow' });
            const rawData = await dataRes.json();

            // 3. ORGANIZAR DADOS (Lógica do Split corrigida)
            const coverageMap = {};
            rawData.forEach(row => {
                let rawPath = String(row['Paths 2'] || "").trim();
                if (!rawPath) return;

                let countryPart = rawPath.split(/ M/)[0].trim();
                let cleanId = countryPart.replace(/\s+/g, '_').toLowerCase();

                if (!coverageMap[cleanId]) coverageMap[cleanId] = [];
                coverageMap[cleanId].push(row);
            });

            // 4. INTERATIVIDADE POR CLIQUE
            const allPaths = Array.from(document.querySelectorAll('path'));

            Object.keys(coverageMap).forEach(idPlanilha => {
                const el = allPaths.find(p => {
                    const title = (p.getAttribute('title') || "").toLowerCase();
                    const idAttr = (p.id || "").toLowerCase();
                    return title === idPlanilha || idAttr === idPlanilha;
                });

                if (el) {
                    el.classList.add('pais-ativo');

                    el.onclick = () => {
                        // Limpar seleção anterior
                        const anterior = document.querySelector('.pais-selecionado');
                        if (anterior) anterior.classList.remove('pais-selecionado');

                        // Destacar novo país
                        el.classList.add('pais-selecionado');

                        // Montar conteúdo
                        const partners = coverageMap[idPlanilha];
                        const countryDisplay = partners[0].Country || idPlanilha.replace(/_/g, ' ');

                        let html = `
                            <div class="tooltip-header">
                                <span class="tooltip-title">${countryDisplay.toUpperCase()}</span>
                                <button id="btn-close" style="background:none; border:none; color:#ff4444; cursor:pointer; font-size:1.5rem;">&times;</button>
                            </div>`;

                        partners.forEach(p => {
                            html += `
                                <div class="partner-entry">
                                    <span class="partner-name">🚩 ${p['Partner Name']}</span>
                                    <div class="partner-details">
                                        <b>Rede:</b> ${p['Mobile Network']}<br>
                                        <b>Tech:</b> ${p.Tech} | <b>VoLTE:</b> ${p.VoLTE}<br>
                                        <small style="color:#00ff88;">Frequências: ${p.Frequencies}</small>
                                    </div>
                                </div>`;
                        });

                        tooltip.innerHTML = html;
                        tooltip.scrollTop = 0; // Volta o scroll pro topo

                        // Lógica do botão fechar
                        document.getElementById('btn-close').onclick = (e) => {
                            e.stopPropagation(); // Impede de clicar no mapa atrás
                            el.classList.remove('pais-selecionado');
                            tooltip.innerHTML = "📍 Selecione um país no mapa para ver os detalhes.";
                        };
                    };
                }
            });

            tooltip.innerHTML = "📍 Pronto! Clique nos países destacados em verde.";

        } catch (error) {
            console.error(error);
            tooltip.innerHTML = "❌ Erro ao carregar mapa ou dados.";
        }
    }
    start();
});
