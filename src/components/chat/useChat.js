import api from './shared/api'
import chatHub from '@/hubs/chatHub.js'

// Funções utilitárias para gerenciar mensagens agrupadas por data
const getDateString = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addMessageToGroupedStructure = (messages, newMessage) => {
  if (!messages || !Array.isArray(messages)) {
    const dateString = getDateString(newMessage.sendingTime)
    return [{
      date: dateString,
      messages: [newMessage]
    }]
  }

  const dateString = getDateString(newMessage.sendingTime)
  
  // Procurar se já existe um grupo para esta data
  const existingGroupIndex = messages.findIndex(group => group.date === dateString)
  
  if (existingGroupIndex >= 0) {
    messages[existingGroupIndex].messages.push(newMessage)
    messages[existingGroupIndex].messages.sort((a, b) => new Date(a.sendingTime) - new Date(b.sendingTime))
  } else {
    messages.push({
      date: dateString,
      messages: [newMessage]
    })
    messages.sort((a, b) => new Date(a.date + 'T12:00:00') - new Date(b.date + 'T12:00:00'))
  }
  
  return messages
}

const updateMessageInGroupedStructure = (messages, updatedMessage) => {
  if (!messages || !Array.isArray(messages)) return messages
  
  const dateString = getDateString(updatedMessage.sendingTime)
  
  for (let groupIndex = 0; groupIndex < messages.length; groupIndex++) {
    const group = messages[groupIndex]
    const messageIndex = group.messages.findIndex(msg => msg.id === updatedMessage.id)
    
    if (messageIndex >= 0) {
      if (group.date !== dateString) {
        group.messages.splice(messageIndex, 1)
        
        if (group.messages.length === 0) {
          messages.splice(groupIndex, 1)
        }
        
        return addMessageToGroupedStructure(messages, updatedMessage)
      } else {
        group.messages[messageIndex] = updatedMessage
        group.messages.sort((a, b) => new Date(a.sendingTime) - new Date(b.sendingTime))
        return messages
      }
    }
  }
  
  return messages
}

export default function useChat(
  router,
  toast,
  currentChat,
  hasDraft,
  conversations,
  modalTitle,
  showModal,
  currentModal,
  onBeforeUnmount,
  ChatAreaCp,
  InviteCp,
  NotificationSoundEl,
) {

  const notifyMessage = () => {
    NotificationSoundEl.value.play()
  }
  // hub

  const hub = chatHub()

  hub.on('MessageReceived', (response) => {
    notifyMessage()
    let scrollOnReceive = ChatAreaCp.value.userInBottom

    let index = conversations.value.findIndex(
      (find) => find.id == response.conversationId
    )
    if (index >= 0) {
      conversations.value[index].lastMessage = response
    }

    if (currentChat.value && currentChat.value.id == response.conversationId) {
      currentChat.value.messages = addMessageToGroupedStructure(currentChat.value.messages, response)
      if (scrollOnReceive) ChatAreaCp.value.scrollToBottom()
    }
  })

  hub.on('NewConversation', (response) => {
    notifyMessage()
    conversations.value.push(response) // check whether this should be changed in the future
  })

  hub.on('RequestReceived', () => {
    toast.info('You received a new message request')
  })

  hub.on('UserStatusChange', (response) => {
    updateConversationStatus(
      response,
      currentChat.value.status?.userName == response.userName
    )
  })

  // before unmount, close the connection...
  onBeforeUnmount(() => {
    hub.stop()
  })

  const openMenuOption = (optionValue) => {
    showModal.value = true
    currentModal.value = optionValue
    switch (optionValue) {
      case 1:
        modalTitle.value = 'Contacts'
        break
      case 2:
        modalTitle.value = 'Invite user'
        break
    }
  }

  const loadAllConversations = () => {
    api
      .loadAll()
      .then((response) => {
        if (response.status == 200) {
          conversations.value = response.data
        }
      })
      .catch((err) => {
        if (err.response && err.response.data) {
          toast.error(err.response.data.message)
        } else {
          const errorMsg = 'Unable to load your conversations. Try again later.'
          toast.error(errorMsg)
        }
      })
  }

  const updateConversationStatus = (statusInfo, isCurrentChat = false) => {
    if (isCurrentChat || currentChat.value.receiver == statusInfo.userName) {
      currentChat.value.status = statusInfo
    }
  }

  const loadConversation = (conversation) => {
    if (!currentChat.value || currentChat.value.id != conversation.id) {
      removeDraft()
      if (conversation.draft) {
        currentChat.value = {
          messages: [],
          title: conversation.title,
          type: 1,
          draft: true,
          receiver: conversation.receiver,
          id: conversation.id,
        }
        hub
          .invoke('ListenToUserStatus', conversation.receiver)
          .then((result) => {
            updateConversationStatus(result, true)
          })
      } else {
        api
          .getConversation(conversation.id)
          .then((payload) => {
            let result = payload.data
            if (!result.title) result.title = conversation.title
            currentChat.value = result
            ChatAreaCp.value.scrollToBottom()
            if (result.type == 1) {
              hub
                .invoke('ListenToUserStatusByPrivateChat', conversation.id)
                .then((result) => {
                  updateConversationStatus(result, true)
                })
            }
          })
          .catch((err) => {
            if (err.response && err.response.data) {
              toast.error(err.response.data.message)
            } else {
              const errorMsg =
                'Unable to load this conversation. Try again later.'
              toast.error(errorMsg)
            }
          })
      }
    }
  }

  const createTempChat = (user) => {
    removeDraft()
    const tempChat = {
      id: -1,
      lastMessage: {
        content: 'Draft',
        ownMessage: false,
      },
      title: user.name,
      type: 1,
      draft: true,
      receiver: user.userName,
    }
    conversations.value.unshift(tempChat)
    loadConversation(conversations.value[0])
    hasDraft.value = true
    showModal.value = false
  }

  const removeDraft = () => {
    if (hasDraft.value) {
      conversations.value.shift()
      hasDraft.value = false
    }
  }

  const sendMessageToContact = (target) => {
    api
      .findPrivateConversation(target.userName)
      .then((payload) => {
        if (payload.status == 200) {
          loadConversation(payload.data)
          showModal.value = false
        }
      })
      .catch((err) => {
        if (err.response.status == 404) {
          createTempChat(target)
        } else {
          const errorMsg = 'Something went wrong. Try again later.'
          toast.error(errorMsg)
        }
      })
  }

  const sendMessageFromChat = (message) => {
    if (currentChat.value.draft) {
      const conversationObj = {
        receiver: currentChat.value.receiver,
        firstMessage: message,
        type: 1, // only private for now
      }
      hub.invoke('CreateConversation', conversationObj).then((result) => {
        loadConversation(result)
        conversations.value.unshift(result)
      })
    } else {
      const handlerId = Date.now()
      const messageObj = {
        id: handlerId,
        ownMessage: true,
        sendingTime: new Date(),
        content: message,
        action: 1,
        conversationId: currentChat.value.id,
      }
      currentChat.value.messages = addMessageToGroupedStructure(currentChat.value.messages, messageObj)
      messageObj.sendingTime = messageObj.sendingTime.toJSON()
      hub.invoke('SendMessage', messageObj).then((result) => {
        currentChat.value.messages = updateMessageInGroupedStructure(currentChat.value.messages, result)
        ChatAreaCp.value.scrollToBottom()
        
        let chatIndex = conversations.value.findIndex(
          (find) => find.id == result.conversationId
        )
        if (chatIndex >= 0) {
          conversations.value[chatIndex].lastMessage = result
        }
      })
    }
  }

  const openPrivateChat = (target) => {
    api
      .findPrivateConversation(target.userName)
      .then((payload) => {
        if (payload.status == 200) {
          loadConversation(payload.data)
          showModal.value = false
        }
      })
      .catch((err) => {
        if (err.response.status == 404) {
          createTempChat(target)
        } else if (err.response && err.response.data) {
          toast.error(err.response.data.message)
        } else {
          const errorMsg = 'Unable to find this conversation. Try again later.'
          toast.error(errorMsg)
        }
      })
  }

  const clearCurrentChat = () => {
    currentChat.value = null
  }

  const logout = () => {
    router.push({ name: 'login' })
  }

  const acceptRequest = (requestId) => {
    api.acceptRequest(requestId).then((payload) => {
      loadConversation(payload.data)
      showModal.value = false
      conversations.value.unshift(payload.data)
    })
  }

  const refuseRequest = (requestId) => {
    api.refuseRequest(requestId).then(() => {
      InviteCp.value.reloadRequests()
      toast.success('The request was deleted!')
    })
  }

  const addContact = (targetId) => {
    api.addContact(targetId).then(() => {
      if (currentChat.value.targetId == targetId)
        currentChat.value.isContact = true
      toast.success('Contact added!')
    })
  }
  
  const removeContact = (targetId) => [
    api.removeContact(targetId).then(() => {
      if (currentChat.value.targetId == targetId)
        currentChat.value.isContact = false
      toast.success('Contact removed!')
    })
  ]

  const mergeMessageGroups = (oldMessages, newMessages) => {
  if (!oldMessages || !Array.isArray(oldMessages)) return newMessages
  if (!newMessages || !Array.isArray(newMessages)) return oldMessages
  
  const merged = [...oldMessages]
  
  newMessages.forEach(newGroup => {
    const existingGroupIndex = merged.findIndex(group => group.date === newGroup.date)
    
    if (existingGroupIndex >= 0) {
      merged[existingGroupIndex].messages = newGroup.messages.concat(merged[existingGroupIndex].messages)
      merged[existingGroupIndex].messages.sort((a, b) => new Date(a.sendingTime) - new Date(b.sendingTime))
    } else {
      newGroup.messages.sort((a, b) => new Date(a.sendingTime) - new Date(b.sendingTime))
      merged.unshift(newGroup)
    }
  })
  
  merged.sort((a, b) => new Date(a.date + 'T12:00:00') - new Date(b.date + 'T12:00:00'))
  
  return merged
}

const loadMessages = () => {
  // Pegar o ID da primeira mensagem do primeiro grupo
  const firstMessageId = currentChat.value.messages[0]?.messages[0]?.id
  if (!firstMessageId) return
  
  api.loadMessages(currentChat.value.id, firstMessageId).then((payload) => {
    const conversation = payload.data
    if (conversation) {
      // Mesclar as mensagens antigas com as atuais, agrupando por data
      currentChat.value.messages = mergeMessageGroups(conversation.messages, currentChat.value.messages)
      currentChat.value.hasPreviousMessages = conversation.hasPreviousMessages
    }
  })
}

  // on each first load
  loadAllConversations()

  return {
    openMenuOption,
    createTempChat,
    loadConversation,
    sendMessageToContact,
    sendMessageFromChat,
    openPrivateChat,
    logout,
    clearCurrentChat,
    acceptRequest,
    refuseRequest,
    addContact,
    removeContact,
    loadMessages,
  }
}
