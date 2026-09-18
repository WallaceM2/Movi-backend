const axios = require('axios');

async function calcularRota(origem_lat, origem_lng, destino_lat, destino_lng, categoria = 'carro', multiplicadorDinamica = 1.0) {
    const tokenMapbox = process.env.MAPBOX_API_KEY;
    
    // Endpoint oficial do Mapbox Directions (geometries=geojson para garantir o traçado se precisar)
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origem_lng},${origem_lat};${destino_lng},${destino_lat}?geometries=geojson&access_token=${tokenMapbox}`;

    try {
        const resposta = await axios.get(url);
        const dados = resposta.data;

        if (!dados.routes || dados.routes.length === 0) {
            throw new Error('Não foi possível traçar uma rota por ruas entre estes pontos pelo Mapbox.');
        }

        const rota = dados.routes[0];
        
        // O Mapbox retorna a distância em metros e a duração em segundos
        const distanciaKm = rota.distance / 1000;
        const tempoMin = rota.duration / 60;
        const geometriaPolyline = rota.geometry; // Geometria exata para desenhar a linha no app

        // A sua Lógica de Mercado Oficial Definitiva
        const regrasPreco = {
            moto: {
                taxaBase: 2.00,
                valorPorKm: 1.00,    // <-- Cravado R$ 1,00 por KM
                valorPorMinuto: 0.15,
                tarifaMinimaCliente: 5.50, 
                comissaoApp: 0.15 
            },
            carro: {
                taxaBase: 4.00,
                valorPorKm: 1.50,    // <-- Cravado R$ 1,50 por KM
                valorPorMinuto: 0.25,
                tarifaMinimaCliente: 9.00, 
                comissaoApp: 0.15 
            }
        };

        const regra = regrasPreco[categoria] || regrasPreco['carro'];

        // 1. Calcula o valor bruto da corrida
        let valorPassageiro = regra.taxaBase + (distanciaKm * regra.valorPorKm) + (tempoMin * regra.valorPorMinuto);
        let isCorridaCurta = false;

        // 2. Proteção de Corrida Curta (Piso)
        if (valorPassageiro < regra.tarifaMinimaCliente) {
            valorPassageiro = regra.tarifaMinimaCliente;
            isCorridaCurta = true; // Marca que a corrida caiu na tarifa mínima
        }

        // 3. Aplica a Tarifa Dinâmica 
        valorPassageiro = valorPassageiro * multiplicadorDinamica;

        let ganhoApp, ganhoMotorista;

        // 4. Divisão Justa com a sua Regra de Ouro para Motos:
        // Se for moto, for corrida curta e não houver dinâmica, crava a divisão em R$ 4,50 / R$ 1,00
        if (categoria === 'moto' && isCorridaCurta && multiplicadorDinamica === 1.0) {
            ganhoApp = 1.00;
            ganhoMotorista = 4.50;
        } else {
            // Demais casos, corridas mais longas e carro: 15% App / 85% Motorista
            ganhoApp = valorPassageiro * regra.comissaoApp;
            ganhoMotorista = valorPassageiro - ganhoApp;
        }

        return {
            distanciaKm: parseFloat(distanciaKm.toFixed(2)),
            tempoMin: Math.ceil(tempoMin),
            dinamicaAplicada: `${multiplicadorDinamica}x`,
            valorPassageiro: parseFloat(valorPassageiro.toFixed(2)),
            ganhoMotorista: parseFloat(ganhoMotorista.toFixed(2)),
            ganhoApp: parseFloat(ganhoApp.toFixed(2)),
            geometria: geometriaPolyline, // <-- Traçado completo da rua para o front-end
            enderecoOrigem: "Endereço Coletado",
            enderecoDestino: "Endereço Coletado"
        };

    } catch (erro) {
        console.error('Erro na comunicação com o Mapbox:', erro.response?.data || erro.message);
        throw new Error('Falha na comunicação com o servidor de rotas (Mapbox)');
    }
}

module.exports = { calcularRota };