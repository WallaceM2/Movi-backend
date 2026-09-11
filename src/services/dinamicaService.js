const redisClient = require('../config/redis');

// 1. Registra no mapa de calor que tem um cliente buscando corrida
async function registrarDemanda(lat, lng, passageiro_id) {
    try {
        await redisClient.geoAdd('mapa_calor_demanda', {
            longitude: lng,
            latitude: lat,
            member: String(passageiro_id)
        });
        
        // No mundo real, rodamos um "limpador" de 5 em 5 minutos
        // para apagar quem já pediu a corrida e não inflar a demanda fantasma.
    } catch (erro) {
        console.error('Erro ao registrar demanda:', erro);
    }
}

// 2. O Robô que cruza os dados e cospe o multiplicador (1.0x, 1.5x, 2.0x)
async function calcularMultiplicador(lat, lng, raioKm = 3) {
    try {
        // Quantos motoristas estão num raio de 3km?
        const motoristas = await redisClient.geoSearch(
            'motoristas_disponiveis',
            { latitude: lat, longitude: lng },
            { radius: raioKm, unit: 'km' }
        );
        const qtdMotoristas = motoristas.length;

        // Quantos clientes estão pedindo corrida num raio de 3km?
        const passageiros = await redisClient.geoSearch(
            'mapa_calor_demanda',
            { latitude: lat, longitude: lng },
            { radius: raioKm, unit: 'km' }
        );
        const qtdPassageiros = passageiros.length;

        // Regras de Negócio do Algoritmo:
        
        // Cenário 1: Ninguém pedindo, dinâmica normal
        if (qtdPassageiros === 0) return 1.0; 
        
        // Cenário 2: Tem passageiro, mas ZERO motoristas perto (Sobe pra 1.5x para atrair motorista de longe)
        if (qtdMotoristas === 0 && qtdPassageiros > 0) return 1.5; 

        // Cenário 3: Conta matemática de Oferta vs Demanda
        const proporcao = qtdPassageiros / qtdMotoristas;

        if (proporcao >= 3) return 2.0; // 3x mais clientes que motoristas (Dinâmica Máxima)
        if (proporcao >= 2) return 1.5; // O dobro de clientes (Dinâmica Alta)
        if (proporcao >= 1.5) return 1.2; // 50% a mais (Dinâmica Leve)
        
        return 1.0; // Oferta e demanda equilibradas (Preço normal)

    } catch (erro) {
        console.error("Erro no robô de dinâmica:", erro);
        return 1.0; // Se o robô falhar, protege o cliente cobrando preço normal
    }
}

module.exports = { registrarDemanda, calcularMultiplicador };