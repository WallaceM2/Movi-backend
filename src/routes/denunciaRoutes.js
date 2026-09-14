const express = require('express');
const router = express.Router();
const denunciaController = require('../controllers/denunciaController');
const verificarToken = require('../middlewares/autenticacao');

// Rota para registrar um problema grave na viagem
router.post('/denuncias', verificarToken, denunciaController.criarDenuncia);

module.exports = router;