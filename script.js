document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec";
    const tooltip = document.getElementById('tooltip');

    try {
        console.log("Iniciando busca de dados...");
        const response = await fetch(API_URL, { redirect: 'follow' });
        const data = await response.json();
        console.log("Dados recebidos:", data);

        tooltip.innerText = "Passe o mouse sobre um país";

        data.forEach(item => {
            // Tenta achar o país pelo 'title' (que o MapChart sempre cria)
            const country = document.querySelector(`path[title="${item.Pais}" i]`);

            if (country) {
                console.log(`Pintando: ${item.Pais}`);
                const color = (item.Status === "Ativo") ? "#00ff88" : "#ffd500";
                country.style.setProperty('fill', color, 'important');
                
                country.onmouseenter = () => {
                    tooltip.innerHTML = `<strong>${item.Pais}</strong>: ${item.Status}`;
                };
            } else {
                console.warn(`País da planilha não encontrado no SVG: ${item.Pais}`);
            }
        });
    } catch (error) {
        console.error("Erro fatal:", error);
        tooltip.innerText = "Erro ao carregar dados.";
    }
});
