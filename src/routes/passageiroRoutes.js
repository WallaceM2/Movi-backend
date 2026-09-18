const express = require('express');
const router = express.Router();
const passageiroController = require('../controllers/passageiroController');
// CORREÇÃO AQUI: Importando limiteAuth ao invés de limiteLogin
const { limiteAuth } = require('../middlewares/rateLimiter');
const validar = require('../middlewares/validar');
const { cadastroPassageiroSchema, loginSchema } = require('../validators/passageiroValidator');
const upload = require('../config/upload');
const permitirTipo = require('../middlewares/permitirTipo');
const verificarToken = require('../middlewares/autenticacao');

router.post('/passageiros', validar(cadastroPassageiroSchema), passageiroController.cadastrar);
router.get('/passageiros', passageiroController.listar);

// CORREÇÃO AQUI: Passando limiteAuth na rota
router.post('/passageiros/login', limiteAuth, validar(loginSchema), passageiroController.login);

router.post (
    '/passageiros/documentos',
        verificarToken,
        permitirTipo('passageiro'),
        upload.fields([
            { name: 'rg', maxCount: 1 },
            { name: 'cnh', maxCount: 1 },
            { name: 'foto_perfil', maxCount: 1 }
        ]),
        passageiroController.uploadDocumentos
);

module.exports = router;