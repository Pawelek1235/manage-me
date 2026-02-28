<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ProjectService } from "./services/ProjectService";
import type { Project } from "./types/Project";

const service = new ProjectService();

const projects = ref<Project[]>([]);
const name = ref("");
const description = ref("");

onMounted(() => {
  projects.value = service.getAll();
});

function handleAdd() {
  if (!name.value.trim()) return;

  const newProject: Project = {
    id: crypto.randomUUID(),
    name: name.value,
    description: description.value,
  };

  service.create(newProject);
  projects.value = service.getAll();

  name.value = "";
  description.value = "";
}

function handleDelete(id: string) {
  service.delete(id);
  projects.value = service.getAll();
}
</script>

<template>
  <div style="padding:20px">
    <h1>ManageMe</h1>

    <h2>Dodaj projekt</h2>

    <input v-model="name" placeholder="Nazwa" />
    <br />
    <textarea v-model="description" placeholder="Opis"></textarea>
    <br />
    <button @click="handleAdd">Dodaj</button>

    <h2>Lista projektów</h2>

    <div
      v-for="project in projects"
      :key="project.id"
      style="border:1px solid gray; margin:8px; padding:8px"
    >
      <h3>{{ project.name }}</h3>
      <p>{{ project.description }}</p>
      <button @click="handleDelete(project.id)">Usuń</button>
    </div>
  </div>
</template>