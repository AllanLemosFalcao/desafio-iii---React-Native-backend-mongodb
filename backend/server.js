require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Importa o modelo (Certifique-se que o arquivo models/Place.js também foi atualizado)
const Place = require('./models/Place');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/geoapp';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Healthcheck
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Geo Backend API - Registro de Defeitos' });
});

// List all places (Listar Defeitos)
app.get('/api/places', async (req, res) => {
  try {
    const places = await Place.find().sort({ createdAt: -1 });
    res.json(places);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar registros' });
  }
});

// Create new place (Registrar Defeito)
app.post('/api/places', async (req, res) => {
  try {
    // 1. Recebemos o novo campo 'laboratory' aqui
    const { title, description, laboratory, latitude, longitude, photo } = req.body;

    // 2. Validamos se o laboratório foi preenchido
    if (!title || !description || !laboratory || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Campos obrigatórios: title, description, laboratory, latitude, longitude' });
    }

    // 3. Salvamos o laboratório no banco
    const place = new Place({
      title,
      description,
      laboratory, // <--- Novo campo salvo
      latitude,
      longitude,
      photo: photo || null,
    });

    await place.save();
    res.status(201).json(place);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar registro' });
  }

  // Delete place (Deletar registro)
app.delete('/api/places/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Place.findByIdAndDelete(id);
    res.json({ message: 'Registro deletado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar registro' });
  }
});
});



mongoose
  .connect(MONGO_URI, { })
  .then(() => {
    console.log('MongoDB conectado');
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao conectar no MongoDB', err);
    process.exit(1);
  });