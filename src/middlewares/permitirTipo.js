// Middleware "gerador" — recebe quais tipos são permitidos, e devolve o middleware de verdade
function permitirTipo(...tiposPermitidos) {
    return(req, res, next) => {
        // Esse middleware SEMPRE roda depois do verificarToken,
        // então req.usuario já deve existir aqui
        if (!req.usuario || !tiposPermitidos.includes(req.usuario.tipo)) {
            return res.status(403).json({
                erro: `Acesso negado. Rota exclusiva para: ${tiposPermitidos.join(', ')}.`
            });
        }
        next();
    };
}

module.exports = permitirTipo;
