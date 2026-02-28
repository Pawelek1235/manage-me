<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useProjects } from "./composables/useProjects";
import type { Project } from "./types/Project";

const { projects, load, create, update, remove } = useProjects();

const name = ref("");
const description = ref("");
const editingId = ref<string | null>(null);
const error = ref<string | null>(null);

onMounted(() => {
  load();
});

function resetForm() {
  name.value = "";
  description.value = "";
  editingId.value = null;
}

function handleSave() {
  if (!name.value.trim()) {
    error.value = "Nazwa projektu jest wymagana";
    return;
  }

  error.value = null;

  if (editingId.value) {
    update({
      id: editingId.value,
      name: name.value,
      description: description.value,
    });
  } else {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: name.value,
      description: description.value,
    };
    create(newProject);
  }

  resetForm();
}

function handleEdit(project: Project) {
  name.value = project.name;
  description.value = project.description;
  editingId.value = project.id;
}

function handleDelete(id: string) {
  remove(id);
}
</script>

<template>
  <div style="padding:20px">
    <h1>ManageMe</h1>

    <h2>{{ editingId ? "Edytuj projekt" : "Dodaj projekt" }}</h2>

    <p v-if="error" style="color:red">{{ error }}</p>

    <input v-model="name" placeholder="Nazwa" />
    <br />
    <textarea v-model="description" placeholder="Opis"></textarea>
    <br />
    <button @click="handleSave">
      {{ editingId ? "Zapisz zmiany" : "Dodaj" }}
    </button>

    <h2>Lista projektów</h2>

    <div
      v-for="project in projects"
      :key="project.id"
      style="border:1px solid gray; margin:8px; padding:8px"
    >
      <h3>{{ project.name }}</h3>
      <p>{{ project.description }}</p>
      <button @click="handleEdit(project)">Edytuj</button>
      <button @click="handleDelete(project.id)">Usuń</button>
    </div>
  </div>
</template>