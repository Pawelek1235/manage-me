<script setup lang="ts">
import type { Project, ProjectForm } from '../types'

defineProps<{
  projects: Project[]
  activeProjectId: string
  projectForm: ProjectForm
}>()

const emit = defineEmits<{
  save: []
  reset: []
  setActiveProject: [projectId: string]
  edit: [project: Project]
  delete: [projectId: string]
}>()
</script>

<template>
  <section class="grid two">
    <form class="panel" @submit.prevent="emit('save')">
      <h2>{{ projectForm.id ? 'Edytuj projekt' : 'Nowy projekt' }}</h2>

      <label for="project-name">Nazwa</label>
      <input id="project-name" v-model="projectForm.name" required placeholder="np. ManageMe" />

      <label for="project-description">Opis</label>
      <textarea id="project-description" v-model="projectForm.description" placeholder="Krótki opis projektu" />

      <div class="row">
        <button type="submit">{{ projectForm.id ? 'Zapisz zmiany' : 'Dodaj projekt' }}</button>
        <button type="button" class="secondary" @click="emit('reset')">Wyczyść</button>
      </div>
    </form>

    <section class="panel">
      <h2>Lista projektów</h2>

      <article v-for="project in projects" :key="project.id" class="card">
        <div>
          <h3>{{ project.name }}</h3>
          <p>{{ project.description }}</p>
          <span v-if="project.id === activeProjectId" class="badge">aktywny</span>
        </div>
        <div class="row">
          <button class="secondary" type="button" @click="emit('setActiveProject', project.id)">
            Wybierz
          </button>
          <button class="secondary" type="button" @click="emit('edit', project)">Edytuj</button>
          <button class="danger" type="button" @click="emit('delete', project.id)">Usuń</button>
        </div>
      </article>
    </section>
  </section>
</template>
