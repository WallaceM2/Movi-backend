const { z } = require('zod');

const avaliacaoSchema = z.object({
    avaliado_tipo: z.enum(['motorista', 'passageiro']),
    avaliado_id: z.number().int().positive(),
    nota: z.number().int().min(1, 'Nota mínima é 1').max(5, 'Nota máxima é 5'),
    tag: z.string().optional(),
    comentario: z.string().optional()
});

module.exports = { avaliacaoSchema };