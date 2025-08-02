const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Question = require('../models/Question');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Register
router.post('/register', async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        console.log('Registration failed: Missing fields', { email, name });
        return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        console.log('Registration failed: Invalid email', { email });
        return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password.length < 6) {
        console.log('Registration failed: Password too short', { email });
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    if (name.length < 2 || !name.match(/^[a-zA-Z\s]+$/)) {
        console.log('Registration failed: Invalid name', { name });
        return res.status(400).json({ error: 'Name must be at least 2 characters and contain only letters and spaces' });
    }
    try {
        let user = await User.findOne({ email });
        if (user) {
            console.log('Registration failed: User already exists', { email });
            return res.status(400).json({ error: 'User already exists' });
        }
        user = new User({
            email,
            password: await bcrypt.hash(password, 10),
            name
        });
        await user.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        console.log('Registration successful', { email, userId: user._id });
        return res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Registration error:', error.message, error.stack);
        return res.status(500).json({ error: 'Server error during registration', details: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        console.log('Login failed: Missing email or password', { email });
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log('Login failed: User not found', { email });
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Login failed: Incorrect password', { email });
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        console.log('Login successful', { email, userId: user._id });
        return res.status(200).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error('Login error:', error.message, error.stack);
        return res.status(500).json({ error: 'Server error during login', details: error.message });
    }
});

// Get progress
router.get('/progress', authMiddleware, async (req, res) => {
    try {
        const progress = await Progress.find({ userId: req.user.id });
        return res.status(200).json(progress);
    } catch (error) {
        console.error('Error fetching progress:', error.message, error.stack);
        return res.status(500).json({ error: 'Server error while fetching progress', details: error.message });
    }
});

// Save progress
router.post('/progress', authMiddleware, async (req, res) => {
    const { category, score, completedQuestions } = req.body;
    if (!category || score === undefined || !completedQuestions) {
        console.log('Progress save failed: Missing fields', { category, score });
        return res.status(400).json({ error: 'Category, score, and completed questions are required' });
    }
    try {
        const progress = new Progress({
            userId: req.user.id,
            category,
            score,
            completedQuestions
        });
        await progress.save();
        console.log('Progress saved', { userId: req.user.id, category, score });
        return res.status(201).json(progress);
    } catch (error) {
        console.error('Error saving progress:', error.message, error.stack);
        return res.status(500).json({ error: 'Server error while saving progress', details: error.message });
    }
});

// Get questions
router.get('/questions', async (req, res) => {
    const { category } = req.query;
    if (!category) {
        console.log('Questions fetch failed: Missing category');
        return res.status(400).json({ error: 'Category is required' });
    }
    try {
        let query = {};
        if (category !== 'exam') {
            query.category = category;
        }
        const questions = await Question.find(query).limit(category === 'exam' ? 64 : 10);
        if (!questions || questions.length === 0) {
            console.log('No questions found for category:', category);
            return res.status(404).json({ error: 'No questions found for this category' });
        }
        return res.status(200).json(questions);
    } catch (error) {
        console.error('Error fetching questions:', error.message, error.stack);
        return res.status(500).json({ error: 'Server error while fetching questions', details: error.message });
    }
});

module.exports = router;