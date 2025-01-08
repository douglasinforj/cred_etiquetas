const express = require('express');
const multer = require('multer')       //middleware do Node.js que é usado para manipular multipart/form-data, sendo a principal função fazer o upload de arquivos
const xlsx = require('xlsx');
const dbPromise = require('../db/database.db');
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

//Atualizar Participante
router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { nome, cargo, empresa, evento, data_evento, horario_evento, checkin } = req.body;
      const horario_checkin = checkin ? new Date() : null;
      const db = await dbPromise;
      const [result] = await db.query(
        `UPDATE participantes SET 
          nome = ?, 
          cargo = ?, 
          empresa = ?, 
          evento = ?, 
          data_evento = ?, 
          horario_evento = ?, 
          checkin = ?, 
          horario_checkin = ? 
         WHERE id = ?`,
        [nome, cargo, empresa, evento, data_evento, horario_evento, checkin, horario_checkin, id]
      );
      res.json({ updated: result.affectedRows });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

//Listando Participantes
router.get('/', async (req, res) => {
    try {
        const db = await dbPromise;
        const [rows] =  await db.query(
            `SELECT id, nome, cargo, empresa, evento, data_evento, horario_evento, data_inscricao, checkin, horario_checkin FROM participantes`
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message});
    }
});

