const CONFIG = {
    SHEETS_API: "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec",
    SVG_URL: "MapChart_Map.svg",
    USA_TXT_URL: "united_states.txt"
};

document.addEventListener('DOMContentLoaded', async () => {
    const mapContainer = document.getElementById('map-container');
    const tooltip = document.getElementById('tooltip');
    const overlay = document.getElementById('loader-overlay');

    function toggleLoader(show) {
        if (!show) {
            overlay.style.opacity = "0";
            setTimeout(() => { overlay.style.display = "none"; }, 500);
        }
    }

    async function start() {
        try {
            // 1. CARREGAMENTO PARALELO
            const [svgRes, usaTxtRes, dataRes] = await Promise.all([
                fetch(CONFIG.SVG_URL),
                fetch(CONFIG.USA_TXT_URL).then(r => r.text()).catch(() => ""),
                fetch(CONFIG.SHEETS_API, { redirect: 'follow' }).then(r => r.json())
            ]);

            mapContainer.innerHTML = await svgRes.text();
            
            // LIMPEZA DO TXT DOS EUA: Pega apenas o que vem depois do "M"
            const usaFullText = usaTxtRes.trim();
            const usaGeomOnly = usaFullText.includes(" M") ? usaFullText.split(" M")[1] : "";

            // 2. PROCESSAR DADOS
            const coverageMap = {};
            const rows = Array.isArray(dataRes) ? dataRes : (dataRes.links || []);

            rows.forEach(row => {
                let rawPath = String(row['Paths 2'] || "").trim();
                let cleanId = "";

                const isUSA = String(row['Country'] || "").toLowerCase().includes("united states");

                if (isUSA) {
                    cleanId = "united_states"; 
                } else if (rawPath) {
                    let countryPart = rawPath.split(/ M/)[0].trim();
                    cleanId = countryPart.replace(/\s+/g, '_').toLowerCase();
                }

                if (cleanId) {
                    if (!coverageMap[cleanId]) coverageMap[cleanId] = [];
                    coverageMap[cleanId].push(row);
                }
            });

            // 3. ATIVAR MAPA
            const allPaths = Array.from(document.querySelectorAll('path'));

            Object.keys(coverageMap).forEach(idPlanilha => {
                let el = allPaths.find(p => {
                    const title = (p.getAttribute('title') || "").toLowerCase();
                    const idAttr = (p.id || "").toLowerCase();
                    const dAttr = p.getAttribute('d') || "";
                    
                    if (idPlanilha === "united_states") {
                        // Tenta achar os EUA de 3 formas: ID, Título ou comparando o início do desenho (d)
                        return idAttr.includes("united_states") || 
                               title === "united states" || 
                               (usaGeomOnly && dAttr.includes(usaGeomOnly.substring(0, 30)));
                    }
                    return title === idPlanilha || idAttr === idPlanilha;
                });

                if (el) {
                    el.classList.add('pais-ativo');

                    el.onclick = () => {
                        document.querySelectorAll('.pais-selecionado').forEach(p => p.classList.remove('pais-selecionado'));
                        el.classList.add('pais-selecionado');

                        const partners = coverageMap[idPlanilha];
                        const countryDisplay = partners[0].Country || idPlanilha.replace(/_/g, ' ');

                        let html = `
                            <div class="mb-10">
                                <h3 class="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">${countryDisplay}</h3>
                                <div class="flex items-center gap-2 mt-2">
                                    <span class="h-[2px] w-8 bg-indigo-600"></span>
                                    <p class="text-[10px] font-black text-indigo-600 uppercase tracking-widest">${partners.length} Active Node(s)</p>
                                </div>
                            </div>
                            <div class="space-y-3">
                        `;

                        partners.forEach(p => {
                            html += `
                                <div class="partner-card">
                                    <div class="flex justify-between items-center mb-3">
                                        <span class="text-[11px] font-black text-slate-800 uppercase tracking-tight">${p['Partner Name'] || 'Partner'}</span>
                                        <span class="text-[8px] bg-slate-900 text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-widest">${p.Tech || 'LTE'}</span>
                                    </div>
                                    <div class="space-y-2 text-[10px]">
                                        <div class="flex justify-between font-medium">
                                            <span class="text-slate-400 uppercase tracking-tighter text-[9px]">Network</span>
                                            <span class="text-slate-700 font-black">${p['Mobile Network'] || 'N/A'}</span>
                                        </div>
                                        <div class="flex justify-between font-medium">
                                            <span class="text-slate-400 uppercase tracking-tighter text-[9px]">VoLTE Support</span>
                                            <span class="text-indigo-600 font-black italic">${p.VoLTE || 'No'}</span>
                                        </div>
                                    </div>
                                </div>`;
                        });

                        html += `</div>`;
                        tooltip.innerHTML = html;
                        tooltip.scrollTop = 0;
                    };
                }
            });

            toggleLoader(false);

        } catch (error) {
            console.error("Error:", error);
            toggleLoader(false);
        }
    }
    start();
});
