<template>
  <FormComponent>
    <div class="login__form-group">
      <label class="login__form--label" for="username">Username:</label>
      <input
        class="login__form--input"
        autocapitalize="none"
        :class="!validator.userName.valid ? 'invalid-input' : ''"
        type="text"
        maxlength="15"
        v-model="user.userName"
        placeholder="Enter your username"
        @blur="validateUser"
        @input="validateUser"
        @keypress="handleUsername"
      />
      <span v-if="!validator.userName.valid" class="invalid-message">{{
        validator.userName.message
      }}</span>
    </div>
    <div class="login__form-group">
      <label class="login__form--label" for="password">Password:</label>
      <input
        class="login__form--input"
        :class="!validator.password.valid ? 'invalid-input' : ''"
        type="password"
        v-model="user.password"
        placeholder="Enter your password"
        @blur="validatePassword"
        @input="validatePassword"
        @keyup.enter="signIn"
      />
      <span v-if="!validator.password.valid" class="invalid-message">{{
        validator.password.message
      }}</span>
    </div>
    <button id="login__form--sign-in" @click="signIn">Sign in</button>
    <p style="color: var(--dark)">
      Don't have an account?
      <a href="#" class="login__form--sign-up" @click="toSignUp">Sign up</a>
    </p>
  </FormComponent>
</template>

<script setup>
import './shared/style.css'
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import FormComponent from '../shared/form-section/FormComponent.vue'
import api from './shared/api.js'
import { useToast } from 'vue-toastification'

const toast = useToast()
const router = useRouter()
const route = useRoute()

const user = ref({
  userName: '',
  password: '',
})

const validator = ref({
  userName: {
    message: '',
    valid: true,
  },
  password: {
    message: '',
    valid: true,
  },
})

const handleUsername = (event) => {
  const char = event.key.toLowerCase();
    if (!/^[a-z]$/.test(char)) {
      event.preventDefault();
    }
}

const validateUser = () => {
  let valid = true
  user.value.userName = user.value.userName.replace(/\s/g, '').toLowerCase()
  if (!user.value.userName || user.value.userName.length == 0) {
    validator.value.userName.valid = false
    validator.value.userName.message = 'Invalid username'
    valid = false
  } else {
    validator.value.userName.valid = true
    validator.value.userName.message = ''
  }

  return valid
}

const validatePassword = () => {
  let valid = true
  if (!user.value.password || user.value.password.length == 0) {
    validator.value.password.valid = false
    validator.value.password.message = 'Invalid password'
    valid = false
  } else {
    validator.value.password.valid = true
    validator.value.password.message = ''
  }

  return valid
}

const validate = () => {
  let valid = true
  if (!validateUser()) valid = false
  if (!validatePassword()) valid = false
  return valid
}

const signIn = () => {
  if (validate()) {
    api
      .signIn(user.value)
      .then((response) => {
        if (response.status == 200) {
          localStorage.setItem('token', response.data)
          const redirectRoute = route.query.redirect || '/chat'
          router.push(redirectRoute)
        }
      })
      .catch((err) => {
        if (err.response && err.response.data) {
          validator.value.password.message = err.response.data
        } else {
          const errorMsg = 'Something went wrong. Try again later.'
          toast.error(errorMsg)
          validator.value.password.message = errorMsg
        }
        validator.value.password.valid = false
        validator.value.userName.valid = false
      })
  }
}

const toSignUp = () => router.push({ name: 'register' })
</script>
