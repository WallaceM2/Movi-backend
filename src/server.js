require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
require('./config/database');
const redisClient = require('./config/redis');

// 1. Importações de Banco e Middlewares Customizados
const { limiteGeral } = require('./middlewares/rateLimiter');

// 2. Importações de Rotas
const motoristaRoutes = require('./routes/motoristaRoutes');
const passageiroRoutes = require('./routes/passageiroRoutes');
const adminRoutes = require('./routes/adminRoutes');
const avaliacaoRoutes = require('./routes/avaliacaoRoutes');
const corridaRoutes = require('./routes/corridaRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// 3. Configuração do Servidor HTTP e Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' } 
});

io.on('connection', (socket) => {
    console.log(`Novo dispositivo conectado: ${socket.id}`);

    // =======================================================
    // TELEMETRIA E REGISTRO DE GPS DO MOTORISTA (UNIFICADO)
    // =======================================================
    socket.on('atualizar_localizacao', async (dados) => {
        // Recebe: { motorista_id, passageiro_id, lat, lng, direcao }
        const { motorista_id, passageiro_id, lat, lng, direcao } = dados;

        try {
            if (motorista_id) {
                // 1. Atualiza as coordenadas no radar geoespacial do Redis
                await redisClient.geoAdd('motoristas_disponiveis', {
                    longitude: lng,
                    latitude: lat,
                    member: String(motorista_id)
                });

                // 2. Registra o socket.id atual do motorista para ofertas de corrida
                await redisClient.set(`motorista_socket:${motorista_id}`, socket.id);
            }

            // 3. ESPELHO DE NAVEGAÇÃO: Se o motorista estiver em uma corrida ativa,
            // retransmite o sinal de GPS direto para o aplicativo do passageiro em tempo real
            if (passageiro_id) {
                const socketPassageiro = await redisClient.get(`passageiro_socket:${passageiro_id}`);

                if (socketPassageiro) {
                    io.to(socketPassageiro).emit('motorista_em_movimento', {
                        lat,
                        lng,
                        direcao: direcao || 0 // Usado pelo front-end para rotacionar o ícone da moto/carro
                    });
                }
            }
        } catch (erro) {
            console.error('Erro ao processar telemetria no Redis/Socket:', erro);
        }
    });

    // Registro do Passageiro (Necessário para ele receber notificações e GPS)
    socket.on('registrar_passageiro', async (dados) => {
        try {
            if (dados.passageiro_id) {
                await redisClient.set(`passageiro_socket:${dados.passageiro_id}`, socket.id);
                console.log(`Passageiro ${dados.passageiro_id} está online no socket ${socket.id}`);
            }
        } catch (erro) {
            console.error('Erro ao registrar passageiro no Redis:', erro);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Dispositivo desconectado: ${socket.id}`);
    });
});

app.set('io', io);

// 4. Middlewares Globais (Devem vir ANTES das rotas)
app.use(helmet()); 
app.use(express.json({ limit: '10kb' })); 
app.use('/uploads', express.static('uploads'));
app.use('/api', limiteGeral);

// 5. Injeção de Rotas
app.use('/api', motoristaRoutes);
app.use('/api', passageiroRoutes);
app.use('/api', adminRoutes);
app.use('/api', avaliacaoRoutes);
app.use('/api/corridas', corridaRoutes);

// Rota de Teste (Root)
app.get('/', (req, res) => {
    res.json({ mensagem: '🏍️ API do app de corridas está rodando e protegida!' });
});

// 6. Tratamento Global de Erros
app.use((err, req, res, next) => {
    console.error('🔴 Erro Global:', err);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
});

// 7. Inicialização do Servidor
server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`🔌 Socket.io habilitado e aguardando conexões.`);
});