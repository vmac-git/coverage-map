const SHEETS_API = "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec";
const SVG_FILE = "MapChart_Map.svg"; // O nome do arquivo que você subiu no GitHub

document.addEventListener('DOMContentLoaded', async () => {
    const mapHolder = document.getElementById('map-holder');
    const tooltip = document.getElementById('tooltip');

    try {
        // 1. Carrega o arquivo SVG externo
        const svgResponse = await fetch(SVG_FILE);
        const svgText = await svgResponse.text();
        mapHolder.innerHTML = svgText;

        // 2. Carrega os dados da Planilha
        const dataResponse = await fetch(SHEETS_API, { redirect: 'follow' });
        const coverageData = await dataResponse.json();

        // 3. Aplica a cobertura
        coverageData.forEach(item => {
            // Procura pelo atributo 'title' que o MapChart gera (ex: "Brazil")
            const countryElement = document.querySelector(`path[title="${item.Pais}" i]`);

            if (countryElement) {
                const color = (item.Status === "Ativo") ? "#00ff88" : "#ffd500";
                countryElement.style.setProperty('fill', color, 'important');
                countryElement.style.fillOpacity = "0.6";

                countryElement.onmouseenter = () => {
                    tooltip.innerHTML = `<strong>${item.Pais}</strong>: ${item.Status}`;
                    countryElement.style.fillOpacity = "0.9";
                };

                countryElement.onmouseleave = () => {
                    tooltip.innerText = "Passe o mouse sobre um país";
                    countryElement.style.fillOpacity = "0.6";
                };
            }
        });

    } catch (error) {
        console.error("Erro no carregamento:", error);
        mapHolder.innerHTML = "<p>Erro ao carregar mapa ou dados.</p>";
    }
});
