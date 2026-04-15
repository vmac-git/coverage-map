const CONFIG = {
    SHEETS_API: "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec",
    SVG_URL: "MapChart_Map.svg",
    USA_TXT_URL: "united_states.txt" // O arquivo que você criou
};

document.addEventListener('DOMContentLoaded', async () => {
    const mapContainer = document.getElementById('map-container');
    const tooltip = document.getElementById('tooltip');

    async function start() {
        try {
            // 1. CARREGAR SVG E CONTEÚDO DO TXT DOS EUA (EM PARALELO)
            const [svgRes, usaTxtRes, dataRes] = await Promise.all([
                fetch(CONFIG.SVG_URL),
                fetch(CONFIG.USA_TXT_URL).then(r => r.text()).catch(() => ""),
                fetch(CONFIG.SHEETS_API, { redirect: 'follow' }).then(r => r.json())
            ]);

            mapContainer.innerHTML = await svgRes.text();
            const usaGeomCode = usaTxtRes.trim();

            // 2. ORGANIZAR DADOS DA PLANILHA
            const coverageMap = {};
            dataRes.forEach(row => {
                let rawPath = String(row['Paths 2'] || "").trim();
                let cleanId = "";

                // Verifica se é United States pelo nome ou se o Paths 2 está vazio/curto
                const isUSA = String(row['Country']).toLowerCase().includes("united states");

                if (isUSA) {
                    cleanId = "united_states"; 
                } else {
                    let countryPart = rawPath.split(/ M/)[0].trim();
                    cleanId = countryPart.replace(/\s+/g, '_').toLowerCase();
                }

                if (!cleanId) return;
                if (!coverageMap[cleanId]) coverageMap[cleanId] = [];
                coverageMap[cleanId].push(row);
            });

            // 3. INTERATIVIDADE
            const allPaths = Array.from(document.querySelectorAll('path'));

            Object.keys(coverageMap).forEach(idPlanilha => {
                let el;

                if (idPlanilha === "united_states") {
                    // BUSCA ESPECIAL PARA EUA: Tenta pelo ID ou pelo conteúdo do TXT
                    el = allPaths.find(p => 
                        p.id.toLowerCase() === "united_states" || 
                        p.getAttribute('title')?.toLowerCase() === "united states" ||
                        (usaGeomCode && p.getAttribute('d')?.startsWith(usaGeomCode.substring(0, 50)))
                    );
                } else {
                    // Busca padrão para os outros países
                    el = allPaths.find(p => {
                        const title = (p.getAttribute('title') || "").toLowerCase();
                        const idAttr = (p.id || "").toLowerCase();
                        return title === idPlanilha || idAttr === idPlanilha;
                    });
                }

                if (el) {
                    el.classList.add('pais-ativo');

                    el.onclick = () => {
                        const anterior = document.querySelector('.pais-selecionado');
                        if (anterior) anterior.classList.remove('pais-selecionado');
                        el.classList.add('pais-selecionado');

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
                                        <small style="color:#00ff88;">Freq: ${p.Frequencies}</small>
                                    </div>
                                </div>`;
                        });

                        tooltip.innerHTML = html;
                        tooltip.scrollTop = 0;

                        document.getElementById('btn-close').onclick = (e) => {
                            e.stopPropagation();
                            el.classList.remove('pais-selecionado');
                            tooltip.innerHTML = "📍 Selecione um país no mapa para ver os detalhes.";
                        };
                    };
                }
            });

            tooltip.innerHTML = "📍 Mapa carregado com suporte especial para EUA.";

        } catch (error) {
            console.error(error);
            tooltip.innerHTML = "❌ Erro ao carregar mapa ou dados.";
        }
    }
    start();
});
