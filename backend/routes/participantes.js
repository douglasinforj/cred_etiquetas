const express = require('express');
const multer = require('multer')       //middleware do Node.js que é usado para manipular multipart/form-data, sendo a principal função fazer o upload de arquivos
const xlsx = require('xlsx');
const dbPromise = require('../db/database.db');
const router = express.Router();
const printer = require('printer');

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


/*TODO: apagar Imprimir Etiquetas e Registrar Checkin
router.post('/checkin/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const db = await dbPromise;
        const horario_checkin = new Date();
        const [result] = await db.query(
            `UPDATE participantes SET checkin = 1, horario_checkin = ? WHERE id = ?`,
            [horario_checkin, id]
        );
        res.json({ message: 'Check-in realizado com sucesso!', horario_checkin});
    } catch (error) {
        res.status(500).json({ error: error.message});
    }
});
*/


router.get('/imprimir-etiqueta/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const db = await dbPromise;
  
      // Buscar dados do participante
      const [rows] = await db.query(`SELECT * FROM participantes WHERE id = ?`, [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Participante não encontrado' });
      }
  
      const participante = rows[0];
  
      // Conteúdo da etiqueta
      const etiqueta = `
        Nome: ${participante.nome}
        Cargo: ${participante.cargo || '---'}
        Empresa: ${participante.empresa || '---'}
        Evento: ${participante.evento}
      `;
  
      // Enviar para a impressora
      printer.printDirect({
        data: etiqueta,
        type: 'RAW',
        success: async () => {
          // Marcar check-in no banco de dados
          const horario_checkin = new Date();
          await db.query(
            `UPDATE participantes SET checkin = 1, horario_checkin = ? WHERE id = ?`,
            [horario_checkin, id]
          );
          res.json({ message: 'Etiqueta impressa e check-in realizado com sucesso!' });
        },
        error: (err) => {
          console.error(err);
          res.status(500).json({ error: 'Erro ao imprimir a etiqueta' });
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });




//Rota pata importar participantes em excel

router.post('/import', upload.single('file'), async (req, res) => {
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
  

