const Corrida = require('../models/Corrida');
const redisClient = require('../config/redis');
const { calcularRota } = require('../services/mapsService');

async function estimar(req, res) {
    try {
        const { origem_lat, origem_lng, destino_lat, destino_lng, categoria, dinamica } = req.body;
        const multiplicador = dinamica || 1.0; 
        const estimativa = await calcularRota(origem_lat, origem_lng, destino_lat, destino_lng, categoria, multiplicador);
        
        return res.json({
            mensagem: 'Estimativa calculada com sucesso',
            estimativa
        });
    } catch (erro) {
        console.error('Erro ao estimar rota:', erro);
        return res.status(500).json({ erro: 'Não foi possível calcular a rota com o mapa.' });
    }
}

async function solicitarCorrida(req, res) {
    try {
        const { origem, destino, origem_lat, origem_lng, destino_lat, destino_lng, categoria } = req.body;
        const passageiro_id = req.usuario.id; 

        // O Backend calcula o valor oficial
        const estimativaOficial = await calcularRota(origem_lat, origem_lng, destino_lat, destino_lng, categoria);

        // Gravamos no banco o valor blindado
        const novaCorrida = await Corrida.criar({ 
            passageiro_id, 
            origem, 
            destino, 
            origem_lat, 
            origem_lng, 
            destino_lat, 
            destino_lng, 
            valor: estimativaOficial.valorPassageiro,
            status: 'solicitada' 
        });

        // Busca motoristas
        const motoristasProximos = await redisClient.geoSearch(
            'motoristas_disponiveis',
            { latitude: origem_lat, longitude: origem_lng },
            { radius: 5, unit: 'km' },
            { SORT: 'ASC', COUNT: 1 } 
        );

        if (motoristasProximos.length > 0) {
            const motoristaIdProximo = motoristasProximos[0]; 
            const socketId = await redisClient.get(`motorista_socket:${motoristaIdProximo}`);
            
            if (socketId) {
                const io = req.app.get('io');
                const ganhoPorKm = (estimativaOficial.ganhoMotorista / estimativaOficial.distanciaKm).toFixed(2);

                io.to(socketId).emit('nova_oferta_corrida', {
                    corrida_id: novaCorrida.id,
                    local_embarque: origem, 
                    local_desembarque: destino, 
                    valor_motorista: estimativaOficial.ganhoMotorista, 
                    ganho_por_km: parseFloat(ganhoPorKm),
                    distancia_km: estimativaOficial.distanciaKm,
                    tempo_minutos: estimativaOficial.tempoMin,
                    conta_verificada: true, 
                    coordenadas: {
                        origem: { lat: origem_lat, lng: origem_lng },
                        destino: { lat: destino_lat, lng: destino_lng }
                    },
                    tempo_para_aceitar: 15 
                });
            }
        }

        res.status(201).json({ 
            mensagem: 'Corrida solicitada com sucesso!', 
            corrida: novaCorrida,
            detalhes_valores: estimativaOficial,
            motoristas_encontrados: motoristasProximos.length
        });
    } catch (erro) {
        console.error('Erro no controller solicitarCorrida:', erro);
        res.status(500).json({ erro: 'Erro ao solicitar corrida' });
    }
}

async function aceitarCorrida(req, res) {
    try {
        const { id } = req.params; 
        const motorista_id = req.usuario.id; 

        const corridaAceita = await Corrida.aceitar(id, motorista_id);

        if (!corridaAceita) {
            return res.status(409).json({ 
                erro: 'Esta corrida já foi aceita por outro motorista ou cancelada.' 
            });
        }

        const socketPassageiro = await redisClient.get(`passageiro_socket:${corridaAceita.passageiro_id}`);

        if (socketPassageiro) {
            const io = req.app.get('io');
            io.to(socketPassageiro).emit('corrida_aceita', corridaAceita);
        }

        res.json({
            mensagem: 'Corrida aceita com sucesso!',
            corrida: corridaAceita
        });
    } catch (erro) {
        console.error('Erro no controller aceitar corrida:', erro);
        res.status(500).json({ erro: 'Erro ao aceitar corrida.' });
    }
}

async function iniciarEmbarque(req, res) {
    try {
        const { id } = req.params;
        const corridaAtualizada = await Corrida.atualizarStatus(id, 'em_andamento');
        
        res.json({ mensagem: 'Corrida iniciada', corrida: corridaAtualizada });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: 'Erro ao iniciar corrida.' });
    }
}

async function finalizarCorrida(req, res) {
    try {
        const { id } = req.params;
        
        // 1. Muda o status no banco de dados, efetivando a cobrança e os ganhos
        const corridaFinalizada = await Corrida.atualizarStatus(id, 'concluida');
        
        // 2. Avisa o passageiro em tempo real que a viagem acabou
        // O aplicativo dele vai ler isso e fechar o mapa, abrindo a tela de "Avalie o Motorista"
        const socketPassageiro = await redisClient.get(`passageiro_socket:${corridaFinalizada.passageiro_id}`);
        
        if (socketPassageiro) {
            const io = req.app.get('io');
            io.to(socketPassageiro).emit('corrida_finalizada', {
                mensagem: 'Você chegou ao seu destino!',
                corrida: corridaFinalizada
            });
        }
        
        // 3. Libera o motorista devolvendo o sucesso para o celular dele
        res.json({ 
            mensagem: 'Corrida finalizada com sucesso! Ganhos computados.', 
            corrida: corridaFinalizada 
        });
    } catch (erro) {
        console.error('Erro ao finalizar corrida:', erro);
        res.status(500).json({ erro: 'Erro ao finalizar a corrida.' });
    }
}

module.exports = { estimar, solicitarCorrida, aceitarCorrida, iniciarEmbarque, finalizarCorrida };