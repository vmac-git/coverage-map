const CONFIG = {
    // URL da tua API do Google Sheets (Apps Script)
    SHEETS_API: "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec",
    // Nome do ficheiro SVG no teu diretório
    SVG_URL: "MapChart_Map.svg",
    // Ficheiro auxiliar para o United States (devido ao limite de caracteres)
    USA_TXT_URL: "united_states.txt"
};

document.addEventListener('DOMContentLoaded', async () => {
    const mapContainer = document.getElementById('map-container');
    const tooltip = document.getElementById('tooltip');
    const overlay = document.getElementById('loader-overlay');

    // Função para esconder o loader com transição suave
    function toggleLoader(show) {
        if (!show) {
            overlay.style.opacity = "0";
            setTimeout(() => { overlay.style.display = "none"; }, 500);
        } else {
            overlay.style.display = "flex";
            overlay.style.opacity = "1";
        }
    }

    async function start() {
        try {
            // 1. CARREGAMENTO PARALELO (Mais rápido)
            const [svgRes, usaTxtRes, dataRes] = await Promise.all([
                fetch(CONFIG.SVG_URL),
                fetch(CONFIG.USA_TXT_URL).then(r => r.text()).catch(() => ""),
                fetch(CONFIG.SHEETS_API, { redirect: 'follow' }).then(r => r.json())
            ]);

            if (!svgRes.ok) throw new Error("SVG file not found.");
            
            // Injetar SVG no contentor
            mapContainer.innerHTML = await svgRes.text();
            const usaGeomCode = usaTxtRes.trim();

            // 2. PROCESSAR DADOS DA PLANILHA
            const coverageMap = {};
            
            // "dataRes" assume-se que seja o array diretamente ou dataRes.links
            const rows = Array.isArray(dataRes) ? dataRes : (dataRes.links || []);

            rows.forEach(row => {
                let rawPath = String(row['Paths 2'] || "").trim();
                let cleanId = "";

                // Verificação especial para United States
                const isUSA = String(row['Country'] || "").toLowerCase().includes("united states");

                if (isUSA) {
                    cleanId = "united_states"; 
                } else if (rawPath) {
                    // Limpa o nome do país removendo o código que começa com " M"
                    let countryPart = rawPath.split(/ M/)[0].trim();
                    // Converte "Costa Rica" em "costa_rica" para bater com o ID do SVG
                    cleanId = countryPart.replace(/\s+/g, '_').toLowerCase();
                }

                if (!cleanId) return;

                if (!coverageMap[cleanId]) coverageMap[cleanId] = [];
                coverageMap[cleanId].push(row);
            });

            // 3. ATIVAR INTERATIVIDADE NO MAPA
            const allPaths = Array.from(document.querySelectorAll('path'));

            Object.keys(coverageMap).forEach(idPlanilha => {
                // Encontrar o elemento correspondente no SVG
                let el = allPaths.find(p => {
                    const title = (p.getAttribute('title') || "").toLowerCase();
                    const idAttr = (p.id || "").toLowerCase();
                    
                    if (idPlanilha === "united_states") {
                        // Tenta pelo ID, pelo Title ou pelos primeiros caracteres do desenho (d) do TXT
                        return idAttr === "united_states" || 
                               title === "united states" || 
                               (usaGeomCode && p.getAttribute('d')?.startsWith(usaGeomCode.substring(0, 50)));
                    }
                    return title === idPlanilha || idAttr === idPlanilha;
                });

                if (el) {
                    el.classList.add('pais-ativo');

                    el.onclick = (e) => {
                        // Resetar seleção visual anterior
                        document.querySelectorAll('.pais-selecionado').forEach(p => p.classList.remove('pais-selecionado'));
                        
                        // Destacar país atual
                        el.classList.add('pais-selecionado');

                        // Gerar conteúdo lateral (Tooltip)
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
                                        <span class="text-[11px] font-black text-slate-800 uppercase tracking-tight">${p['Partner Name'] || 'Unknown Partner'}</span>
                                        <span class="text-[8px] bg-slate-900 text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-widest">${p.Tech || 'LTE'}</span>
                                    </div>
                                    <div class="space-y-2">
                                        <div class="flex justify-between text-[10px]">
                                            <span class="text-slate-400 font-bold uppercase tracking-tighter text-[9px]">Network</span>
                                            <span class="text-slate-700 font-black">${p['Mobile Network'] || 'N/A'}</span>
                                        </div>
                                        <div class="flex justify-between text-[10px]">
                                            <span class="text-slate-400 font-bold uppercase tracking-tighter text-[9px]">VoLTE Support</span>
                                            <span class="text-indigo-600 font-black italic">${p.VoLTE || 'No'}</span>
                                        </div>
                                        ${p.Frequencies ? `
                                        <div class="pt-2 border-t border-slate-50 text-[8px] text-slate-400 font-medium">
                                            FREQ: ${p.Frequencies}
                                        </div>` : ''}
                                    </div>
                                </div>`;
                        });

                        html += `</div>`;
                        tooltip.innerHTML = html;
                        
                        // Scroll automático para o topo do painel lateral
                        tooltip.scrollTop = 0;
                    };
                }
            });

            // Finalizar Loader
            toggleLoader(false);

        } catch (error) {
            console.error("Critical Error:", error);
            toggleLoader(false);
            tooltip.innerHTML = `
                <div class="text-center py-10">
                    <p class="text-red-500 font-black uppercase text-xs tracking-widest">Sync Failure</p>
                    <p class="text-slate-400 text-[10px] mt-2">${error.message}</p>
                </div>`;
        }
    }

    start();
});
