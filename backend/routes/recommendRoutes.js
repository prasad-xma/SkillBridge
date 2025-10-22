const express = require('express')
const { recommendSkills, getRecommendations } = require('../controllers/recommendController')

const router = express.Router()

router.post('/recommend-skills', recommendSkills)
router.get('/recommendations', getRecommendations)

module.exports = router
