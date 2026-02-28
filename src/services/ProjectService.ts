import type { Project } from "../types/Project";

const STORAGE_KEY = "projects";

export class ProjectService {
  private getProjects(): Project[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveProjects(projects: Project[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  getAll(): Project[] {
    return this.getProjects();
  }

  getById(id: string): Project | undefined {
    return this.getProjects().find(p => p.id === id);
  }

  create(project: Project): void {
    const projects = this.getProjects();
    projects.push(project);
    this.saveProjects(projects);
  }

  update(updatedProject: Project): void {
    const projects = this.getProjects().map(p =>
      p.id === updatedProject.id ? updatedProject : p
    );
    this.saveProjects(projects);
  }

  delete(id: string): void {
    const projects = this.getProjects().filter(p => p.id !== id);
    this.saveProjects(projects);
  }
}