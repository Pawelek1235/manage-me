<script setup lang="ts">
import type { Project } from '../types'

defineProps<{
  projects: Project[]
  activeProject: Project | undefined
  activeProjectId: string
}>()

const emit = defineEmits<{
  setActiveProject: [projectId: string]
}>()

function onChange(event: Event) {
  emit('setActiveProject', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <section class="panel active-project">
    <div>
      <label for="active-project">Aktywny projekt</label>
      <select id="active-project" :value="activeProjectId" @change="onChange">
        <option disabled value="">Wybierz projekt</option>
        <option v-for="project in projects" :key="project.id" :value="project.id">
          {{ project.name }}
        </option>
      </select>
    </div>

    <p v-if="activeProject" class="muted">{{ activeProject.description }}</p>
    <p v-else class="muted">Dodaj projekt, aby rozpocząć pracę.</p>
  </section>
</template>
