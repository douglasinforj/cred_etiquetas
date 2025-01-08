
const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const dbPromise = require('../db/database');


const router = express.Router();
const upload = multer({ dest: 'uploads/' });



const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;





// Rota principal para informações da API
router.get('/', (req, res) => {
    res.json({
      message: 'Bem-vindo à API do Sistema de Participantes',
      endpoints: {
        listar_participantes: '/participantes',
        cadastrar_participante: 'POST /participantes',
        atualizar_participante: 'PUT /participantes/:id',
        importar_participantes: 'POST /participantes/import',
        imprimir_etiqueta: 'GET /participantes/imprimir-etiqueta/:id',
      },
      status: 'API funcionando corretamente',
    });
  });




//Cadastro de Participante
router.post('/participantes', async (req, res) => {
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
router.put('/participantes/:id', async (req, res) => {
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

//Listar Participantes
router.get('/participantes', async (req, res) => {
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

//Importar Participantes via Excel
router.post('/participantes/import', upload.single('file'), async (req, res) => {
    try {
      const filePath = req.file.path;
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
      const db = await dbPromise;
      const stmt = `INSERT INTO participantes (nome, cargo, empresa, evento, data_evento, horario_evento) VALUES (?, ?, ?, ?, ?, ?)`;
  
      for (const row of data) {
        const { nome, cargo, empresa, evento, data_evento, horario_evento } = row;
        await db.query(stmt, [nome, cargo, empresa, evento, data_evento, horario_evento]);
      }
  
      res.json({ message: 'Participantes importados com sucesso!' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

//Imprimir Etiqueta e Realizar Check-in
router.get('/participantes/:id/imprimir-etiqueta', async (req, res) => {
    try {
      const { id } = req.params;
      const db = await dbPromise;
  
      // Buscar dados do participante
      const [rows] = await db.query(`SELECT * FROM participantes WHERE id = ?`, [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Participante não encontrado' });
      }
  
      const participante = rows[0];
  
      // Criar o PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([200, 100]);
      const { width, height } = page.getSize();
      
      const text = `
        Nome: ${participante.nome}
        Cargo: ${participante.cargo || '---'}
        Empresa: ${participante.empresa || '---'}
        Evento: ${participante.evento}
      `;
  
      page.drawText(text, { x: 10, y: height - 30 });
  
      // Salvar PDF em um arquivo temporário
      const pdfBytes = await pdfDoc.save();
      const tempFilePath = path.join(__dirname, 'etiqueta.pdf');
      fs.writeFileSync(tempFilePath, pdfBytes);
  
      // Enviar PDF para a impressora (Windows)
      exec(`start /min acrord32 /t "${tempFilePath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return res.status(500).json({ error: 'Erro ao enviar o PDF para a impressora' });
        }
  
        // Marcar check-in no banco de dados
        const horario_checkin = new Date();
        db.query(
          `UPDATE participantes SET checkin = 1, horario_checkin = ? WHERE id = ?`,
          [horario_checkin, id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Erro ao marcar check-in' });
            }
            res.json({ message: 'Etiqueta impressa e check-in realizado com sucesso!' });
          }
        );
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;