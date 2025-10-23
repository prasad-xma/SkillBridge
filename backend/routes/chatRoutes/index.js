const express = require('express')
const {
  searchContacts,
  ensureConversation,
  getConversations,
  getMessages,
  sendMessage,
} = require('../../controllers/chatControllers/chatController')

const router = express.Router()

// search for professionals and institutes
router.get('/search-contacts', searchContacts)

// ensure a 1-1 conversation between two users
router.post('/ensure', ensureConversation)

// list conversations for a user
router.get('/conversations', getConversations)

// messages for a conversation
router.get('/messages/:id', getMessages)
router.post('/messages/:id', sendMessage)

module.exports = router
