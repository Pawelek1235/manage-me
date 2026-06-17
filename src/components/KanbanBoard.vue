<script setup lang="ts">
import type { Status, Story, Task, User } from '../types'

const props = defineProps<{
  statuses: Status[]
  tasks: Task[]
  stories: Story[]
  users: User[]
}>()

const emit = defineEmits<{
  openTaskDetails: [taskId: string]
}>()

function storyName(storyId: string) {
  return props.stories.find((story) => story.id === storyId)?.name ?? 'Brak historyjki'
}

function userName(userId?: string) {
  const user = props.users.find((item) => item.id === userId)
  return user ? `${user.firstName} ${user.lastName} (${user.role})` : 'Nieprzypisany'
}

function tasksByStatus(status: Status) {
  return props.tasks.filter((task) => task.status === status)
}
</script>

<template>
  <section class="panel">
    <h2>Tablica Kanban</h2>

    <div class="kanban">
      <div v-for="status in statuses" :key="status" class="kanban-column">
        <h3>{{ status }}</h3>

        <article v-for="task in tasksByStatus(status)" :key="task.id" class="card compact">
          <h4>{{ task.name }}</h4>
          <p>{{ task.description }}</p>
          <div class="meta">
            <span class="badge">{{ task.priority }}</span>
            <span>{{ storyName(task.storyId) }}</span>
            <span>{{ userName(task.assignedUserId) }}</span>
          </div>
          <button class="secondary full" type="button" @click="emit('openTaskDetails', task.id)">
            Szczegóły
          </button>
        </article>
      </div>
    </div>
  </section>
</template>
