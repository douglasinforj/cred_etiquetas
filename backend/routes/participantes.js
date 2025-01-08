const express = require('express');
const multer = require('multer')       //middleware do Node.js que é usado para manipular multipart/form-data, sendo a principal função fazer o upload de arquivos
const xlsx = require('../db/datebase.db');
const router = express.Router();

//configurando upload de arquivos
const upload = multer({ dest: 'upload/'});

//Rotas

//Cadastrar Participante
router.post('/', async(req, res) => {
    try {
        const { nome, cargo, empresa, evento, data_evento, horario_evento } = req.body;
        const db = await dbPromise;
        const [result] = await db.query(
            `INSERT INTO participantes (nome, cargo, empresa, evento, data_evento, horario_evento) VALUES (?, ?, ?, ?, ?, ?)`,
            [nome, cargo, empresa, evento, data_evento, horario_evento]
          );
          res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

