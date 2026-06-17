<script setup lang="ts">
import type { AppNotification } from '../types'
import { formatDate } from '../utils/formatters'

defineProps<{
  notification: AppNotification | null
}>()

const emit = defineEmits<{
  close: []
  markRead: [id: string]
}>()
</script>

<template>
  <div v-if="notification" class="dialog-backdrop" role="dialog" aria-modal="true">
    <section class="dialog-panel">
      <div class="dialog-header">
        <span class="badge" :class="`priority-${notification.priority}`">
          {{ notification.priority }}
        </span>
        <button class="icon-button" type="button" aria-label="Zamknij" @click="emit('close')">
          x
        </button>
      </div>

      <h2>{{ notification.title }}</h2>
      <p>{{ notification.content }}</p>
      <p class="muted">{{ formatDate(notification.createdAt) }}</p>

      <div class="row">
        <button type="button" @click="emit('markRead', notification.id)">
          Oznacz jako przeczytane
        </button>
        <button class="secondary" type="button" @click="emit('close')">Zamknij</button>
      </div>
    </section>
  </div>
</template>
