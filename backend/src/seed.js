require('dotenv').config({ path: '../.env' });
console.log('MONGO_URI:', process.env.MONGO_URI); // Debug log
const mongoose = require('mongoose');
const Question = require('./models/Question');
const rulesData = require('./data/rules');
const controlsData = require('./data/controls');
const signsData = require('./data/signs');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10
    });
    console.log('Connected to MongoDB for seeding');

    await Question.deleteMany({});
    const allQuestions = [...rulesData, ...controlsData, ...signsData];
    await Question.insertMany(allQuestions);
    console.log('Database seeded with questions');

    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding error:', error);
    mongoose.connection.close();
  }
};

seedDB();