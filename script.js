document.addEventListener('DOMContentLoaded', () => {
    const API_URL = "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec";
    const tooltip = document.getElementById('tooltip');

    // Dicionário para traduzir nomes da planilha para os IDs do MapChart
    const translate = {
        "Brasil": "brazil",
        "Estados Unidos": "united_states",
        "EUA": "united_states",
        "Argentina": "argentina",
        "Chile": "chile",
        "México": "mexico",
        "Canada": "canada"
    };

    async function fetchData() {
        try {
            const response = await fetch(API_URL, { redirect: 'follow' });
            const data = await response.json();

            data.forEach(item => {
                // Tenta encontrar pelo ID do MapChart ou pelo atributo 'title'
                const targetId = translate[item.Pais] || item.Pais.toLowerCase().replace(/ /g, "_");
                const country = document.getElementById(targetId) || 
                                document.querySelector(`path[title="${item.Pais}"]`);

                if (country) {
                    // Aplica cor baseada no status
                    if (item.Status === "Ativo") {
                        country.style.fill = "#00ff88"; // Verde neon
                        country.style.fillOpacity = "0.7";
                    } else if (item.Status === "Em Teste") {
                        country.style.fill = "#ffd500"; // Amarelo
                        country.style.fillOpacity = "0.7";
                    }

                    // Eventos de Mouse
                    country.onmouseenter = () => {
                        tooltip.innerHTML = `<strong>${item.Pais}</strong>: ${item.Status}`;
                        country.style.stroke = "#fff";
                        country.style.strokeWidth = "1.5";
                    };

                    country.onmouseleave = () => {
                        tooltip.innerText = "Passe o mouse sobre um país";
                        country.style.stroke = "rgba(255, 255, 255, 0.2)";
                        country.style.strokeWidth = "0.5";
                    };
                }
            });
        } catch (e) {
            console.error("Erro na carga:", e);
            tooltip.innerText = "Erro ao conectar com a base de dados.";
        }
    }

    fetchData();
});
