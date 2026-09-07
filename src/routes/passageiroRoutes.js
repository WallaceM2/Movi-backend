const express = require('express');
const router = express.Router();
const passageiroController = require('../controllers/passageiroController');
const { limiteLogin } = require('../middlewares/rateLimiter');
const validar = require('../middlewares/validar');
const { cadastroPassageiroSchema, loginSchema } = require('../validators/passageiroValidator');
const upload = require('../config/upload');
const permitirTipo = require('../middlewares/permitirTipo');
const verificarToken = require('../middlewares/autenticacao');

router.post('/passageiros', validar(cadastroPassageiroSchema), passageiroController.cadastrar);
router.get('/passageiros', passageiroController.listar);
router.post('/passageiros/login', limiteLogin, validar(loginSchema), passageiroController.login);
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