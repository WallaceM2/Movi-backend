const Joi = require('joi');

// Define as regras exatas do que é aceito no Body da requisição
const corridaSchema = Joi.object({
    origem: Joi.string().required().messages({
        'string.empty': 'O endereço de origem não pode estar vazio.',
        'any.required': 'O endereço de origem é obrigatório.'
    }),
    destino: Joi.string().required().messages({
        'string.empty': 'O endereço de destino não pode estar vazio.',
        'any.required': 'O endereço de destino é obrigatório.'
    }),
    origem_lat: Joi.number().required().messages({
        'number.base': 'A latitude de origem deve ser um número.',
        'any.required': 'A latitude de origem é obrigatória.'
    }),
    origem_lng: Joi.number().required().messages({
        'number.base': 'A longitude de origem deve ser um número.',
        'any.required': 'A longitude de origem é obrigatória.'
    }),
    destino_lat: Joi.number().required().messages({
        'number.base': 'A latitude de destino deve ser um número.',
        'any.required': 'A latitude de destino é obrigatória.'
    }),
    destino_lng: Joi.number().required().messages({
        'number.base': 'A longitude de destino deve ser um número.',
        'any.required': 'A longitude de destino é obrigatória.'
    }),
    categoria: Joi.string().valid('carro', 'moto').required().messages({
        'any.only': 'A categoria deve ser "carro" ou "moto".',
        'any.required': 'A categoria do veículo é obrigatória.'
    })
});

// Middleware que intercepta a rota e checa as regras
function validarCorrida(req, res, next) {
    // abortEarly: false faz com que o Joi retorne TODOS os erros de uma vez, e não pare no primeiro
    const { error } = corridaSchema.validate(req.body, { abortEarly: false });

    if (error) {
        // Extrai apenas as mensagens de erro limpas para enviar ao usuário
        const mensagensErro = error.details.map(detalhe => detalhe.message);
        return res.status(400).json({ 
            erro: 'Dados inválidos ou ausentes na requisição.', 
            detalhes: mensagensErro 
        });
    }

    // Se passou na validação, segue para o Controller
    next();
}

module.exports = { validarCorrida };