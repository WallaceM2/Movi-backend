const pool = require('./config/database');
const bcrypt = require('bcrypt');

async function resetarSenha() {
  const email = 'admin@movi.com'; // troque pelo email real do seu admin
  const novaSenha = 'deusnaminhavida1';   // escolha uma senha nova aqui

  const senha_hash = await bcrypt.hash(novaSenha, 10);

  const query = `
    UPDATE admins
    SET senha_hash = $1
    WHERE email = $2
    RETURNING id, nome, email;
  `;

  const resultado = await pool.query(query, [senha_hash, email]);

  if (resultado.rows.length === 0) {
    console.log('❌ Nenhum admin encontrado com esse email.');
  } else {
    console.log('✅ Senha atualizada para:', resultado.rows[0]);
  }

  process.exit();
}

resetarSenha();