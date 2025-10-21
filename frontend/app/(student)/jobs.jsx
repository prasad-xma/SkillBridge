import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  useColorScheme,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { themes } from '../../constants/colors' // your existing theme setup

const JobCard = ({ job, onPress, theme }) => (
  <TouchableOpacity style={[styles.jobCard, { backgroundColor: theme.card }]} onPress={() => onPress(job)}>
    <View style={styles.jobHeader}>
      <View style={[styles.companyIcon, { backgroundColor: theme.tint }]}>
        <Text style={styles.companyInitial}>{job.company.charAt(0)}</Text>
      </View>
      <View style={styles.jobInfo}>
        <Text style={[styles.jobTitle, { color: theme.text }]} numberOfLines={2}>
          {job.role}
        </Text>
        <Text style={{ color: theme.textSecondary }}>{job.company}</Text>
      </View>
    </View>

    <View style={styles.jobDetails}>
      <View style={styles.detailItem}>
        <Ionicons name="location-outline" size={16} color={theme.tint} />
        <Text style={[styles.detailText, { color: theme.text }]}>{job.location}</Text>
      </View>
      <View style={styles.detailItem}>
        <Ionicons name="briefcase-outline" size={16} color={theme.tint} />
        <Text style={[styles.detailText, { color: theme.text }]}>{job.type}</Text>
      </View>
      <View style={styles.detailItem}>
        <Ionicons name="people-outline" size={16} color={theme.tint} />
        <Text style={[styles.detailText, { color: theme.text }]}>{job.applicants} applicants</Text>
      </View>
    </View>

    <View style={styles.jobFooter}>
      <Text style={[styles.workMode, { color: theme.tint, backgroundColor: `${theme.tint}20` }]}>{job.workMode}</Text>
      <Text style={[styles.postedDate, { color: theme.textSecondary }]}>
        Posted {new Date(job.postedDate).toLocaleDateString()}
      </Text>
    </View>
  </TouchableOpacity>
)

export default function StudentJobs() {
  const router = useRouter()
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light

  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('All')

  const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://192.168.8.181:5000'

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    filterJobs()
  }, [searchQuery, selectedFilter, jobs])

  const fetchJobs = async () => {
    try {
      // ✅ Dummy jobs (replace with API later)
      const dummyJobs = Array.from({ length: 20 }).map((_, i) => ({
        id: `${i + 1}`,
        role: `Job Role ${i + 1}`,
        company: `Company ${i + 1}`,
        location: 'Colombo, Sri Lanka',
        type: i % 2 === 0 ? 'Internship' : 'Full-time',
        workMode: i % 3 === 0 ? 'Remote' : 'On-site',
        applicants: Math.floor(Math.random() * 50) + 1,
        postedDate: new Date(),
      }))
      setJobs(dummyJobs)
      setFilteredJobs(dummyJobs)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterJobs = () => {
    let filtered = jobs
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (job) =>
          job.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    if (selectedFilter !== 'All') {
      filtered = filtered.filter((job) => job.type === selectedFilter)
    }
    setFilteredJobs(filtered)
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchJobs()
  }

  const handleJobPress = (job) => {
    router.push({
      pathname: '/(student)/jobDetail',
      params: { jobId: job.id },
    })
  }

  const filters = ['All', 'Internship', 'Full-time', 'Part-time']

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading jobs...</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Find Your Dream Job</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          {filteredJobs.length} opportunities available
        </Text>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <Ionicons name="search-outline" size={20} color={theme.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search jobs, companies, locations..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              {
                backgroundColor: selectedFilter === filter ? theme.tint : theme.card,
              },
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                { color: selectedFilter === filter ? '#fff' : theme.text },
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Job List */}
      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobCard job={item} onPress={handleJobPress} theme={theme} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.text }]}>No jobs found</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Try adjusting your search or filters</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16 },
  header: { padding: 20, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  headerSubtitle: { fontSize: 14 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15 },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterText: { fontSize: 14, fontWeight: '500' },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  jobCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: { flexDirection: 'row', marginBottom: 12 },
  companyIcon: { width: 50, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  companyInitial: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  jobInfo: { flex: 1, justifyContent: 'center' },
  jobTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  jobDetails: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15, marginBottom: 6 },
  detailText: { fontSize: 13 },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
  workMode: { fontSize: 12, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  postedDate: { fontSize: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtext: { fontSize: 14, marginTop: 8 },
})
