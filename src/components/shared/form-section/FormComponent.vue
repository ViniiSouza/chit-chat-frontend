<template>
<div class="form__container">
  <img v-if="showIcons" src="https://images.vexels.com/media/users/3/139911/isolated/preview/1afb4038427b2bd8edd275940aea269d-icone-de-servico-de-bate-papo.png" alt="Imagem" class="form__speech-icon--first">
  <div class="form__card">
    <div v-if="showLogo" class="form__logo--container">
        <img
          class="form__logo--image"
          :src="logoImg"
          alt="Logo"
        />
      </div>
      <div>
        <slot></slot>
      </div>
  </div>
  <img v-if="showIcons" src="https://images.vexels.com/media/users/3/139911/isolated/preview/1afb4038427b2bd8edd275940aea269d-icone-de-servico-de-bate-papo.png" alt="Imagem" class="form__speech-icon--second">
</div>
</template>
<script>
import './shared/style.css'
export default {
  data() { 
    return {

    }
  },
  props: {
    showLogo: {
      type: Boolean,
      default: true
    },
    logoImg: {
      type: String,
      default: 'https://i.imgur.com/EuPx9ng.png'
    },
    showIcons: {
      type: Boolean,
      default: true
    }
  }
}
</script>
