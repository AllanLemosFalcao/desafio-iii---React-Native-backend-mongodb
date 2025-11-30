const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema({
  title: String,       // Nome do Equipamento
  description: String, // Descrição do Defeito
  laboratory: String,  // Novo campo: Laboratório
  latitude: Number,    // Local (GPS)
  longitude: Number,   // Local (GPS)
  photo: String,       // Foto do defeito (Base64)
  createdAt: {         // Data e Hora (Automático)
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Place', PlaceSchema);