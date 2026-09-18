require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const morgan = require('morgan'); // NOVO: Importação do Morgan
require('./config/database');
const redisClient = require('./config/redis');

// 1. Importações de Banco e Middlewares Customizados
const { limiteGeral, limiteAuth } = require('./middlewares/rateLimiter');

// 2. Importações de Rotas
const motoristaRoutes = require('./routes/motoristaRoutes');
const passageiroRoutes = require('./routes/passageiroRoutes');
const adminRoutes = require('./routes/adminRoutes');
const avaliacaoRoutes = require('./routes/avaliacaoRoutes');
const corridaRoutes = require('./routes/corridaRoutes');
const historicoRoutes = require('./routes/historicoRoutes');
const documentoRoutes = require('./routes/documentoRoutes');
const denunciaRoutes = require('./routes/denunciaRoutes');
const healthRoutes = require('./routes/healthRoutes'); // NOVO: Rota de Health Check

const app = express();
const PORT = process.env.PORT || 3000;

// CRÍTICO PARA O RENDER: Permite capturar o IP real do usuário passando pelo proxy da nuvem
app.set('trust proxy', 1);

// 3. Configuração do Servidor HTTP e Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' } 
});

io.on('connection', (socket) => {
    console.log(`Novo dispositivo conectado: ${socket.id}`);

    socket.on('atualizar_localizacao', async (dados) => {
        const { motorista_id, passageiro_id, lat, lng, direcao } = dados;

        try {
            if (motorista_id) {
                await redisClient.geoAdd('motoristas_disponiveis', {
                    longitude: lng,
                    latitude: lat,
                    member: String(motorista_id)
                });

                await redisClient.set(`motorista_socket:${motorista_id}`, socket.id);
            }

            if (passageiro_id) {
                const socketPassageiro = await redisClient.get(`passageiro_socket:${passageiro_id}`);

                if (socketPassageiro) {
                    io.to(socketPassageiro).emit('motorista_em_movimento', {
                        lat,
                        lng,
                        direcao: direcao || 0 
                    });
                }
            }
        } catch (erro) {
            console.error('Erro ao processar telemetria no Redis/Socket:', erro);
        }
    });

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

// NOVO: Middleware de log estruturado (formato 'dev' é excelente para leitura no terminal)
app.use(morgan('dev'));

// Aplica o limite geral para toda a API
app.use('/api', limiteGeral);

// Aplica o limite rigoroso especificamente nas rotas de autenticação/login
app.use('/api/passageiros/login', limiteAuth);
app.use('/api/motoristas/login', limiteAuth);

// 5. Injeção de Rotas
app.use('/api', motoristaRoutes);
app.use('/api', passageiroRoutes);
app.use('/api', adminRoutes);
app.use('/api', avaliacaoRoutes);
app.use('/api/corridas', corridaRoutes);
app.use('/api', historicoRoutes);
app.use('/api', documentoRoutes);
app.use('/api', denunciaRoutes);

// NOVO: Rota avançada de Health Check
app.use('/health', healthRoutes);

// Rota de Teste (Root)
app.get('/', (req, res) => {
    res.json({ mensagem: '🏍️ API do app de corridas está rodando e protegida!' });
});

// 6. Tratamento Global de Erros
app.use((err, req, res, next) => {
    console.error('🔴 Erro Global:', err);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
});

// ROTA TEMPORÁRIA PARA LIMPAR O REDIS
app.get('/limpar-radar', async (req, res) => {
    try {
        await redisClient.flushAll();
        res.json({ mensagem: 'Radar limpo! Todos os motoristas foram removidos da memória.' });
    } catch (erro) {
        res.status(500).json({ erro: 'Falha ao limpar Redis' });
    }
});

// 7. Inicialização do Servidor
server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`🔌 Socket.io habilitado e aguardando conexões.`);
});