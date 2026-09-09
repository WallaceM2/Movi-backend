const express = require('express');
const router = express.Router();

const corridaController = require('../controllers/corridaController');
const {
    verificarToken,
    apenasMotorista,
    apenasPassageiro
} = require('../middlewares/authMiddleware');

// 1. Solicitação da Viagem (Restrito a Passageiros)
router.post(
    '/solicitar',
    verificarToken,
    apenasPassageiro,
    corridaController.solicitarCorrida
);

// 2. Aceite do Motorista (Restrito a Motoristas)
router.post(
    '/:id/aceitar',
    verificarToken,
    apenasMotorista,
    corridaController.aceitar
);

// 3. Início do Embarque (Restrito a Motoristas)
router.post(
    '/:id/iniciar',
    verificarToken,
    apenasMotorista,
    corridaController.iniciarEmbarque
);

module.exports = router;