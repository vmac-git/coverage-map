document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec";
    
    // Captura os elementos
    const tooltip = document.getElementById('tooltip');
    const container = document.getElementById('map-container');

    // Verifica se os elementos existem antes de continuar
    if (!tooltip || !container) {
        console.error("ERRO: Elementos 'tooltip' ou 'map-container' não encontrados no HTML.");
        return;
    }

    try {
        tooltip.innerHTML = "Buscando dados na planilha...";

        const response = await fetch(API_URL, { redirect: 'follow' });
        const data = await response.json();
        
        tooltip.innerHTML = "Passe o mouse sobre um país";

        data.forEach(item => {
            // Busca o país pelo título (MapChart coloca o nome no title)
            const country = document.querySelector(`path[title="${item.Pais}" i]`);

            if (country) {
                const color = (item.Status === "Ativo") ? "#00ff88" : "#ffd500";
                country.style.setProperty('fill', color, 'important');
                country.style.fillOpacity = "0.7";

                country.onmouseenter = () => {
                    tooltip.innerHTML = `<strong>${item.Pais}</strong>: ${item.Status}`;
                };
            }
        });

    } catch (error) {
        console.error("Erro no carregamento:", error);
        tooltip.innerHTML = "Erro ao carregar dados da planilha.";
    }
});
