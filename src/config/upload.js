const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define onde e com que nome cada arquivo será salvo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Pasta separada por tipo de usuário e id (ex: uploads/motoristas/4/)
    const tipoUsuario = req.usuario.tipo === 'motorista' ? 'motoristas' : 'passageiros';
    const pasta = path.join(__dirname, '..', '..', 'uploads', tipoUsuario, String(req.usuario.id));

    // Cria a pasta automaticamente se ela ainda não existir
    fs.mkdirSync(pasta, { recursive: true });

    cb(null, pasta);
  },
  filename: (req, file, cb) => {
    // Nome do arquivo = nome do campo + extensão original (ex: rg.jpg, cnh.pdf)
    const extensao = path.extname(file.originalname);
    cb(null, `${file.fieldname}${extensao}`);
  }
});

// Filtro: só aceita imagens e PDF, nada mais
const filtroArquivo = (req, file, cb) => {
    const tiposPermitidos= ['image/jpeg', 'image/png', 'application/pdf'];

        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido. Envie apenas JPG, PNG ou PDF.'), false);
        }
};

const upload = multer ({
    storage,
    fileFilter: filtroArquivo,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB por arquivo
});

module.exports = upload;