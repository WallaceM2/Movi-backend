const pool = require('../config/database');

async function enviarCnh(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ erro: 'Nenhuma foto enviada no formato esperado.' });
        }

        const motorista_id = req.usuario.id;
        const caminhoFoto = req.file.filename;

        const query = `
            UPDATE motoristas 
            SET cnh_foto = $1, status_cadastro = 'em_analise' 
            WHERE id = $2 
            RETURNING id, nome, status_cadastro, cnh_foto;
        `;

        const resultado = await pool.query(query, [caminhoFoto, motorista_id]);

        res.json({
            mensagem: 'Documento recebido! Aguarde a aprovação do administrador.',
            perfil: resultado.rows[0]
        });
    } catch (erro) {
        console.error('Erro no upload:', erro);
        res.status(500).json({ erro: 'Falha ao processar o documento.' });
    }
}

module.exports = { enviarCnh };