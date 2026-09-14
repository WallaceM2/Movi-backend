const multer = require('multer');
const path = require('path');
const fs = require('fs');


const pastaDestino = path.resolve(__dirname, '..', '..', 'uploads', 'documentos');
if (!fs.existsSync(pastaDestino)) {
    fs.mkdirSync(pastaDestino, { recursive: true });
}

const configuracao = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, pastaDestino);
    },
    filename: (req, file, cb) => {
        // Renomeia o arquivo para: cnh-ID_MOTORISTA-DATA.jpg
        const id = req.usuario ? req.usuario.id : 'temp';
        const extensao = path.extname(file.originalname);
        cb(null, `cnh-${id}-${Date.now()}${extensao}`);
    }
});

module.exports = multer({ storage: configuracao });