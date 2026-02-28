import { ref } from "vue";
import { ProjectService } from "../services/ProjectService";
import type { Project } from "../types/Project";

const service = new ProjectService();
const projects = ref<Project[]>([]);

function load() {
  projects.value = service.getAll();
}

function create(project: Project) {
  service.create(project);
  load();
}

function update(project: Project) {
  service.update(project);
  load();
}

function remove(id: string) {
  service.delete(id);
  load();
}

export function useProjects() {
  return {
    projects,
    load,
    create,
    update,
    remove,
  };
}