const express = require('express');
const router = express.Router();
const historicoController = require('../controllers/historicoController');
const verificarToken = require('../middlewares/autenticacao');

// Rota única que serve tanto para passageiro ver viagens, quanto motorista ver ganhos
router.get('/extrato', verificarToken, historicoController.consultarExtrato);

module.exports = router;