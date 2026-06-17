<script setup lang="ts">
import type { User } from '../types'

defineProps<{
  loggedUser: User | null
  unreadNotificationsCount: number
  theme: 'light' | 'dark'
}>()

const emit = defineEmits<{
  openNotifications: []
  toggleTheme: []
  resetData: []
}>()
</script>

<template>
  <header class="topbar">
    <div>
      <p class="eyebrow">ManageMe</p>
      <h1>Zarządzanie projektami</h1>
      <p v-if="loggedUser" class="muted">
        Zalogowany:
        <strong>{{ loggedUser.firstName }} {{ loggedUser.lastName }}</strong>
        - {{ loggedUser.role }}
      </p>
    </div>

    <div class="topbar-actions">
      <button class="notification-counter" type="button" @click="emit('openNotifications')">
        Powiadomienia
        <span>{{ unreadNotificationsCount }}</span>
      </button>
      <button class="secondary" type="button" @click="emit('toggleTheme')">
        {{ theme === 'light' ? 'Tryb ciemny' : 'Tryb jasny' }}
      </button>
      <button class="danger ghost" type="button" @click="emit('resetData')">
        Reset danych
      </button>
    </div>
  </header>
</template>
