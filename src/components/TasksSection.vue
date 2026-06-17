<script setup lang="ts">
import type { Priority, Story, Task, TaskForm, User } from '../types'
import { formatDate } from '../utils/formatters'

const props = defineProps<{
  priorities: Priority[]
  projectStories: Story[]
  projectTasks: Task[]
  taskForm: TaskForm
  selectedTask: Task | undefined
  assignableUsers: User[]
  users: User[]
  completionHours: number
}>()

const emit = defineEmits<{
  save: []
  reset: []
  selectTask: [taskId: string]
  edit: [task: Task]
  delete: [taskId: string]
  assignUser: [taskId: string, userId: string]
  completeTask: []
  updateCompletionHours: [hours: number]
}>()

function storyName(storyId: string) {
  return props.projectStories.find((story) => story.id === storyId)?.name ?? 'Brak historyjki'
}

function userName(userId?: string) {
  const user = props.users.find((item) => item.id === userId)
  return user ? `${user.firstName} ${user.lastName} (${user.role})` : 'Nieprzypisany'
}

function assignSelectedUser(event: Event, taskId: string) {
  emit('assignUser', taskId, (event.target as HTMLSelectElement).value)
}

function updateHours(event: Event) {
  emit('updateCompletionHours', Number((event.target as HTMLInputElement).value))
}
</script>

<template>
  <section class="grid two">
    <form class="panel" @submit.prevent="emit('save')">
      <h2>{{ taskForm.id ? 'Edytuj zadanie' : 'Nowe zadanie' }}</h2>

      <label for="task-name">Nazwa</label>
      <input id="task-name" v-model="taskForm.name" required :disabled="projectStories.length === 0" />

      <label for="task-description">Opis</label>
      <textarea id="task-description" v-model="taskForm.description" :disabled="projectStories.length === 0" />

      <label for="task-story">Historyjka</label>
      <select id="task-story" v-model="taskForm.storyId" required :disabled="projectStories.length === 0">
        <option disabled value="">Wybierz historyjkę</option>
        <option v-for="story in projectStories" :key="story.id" :value="story.id">
          {{ story.name }}
        </option>
      </select>

      <label for="task-priority">Priorytet</label>
      <select id="task-priority" v-model="taskForm.priority" :disabled="projectStories.length === 0">
        <option v-for="priority in priorities" :key="priority" :value="priority">
          {{ priority }}
        </option>
      </select>

      <label for="task-hours">Przewidywany czas wykonania / h</label>
      <input
        id="task-hours"
        v-model.number="taskForm.estimatedHours"
        type="number"
        min="1"
        :disabled="projectStories.length === 0"
      />

      <div class="row">
        <button type="submit" :disabled="projectStories.length === 0">
          {{ taskForm.id ? 'Zapisz zmiany' : 'Dodaj zadanie' }}
        </button>
        <button type="button" class="secondary" @click="emit('reset')">Wyczyść</button>
      </div>
    </form>

    <section class="panel">
      <h2>Lista zadań</h2>

      <article v-for="task in projectTasks" :key="task.id" class="card">
        <div>
          <h3>{{ task.name }}</h3>
          <p>{{ task.description }}</p>
          <div class="meta">
            <span class="badge">{{ task.status }}</span>
            <span class="badge">{{ task.priority }}</span>
            <span>{{ storyName(task.storyId) }}</span>
            <span>{{ userName(task.assignedUserId) }}</span>
          </div>
        </div>

        <div class="row">
          <button class="secondary" type="button" @click="emit('selectTask', task.id)">Szczegóły</button>
          <button class="secondary" type="button" @click="emit('edit', task)">Edytuj</button>
          <button class="danger" type="button" @click="emit('delete', task.id)">Usuń</button>
        </div>
      </article>
    </section>

    <section class="panel details">
      <h2>Szczegóły zadania</h2>

      <div v-if="selectedTask" class="details-grid">
        <p><strong>Nazwa:</strong> {{ selectedTask.name }}</p>
        <p><strong>Opis:</strong> {{ selectedTask.description }}</p>
        <p><strong>Historyjka:</strong> {{ storyName(selectedTask.storyId) }}</p>
        <p><strong>Priorytet:</strong> {{ selectedTask.priority }}</p>
        <p><strong>Stan:</strong> {{ selectedTask.status }}</p>
        <p><strong>Dodano:</strong> {{ formatDate(selectedTask.createdAt) }}</p>
        <p><strong>Start:</strong> {{ formatDate(selectedTask.startDate) }}</p>
        <p><strong>Koniec:</strong> {{ formatDate(selectedTask.endDate) }}</p>
        <p><strong>Szacowany czas:</strong> {{ selectedTask.estimatedHours }} h</p>
        <p><strong>Zrealizowane roboczogodziny:</strong> {{ selectedTask.actualHours }} h</p>
        <p><strong>Przypisana osoba:</strong> {{ userName(selectedTask.assignedUserId) }}</p>

        <div>
          <label for="task-assignee">Przypisz osobę</label>
          <select
            id="task-assignee"
            :value="selectedTask.assignedUserId || ''"
            :disabled="selectedTask.status === 'done'"
            @change="assignSelectedUser($event, selectedTask.id)"
          >
            <option disabled value="">Wybierz osobę</option>
            <option v-for="user in assignableUsers" :key="user.id" :value="user.id">
              {{ user.firstName }} {{ user.lastName }} - {{ user.role }}
            </option>
          </select>
        </div>

        <div>
          <label for="completion-hours">Roboczogodziny przy zamknięciu</label>
          <input id="completion-hours" :value="completionHours" type="number" min="0" @input="updateHours" />
        </div>

        <button
          class="success"
          type="button"
          :disabled="selectedTask.status === 'done' || !selectedTask.assignedUserId"
          @click="emit('completeTask')"
        >
          Oznacz jako done
        </button>
      </div>

      <p v-else class="muted">Wybierz zadanie z listy.</p>
    </section>
  </section>
</template>
