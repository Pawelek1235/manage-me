<script setup lang="ts">
import type { Project } from "../types/Project";

defineProps<{
  projects: Project[];
}>();

const emit = defineEmits<{
  (e: "edit", project: Project): void;
  (e: "delete", id: string): void;
}>();
</script>

<template>
  <div>
    <h2>Lista projektów</h2>

    <div
      v-for="project in projects"
      :key="project.id"
      class="project-card"
    >
      <h3>{{ project.name }}</h3>
      <p>{{ project.description }}</p>

      <button @click="$emit('edit', project)">Edytuj</button>
      <button class="secondary" @click="$emit('delete', project.id)">
        Usuń
      </button>
    </div>
  </div>
</template>