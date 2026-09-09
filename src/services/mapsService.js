async function calcularRota(origem_lat, origem_lng, destino_lat, destino_lng) {
    // O OSRM exige as coordenadas no formato invertido: longitude,latitude
    const url = `http://router.project-osrm.org/route/v1/driving/${origem_lng},${origem_lat};${destino_lng},${destino_lat}?overview=false`;

    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error('Falha na comunicação com servidor de rotas (OSRM)');

    const dados = await resposta.json();
    
    if (!dados.routes || dados.routes.length === 0) {
        throw new Error('Não foi possível traçar uma rota por ruas entre estes pontos.');
    }

    const rota = dados.routes[0];
    
    // OSRM retorna distância em metros e tempo em segundos
    const distanciaKm = rota.distance / 1000;
    const tempoMin = rota.duration / 60;

    // Tabela de Precificação do seu App
    const taxaBase = 5.00;
    const valorPorKm = 1.50;
    const valorPorMinuto = 0.50;
    const tarifaMinima = 8.00;

    let valorTotal = taxaBase + (distanciaKm * valorPorKm) + (tempoMin * valorPorMinuto);
    if (valorTotal < tarifaMinima) valorTotal = tarifaMinima;

    return {
        distanciaKm: parseFloat(distanciaKm.toFixed(2)),
        tempoMin: Math.ceil(tempoMin),
        valor: parseFloat(valorTotal.toFixed(2)),
        // O OSRM de rotas não devolve o nome da rua escrito (Geocoding), 
        // então deixamos um texto padrão por enquanto.
        enderecoOrigem: "Endereço de Origem Coletado",
        enderecoDestino: "Endereço de Destino Coletado"
    };
}

module.exports = { calcularRota };