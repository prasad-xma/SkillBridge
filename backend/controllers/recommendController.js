const { GoogleGenerativeAI } = require('@google/generative-ai')

async function runTestPrompt() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  const prompt = 'Explain how AI works in a few words'
  const result = await model.generateContent(prompt)
  const response = result?.response
  return response?.text?.() || ''
}

async function recommendSkills(req, res) {
  try {
    const text = await runTestPrompt()
    return res.status(200).json({ ok: true, text })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate test response', error: error.message })
  }
}

async function getRecommendations(req, res) {
  try {
    const text = await runTestPrompt()
    return res.status(200).json({ ok: true, text })
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate test response', error: error.message })
  }
}

module.exports = { recommendSkills, getRecommendations }
