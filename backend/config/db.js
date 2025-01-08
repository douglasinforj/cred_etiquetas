const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 3306, // Porta padrão do MySQL
};

// Função para inicializar o banco de dados
async function initDB() {
  try {
    const connection = await mysql.createConnection(dbConfig);

    // Criar tabela se não existir
    await connection.query(`
      CREATE TABLE IF NOT EXISTS participante (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cargo VARCHAR(255),
        empresa VARCHAR(255),
        evento VARCHAR(255),
        data_evento DATE,
        horario_evento TIME,
        data_inscricao DATETIME DEFAULT CURRENT_TIMESTAMP,
        checkin BOOLEAN DEFAULT 0,
        horario_checkin DATETIME
      )
    `);

    console.log('Banco de dados conectado e tabela inicializada');
    return connection; // Retorna a conexão para reutilização
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    throw err;
  }
}

module.exports = {
  initDB,
  dbConfig,
};