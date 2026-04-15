const CONFIG = {
    // Certifique-se de que esta URL é a da "Nova Implantação" do Apps Script
    SHEETS_API: "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec",
    SVG_URL: "MapChart_Map.svg"
};

document.addEventListener('DOMContentLoaded', async () => {
    const mapContainer = document.getElementById('map-container');
    const tooltip = document.getElementById('tooltip');

    async function start() {
        try {
            // 1. Carregar o arquivo SVG
            tooltip.innerHTML = "Injetando mapa geográfico...";
            const svgRes = await fetch(CONFIG.SVG_URL);
            if (!svgRes.ok) throw new Error("Não foi possível carregar o arquivo SVG. Verifique o nome no repositório.");
            const svgText = await svgRes.text();
            mapContainer.innerHTML = svgText;
            console.log("SVG injetado com sucesso.");

            // 2. Carregar os Dados do Google Sheets
            tooltip.innerHTML = "Sincronizando base de dados de parceiros...";
            const dataRes = await fetch(CONFIG.SHEETS_API, { redirect: 'follow' });
            if (!dataRes.ok) throw new Error("Falha na conexão com o Google Sheets.");
            const rawData = await dataRes.json();
            console.log("Dados recebidos da planilha:", rawData.length, "linhas.");

            // 3. Agrupar Dados pela coluna "Paths" (Normalizando para evitar erros de digitação)
            const coverageMap = {};
            rawData.forEach(row => {
                if (!row.Paths) return;
                const pathKey = String(row.Paths).trim().toLowerCase();
                if (!coverageMap[pathKey]) coverageMap[pathKey] = [];
                coverageMap[pathKey].push(row);
            });

            // 4. Identificar os Países no SVG (Lógica Anti-Pattern)
            // Filtramos apenas elementos <path> que tenham title ou id, ignorando texturas/patterns
            const allPaths = Array.from(document.querySelectorAll('path')).filter(p => {
                const title = p.getAttribute('title');
                const id = p.id;
                // Ignora caminhos que começam com 'pattern' ou que não possuem identificação
                return (title && !title.startsWith('pattern')) || (id && !id.startsWith('pattern'));
            });

            let activeCount = 0;

            // 5. Vincular Planilha ao Mapa
            Object.keys(coverageMap).forEach(idPlanilha => {
                // Busca o elemento correspondente no SVG
                const el = allPaths.find(p => {
                    const title = (p.getAttribute('title') || "").toLowerCase();
                    const idAttr = (p.id || "").toLowerCase();
                    return title === idPlanilha || idAttr === idPlanilha;
                });

                if (el) {
                    activeCount++;
                    // Aplica estilo visual de país ativo
                    el.classList.add('pais-ativo');
                    el.style.setProperty('fill', '#00ff88', 'important');
                    el.style.fillOpacity = "0.4";
                    el.style.cursor = "pointer";

                    // Evento: Mouse Entra
                    el.onmouseenter = () => {
                        el.style.fillOpacity = "0.9";
                        el.style.stroke = "#ffffff";
                        el.style.strokeWidth = "1.5";

                        const partners = coverageMap[idPlanilha];
                        // Criando o HTML do Tooltip (Nome do país + Lista de Parceiros)
                        let html = `<div class="tooltip-title">${partners[0].Country.toUpperCase()}</div>`;
                        
                        partners.forEach(p => {
                            html += `
                                <div class="partner-entry">
                                    <span class="partner-name">🚩 ${p['Partner Name'] || 'Parceiro'}</span>
                                    <div class="partner-details">
                                        <b>Rede:</b> ${p['Mobile Network'] || 'N/A'}<br>
                                        <b>Tech:</b> ${p.Tech || 'N/A'} | <b>VoLTE:</b> ${p.VoLTE || 'N/A'}<br>
                                        <small style="color:#888;">Frequências: ${p.Frequencies || 'N/A'}</small>
                                    </div>
                                </div>`;
                        });
                        tooltip.innerHTML = html;
                    };

                    // Evento: Mouse Sai
                    el.onmouseleave = () => {
                        el.style.fillOpacity = "0.4";
                        el.style.stroke = "rgba(255, 255, 255, 0.2)";
                        el.style.strokeWidth = "0.6";
                        tooltip.innerHTML = "Passe o mouse sobre um país destacado.";
                    };
                } else {
                    console.warn(`Link Falhou: O Path "${idPlanilha}" definido na planilha não foi encontrado no SVG.`);
                }
            });

            // Atualização final do status
            if (activeCount > 0) {
                tooltip.innerHTML = "Mapa pronto! Passe o mouse sobre os países destacados.";
            } else {
                tooltip.innerHTML = "Aviso: Nenhum ID da coluna 'Paths' corresponde aos títulos do mapa.";
            }

        } catch (error) {
            console.error("Erro Geral:", error);
            tooltip.innerHTML = `<span style="color:#ff4444;">❌ Erro: ${error.message}</span>`;
        }
    }

    start();
});
