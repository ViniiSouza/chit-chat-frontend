<template>
  <div
    v-if="!isMobile || (isMobile && chatInfo)"
    class="chat__messages__container"
  >
    <div v-if="!chatInfo" class="chat__empty__container">
      <div class="chat__empty__container__wrapper">
        <img
          class="chat__empty__container__image"
          src="https://i.imgur.com/EuPx9ng.png"
        />
        <p>Select a conversation</p>
        <p>or</p>
        <button
          class="chat__empty__container__button"
          @click="emit('inviteUser')"
        >
          Start a new
        </button>
      </div>
    </div>
    <div v-else class="chat__messages__container__chat">
      <div class="chat__messages__header">
        <div v-if="isMobile" class="chat__back-button" @click="backToMenu">
          <font-awesome-icon icon="fa-solid fa-angle-left" />
        </div>
        <div class="chat__user-info">
          <div class="chat__messages__name">{{ chatInfo.title }}</div>
          <div class="chat__messages__info">
            {{ chatInfo.type == 1 ? getUserStatus : 'Not private' }}
          </div>
        </div>
        <div class="chat__options">
          <font-awesome-icon
            class="chat__options__item"
            icon="fa-solid fa-bars"
            @click="showOptions = !showOptions"
          />
        </div>
        <Options
          :show-options="showOptions"
          :items="options"
          distance-from-top="50"
        />
      </div>
      <div class="chat__messages__area" ref="messageArea">
        <button
          v-if="chatInfo.hasPreviousMessages"
          class="chat__load-more-button"
          @click="loadMessages"
        >
          Load more
        </button>
        <div
          v-for="(dateGroup, dateIndex) in chatInfo.messages"
          :key="dateGroup.date"
          class="chat__date-group"
        >
          <div class="chat__date-header">
            {{ formatDateHeader(dateGroup.date) }}
          </div>
          <div
            class="chat__messages__wrapper"
            v-for="(message, messageIndex) in dateGroup.messages"
            :key="message.id"
          >
            <div
              v-if="message.action == 1"
              class="chat__message--text"
              :class="
                message.ownMessage
                  ? 'chat__message--sent'
                  : 'chat__message--received'
              "
            >
              <div
                v-if="
                  !message.ownMessage &&
                  (messageIndex == 0 ||
                    dateGroup.messages[messageIndex - 1].ownMessage != message.ownMessage)
                "
                class="chat__message__name"
              >
                {{ getFirstName(message.senderName) }}
              </div>
              <div class="chat__message__content">
                {{ message.content }}
              </div>
              <div class="chat__message__time">
                {{ dateHandler.getStringTime(message.sendingTime) }}
              </div>
            </div>
            <div v-else-if="message.action == 2" class="chat__message--info">
              <b>{{ message.senderName }}</b> created the chat
            </div>
          </div>
        </div>
      </div>
      <div class="chat__messages__input">
        <input
          type="text"
          ref="chatInput"
          v-model="newMessage"
          placeholder="Write your message"
          v-on:keyup.enter="sendMessage"
        />
        <button @click="sendMessage">Send</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import './shared/style.css'
import { computed, nextTick, ref, watch } from 'vue'
import dateHandler from '@/utils/dateHandler.js'
import Options from '../../../shared/options/Options.vue'

const emit = defineEmits([
  'inviteUser',
  'sendMessage',
  'backToMenu',
  'addContact',
  'removeContact',
  'loadMessages',
])

const props = defineProps({
  chatInfo: {
    type: Object,
  },
  isMobile: {
    type: Boolean,
  },
})

const messageArea = ref(null)
const newMessage = ref('')
const showOptions = ref(false)
const chatInput = ref(null)

// on chat change
watch(
  () => props.chatInfo,
  () => {
    showOptions.value = false
    focusInput()
  }
)

const getFirstName = (name) => {
  let splitted = name.trim().split(' ')
  let firstName = splitted[0]
  if (firstName.length > 10) {
    firstName = firstName.substring(0, 10)
  }
  return firstName
}

const getUserStatus = computed(() => {
  if (props.chatInfo.status) {
    if (props.chatInfo.status.status == 1) return 'On-line'
    if (dateHandler.dateIsToday(props.chatInfo.status.lastSeen))
      return `Last seen today at ${dateHandler.getStringTime(
        props.chatInfo.status.lastSeen
      )}`
    if (dateHandler.dateIsYesterday(props.chatInfo.status.lastSeen))
      return `Last seen yesterday at ${dateHandler.getStringTime(
        props.chatInfo.status.lastSeen
      )}`

    return `Last seen ${dateHandler.getStringDate(
      props.chatInfo.status.lastSeen
    )}`
  }
})

const options = computed(() => {
  let opt = []
  if (props.chatInfo.type == 1 && !props.chatInfo.isContact)
    opt.push({
      name: 'Add to contacts',
      event: () => emit('addContact', props.chatInfo.receiverId),
      show: true,
    })
  if (props.chatInfo.type == 1 && props.chatInfo.isContact)
    opt.push({
      name: 'Remove from contacts',
      event: () => emit('removeContact', props.chatInfo.receiverId),
      show: true,
    })
  return opt
})

const sendMessage = () => {
  if (newMessage.value) {
    emit('sendMessage', newMessage.value)
    newMessage.value = ''
    focusInput()
  }
}

const backToMenu = () => {
  emit('backToMenu')
}

const userInBottom = computed(
  () =>
    messageArea.value.scrollTop >=
    messageArea.value.scrollHeight - messageArea.value.offsetHeight
)

const scrollToBottom = () => {
  nextTick(() => {
    messageArea.value.scrollTop = messageArea.value.scrollHeight
  })
}

const focusInput = () => {
  nextTick(() => {
    chatInput.value.focus()
  })
}

const loadMessages = () => {
  emit('loadMessages')
}

const formatDateHeader = (dateString) => {
  let normalizedDateString = dateString
  if (dateString.length === 10 && dateString.includes('-')) {
    normalizedDateString = dateString + 'T12:00:00'
  }
  
  const date = new Date(normalizedDateString)
  
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  const isSameDate = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }
  
  if (isSameDate(date, today)) {
    return 'Today'
  } else if (isSameDate(date, yesterday)) {
    return 'Yesterday'
  } else {
    return dateHandler.getStringDate(dateString)
  }
}

defineExpose({
  userInBottom,
  scrollToBottom,
})
</script>
