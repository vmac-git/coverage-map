document.addEventListener('DOMContentLoaded', () => {
    // Substitua pela sua URL de execução do Google Apps Script
    const API_URL = "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec";

    const tooltip = document.getElementById('tooltip');

    async function loadCoverage() {
        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                redirect: 'follow'
            });

            if (!response.ok) throw new Error('Falha ao acessar banco de dados');
            
            const data = await response.json();
            console.log("Dados carregados:", data);

            data.forEach(item => {
                // Tenta encontrar o país no SVG pelo ID (ex: Brazil)
                const country = document.getElementById(item.Pais);
                
                if (country) {
                    // Lógica de cores baseada no Status da sua planilha
                    if (item.Status === "Ativo") {
                        country.style.fill = "rgba(0, 255, 136, 0.6)";
                        country.style.stroke = "#00ff88";
                    } else if (item.Status === "Em Teste") {
                        country.style.fill = "rgba(255, 213, 0, 0.6)";
                        country.style.stroke = "#ffd500";
                    }

                    // Interatividade
                    country.addEventListener('mouseenter', () => {
                        tooltip.innerHTML = `<strong>${item.Pais}</strong>: ${item.Info || item.Status}`;
                        tooltip.style.color = "#00ff88";
                    });

                    country.addEventListener('mouseleave', () => {
                        tooltip.innerText = "Passe o mouse sobre um país";
                        tooltip.style.color = "white";
                    });
                }
            });

        } catch (error) {
            console.error("Erro:", error);
            tooltip.innerText = "Erro ao carregar dados da planilha.";
        }
    }

    loadCoverage();
});
