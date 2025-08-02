const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
  category: { type: String, required: true, enum: ['rules', 'signs', 'controls', 'exam'] },
  image: { type: String, default: '' }
});

module.exports = mongoose.model('Question', questionSchema);