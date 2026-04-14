document.addEventListener('DOMContentLoaded', async () => {
    const API_URL = "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec";
    const tooltip = document.getElementById('tooltip');

    async function init() {
        try {
            const res = await fetch(API_URL, { redirect: 'follow' });
            const data = await res.json();
            
            tooltip.innerText = "Passe o mouse sobre um país";

            data.forEach(item => {
                // Procuramos o path que tenha o atributo 'title' IGUAL ao nome na planilha
                // Ex: Planilha "Brazil" -> Path title="Brazil"
                const country = document.querySelector(`path[title="${item.Pais}" i]`);

                if (country) {
                    // Pinta conforme o status
                    const color = (item.Status === "Ativo") ? "#00ff88" : "#ffd500";
                    country.style.setProperty('fill', color, 'important');
                    country.style.fillOpacity = "0.7";

                    country.onmouseenter = () => {
                        tooltip.innerHTML = `<strong>${item.Pais}</strong>: ${item.Status}`;
                    };
                }
            });
        } catch (err) {
            console.error("Erro:", err);
            tooltip.innerText = "Erro ao carregar dados da planilha.";
        }
    }

    init();
});
