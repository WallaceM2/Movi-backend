const rateLimit = require('express-rate-limit');

// Limite geral: aplica em toda a API
const limiteGeral = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100, // no máximo 100 requisições por IP nesse período
            message: { erro: ' Muitas requisições. Tente novamente em alguns minutos. '}
});

// Limite mais rígido, específico pra rotas de login (contra força bruta de senha)
const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000, 
        max: 5, // só 5 tentativas de login por IP a cada 15 minutos
            message: { erro: 'Muitas tentativas de login. Tente novamente em 15 minutos.'}
});

module.exports = { limiteGeral, limiteLogin };