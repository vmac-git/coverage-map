const CONFIG = {
    SHEETS_API: "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec",
    SVG_URL: "MapChart_Map.svg"
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const svgRes = await fetch(CONFIG.SVG_URL);
        document.getElementById('map-container').innerHTML = await svgRes.text();

        const dataRes = await fetch(CONFIG.SHEETS_API, { redirect: 'follow' });
        const rawData = await dataRes.json();

        // --- DIAGNÓSTICO ---
        const idsNoSVG = Array.from(document.querySelectorAll('path'))
            .map(p => p.getAttribute('title'))
            .filter(t => t && !t.startsWith('pattern'));

        const idsNaPlanilha = rawData.map(r => String(r.Paths).trim());

        console.log("=== LISTA DE TÍTULOS REAIS NO MAPA (Use esses nomes na coluna Paths) ===");
        console.table(idsNoSVG);

        console.log("=== NOMES QUE VOCÊ ESCREVEU NA PLANILHA ===");
        console.table(idsNaPlanilha);
        
        document.getElementById('tooltip').innerHTML = "Abra o Console (F12) para ver a tabela de nomes permitidos.";
        // -------------------

    } catch (e) { console.error(e); }
});
