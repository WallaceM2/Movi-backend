const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    // O token vem no cabeçalho "Authorization", geralmente no formato:
    // "Bearer eyJhbGciOiJIUzI1NiIs..."
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ erro: 'Token nao fornecido'});
    }

    // O cabeçalho vem como "Bearer TOKEN" — precisamos separar as duas partes
    const partes = authHeader.split(' ');

    if (partes.length !==2 ) {
        return res.status(401).json({ erro: 'Token mal formatado. '});
    }

    const [esquema, token] = partes;

    if (esquema !== 'Bearer') {
        return res.status(401).json({ erro: 'Token mal formatado. '});
    }

    // Verifica se o token é válido e não expirou

    jwt.verify(token, process.env.JWT_SECRET, (erro, decodificado) => {
        if (erro) {
            return res.status(401).json({ erro: 'Token inválido ou expirado'});
        }       
        // Guarda os dados do token pra qualquer controller usar depois
        req.motorista = {
            id: decodificado.id,
            categoria: decodificado.categoria
        };

        next(); // Libera a mensagem
    });
}

module.exports = verificarToken;