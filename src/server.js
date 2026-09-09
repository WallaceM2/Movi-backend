require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
require('./config/database');
const redisClient = require('./config/redis');

// 1. Importações de Banco e Middlewares Customizados
require('./config/database');
const { limiteGeral } = require('./middlewares/rateLimiter');

// 2. Importações de Rotas
const motoristaRoutes = require('./routes/motoristaRoutes');
const passageiroRoutes = require('./routes/passageiroRoutes');
const adminRoutes = require('./routes/adminRoutes');
const avaliacaoRoutes = require('./routes/avaliacaoRoutes');
const corridaRoutes = require('./routes/corridaRoutes'); // Nova rota!

const app = express();
const PORT = process.env.PORT || 3000;

// 3. Configuração do Servidor HTTP e Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' } 
});

io.on('connection', (socket) => {
    console.log(`Novo dispositivo conectado: ${socket.id}`);

    // Registro e GPS do Motorista 
    socket.on('atualizar_localizacao', async (dados) => {
        const { motorista_id, lat, lng } = dados;
        
        try {
            // Salva as coordenadas exatas no radar do Redis
            await redisClient.geoAdd('motoristas_disponiveis', {
                longitude: lng,
                latitude: lat,
                member: motorista_id.toString() 
            });
            
            // Salva qual é a conexão (socket.id) atual deste motorista
            await redisClient.set(`motorista_socket:${motorista_id}`, socket.id);
            
            console.log(`Motorista ${motorista_id} online e GPS atualizado.`);
        } catch (erro) {
            console.error('Erro ao atualizar GPS no Redis:', erro);
        }
    });

    // Registro do Passageiro (Necessário para ele receber notificações)
    socket.on('registrar_passageiro', async (dados) => {
        try {
            // Salva o socket do passageiro no Redis
            await redisClient.set(`passageiro_socket:${dados.passageiro_id}`, socket.id);
            console.log(`Passageiro ${dados.passageiro_id} está online.`);
        } catch (erro) {
            console.error('Erro ao registrar passageiro no Redis:', erro);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Dispositivo desconectado: ${socket.id}`);
        // Futuro: Implementar a remoção do ID do Redis quando o app for fechado
    });
});

app.set('io', io);


// 4. Middlewares Globais (Devem vir ANTES das rotas)
app.use(helmet()); 
app.use(express.json({ limit: '10kb' })); 
app.use('/uploads', express.static('uploads'));
app.use('/api', limiteGeral); // Protege todas as rotas que começam com /api

// 5. Injeção de Rotas
app.use('/api', motoristaRoutes);
app.use('/api', passageiroRoutes);
app.use('/api', adminRoutes);
app.use('/api', avaliacaoRoutes);
app.use('/api/corridas', corridaRoutes); // Rota dedicada às corridas

// Rota de Teste (Root)
app.get('/', (req, res) => {
    res.json({ mensagem: '🏍️ API do app de corridas está rodando e protegida!' });
});

// 6. Tratamento Global de Erros (Deve ser o ÚLTIMO app.use)
app.use((err, req, res, next) => {
    console.error('🔴 Erro Global:', err);
    res.status(500).json({ erro: 'Erro interno no servidor.' });
});

// 7. Inicialização do Servidor (Única chamada de listen)
server.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`🔌 Socket.io habilitado e aguardando conexões.`);
});