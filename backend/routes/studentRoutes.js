const express = require('express');
const { saveQuestionnaire } = require('../controllers/studentController');

const router = express.Router();

router.post('/questionnaire', saveQuestionnaire);

module.exports = router;
