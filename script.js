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
        overlay.style.opacity = show ? "1" : "0";
        setTimeout(() => { if(!show) overlay.style.display = "none"; }, 500);
    }

    async function start() {
        try {
            const [svgRes, usaTxtRes, dataRes] = await Promise.all([
                fetch(CONFIG.SVG_URL),
                fetch(CONFIG.USA_TXT_URL).then(r => r.text()).catch(() => ""),
                fetch(CONFIG.SHEETS_API, { redirect: 'follow' }).then(r => r.json())
            ]);

            mapContainer.innerHTML = await svgRes.text();
            const usaGeomCode = usaTxtRes.trim();

            const coverageMap = {};
            dataRes.forEach(row => {
                let rawPath = String(row['Paths 2'] || "").trim();
                let cleanId = "";
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

            const allPaths = Array.from(document.querySelectorAll('path'));

            Object.keys(coverageMap).forEach(idPlanilha => {
                let el = allPaths.find(p => {
                    const title = (p.getAttribute('title') || "").toLowerCase();
                    const idAttr = (p.id || "").toLowerCase();
                    if (idPlanilha === "united_states") {
                        return idAttr === "united_states" || title === "united states" || (usaGeomCode && p.getAttribute('d')?.startsWith(usaGeomCode.substring(0, 50)));
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
                            <div class="mb-6">
                                <h3 class="text-xl font-black text-slate-900 tracking-tighter uppercase italic">${countryDisplay}</h3>
                                <p class="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">${partners.length} Active Partners</p>
                            </div>
                            <div class="space-y-4 overflow-y-auto max-h-[400px] pr-2" id="partner-list">
                        `;

                        partners.forEach(p => {
                            html += `
                                <div class="partner-entry bg-white/50 border border-slate-100 p-4 rounded-2xl shadow-sm">
                                    <div class="flex justify-between items-start mb-2">
                                        <span class="text-[10px] font-black text-slate-800 uppercase tracking-tight">${p['Partner Name']}</span>
                                        <span class="text-[8px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold uppercase">${p.Tech || 'LTE'}</span>
                                    </div>
                                    <div class="grid grid-cols-2 gap-2 text-[9px]">
                                        <div class="text-slate-400 font-medium uppercase">Network: <span class="text-slate-600 block font-bold">${p['Mobile Network'] || 'N/A'}</span></div>
                                        <div class="text-slate-400 font-medium uppercase">VoLTE: <span class="text-slate-600 block font-bold">${p.VoLTE || 'No'}</span></div>
                                    </div>
                                </div>`;
                        });

                        html += `</div>`;
                        tooltip.innerHTML = html;
                    };
                }
            });

            toggleLoader(false);

        } catch (error) {
            console.error(error);
            tooltip.innerHTML = `<p class="text-red-500 font-bold text-xs">Sync Error. Please check database connection.</p>`;
        }
    }
    start();
});
