<script setup lang="ts">
import type { AppSection } from '../types'

defineProps<{
  activeSection: AppSection
}>()

const emit = defineEmits<{
  changeSection: [section: AppSection]
}>()

const tabs: { id: AppSection; label: string }[] = [
  { id: 'projects', label: 'Projekty' },
  { id: 'stories', label: 'Historyjki' },
  { id: 'tasks', label: 'Zadania' },
  { id: 'kanban', label: 'Kanban' },
  { id: 'notifications', label: 'Powiadomienia' },
]
</script>

<template>
  <nav class="tabs" aria-label="Główna nawigacja">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :class="{ active: activeSection === tab.id }"
      type="button"
      @click="emit('changeSection', tab.id)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>
