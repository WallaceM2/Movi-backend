const express = require('express');
const router = express.Router();

const corridaController = require('../controllers/corridaController');
const {
    verificarToken,
    apenasMotorista,
    apenasPassageiro
} = require('../middlewares/authMiddleware');

// Importa a nova trava de validação de dados
const { validarCorrida } = require('../middlewares/validacaoMiddleware');

// 1. Estimativa da Viagem com OSRM (Restrito a Passageiros e Dados Validados)
router.post(
    '/estimar',
    verificarToken,
    apenasPassageiro,
    validarCorrida, // <-- Validação Joi inserida aqui
    corridaController.estimar
);

// 2. Solicitação da Viagem (Restrito a Passageiros e Dados Validados)
router.post(
    '/solicitar',
    verificarToken,
    apenasPassageiro,
    validarCorrida, // <-- Validação Joi inserida aqui
    corridaController.solicitarCorrida
);

// 3. Aceite do Motorista (Restrito a Motoristas)
router.post(
    '/:id/aceitar',
    verificarToken,
    apenasMotorista,
    corridaController.aceitarCorrida 
);

// 4. Início do Embarque (Restrito a Motoristas)
router.post(
    '/:id/iniciar',
    verificarToken,
    apenasMotorista,
    corridaController.iniciarEmbarque
);

// 5. Finalização da Corrida (Restrito a Motoristas)
router.post(
    '/:id/finalizar',
    verificarToken,
    apenasMotorista,
    corridaController.finalizarCorrida
);

// 6. Cancelamento da Corrida (Permitido para ambos)
router.post(
    '/:id/cancelar',
    verificarToken,
    corridaController.cancelarCorrida
);

module.exports = router;