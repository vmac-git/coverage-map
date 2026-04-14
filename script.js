document.addEventListener('DOMContentLoaded', () => {
    const API_URL = "https://script.google.com/macros/s/AKfycbyZpKLAAnTbNgA3qBmXUFTEP658_ssmvIrrB11SWQHSwZm-z9Qs_2AlBDcq_Dt6qTA1/exec"; // Deve terminar em /exec

    async function loadCoverage() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Erro na rede');
            
            const data = await response.json();
            
            data.forEach(item => {
                // O ID aqui deve ser EXATAMENTE igual ao ID que você colocou no <path> do SVG
                const countryElement = document.getElementById(item.Pais); 
                
                if (countryElement) {
                    countryElement.style.fill = "#00ff88"; // Cor de destaque
                    countryElement.style.filter = "drop-shadow(0 0 5px rgba(0,255,136,0.5))";
                    
                    countryElement.addEventListener('click', () => {
                        alert(`Cobertura em ${item.Pais}: ${item.Status}`);
                    });
                }
            });
        } catch (error) {
            console.error("Erro ao buscar dados do Sheets:", error);
        }
    }

    loadCoverage();
});
