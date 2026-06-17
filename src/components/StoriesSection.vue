<script setup lang="ts">
import type { Priority, Status, Story, StoryForm, User } from '../types'
import { formatDate } from '../utils/formatters'

const props = defineProps<{
  activeProjectId: string
  priorities: Priority[]
  statuses: Status[]
  stories: Story[]
  storyForm: StoryForm
  users: User[]
}>()

const emit = defineEmits<{
  save: []
  reset: []
  edit: [story: Story]
  delete: [storyId: string]
}>()

function userName(userId?: string) {
  const user = props.users.find((item) => item.id === userId)
  return user ? `${user.firstName} ${user.lastName} (${user.role})` : 'Nieprzypisany'
}

function storiesByStatus(status: Status) {
  return props.stories.filter((story) => story.status === status)
}
</script>

<template>
  <section class="grid two">
    <form class="panel" @submit.prevent="emit('save')">
      <h2>{{ storyForm.id ? 'Edytuj historyjkę' : 'Nowa historyjka' }}</h2>

      <label for="story-name">Nazwa</label>
      <input id="story-name" v-model="storyForm.name" required :disabled="!activeProjectId" />

      <label for="story-description">Opis</label>
      <textarea id="story-description" v-model="storyForm.description" :disabled="!activeProjectId" />

      <label for="story-priority">Priorytet</label>
      <select id="story-priority" v-model="storyForm.priority" :disabled="!activeProjectId">
        <option v-for="priority in priorities" :key="priority" :value="priority">
          {{ priority }}
        </option>
      </select>

      <label for="story-owner">Właściciel</label>
      <select id="story-owner" v-model="storyForm.ownerId" :disabled="!activeProjectId">
        <option v-for="user in users" :key="user.id" :value="user.id">
          {{ user.firstName }} {{ user.lastName }} - {{ user.role }}
        </option>
      </select>

      <div class="row">
        <button type="submit" :disabled="!activeProjectId">
          {{ storyForm.id ? 'Zapisz zmiany' : 'Dodaj historyjkę' }}
        </button>
        <button type="button" class="secondary" @click="emit('reset')">Wyczyść</button>
      </div>
    </form>

    <section class="panel">
      <h2>Historyjki projektu</h2>

      <div class="status-grid">
        <div v-for="status in statuses" :key="status" class="status-column">
          <h3>{{ status }}</h3>

          <article v-for="story in storiesByStatus(status)" :key="story.id" class="card compact">
            <h4>{{ story.name }}</h4>
            <p>{{ story.description }}</p>
            <div class="meta">
              <span class="badge">{{ story.priority }}</span>
              <span>{{ formatDate(story.createdAt) }}</span>
              <span>{{ userName(story.ownerId) }}</span>
            </div>
            <div class="row">
              <button class="secondary" type="button" @click="emit('edit', story)">Edytuj</button>
              <button class="danger" type="button" @click="emit('delete', story.id)">Usuń</button>
            </div>
          </article>
        </div>
      </div>
    </section>
  </section>
</template>
