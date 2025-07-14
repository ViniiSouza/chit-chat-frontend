<template>
  <div
    v-if="!isMobile || (isMobile && !selectedConversation)"
    class="chat__conversations__container"
  >
    <div class="chat__conversations__header">
      <div class="chat__conversations__header__options">
        <span
          class="chat__conversations__header__icon tooltip-container"
          @click="selectOption(1)"
        >
          <font-awesome-icon icon="fa-solid fa-pen-to-square" />
          <span class="tooltip-component tooltip--bottom">Contacts</span>
        </span>
        <span
          class="chat__conversations__header__icon tooltip-container"
          @click="selectOption(2)"
        >
          <font-awesome-icon icon="fa-solid fa-user-plus" />
          <span class="tooltip-component tooltip--bottom">Invite/Requests</span>
        </span>
        <span
          class="chat__conversations__header__icon"
          @click="showConfig = !showConfig"
        >
          <font-awesome-icon icon="fa-solid fa-gear" />
        </span>
        <Options :show-options="showConfig" :items="[{ name: 'Logout', event: logout, show: true}]"/>
      </div>
      <h2 class="chat__header__title">Conversations</h2>
      <input
        class="chat__header__input"
        type="search"
        v-model="searchValue"
        placeholder="Search"
      />
    </div>
    <ul
      v-if="conversations && conversations.length > 0"
      class="chat__conversations__list"
    >
      <li
        v-for="conversation in orderedConversations"
        :key="conversation.id"
        class="chat__conversations__item"
        :class="
          (selectedConversation == conversation.id || conversation.id == -1) &&
          'chat__conversations__item--selected'
        "
        @click="selectConversation(conversation)"
      >
        <p class="chat__conversations__item__time">
          {{ getTime(conversation.lastMessage?.sendingTime) }}
        </p>
        <p class="chat__conversations__item__name">{{ conversation.title }}</p>
        <span
          v-if="conversation.lastMessage && conversation.type == 1"
          :class="
            conversation.draft && 'chat__conversations__item__name--italic'
          "
        >
        <div v-if="conversation.lastMessage?.action == 1">
          <b v-if="conversation.lastMessage?.ownMessage">You: </b>
          {{ conversation.lastMessage?.content }}
        </div>
        <div v-else-if="conversation.lastMessage?.action == 5">
          {{ conversation.lastMessage?.ownMessage ? 'You' : conversation.lastMessage?.senderName}} accepted the request
        </div>
        </span>
      </li>
    </ul>
    <div style="text-align: center" v-else>You have no chats</div>
  </div>
</template>
<script setup>
import './shared/style.css'
import { computed, ref } from 'vue'
import dateHandler from '@/utils/dateHandler.js'
import Options from '../../../shared/options/Options.vue';

const emit = defineEmits(['conversationSelected', 'menuOption', 'logout'])

const props = defineProps({
  conversations: {
    type: Array,
    default: [],
  },
  selectedConversation: {
    type: Number,
    default: null,
  },
  isMobile: {
    type: Boolean,
  },
})

const orderByDateTime = (a, b) => {
  if (!a.lastMessage || a.lastMessage?.sendingTime < b.lastMessage?.sendingTime) {
    return 1
  }
  if (!b.lastMessage || a.lastMessage?.sendingTime > b.lastMessage?.sendingTime) {
    return -1
  }
  return 0
}

const orderedConversations = computed(() => {
  props.conversations.sort(orderByDateTime)
  return props.conversations
})

const searchValue = ref('')
const showConfig = ref(false)

const logout = () => {
  emit('logout')
}

const selectOption = (optionNumber) => {
  emit('menuOption', optionNumber)
}

const getTime = (time) => {
  if (time == null) return ''
  if (dateHandler.dateIsToday(time)) {
    return dateHandler.getStringTime(time)
  }
  return dateHandler.getStringDate(time)
}

const selectConversation = (conversation) => {
  emit('conversationSelected', conversation)
}
</script>