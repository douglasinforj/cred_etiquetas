const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 3306,
};

async function initDB() {
  const connection = await mysql.createConnection(dbConfig);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS participantes (
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

  console.log('Banco de dados conectado e tabela "participantes" inicializada.');
  return connection;
}

module.exports = initDB();