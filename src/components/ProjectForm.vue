<script setup lang="ts">
import { ref, watch } from "vue";
import type { Project } from "../types/Project";

const props = defineProps<{
  modelValue: Project | null;
}>();

const emit = defineEmits<{
  (e: "save", project: Omit<Project, "id"> & { id?: string }): void;
  (e: "cancel"): void;
}>();

const name = ref("");
const description = ref("");
const error = ref<string | null>(null);

watch(
  () => props.modelValue,
  (project) => {
    if (project) {
      name.value = project.name;
      description.value = project.description;
    } else {
      name.value = "";
      description.value = "";
    }
  },
  { immediate: true }
);

function handleSubmit() {
  if (!name.value.trim()) {
    error.value = "Nazwa projektu jest wymagana";
    return;
  }

  error.value = null;

  emit("save", {
    id: props.modelValue?.id,
    name: name.value,
    description: description.value,
  });
}
</script>
<template>
  <div>
    <h2>{{ modelValue ? "Edytuj projekt" : "Dodaj projekt" }}</h2>

    <p v-if="error" class="error">{{ error }}</p>

    <input v-model="name" placeholder="Nazwa projektu" />
    <textarea v-model="description" placeholder="Opis projektu"></textarea>

    <button @click="handleSubmit">
      {{ modelValue ? "Zapisz zmiany" : "Dodaj" }}
    </button>

    <button
      v-if="modelValue"
      class="secondary"
      @click="$emit('cancel')"
    >
      Anuluj
    </button>
  </div>
</template>