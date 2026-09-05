// Middleware genérico: recebe um "schema" (regra) do Zod e valida o req.body com ele

function validar(schema) {
    return (req, res, next) => {
        const resultado = schema.safeParse(req.body);

            if (!resultado.success) {
                const erros = resultado.error.issues.map(e => ({
                    campo: e.path.join('.'),
                        mensagem: e.message
                }));
                    return res.status(400).json({ erro: 'Dados inválidos. ', detalhes: erros });
            }

            req.body = resultado.data // dados já validados e "limpos"
                next();
    };
}

module.exports = validar;