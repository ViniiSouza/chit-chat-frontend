<template>
  <div
    v-if="showOptions"
    class="options__container"
    :style="`transform: translateY(${distanceFromTop}px);`"
  >
    <p
      class="options__item"
      v-for="item in validItems"
      :key="item.name"
      @click="item.event"
    >
      {{ item.name }}
    </p>
  </div>
</template>
<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: [],
  },
  showOptions: {
    type: Boolean,
    default: false,
  },
  distanceFromTop: {
    type: String,
    default: '5',
  },
})

const validItems = computed(() => {
  return props.items.filter((where) => where.show)
})
</script>
<style scoped>
.options__container {
  position: absolute;
  right: 5px;
  background-color: var(--white);
  min-width: 120px;
  border-radius: 5px;
  z-index: 1050;
}

.options__item {
  font-size: 16px;
  margin-bottom: 5px;
  color: var(--dark);
  display: block;
  padding: 5px 12px;
  cursor: pointer;
}

.options__item:hover {
  background-color: var(--grey);
}
</style>