const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });
    }

    const partes = authHeader.split(' ');
    
    // Valida se o formato é exatamente "Bearer <token>"
    if (partes.length !== 2 || partes[0] !== 'Bearer') {
        return res.status(401).json({ erro: 'Formato de token inválido. Use: Bearer <token>' });
    }

    const token = partes[1];

    try {
        // Verifica a assinatura e a validade usando o segredo do seu .env
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decodificado;
        next();
    } catch (erro) {
        return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }
}

function apenasMotorista(req, res, next) {
    // A trava !req.usuario previne crashes caso o objeto chegue nulo
    if (!req.usuario || req.usuario.tipo !== 'motorista') {
        return res.status(403).json({ erro: 'Acesso restrito para motoristas.' });
    }
    next();
}

function apenasPassageiro(req, res, next) {
    if (!req.usuario || req.usuario.tipo !== 'passageiro') {
        return res.status(403).json({ erro: 'Acesso restrito para passageiros.' });
    }
    next();
}

module.exports = { 
    verificarToken, 
    apenasMotorista, 
    apenasPassageiro 
};