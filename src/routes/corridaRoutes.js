const express = require('express');
const router = express.Router();

const corridaController = require('../controllers/corridaController');
const {
    verificarToken,
    apenasMotorista,
    apenasPassageiro
} = require('../middlewares/authMiddleware');

// 1. Estimativa da Viagem com OSRM (Restrito a Passageiros) - SEMPRE ANTES DOS IDs
router.post(
    '/estimar',
    verificarToken,
    apenasPassageiro,
    corridaController.estimar
);

// 2. Solicitação da Viagem (Restrito a Passageiros)
router.post(
    '/solicitar',
    verificarToken,
    apenasPassageiro,
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

module.exports = router;