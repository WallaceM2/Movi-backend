const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verificarToken = require('../middlewares/autenticacao');
const permitirTipo = require('../middlewares/permitirTipo');

router.post('/admin/login', adminController.login);

// Todas as rotas abaixo exigem: estar logado E ser admin
router.get('/admin/motoristas', verificarToken, permitirTipo('admin'), adminController.listarMotoristas);
router.get('/admin/passageiros', verificarToken, permitirTipo('admin'), adminController.listarPassageiros);

module.exports = router;