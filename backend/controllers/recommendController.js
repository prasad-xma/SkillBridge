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

function buildTagsPrompt(answers, skills = []) {
  const domain = answers.domain || answers.fieldOfStudy || 'General'
  const interests = Array.isArray(answers.interests) ? answers.interests.join(', ') : (answers.interests || 'General')
  const skillHints = Array.isArray(skills) ? skills.map(s => (s && (s.name || s.skill || s.title))).filter(Boolean).join(', ') : ''
  return `You are an expert career mentor.

Task: Produce a concise list of concrete skill tags (technologies, tools, frameworks, or short competency phrases) tailored to the student's domain and interests. Focus on nouns like HTML, CSS, JavaScript, React, Python, MongoDB, etc. Avoid sentences.

Student context:
- Domain: ${domain}
- Interests: ${interests}
- Recommended skills (hints): ${skillHints}

Output format (JSON only, no prose):
{
  "tags": ["tag1", "tag2", "tag3", "..."]
}
- 6 to 14 items
- No duplicates
- Each item must be 2-20 characters
`}

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

function parseTagsResponse(text) {
  if (!text) return []
  let cleaned = text.trim()
  cleaned = cleaned.replace(/```json|```/gi, '').trim()
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  const arrFirst = cleaned.indexOf('[')
  const arrLast = cleaned.lastIndexOf(']')
  try {
    if (arrFirst >= 0 && arrLast >= arrFirst) {
      const js = JSON.parse(cleaned.slice(arrFirst, arrLast + 1))
      return Array.isArray(js) ? js : []
    }
    if (first >= 0 && last >= first) {
      const obj = JSON.parse(cleaned.slice(first, last + 1))
      const t = obj && obj.tags
      return Array.isArray(t) ? t : []
    }
    const fallback = JSON.parse(cleaned)
    return Array.isArray(fallback) ? fallback : (Array.isArray(fallback?.tags) ? fallback.tags : [])
  } catch (_) {
    return []
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

// Local deterministic fallback when model calls are unavailable
function localGenerateFromAnswers(answers = {}) {
  const domain = (answers.domain || answers.fieldOfStudy || 'general').toString().toLowerCase()
  const interests = Array.isArray(answers.interests) ? answers.interests.map(String) : []
  const skillsLevels = answers.skillsLevels || {}

  const picks = []
  const push = (name, why) => {
    if (name && !picks.find((p) => p.name.toLowerCase() === String(name).toLowerCase())) {
      picks.push({ name, why })
    }
  }

  const addWeb = () => {
    push('JavaScript', 'Core language for interactive web apps and many frameworks you may use.')
    push('React', 'A dominant frontend library; mastering it opens many project opportunities.')
    push('Node.js', 'Lets you build full‑stack apps and APIs using one language end‑to‑end.')
  }
  const addMobile = () => {
    push('React Native', 'Cross‑platform mobile apps align well with your interests.')
    push('TypeScript', 'Stronger types improve app reliability and developer velocity.')
    push('Mobile UI Patterns', 'Design patterns will help you craft polished experiences.')
  }
  const addData = () => {
    push('Python', 'Primary language for data work and ML experimentation.')
    push('Pandas', 'Core library for data wrangling and analysis.')
    push('SQL', 'Essential for querying and working with real‑world datasets.')
  }
  const addAI = () => {
    push('Machine Learning', 'Foundational concepts to build intelligent systems.')
    push('TensorFlow', 'Popular framework for training and deploying models.')
    push('MLOps Basics', 'Helps you move experiments toward production reliably.')
  }
  const addCloud = () => {
    push('AWS Basics', 'Cloud fundamentals enable deployment and scaling of solutions.')
    push('Docker', 'Containerization is key for reproducible environments.')
    push('Kubernetes', 'Orchestrates containers for reliable, scalable services.')
  }
  const addDesign = () => {
    push('Figma', 'Industry‑standard tool for fast UI design and collaboration.')
    push('Wireframing', 'Translating ideas to flows improves product clarity.')
    push('Prototyping', 'Interactive mockups help validate concepts early.')
  }
  const addSecurity = () => {
    push('OWASP Top 10', 'Practical knowledge to avoid the most common web risks.')
    push('Network Security', 'Foundations for securing systems and data in transit.')
    push('Secure Coding', 'Everyday practices that prevent vulnerabilities.')
  }
  const addDevOps = () => {
    push('CI/CD', 'Automated delivery shortens feedback loops and improves quality.')
    push('Infrastructure as Code', 'Versioning infra makes environments consistent and repeatable.')
    push('Observability', 'Metrics, logs, and tracing help you find issues fast.')
  }
  const addProduct = () => {
    push('User Stories', 'Structured requirements improve delivery focus.')
    push('Roadmapping', 'Prioritization and sequencing skills for impact.')
    push('Analytics', 'Measuring outcomes guides better product decisions.')
  }
  const addMarketing = () => {
    push('SEO', 'Improves organic discoverability of content and products.')
    push('Content Strategy', 'Clear messaging that resonates with the audience.')
    push('Google Analytics', 'Data‑driven insights to refine campaigns.')
  }

  const lowers = interests.map((s) => s.toLowerCase())
  if (domain.includes('web')) addWeb()
  if (domain.includes('mobile')) addMobile()
  if (domain.includes('data') || domain.includes('science')) addData()
  if (domain.includes('ai') || domain.includes('ml')) addAI()
  if (domain.includes('cloud')) addCloud()
  if (domain.includes('design') || lowers.some((k) => /ui|ux|design/.test(k))) addDesign()
  if (domain.includes('security') || lowers.some((k) => /security|owasp|pentest/.test(k))) addSecurity()
  if (lowers.some((k) => /devops/.test(k))) addDevOps()
  if (lowers.some((k) => /product/.test(k))) addProduct()
  if (lowers.some((k) => /marketing/.test(k))) addMarketing()

  // Balance based on weaker common skills if provided
  const weakCommons = Object.entries(skillsLevels)
    .filter(([, v]) => typeof v === 'number' && v <= 4)
    .map(([k]) => k)
  weakCommons.forEach((k) => push(k, `Strengthening ${k} will accelerate your next milestones.`))

  // Ensure 3–5 items
  const skills = picks.slice(0, 5)
  while (skills.length < 3) {
    push('Problem Solving', 'A universal multiplier for engineering and product work.')
    if (skills.length >= 3) break
    push('Time Management', 'Plan and protect focus time to execute consistently.')
  }

  const name = answers.fullName || answers.displayName || 'you'
  const goal = answers.openAnswer || answers.careerGoal || 'your goals'
  const advice = `Focus on one skill at a time and practice weekly. Tie learning to small projects relevant to ${goal}. Keep momentum—${name}, your consistent effort will compound quickly.`

  return { skills, advice }
}

function deriveRelatedTags(answers) {
  const tags = new Set()
  const interests = Array.isArray(answers?.interests) ? answers.interests : []
  const add = (arr) => arr.forEach(t => tags.add(t))
  interests.forEach((it) => {
    const k = String(it || '').toLowerCase()
    if (k.includes('web')) add(['HTML', 'CSS', 'JavaScript', 'React', 'Tailwind CSS', 'Node.js'])
    else if (k.includes('mobile')) add(['React Native', 'Flutter', 'Swift', 'Kotlin'])
    else if (k.includes('data')) add(['Python', 'Pandas', 'NumPy', 'SQL', 'scikit-learn'])
    else if (k.includes('ai') || k.includes('ml')) add(['Python', 'TensorFlow', 'PyTorch', 'ML'])
    else if (k.includes('cloud')) add(['AWS', 'Docker', 'Kubernetes'])
    else if (k.includes('ui') || k.includes('ux') || k.includes('design')) add(['Figma', 'Wireframing', 'Prototyping'])
    else if (k.includes('security')) add(['Network Security', 'OWASP', 'Pentesting'])
    else if (k.includes('devops')) add(['Docker', 'Kubernetes', 'Terraform', 'CI/CD'])
    else if (k.includes('product')) add(['User Stories', 'Roadmapping', 'Analytics'])
    else if (k.includes('marketing')) add(['SEO', 'Content Marketing', 'GA4'])
    else if (k.includes('finance')) add(['Excel', 'Accounting', 'Modeling'])
  })
  return Array.from(tags).slice(0, 16)
}

function serializeRecommendations(rec, questionnaireUpdatedAt) {
  if (!rec) return null
  const questionnaireIso = toIso(questionnaireUpdatedAt)
  const recQuestionnaireIso = toIso(rec.questionnaireUpdatedAt)
  const generatedAtIso = toIso(rec.generatedAt)

  return {
    skills: normalizeSkills(rec.skills),
    advice: typeof rec.advice === 'string' ? rec.advice : '',
    skillTags: Array.isArray(rec.skillTags) ? rec.skillTags : [],
    model: rec.model || MODEL_ID,
    provider: rec.provider || PROVIDER,
    promptVersion: rec.promptVersion || PROMPT_VERSION,
    generatedAt: generatedAtIso,
    questionnaireUpdatedAt: recQuestionnaireIso,
    questionnaireLatest: questionnaireIso,
    isStale: Boolean(questionnaireIso && recQuestionnaireIso && questionnaireIso !== recQuestionnaireIso),
  }
}

async function generateAndStore(docRef, answers, questionnaireUpdatedAt, opts = {}) {
  let skills = []
  let advice = ''
  try {
    const prompt = buildPrompt(answers)
    const raw = await callGemini(prompt)
    const parsed = parseModelResponse(raw)
    skills = normalizeSkills(parsed && parsed.skills)
    advice = parsed && typeof parsed.advice === 'string' ? parsed.advice.trim() : ''
    if (!skills.length || !advice) throw new Error('Model response incomplete')
  } catch (_) {
    const local = localGenerateFromAnswers(answers)
    skills = normalizeSkills(local.skills)
    advice = typeof local.advice === 'string' ? local.advice : ''
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

  // Optionally generate concise tags for a chips row
  if (opts && opts.includeTags) {
    try {
      const tagsPrompt = buildTagsPrompt(answers, skills)
      const tagsText = await callGemini(tagsPrompt)
      const tagsParsed = parseTagsResponse(tagsText)
      const cleaned = Array.from(new Set(
        (Array.isArray(tagsParsed) ? tagsParsed : [])
          .map((t) => (typeof t === 'string' ? t.trim() : ''))
          .filter((t) => t && t.length >= 2 && t.length <= 40)
      ))
      payload.skillTags = cleaned.length ? cleaned.slice(0, 16) : deriveRelatedTags(answers)
    } catch (_) {
      payload.skillTags = deriveRelatedTags(answers)
    }
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
    const includeTags = Boolean(req.body && req.body.includeTags)

    if (existing && questionnaireUpdatedAt && !force) {
      if (timestampsEqual(existing.questionnaireUpdatedAt, questionnaireUpdatedAt)) {
        if (includeTags && (!Array.isArray(existing.skillTags) || existing.skillTags.length === 0)) {
          // Compute tags and persist into existing record
          try {
            const tagsPrompt = buildTagsPrompt(answers, existing.skills)
            const tagsText = await callGemini(tagsPrompt)
            const tagsParsed = parseTagsResponse(tagsText)
            const cleaned = Array.from(new Set(
              (Array.isArray(tagsParsed) ? tagsParsed : [])
                .map((t) => (typeof t === 'string' ? t.trim() : ''))
                .filter((t) => t && t.length >= 2 && t.length <= 40)
            ))
            const finalTags = cleaned.length ? cleaned.slice(0, 16) : deriveRelatedTags(answers)
            await docRef.set({ recommendations: { ...existing, skillTags: finalTags } }, { merge: true })
            return res.status(200).json(serializeRecommendations({ ...existing, skillTags: finalTags }, questionnaireUpdatedAt))
          } catch (_) {
            const finalTags = deriveRelatedTags(answers)
            await docRef.set({ recommendations: { ...existing, skillTags: finalTags } }, { merge: true })
            return res.status(200).json(serializeRecommendations({ ...existing, skillTags: finalTags }, questionnaireUpdatedAt))
          }
        }
        return res.status(200).json(serializeRecommendations(existing, questionnaireUpdatedAt))
      }
    }

    const recommendations = await generateAndStore(docRef, answers, questionnaireUpdatedAt, { includeTags })
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

    const includeTags = (req.query?.includeTags === '1' || req.query?.includeTags === 'true')
    if (includeTags && (!Array.isArray(rec.skillTags) || rec.skillTags.length === 0)) {
      const answers = data.answers || {}
      try {
        const tagsPrompt = buildTagsPrompt(answers, rec.skills)
        const tagsText = await callGemini(tagsPrompt)
        const tagsParsed = parseTagsResponse(tagsText)
        const cleaned = Array.from(new Set(
          (Array.isArray(tagsParsed) ? tagsParsed : [])
            .map((t) => (typeof t === 'string' ? t.trim() : ''))
            .filter((t) => t && t.length >= 2 && t.length <= 40)
        ))
        const finalTags = cleaned.length ? cleaned.slice(0, 16) : deriveRelatedTags(answers)
        await docRef.set({ recommendations: { ...rec, skillTags: finalTags } }, { merge: true })
        return res.status(200).json(serializeRecommendations({ ...rec, skillTags: finalTags }, data.updatedAt))
      } catch (_) {
        const fallbackTags = deriveRelatedTags(answers)
        await docRef.set({ recommendations: { ...rec, skillTags: fallbackTags } }, { merge: true })
        return res.status(200).json(serializeRecommendations({ ...rec, skillTags: fallbackTags }, data.updatedAt))
      }
    }

    return res.status(200).json(serializeRecommendations(rec, data.updatedAt))
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load recommendations', error: error.message })
  }
}

module.exports = { recommendSkills, getRecommendations }
