const API_URL = "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec";

async function initMap() {
    try {
        const response = await fetch(API_URL);
        const coverageData = await response.json();
        
        // Exemplo de lógica para pintar o mapa
        coverageData.forEach(item => {
            const countryPath = document.getElementById(item.Pais); // ID no SVG deve ser o nome ou ISO
            if (countryPath) {
                countryPath.style.fill = item.Cor || "#4CAF50"; // Verde para cobertura
                
                countryPath.addEventListener('mouseover', () => {
                    document.getElementById('tooltip').innerText = 
                        `${item.Pais}: Status - ${item.Status}`;
                });
            }
        });
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

initMap();
