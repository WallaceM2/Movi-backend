const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const verificarToken = require('../middlewares/autenticacao');
const permitirTipo = require('../middlewares/permitirTipo');
// CORREÇÃO AQUI: Importando limiteAuth ao invés de limiteLogin
const { limiteAuth } = require('../middlewares/rateLimiter');
const validar = require('../middlewares/validar');
const { loginSchema } = require('../validators/adminValidator');

// Todas as rotas abaixo exigem: estar logado E ser admin
router.get('/admin/motoristas', verificarToken, permitirTipo('admin'), adminController.listarMotoristas);
router.get('/admin/passageiros', verificarToken, permitirTipo('admin'), adminController.listarPassageiros);
router.get('/admin/motoristas/:id', verificarToken, permitirTipo('admin'), adminController.verMotorista);
router.patch('/admin/motoristas/:id/status', verificarToken, permitirTipo('admin'), adminController.atualizarStatusMotorista);

// CORREÇÃO AQUI: Passando limiteAuth na rota de login
router.post('/admin/login', limiteAuth, validar(loginSchema), adminController.login);

router.get('/admin/passageiros/:id', verificarToken, permitirTipo('admin'), adminController.verPassageiro);
router.patch('/admin/passageiros/:id/status', verificarToken, permitirTipo('admin'), adminController.atualizarStatusPassageiro);

module.exports = router;