const redis = require('redis');

// Se houver uma REDISS_URL ou REDIS_URL, extrai ou usa a configuração segura
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
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

(async () => {
    try {
        await redisClient.connect();
    } catch (erro) {
        console.error('🔴 Falha ao inicializar o Redis:', erro);
    }
})();

module.exports = redisClient;