const { z } = require('zod');

const dataNascimentoSchema = z 
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Data deve estar no formato DD/MM/AAAA')
    .transform((valor) => {
        const [dia, mes, ano] = valor.split('/');
        return `${ano}-${mes}-${dia}`;
    })
    .refine((dataISO) => !isNaN(Date.parse(dataISO)), 'Data inválida');

const cadastroPassageiroSchema = z.object({
    nome: z.string().min(2, 'Nome muito curto').max(100),
    sobrenome: z.string().min(2, 'Sobrenome muito curto').max(100),
    email: z.string().email('Email inválido'),
    telefone: z.string().min(10, 'Telefone inválido').max(20),
    senha: z.string().min(6, 'Senha precisa ter no mínimo 6 caracteres'),
    data_nascimento: dataNascimentoSchema,
    nacionalidade: z.string().optional(),
    cpf: z.string().length(11, 'CPF deve ter 11 dígitos'),
    rg: z.string().optional(),
    cnh: z.string().optional(),
    regiao: z.string().optional(),
    estado: z.string().length(2, 'Estado deve ter 2 letras (ex: PE)'),
    cidade: z.string().optional()
});

const loginSchema = z.object({
        email: z.string().email('Email inválido'),
        senha: z.string().min(1, 'Senha é obrigatória')
});

module.exports = { cadastroPassageiroSchema, loginSchema };