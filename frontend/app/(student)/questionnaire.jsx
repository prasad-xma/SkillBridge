import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, TextInput, ActivityIndicator } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { SafeAreaView } from 'react-native-safe-area-context'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { router } from 'expo-router'
import { themes } from '../../constants/colors'
import { getSession } from '../../lib/session'

const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

export default function QuestionnaireScreen() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [user, setUser] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [educationLevel, setEducationLevel] = useState('Undergraduate')
  const [domain, setDomain] = useState('Computer Science')
  const [careerStage, setCareerStage] = useState('Student')
  const [interests, setInterests] = useState([])
  const [domainOther, setDomainOther] = useState('')
  const [interestOther, setInterestOther] = useState('')
  const [showInterestOther, setShowInterestOther] = useState(false)
  const [goalTimeframe, setGoalTimeframe] = useState('6 months')
  // Common skills configuration and state
  const skillsCommon = useMemo(() => (
    ['Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Time Management']
  ), [])
  const [skillsLevels, setSkillsLevels] = useState(() => (
    Object.fromEntries(['Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Time Management'].map(k => [k, 5]))
  ))
  const [learningFormat, setLearningFormat] = useState('Video')
  const [weeklyAvailability, setWeeklyAvailability] = useState('Medium (3-6h/wk)')
  const [openAnswer, setOpenAnswer] = useState('')

  const dropdowns = {
    education: ['High School', 'Undergraduate', 'Graduate', 'Working Professional'],
    domains: ['Computer Science', 'Data Science', 'Business', 'Design', 'Other'],
    career: ['Student', 'Intern', 'Junior', 'Mid', 'Senior'],
    goals: ['3 months', '6 months', '12 months'],
    formats: ['Video', 'Text', 'Interactive'],
    availability: ['Low (<3h/wk)', 'Medium (3-6h/wk)', 'High (6+ h/wk)'],
  }

  const interestOptions = useMemo(() => {
    if (domain === 'Business') {
      return [
        'Marketing',
        'Finance',
        'Operations',
        'Entrepreneurship',
        'Sales',
        'Human Resources',
        'Business Analytics',
        'Product Management',
        'Other',
      ]
    }
    // Default (tech-oriented)
    return [
      'Web Development',
      'Mobile Development',
      'Data Science',
      'AI/ML',
      'Cloud Computing',
      'UI/UX Design',
      'Cybersecurity',
      'DevOps',
      'Product Management',
      'Other',
    ]
  }, [domain])

  useEffect(() => {
    ;(async () => {
      const s = await getSession()
      if (!s || s.role !== 'student') {
        router.replace('/login')
        return
      }
      setUser(s)
    })()
  }, [])

  const toggleInterest = (label) => {
    setInterests((prev) => prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label])
  }

  const addCustomInterest = () => {
    const v = (interestOther || '').trim()
    if (!v) return
    setInterests(prev => prev.includes(v) ? prev : [...prev, v])
    setInterestOther('')
  }

  const removeInterest = (label) => {
    setInterests(prev => prev.filter(i => i !== label))
  }

  const setSkillLevel = (label, value) => {
    setSkillsLevels(prev => ({ ...prev, [label]: value }))
  }

  const setStepValue = (setter, value) => {
    setter(value)
  }

  const onSubmit = async () => {
    if (!user?.uid) return
    const domainFinal = domain === 'Other' ? (domainOther?.trim() || 'Other') : domain
    const interestsFinal = interests.filter(Boolean)
    const answers = {
      educationLevel,
      domain: domainFinal,
      careerStage,
      interests: interestsFinal,
      goalTimeframe,
      skillsLevels,
      learningFormat,
      weeklyAvailability,
      openAnswer,
      createdFrom: 'QuestionnaireScreen.v1'
    }
    setSubmitting(true)
    try {
      await axios.post(`${API_BASE}/api/student/questionnaire`, { uid: user.uid, answers })
      router.push('/(student)/recommendations')
    } catch (e) {
      setSubmitting(false)
    }
  }

  const Section = ({ title, icon, children }) => (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: theme.primary + '1A', borderColor: theme.primary + '33' }]}>
          <Ionicons name={icon} size={16} color={theme.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      </View>
      <View style={styles.divider} />
      {children}
    </View>
  )

  const Dropdown = ({ label, value, options, onChange }) => {
    const [open, setOpen] = useState(false)
    return (
      <View style={{ marginBottom: 14 }}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
        <TouchableOpacity
          style={[styles.select, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => setOpen((v) => !v)}
          activeOpacity={0.8}
        >
          <Text style={[styles.selectText, { color: theme.text }]}>{value}</Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} color={theme.textSecondary} size={18} />
        </TouchableOpacity>
        {open && (
          <View style={[styles.menu, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            {options.map((opt) => (
              <TouchableOpacity key={opt} style={styles.menuItem} onPress={() => { onChange(opt); setOpen(false) }}>
                <Text style={[styles.menuText, { color: theme.text }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    )
  }

  const RadioGroup = ({ label, value, options, onChange }) => (
    <View style={{ marginBottom: 8 }}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View style={styles.rowWrap}>
        {options.map((opt) => (
          <TouchableOpacity key={opt} style={[styles.radio, { borderColor: theme.border }]} onPress={() => onChange(opt)}>
            <Ionicons name={value === opt ? 'radio-button-on' : 'radio-button-off'} size={18} color={value === opt ? theme.primary : theme.textSecondary} />
            <Text style={[styles.radioText, { color: theme.text }]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  const CheckboxGroup = ({ label, selected, options, onToggle }) => (
    <View style={{ marginBottom: 8 }}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View style={styles.rowWrap}>
        {options.map((opt) => {
          const active = selected.includes(opt)
          return (
            <TouchableOpacity key={opt} style={[styles.checkbox, { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary + '14' : theme.surface }]} onPress={() => onToggle(opt)}>
              <Ionicons name={active ? 'checkbox' : 'square-outline'} size={18} color={active ? theme.primary : theme.textSecondary} />
              <Text style={[styles.checkboxText, { color: theme.text }]}>{opt}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )

  const StepSlider = ({ label, value, onChange, steps = 11 }) => (
    <View style={{ marginBottom: 8 }}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}: <Text style={{ fontWeight: '700', color: theme.text }}>{value}</Text></Text>
      <View style={[styles.track, { backgroundColor: theme.border }]}>
        {Array.from({ length: steps }).map((_, i) => (
          <TouchableOpacity key={i} style={[styles.tick, { backgroundColor: i <= value ? theme.primary : theme.surface, borderColor: theme.border }]} onPress={() => setStepValue(onChange, i)} />
        ))}
      </View>
      <View style={styles.trackLabels}>
        <Text style={[styles.small, { color: theme.textSecondary }]}>0</Text>
        <Text style={[styles.small, { color: theme.textSecondary }]}>10</Text>
      </View>
    </View>
  )

  if (!user) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: theme.background }]}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[theme.heroFrom, theme.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="sparkles" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Build Your Path</Text>
            <Text style={styles.heroSubtitle}>Answer a few quick questions to personalize your learning</Text>
          </View>
        </LinearGradient>

      <Section title="Academic / Career Info" icon="school">
        <Dropdown label="Education Level" value={educationLevel} options={dropdowns.education} onChange={setEducationLevel} />
        <Dropdown label="Field / Domain" value={domain} options={dropdowns.domains} onChange={(v) => { setDomain(v); if (v !== 'Other') setDomainOther('') }} />
        {domain === 'Other' && (
          <TextInput
            value={domainOther}
            onChangeText={setDomainOther}
            placeholder="Type your field/domain"
            placeholderTextColor={theme.textSecondary}
            style={[styles.textArea, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border, minHeight: 44 }]}
          />
        )}
        <RadioGroup label="Career Stage" value={careerStage} options={dropdowns.career} onChange={setCareerStage} />
      </Section>

      <Section title="Interests & Goals" icon="flag-outline">
        <CheckboxGroup
          label="Interests"
          selected={interests}
          options={interestOptions}
          onToggle={(label) => {
            if (label === 'Other') { setShowInterestOther(v => !v); return }
            toggleInterest(label)
          }}
        />
        {showInterestOther && (
          <View style={styles.addRow}>
            <TextInput
              value={interestOther}
              onChangeText={setInterestOther}
              placeholder="Type another interest"
              placeholderTextColor={theme.textSecondary}
              style={[styles.addInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
            />
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={addCustomInterest}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}
        {interests.length > 0 && (
          <View style={styles.selectedRow}>
            {interests.map((tag) => (
              <TouchableOpacity key={tag} onPress={() => removeInterest(tag)} style={[styles.selectedChip, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
                <Text style={[styles.selectedChipText, { color: theme.textSecondary }]}>{tag}  ×</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <RadioGroup label="Goal Timeframe" value={goalTimeframe} options={dropdowns.goals} onChange={setGoalTimeframe} />
      </Section>

      <Section title="Current Skills" icon="construct-outline">
        {skillsCommon.map((label) => (
          <StepSlider key={label} label={label} value={skillsLevels[label] ?? 0} onChange={(v) => setSkillLevel(label, v)} />
        ))}
      </Section>

        <Section title="Learning Preferences" icon="book-outline">
        <RadioGroup label="Preferred Format" value={learningFormat} options={dropdowns.formats} onChange={setLearningFormat} />
        <RadioGroup label="Weekly Availability" value={weeklyAvailability} options={dropdowns.availability} onChange={setWeeklyAvailability} />
        </Section>

        <Section title="Open-ended" icon="chatbubbles-outline">
        <Text style={[styles.label, { color: theme.textSecondary }]}>What do you want to achieve?</Text>
        <TextInput
          value={openAnswer}
          onChangeText={setOpenAnswer}
          multiline
          numberOfLines={4}
          style={[styles.textArea, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
          placeholder="Describe your goals"
          placeholderTextColor={theme.textSecondary}
        />
        </Section>

        <TouchableOpacity style={[styles.submit, { backgroundColor: theme.primary }]} onPress={onSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit Quiz</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#00000011', marginVertical: 10 },
  label: { fontSize: 13, marginBottom: 6 },
  select: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { fontSize: 15, fontWeight: '600' },
  menu: { borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  menuItem: { paddingHorizontal: 12, paddingVertical: 12 },
  menuText: { fontSize: 15 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  radio: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1, marginBottom: 8 },
  radioText: { fontSize: 13, fontWeight: '600' },
  checkbox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1, marginBottom: 8 },
  checkboxText: { fontSize: 13, fontWeight: '600' },
  track: { height: 16, borderRadius: 10, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center' },
  tick: { width: 18, height: 10, marginHorizontal: 2, borderWidth: 1, borderRadius: 3 },
  trackLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  small: { fontSize: 12 },
  textArea: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 96, textAlignVertical: 'top' },
  submit: { marginTop: 8, borderRadius: 12, alignItems: 'center', paddingVertical: 14 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  heroCard: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  heroIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  heroSubtitle: { color: '#fff', opacity: 0.9, marginTop: 4, fontSize: 13 },
  // Added styles for custom interests
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  addInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  addBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '800' },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  selectedChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  selectedChipText: { fontSize: 12, fontWeight: '700' },
})
