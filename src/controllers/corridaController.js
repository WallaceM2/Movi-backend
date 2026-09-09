const Corrida = require('../models/Corrida');
const redisClient = require('../config/redis');

async function solicitarCorrida(req, res) {
    try {
        const { origem, destino, valor, origem_lat, origem_lng, destino_lat, destino_lng } = req.body;
        const passageiro_id = req.usuario.id; 

        const novaCorrida = await Corrida.criar({ 
            passageiro_id, 
            origem, 
            destino, 
            origem_lat, 
            origem_lng, 
            destino_lat, 
            destino_lng, 
            valor, 
            status: 'solicitada' 
        });

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
                io.to(socketId).emit('nova_oferta_corrida', {
                    corrida_id: novaCorrida.id,
                    origem, 
                    destino, 
                    valor,
                    tempo_para_aceitar: 15 
                });
            }
        }

        res.status(201).json({ 
            mensagem: 'Corrida solicitada com sucesso!', 
            corrida: novaCorrida,
            motoristas_encontrados: motoristasProximos.length
        });
    } catch (erro) {
        console.error('Erro no controller solicitarCorrida:', erro);
        res.status(500).json({ erro: 'Erro ao solicitar corrida' });
    }
}

async function aceitar(req, res) {
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

module.exports = { solicitarCorrida, aceitar, iniciarEmbarque };