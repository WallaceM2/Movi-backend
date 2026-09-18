const rateLimit = require('express-rate-limit');

// Limite geral da API: 100 requisições a cada 15 minutos por IP
const limiteGeral = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { erro: 'Muitas requisições deste IP. Por favor, aguarde 15 minutos.' },
    standardHeaders: true, 
    legacyHeaders: false, 
});

// Limite rigoroso para Login/Cadastro: 10 tentativas a cada 15 minutos por IP
const limiteAuth = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10, 
    message: { erro: 'Muitas tentativas de acesso. Bloqueado por 15 minutos por segurança.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { limiteGeral, limiteAuth };