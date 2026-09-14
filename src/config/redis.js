const redis = require('redis');

// Em produção, a URL virá do arquivo .env (ex: REDIS_URL=redis://usuario:senha@host:porta)
// Para o seu ambiente local, ele usa o padrão 127.0.0.1:6379

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        // Detecta automaticamente se a URL usa SSL/TLS (rediss://) e aplica a configuração de segurança
        tls: process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://'),
        rejectUnauthorized: false
    }
});

redisClient.on('error', (err) => {
    console.error('🔴 Erro de conexão no Redis:', err);
});

redisClient.on('connect', () => {
    console.log('🟡 Estabelecendo conexão com o Redis...');
});

redisClient.on('ready', () => {
    console.log('🟢 Redis conectado! Radar GPS pronto para uso.');
});

// Inicializa a conexão assíncrona assim que o módulo for importado
(async () => {
    try {
        await redisClient.connect();
    } catch (erro) {
        console.error('🔴 Falha ao inicializar o Redis:', erro);
    }
})();

module.exports = redisClient;