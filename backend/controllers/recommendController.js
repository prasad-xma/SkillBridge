const { GoogleGenerativeAI } = require('@google/generative-ai')
const admin = require('../config/firebase')

const db = admin.firestore()
const MODEL_ID = 'gemini-2.5-flash'
const PROVIDER = 'google'
const PROMPT_VERSION = 'student-recs.v1'

function timestampsEqual(a, b) {
  if (!a || !b) return false
  const aMillis = typeof a.toMillis === 'function' ? a.toMillis() : null
  const bMillis = typeof b.toMillis === 'function' ? b.toMillis() : null
  return aMillis !== null && bMillis !== null && aMillis === bMillis
}

function toIso(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') {
    try {
      return value.toDate().toISOString()
    } catch (_) {
      return null
    }
  }
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return null
}

function skillsSummary(skillsLevels = {}) {
  const entries = Object.entries(skillsLevels)
  if (!entries.length) return 'Current skill levels not provided.'
  return entries
    .map(([skill, level]) => `${skill}: ${level}/10`)
    .join(', ')
}

function buildPrompt(answers) {
  const name = answers.fullName || answers.displayName || 'the student'
  const education = answers.educationLevel || 'Unknown education level'
  const domain = answers.domain || answers.fieldOfStudy || 'General domain'
  const stage = answers.careerStage || answers.experienceLevel || 'N/A'
  const interests = Array.isArray(answers.interests) ? answers.interests.join(', ') : answers.interests || 'Not specified'
  const preferredLearning = answers.learningFormat || answers.preferredLearning || 'No preference provided'
  const availability = answers.weeklyAvailability || 'Availability not provided'
  const goalTimeframe = answers.goalTimeframe || answers.goal || 'No timeframe provided'
  const openGoal = answers.openAnswer || answers.careerGoal || 'No long-form goal provided'
  const currentSkills = skillsSummary(answers.skillsLevels || answers.currentSkills)

  return `You are an expert career mentor creating a personalized growth plan.

Student profile:
- Name: ${name}
- Education level: ${education}
- Primary domain or field: ${domain}
- Career stage / experience level: ${stage}
- Interests: ${interests}
- Learning preferences: ${preferredLearning}
- Weekly availability: ${availability}
- Goal timeframe: ${goalTimeframe}
- Current skills summary: ${currentSkills}
- Long-form goal or motivation: ${openGoal}

Tasks:
1. Recommend 3 to 5 concrete, high-impact skills that this student should develop next. They can include technical, soft, or industry-specific skills. Tailor choices to the profile and highlight why each matters.
2. Write a short motivational advice paragraph (2-3 sentences) referencing their current skills, interests, and goals.

Output format:
- Return ONLY valid JSON with this exact structure:
{
  "skills": [
    { "name": "string", "why": "string" }
  ],
  "advice": "string"
}
- Do not include extra keys, markdown, or explanations.
- "skills" must contain 3-5 items.
- Each "why" should be specific and personal to the profile.
- "advice" should feel encouraging and actionable.
`
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: MODEL_ID })
  const result = await model.generateContent(prompt)
  const text = result?.response?.text?.()
  if (!text) {
    throw new Error('Empty response from Gemini')
  }
  return text
}

function parseModelResponse(text) {
  if (!text) return null
  let cleaned = text.trim()
  cleaned = cleaned.replace(/```json|```/gi, '').trim()
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first >= 0 && last >= first) {
    cleaned = cleaned.slice(first, last + 1)
  }
  try {
    return JSON.parse(cleaned)
  } catch (_) {
    return null
  }
}

function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return []
  return skills
    .map((item) => {
      if (!item) return null
      if (typeof item === 'string') {
        return { name: item, why: '' }
      }
      const name = item.name || item.skill || item.title || ''
      const why = item.why || item.reason || item.description || ''
      if (!name) return null
      return { name, why }
    })
    .filter(Boolean)
}

function serializeRecommendations(rec, questionnaireUpdatedAt) {
  if (!rec) return null
  const questionnaireIso = toIso(questionnaireUpdatedAt)
  const recQuestionnaireIso = toIso(rec.questionnaireUpdatedAt)
  const generatedAtIso = toIso(rec.generatedAt)

  return {
    skills: normalizeSkills(rec.skills),
    advice: typeof rec.advice === 'string' ? rec.advice : '',
    model: rec.model || MODEL_ID,
    provider: rec.provider || PROVIDER,
    promptVersion: rec.promptVersion || PROMPT_VERSION,
    generatedAt: generatedAtIso,
    questionnaireUpdatedAt: recQuestionnaireIso,
    questionnaireLatest: questionnaireIso,
    isStale: Boolean(questionnaireIso && recQuestionnaireIso && questionnaireIso !== recQuestionnaireIso),
  }
}

async function generateAndStore(docRef, answers, questionnaireUpdatedAt) {
  const prompt = buildPrompt(answers)
  const raw = await callGemini(prompt)
  const parsed = parseModelResponse(raw)
  const skills = normalizeSkills(parsed && parsed.skills)
  const advice = parsed && typeof parsed.advice === 'string' ? parsed.advice.trim() : ''

  if (!skills.length) {
    throw new Error('Gemini response missing skills array')
  }
  if (!advice) {
    throw new Error('Gemini response missing advice')
  }

  const payload = {
    skills,
    advice,
    model: MODEL_ID,
    provider: PROVIDER,
    promptVersion: PROMPT_VERSION,
    questionnaireUpdatedAt: questionnaireUpdatedAt || null,
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }

  await docRef.set({ recommendations: payload }, { merge: true })
  const freshSnap = await docRef.get()
  const freshData = freshSnap.data()
  return serializeRecommendations(freshData.recommendations, freshData.updatedAt)
}

function getDocId(body = {}, query = {}) {
  if (body.userId || query.userId) return body.userId || query.userId
  if (body.email || query.email) return body.email || query.email
  return null
}

async function recommendSkills(req, res) {
  try {
    const docId = getDocId(req.body)
    if (!docId) {
      return res.status(400).json({ message: 'Missing userId or email' })
    }

    const docRef = db.collection('questionnaireResponses').doc(docId)
    const snap = await docRef.get()
    if (!snap.exists) {
      return res.status(404).json({ message: 'Questionnaire not found' })
    }

    const data = snap.data() || {}
    const answers = data.answers
    if (!answers || !Object.keys(answers).length) {
      return res.status(404).json({ message: 'Questionnaire answers missing' })
    }

    const questionnaireUpdatedAt = data.updatedAt || null
    const existing = data.recommendations
    const force = Boolean(req.body && req.body.force)

    if (existing && questionnaireUpdatedAt && !force) {
      if (timestampsEqual(existing.questionnaireUpdatedAt, questionnaireUpdatedAt)) {
        return res.status(200).json(serializeRecommendations(existing, questionnaireUpdatedAt))
      }
    }

    const recommendations = await generateAndStore(docRef, answers, questionnaireUpdatedAt)
    return res.status(200).json(recommendations)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate recommendations', error: error.message })
  }
}

async function getRecommendations(req, res) {
  try {
    const docId = getDocId({}, req.query || {})
    if (!docId) {
      return res.status(400).json({ message: 'Missing userId or email' })
    }

    const docRef = db.collection('questionnaireResponses').doc(docId)
    const snap = await docRef.get()
    if (!snap.exists) {
      return res.status(404).json({ message: 'Questionnaire not found' })
    }

    const data = snap.data() || {}
    const rec = data.recommendations
    if (!rec) {
      return res.status(404).json({ message: 'No recommendations' })
    }

    return res.status(200).json(serializeRecommendations(rec, data.updatedAt))
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load recommendations', error: error.message })
  }
}

module.exports = { recommendSkills, getRecommendations }
