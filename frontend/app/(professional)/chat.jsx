import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { GiftedChat, Bubble, Day } from 'react-native-gifted-chat'
import dayjs from 'dayjs'
import { themes } from '../../constants/colors'
import { getSession } from '../../lib/session'
import { router } from 'expo-router'

export default function ProfessionalChat() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [checked, setChecked] = useState(false)
  const [user, setUser] = useState(null)
  const [conversations, setConversations] = useState([])
  const [loadingConvs, setLoadingConvs] = useState(false)
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  const getApiBase = () => ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE

  useEffect(() => {
    ;(async () => {
      const session = await getSession()
      if (!session || session.role !== 'professional') {
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
      const filtered = list.filter((item) => item.otherUser?.role === 'student')
      setConversations(filtered)
    } catch {}
    finally {
      setLoadingConvs(false)
    }
  }, [])

  useEffect(() => {
    if (user?.uid) loadConversations(user.uid)
  }, [loadConversations, user?.uid])

  const openConversation = useCallback(async (conv) => {
    if (!conv?.id || !user?.uid) return
    const API_BASE = getApiBase()
    if (!API_BASE) return
    try {
      setSelected({ id: conv.id, otherUser: conv.otherUser })
      setMessages([])
      setLoadingMessages(true)
      const resp = await axios.get(`${API_BASE}/api/chat/messages/${conv.id}`, { params: { limit: 50 } })
      const list = Array.isArray(resp.data?.messages) ? resp.data.messages : []
      const mapped = list.map((item) => ({
        _id: item.id,
        text: item.text || '',
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        user: {
          _id: item.senderId,
          name: item.senderId === user.uid ? user.fullName || 'You' : conv.otherUser?.fullName || 'Student',
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
    const message = newMessages[0]
    const text = String(message?.text || '').trim()
    if (!text) return
    try {
      const resp = await axios.post(`${API_BASE}/api/chat/messages/${selected.id}`, {
        senderId: user.uid,
        text,
      })
      const saved = resp.data?.message
      const mapped = {
        _id: saved?.id || message._id,
        text: saved?.text || text,
        createdAt: saved?.createdAt ? new Date(saved.createdAt) : new Date(),
        user: { _id: user.uid, name: user.fullName || 'You' },
      }
      setMessages((prev) => GiftedChat.append(prev, [mapped]))
      loadConversations(user.uid)
    } catch {}
  }, [loadConversations, selected?.id, user?.uid, user?.fullName])

  const renderConversation = ({ item }) => {
    const title = item.otherUser?.fullName || item.otherUser?.email || 'Student'
    const preview = item.lastMessage || ''
    const ts = item.updatedAt ? dayjs(item.updatedAt) : null
    const timeStr = ts ? (ts.isSame(dayjs(), 'day') ? ts.format('HH:mm') : ts.format('MMM D')) : ''
    return (
      <TouchableOpacity
        onPress={() => openConversation(item)}
        activeOpacity={0.85}
        style={[styles.chatItem, { borderColor: theme.border, backgroundColor: theme.card }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.chatTitleText, { color: theme.text }]} numberOfLines={1}>
            {title}
          </Text>
          {preview ? (
            <Text style={[styles.chatPreviewText, { color: theme.textSecondary }]} numberOfLines={1}>
              {preview}
            </Text>
          ) : null}
        </View>
        <Text style={{ color: theme.textSecondary, fontSize: 12, marginLeft: 12 }}>{timeStr}</Text>
      </TouchableOpacity>
    )
  }

  if (!checked) return <View style={{ flex: 1, backgroundColor: theme.background }} />

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {!selected ? (
        <View style={{ flex: 1 }}>
          <View style={[styles.headerBar, { borderColor: theme.border }]}> 
            <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: theme.border }]}> 
              <Ionicons name="chevron-back" size={20} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Messages</Text>
          </View>
          {loadingConvs ? (
            <View style={styles.spinnerWrap}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : conversations.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-ellipses-outline" size={42} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No student conversations yet</Text>
              <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 6 }}>
                Replies will appear here once a student reaches out.
              </Text>
            </View>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              renderItem={renderConversation}
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
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
                {selected.otherUser?.fullName || selected.otherUser?.email || 'Student'}
              </Text>
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
              placeholder="Type a reply"
              alwaysShowSend
              renderAvatar={null}
              renderBubble={(props) => (
                <Bubble
                  {...props}
                  wrapperStyle={{
                    right: [styles.wpBubbleRight, { backgroundColor: theme.primary }],
                    left: [styles.wpBubbleLeft, { backgroundColor: theme.card2, borderColor: theme.border, borderWidth: 1 }],
                  }}
                  textStyle={{
                    right: { color: theme.headerText },
                    left: { color: theme.text },
                  }}
                />
              )}
              renderDay={(props) => (
                <View style={styles.wpDayWrap}>
                  <Day {...props} textStyle={{ color: theme.textSecondary, fontSize: 12, fontWeight: '700' }} />
                </View>
              )}
              renderSend={(props) => {
                const disabled = !props.text || String(props.text).trim().length === 0
                return (
                  <View style={styles.wpSendWrap}>
                    <TouchableOpacity
                      disabled={disabled}
                      onPress={() => props.onSend({ text: String(props.text || '').trim() }, true)}
                      style={[styles.wpSendBtn, { backgroundColor: disabled ? theme.border : theme.primary }]}
                      activeOpacity={0.9}
                    >
                      <Ionicons name="send" size={18} color={disabled ? theme.textSecondary : theme.headerText} />
                    </TouchableOpacity>
                  </View>
                )
              }}
              timeTextStyle={{
                right: { color: theme.headerText, opacity: 0.8 },
                left: { color: theme.textSecondary },
              }}
              renderChatFooter={() => <View style={{ height: 6 }} />}
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
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
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
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  chatItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chatTitleText: {
    fontSize: 15,
    fontWeight: '700',
  },
  chatPreviewText: {
    fontSize: 12,
    marginTop: 6,
  },
  chatHeader: {
    paddingHorizontal: 12,
    paddingTop: 42,
    paddingBottom: 10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  wpBubbleRight: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  wpBubbleLeft: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  wpDayWrap: {
    paddingVertical: 6,
  },
  wpSendWrap: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  wpSendBtn: {
    width: 40,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
})
