async function calcularRota(origem_lat, origem_lng, destino_lat, destino_lng, categoria = 'carro', multiplicadorDinamica = 1.0) {
    const url = `http://router.project-osrm.org/route/v1/driving/${origem_lng},${origem_lat};${destino_lng},${destino_lat}?overview=false`;

    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error('Falha na comunicação com servidor de rotas (OSRM)');

    const dados = await resposta.json();
    if (!dados.routes || dados.routes.length === 0) {
        throw new Error('Não foi possível traçar uma rota por ruas entre estes pontos.');
    }

    const rota = dados.routes[0];
    const distanciaKm = rota.distance / 1000;
    const tempoMin = rota.duration / 60;

    // A sua Lógica de Mercado
    const regrasPreco = {
        moto: {
            taxaBase: 2.00,
            valorPorKm: 0.90,
            valorPorMinuto: 0.12,
            tarifaMinimaCliente: 5.50, // Ajustado para R$ 5,50
            comissaoApp: 0.15 
        },
        carro: {
            taxaBase: 4.00,
            valorPorKm: 1.60,
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
        enderecoOrigem: "Endereço Coletado",
        enderecoDestino: "Endereço Coletado"
    };
}

module.exports = { calcularRota };