import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ActivityIndicator, Linking, ScrollView } from 'react-native'
import { themes } from '../../constants/colors'
import { getSession, clearSession } from '../../lib/session'
import { router } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'

export default function RecruiterProfile() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [user, setUser] = useState(null)
  const [profileData, setProfileData] = useState(null)
  const [company, setCompany] = useState(null)
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      const session = await getSession()
      if (!session || session.role !== 'recruiter') {
        router.replace('/login')
        return
      }
      setUser(session)
      setProfileData(null)
      setCompany(null)
      setInsights(null)
    })()
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const session = await getSession()
        if (!session) return
        setUser(session)
        setProfileData(null)
        setCompany(null)
        setInsights(null)
        try {
          const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE
          if (!API_BASE) return
          setLoading(true)
          const uid = session.uid
          const [c, i] = await Promise.all([
            axios.get(`${API_BASE}/api/recruiter/recruiter/${uid}/company`).catch(() => ({ data: null })),
            axios.get(`${API_BASE}/api/recruiter/recruiter/${uid}/company/insights`).catch(() => ({ data: null })),
          ])
          setCompany(c?.data || null)
          setInsights(i?.data || null)
        } catch (_) {
        } finally {
          setLoading(false)
        }
      })()
      return () => {}
    }, [])
  )

  const onLogout = async () => {
    await clearSession()
    router.replace('/login')
  }

  const initials = useMemo(() => {
    const name = user?.fullName || ''
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'RC'
  }, [user?.fullName])

  const renderField = (label, value) => {
    if (!value && value !== 0) return null
    return (
      <View style={styles.row}>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.fieldValue, { color: theme.text }]}>{String(value)}</Text>
      </View>
    )
  }

  const profile = user?.profile || {}
  const fullName = user?.fullName

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.tint + '22', borderColor: theme.tint + '44' }]}>
          <Text style={[styles.avatarText, { color: theme.tint }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]}>{fullName || 'Recruiter'}</Text>
          <Text style={[styles.email, { color: theme.textSecondary }]}>{user?.email || '—'}</Text>
          {user?.role ? (
            <View style={[styles.roleChip, { borderColor: theme.accent + '66', backgroundColor: theme.accent + '14' }]}>
              <View style={[styles.roleDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.roleText, { color: theme.accent }]}>{String(user.role).toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
        <View style={styles.divider} />
        {renderField('Email', user?.email)}
        {renderField('Role', user?.role)}

        {Object.keys(profile).length > 0 ? (
          <View style={{ marginTop: 18 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Profile</Text>
            <View style={styles.divider} />
            {Object.entries(profile).map(([key, val]) => {
              if (key === 'contactNumber') return null
              const value = Array.isArray(val) ? val.filter(Boolean) : val
              if (Array.isArray(value) && value.length > 0) {
                return (
                  <View key={key} style={styles.row}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{key}</Text>
                    <View style={styles.chipsRow}>
                      {value.map((item, idx) => (
                        <View key={idx} style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                          <Text style={[styles.chipText, { color: theme.text }]}>{String(item)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )
              }
              return (
                <View key={key} style={styles.row}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{key}</Text>
                  <Text style={[styles.fieldValue, { color: theme.text }]}>{String(value)}</Text>
                </View>
              )
            })}
          </View>
        ) : null}
      </View>

      <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Company</Text>
        <View style={styles.divider} />
        {loading && (
          <View style={{ paddingVertical: 10 }}>
            <ActivityIndicator color={theme.primary} />
          </View>
        )}
        {!loading && !company && (
          <Text style={{ color: theme.textSecondary }}>No company profile yet</Text>
        )}
        {!!company && (
          <>
            {renderField('Name', company?.name)}
            {!!company?.website && (
              <View style={styles.row}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Website</Text>
                <Text style={[styles.fieldValue, { color: '#3b82f6' }]} onPress={() => Linking.openURL(company?.website)} numberOfLines={1}>
                  {company?.website}
                </Text>
              </View>
            )}
            {renderField('Industry', company?.industry)}
            {renderField('Size', company?.size)}
            {!!(company?.locations && company.locations.length) && (
              <View style={styles.row}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Locations</Text>
                <View style={styles.chipsRow}>
                  {company.locations.map((loc, idx) => (
                    <View key={idx} style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <Text style={[styles.chipText, { color: theme.text }]}>{String(loc)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {!!company?.description && (
              <View style={styles.row}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>About</Text>
                <Text style={[styles.fieldValue, { color: theme.text }]} numberOfLines={3}>{company.description}</Text>
              </View>
            )}
          </>
        )}
      </View>

      <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Company Insights</Text>
        <View style={styles.divider} />
        {loading && (
          <View style={{ paddingVertical: 10 }}>
            <ActivityIndicator color={theme.primary} />
          </View>
        )}
        {!loading && !insights && (
          <Text style={{ color: theme.textSecondary }}>No insights yet</Text>
        )}
        {!!insights && (
          <>
            {renderField('Total Jobs', insights?.totalJobs)}
            {renderField('Open Jobs', insights?.openJobs)}
            {renderField('Draft Jobs', insights?.draftJobs)}
            {renderField('Total Applicants', insights?.totalApplicants)}
            {renderField('Avg Applicants/Job', insights?.avgApplicantsPerJob)}
            {!!(insights?.statusBreakdown) && (
              <>
                {renderField('Shortlisted', insights?.statusBreakdown?.shortlisted)}
                {renderField('Hired', insights?.statusBreakdown?.hired)}
                {renderField('Rejected', insights?.statusBreakdown?.rejected)}
                {renderField('Pending', insights?.statusBreakdown?.pending)}
              </>
            )}
            {!!insights?.mostAppliedJob && (
              <View style={styles.row}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Most Applied Job</Text>
                <Text style={[styles.fieldValue, { color: theme.text }]} numberOfLines={1}>
                  {(insights.mostAppliedJob.title || 'Job')} · {insights.mostAppliedJob.applicants}
                </Text>
              </View>
            )}
            {!!(insights?.topSkillsDemanded && insights.topSkillsDemanded.length) && (
              <View style={styles.row}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Top Skills</Text>
                <View style={styles.chipsRow}>
                  {insights.topSkillsDemanded.map((s, idx) => (
                    <View key={idx} style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <Text style={[styles.chipText, { color: theme.text }]}>{`${s.skill} (${s.count})`}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#3b82f6', flex: 1 }]} onPress={() => router.push('/(recruiter)/edit-profile')}>
          <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, flex: 1 }]} onPress={onLogout}>
          <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 42, paddingBottom: 60 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  roleChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleDot: { width: 8, height: 8, borderRadius: 4 },
  roleText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800' },
  email: { fontSize: 13, marginTop: 2 },
  detailsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8, letterSpacing: 0.3 },
  divider: { height: 1, backgroundColor: '#00000011', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  fieldLabel: { fontSize: 13 },
  fieldValue: { fontSize: 13, fontWeight: '700' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, maxWidth: '60%', justifyContent: 'flex-end' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 12 },
  button: { marginTop: 24, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
})
