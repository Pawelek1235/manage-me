<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useProjects } from "./composables/useProjects";
import type { Project } from "./types/Project";
import ProjectForm from "./components/ProjectForm.vue";
import ProjectList from "./components/ProjectList.vue";

const { projects, load, create, update, remove } = useProjects();

const editingProject = ref<Project | null>(null);

onMounted(() => {
  load();
});

function handleSave(projectData: Omit<Project, "id"> & { id?: string }) {
  if (projectData.id) {
    update(projectData as Project);
  } else {
    create({
      id: crypto.randomUUID(),
      name: projectData.name,
      description: projectData.description,
    });
  }

  editingProject.value = null;
}

function handleEdit(project: Project) {
  editingProject.value = project;
}

function handleCancel() {
  editingProject.value = null;
}
</script>

<template>
  <div class="app-container">
    <h1>ManageMe</h1>

    <div class="section">
      <ProjectForm
        :modelValue="editingProject"
        @save="handleSave"
        @cancel="handleCancel"
      />
    </div>

    <div class="section">
      <ProjectList
        :projects="projects"
        @edit="handleEdit"
        @delete="remove"
      />
    </div>
  </div>
</template>