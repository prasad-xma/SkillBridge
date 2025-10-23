import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { GiftedChat } from 'react-native-gifted-chat'
import dayjs from 'dayjs'
import { themes } from '../../constants/colors'
import { getSession } from '../../lib/session'
import { router } from 'expo-router'

export default function StudentNetwork() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [checked, setChecked] = useState(false)
  const [user, setUser] = useState(null)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [contacts, setContacts] = useState([])
  const [conversations, setConversations] = useState([])
  const [loadingConvs, setLoadingConvs] = useState(false)
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  const getApiBase = () => ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE

  useEffect(() => {
    ;(async () => {
      const session = await getSession()
      if (!session || session.role !== 'student') {
        router.replace('/login')
        return
      }
      setUser(session)
      setChecked(true)
    })()
  }, [])

  const loadConversations = useCallback(async (uid) => {
    if (!uid) return
    const API_BASE = getApiBase()
    if (!API_BASE) return
    try {
      setLoadingConvs(true)
      const resp = await axios.get(`${API_BASE}/api/chat/conversations`, { params: { userId: uid } })
      const list = Array.isArray(resp.data?.conversations) ? resp.data.conversations : []
      setConversations(list)
    } catch {}
    finally {
      setLoadingConvs(false)
    }
  }, [])

  const loadInitialContacts = useCallback(async (uid) => {
    if (!uid) return
    const API_BASE = getApiBase()
    if (!API_BASE) return
    try {
      setSearching(true)
      const resp = await axios.get(`${API_BASE}/api/chat/search-contacts`, { params: { userId: uid, query: '' } })
      const list = Array.isArray(resp.data?.users) ? resp.data.users : []
      setContacts(list)
    } catch {}
    finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (user?.uid) {
      loadConversations(user.uid)
      loadInitialContacts(user.uid)
    }
  }, [loadConversations, loadInitialContacts, user?.uid])

  useEffect(() => {
    if (!user?.uid) return
    const API_BASE = getApiBase()
    if (!API_BASE) return
    const q = query.trim()
    const t = setTimeout(async () => {
      try {
        setSearching(true)
        const resp = await axios.get(`${API_BASE}/api/chat/search-contacts`, {
          params: { userId: user.uid, query: q },
        })
        const list = Array.isArray(resp.data?.users) ? resp.data.users : []
        setContacts(list)
      } catch {}
      finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [query, user?.uid])

  const startChat = useCallback(async (target) => {
    if (!user?.uid || !target?.uid) return
    const API_BASE = getApiBase()
    if (!API_BASE) return
    try {
      const resp = await axios.post(`${API_BASE}/api/chat/ensure`, {
        userId: user.uid,
        otherId: target.uid,
      })
      const conv = resp.data?.conversation || null
      if (!conv?.id) return
      setSelected({ id: conv.id, otherUser: conv.otherUser || target })
      setMessages([])
      setLoadingMessages(true)
      const m = await axios.get(`${API_BASE}/api/chat/messages/${conv.id}`, { params: { limit: 50 } })
      const list = Array.isArray(m.data?.messages) ? m.data.messages : []
      const mapped = list.map((it) => ({
        _id: it.id,
        text: it.text || '',
        createdAt: it.createdAt ? new Date(it.createdAt) : new Date(),
        user: {
          _id: it.senderId,
          name: it.senderId === user.uid ? user.fullName || 'You' : (conv.otherUser?.fullName || 'User'),
        },
      }))
      setMessages(mapped)
    } catch {}
    finally {
      setLoadingMessages(false)
    }
  }, [user?.uid, user?.fullName])

  const onSend = useCallback(async (newMessages = []) => {
    if (!selected?.id || !user?.uid || newMessages.length === 0) return
    const API_BASE = getApiBase()
    if (!API_BASE) return
    const m = newMessages[0]
    const text = String(m?.text || '').trim()
    if (!text) return
    try {
      const resp = await axios.post(`${API_BASE}/api/chat/messages/${selected.id}`, {
        senderId: user.uid,
        text,
      })
      const saved = resp.data?.message
      const mapped = {
        _id: saved?.id || m._id,
        text: saved?.text || text,
        createdAt: saved?.createdAt ? new Date(saved.createdAt) : new Date(),
        user: { _id: user.uid, name: user.fullName || 'You' },
      }
      setMessages((prev) => GiftedChat.append(prev, [mapped]))
    } catch {}
  }, [selected?.id, user?.uid, user?.fullName])

  const renderContact = ({ item }) => (
    <TouchableOpacity
      onPress={() => startChat(item)}
      activeOpacity={0.85}
      style={[styles.contactCard, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.contactName, { color: theme.text }]}>{item.fullName || item.email || 'User'}</Text>
        {item.subtitle ? (
          <Text style={[styles.contactSubtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
        ) : null}
        {item.role ? (
          <View style={[styles.rolePill, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'capitalize' }}>{item.role}</Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chatbubble-ellipses" size={20} color={theme.tint} />
    </TouchableOpacity>
  )

  const openConversation = useCallback(async (conv) => {
    if (!conv?.id) return
    const API_BASE = getApiBase()
    if (!API_BASE) return
    try {
      setSelected({ id: conv.id, otherUser: conv.otherUser })
      setMessages([])
      setLoadingMessages(true)
      const m = await axios.get(`${API_BASE}/api/chat/messages/${conv.id}`, { params: { limit: 50 } })
      const list = Array.isArray(m.data?.messages) ? m.data.messages : []
      const mapped = list.map((it) => ({
        _id: it.id,
        text: it.text || '',
        createdAt: it.createdAt ? new Date(it.createdAt) : new Date(),
        user: {
          _id: it.senderId,
          name: it.senderId === user.uid ? user.fullName || 'You' : (conv.otherUser?.fullName || 'User'),
        },
      }))
      setMessages(mapped)
    } catch {}
    finally {
      setLoadingMessages(false)
    }
  }, [user?.uid, user?.fullName])

  const renderConversation = ({ item }) => {
    const title = item.otherUser?.fullName || item.otherUser?.email || 'Chat'
    const preview = item.lastMessage || ''
    const ts = item.updatedAt ? dayjs(item.updatedAt) : null
    const timeStr = ts ? (ts.isSame(dayjs(), 'day') ? ts.format('HH:mm') : ts.format('MMM D')) : ''
    let subtitle = ''
    if (item.otherUser?.role === 'professional') {
      const t = item.otherUser?.profile?.jobTitle || item.otherUser?.profile?.title
      const c = item.otherUser?.profile?.company || item.otherUser?.profile?.organization
      subtitle = [t, c].filter(Boolean).join(' • ')
    } else if (item.otherUser?.role === 'institute') {
      subtitle = item.otherUser?.profile?.name || item.otherUser?.profile?.instituteName || ''
    }
    return (
      <TouchableOpacity
        onPress={() => openConversation(item)}
        activeOpacity={0.85}
        style={[styles.chatItem, { borderColor: theme.border }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.chatTitleText, { color: theme.text }]} numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.chatSubtitleText, { color: theme.textSecondary }]} numberOfLines={1}>{subtitle}</Text>
          ) : null}
          {preview ? (
            <Text style={[styles.chatPreviewText, { color: theme.textSecondary }]} numberOfLines={1}>{preview}</Text>
          ) : null}
        </View>
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginLeft: 8 }}>{timeStr}</Text>
      </TouchableOpacity>
    )
  }

  if (!checked) return <View style={{ flex: 1, backgroundColor: theme.background }} />

  const showSearch = query.trim().length > 0
  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {!selected ? (
        <View style={{ flex: 1 }}>
          <View style={[styles.headerBar, { borderColor: theme.border }]}> 
            <Text style={[styles.headerTitle, { color: theme.text }]}>Network</Text>
          </View>
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search professionals and institutes"
                placeholderTextColor={theme.textSecondary}
                style={{ flex: 1, marginLeft: 8, color: theme.text }}
                autoCapitalize="none"
              />
            </View>
          </View>
          {showSearch ? (
            searching ? (
              <View style={styles.spinnerWrap}>
                <ActivityIndicator color={theme.primary} />
              </View>
            ) : (
              <FlatList
                data={contacts}
                keyExtractor={(it) => it.uid}
                renderItem={renderContact}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>No results</Text>
                    <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8 }}>
                      Try searching by full name or email.
                    </Text>
                  </View>
                }
              />
            )
          ) : loadingConvs ? (
            <View style={styles.spinnerWrap}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : conversations.length > 0 ? (
            <FlatList
              data={conversations}
              keyExtractor={(it) => it.id}
              renderItem={renderConversation}
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            />
          ) : (
            <FlatList
              data={contacts}
              keyExtractor={(it) => it.uid}
              renderItem={renderContact}
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              ListHeaderComponent={
                <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Suggested</Text>
                </View>
              }
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>No chats yet</Text>
                  <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8 }}>
                    Start a conversation by searching for professionals and institutes.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.chatHeader, { borderColor: theme.border }]}> 
            <TouchableOpacity onPress={() => { setSelected(null); setMessages([]) }} style={[styles.backBtn, { borderColor: theme.border }]}> 
              <Ionicons name="chevron-back" size={20} color={theme.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.chatTitle, { color: theme.text }]} numberOfLines={1}>
                {selected.otherUser?.fullName || selected.otherUser?.email || 'Chat'}
              </Text>
              {selected.otherUser?.profile?.jobTitle || selected.otherUser?.profile?.company ? (
                <Text style={{ color: theme.textSecondary, fontSize: 12 }} numberOfLines={1}>
                  {[selected.otherUser?.profile?.jobTitle, selected.otherUser?.profile?.company].filter(Boolean).join(' • ')}
                </Text>
              ) : null}
            </View>
          </View>
          {loadingMessages ? (
            <View style={[styles.spinnerWrap, { flex: 1 }]}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : (
            <GiftedChat
              messages={messages}
              onSend={onSend}
              user={{ _id: user.uid, name: user.fullName || 'You' }}
              scrollToBottom
              placeholder="Type a message"
              alwaysShowSend
              renderAvatar={null}
              listViewProps={{ style: { backgroundColor: theme.background } }}
            />
          )}
        </KeyboardAvoidingView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  headerBar: {
    paddingTop: 42,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  searchBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spinnerWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingHorizontal: 24,
    marginTop: 80,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  contactCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  contactName: {
    fontSize: 15,
    fontWeight: '700',
  },
  contactSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  rolePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  chatHeader: {
    paddingHorizontal: 12,
    paddingTop: 42,
    paddingBottom: 10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  chatItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatTitleText: {
    fontSize: 15,
    fontWeight: '700',
  },
  chatSubtitleText: {
    fontSize: 12,
    marginTop: 2,
  },
  chatPreviewText: {
    fontSize: 12,
    marginTop: 6,
  },
})


