const Joi = require('joi');

// Define as regras exatas do que é aceito no Body da requisição (Estimar / Solicitar)
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
    }),
    
    // --- NOVO CAMPO DA ETAPA 3: FORMA DE PAGAMENTO ---
    forma_pagamento: Joi.string().valid('dinheiro', 'cartao', 'pix').optional().messages({
        'any.only': 'A forma de pagamento deve ser "dinheiro", "cartao" ou "pix".'
    })
});

// --- NOVO SCHEMA: Validação para quando o motorista Finaliza a Corrida ---
const finalizacaoSchema = Joi.object({
    status_pagamento: Joi.string().valid('pago', 'parcial', 'nao_pago').optional(),
    valor_recebido_motorista: Joi.number().min(0).optional().messages({
        'number.min': 'O valor recebido não pode ser negativo.'
    }),
    observacao_pagamento: Joi.string().allow('').optional()
});

// Middleware que intercepta a rota e checa as regras de solicitação
function validarCorrida(req, res, next) {
    const { error } = corridaSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const mensagensErro = error.details.map(detalhe => detalhe.message);
        return res.status(400).json({ 
            erro: 'Dados inválidos ou ausentes na requisição.', 
            detalhes: mensagensErro 
        });
    }
    next();
}

// Middleware que intercepta a rota de finalização (opcional para o futuro)
function validarFinalizacao(req, res, next) {
    const { error } = finalizacaoSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const mensagensErro = error.details.map(detalhe => detalhe.message);
        return res.status(400).json({ 
            erro: 'Dados financeiros inválidos.', 
            detalhes: mensagensErro 
        });
    }
    next();
}

module.exports = { validarCorrida, validarFinalizacao };