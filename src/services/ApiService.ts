import type { Priority, Project, Status, Story, Task, User } from '../types'
import { NotificationService } from './NotificationService'
import { UserService } from './UserService'

const STORAGE_KEYS = {
  projects: 'manageme_projects',
  stories: 'manageme_stories',
  tasks: 'manageme_tasks',
  activeProjectId: 'manageme_active_project_id',
  theme: 'manageme_theme',
}

const createId = () => crypto.randomUUID()

function normalizePriority(priority: string): Priority {
  if (priority === 'niski' || priority === 'średni' || priority === 'wysoki') {
    return priority
  }

  return 'średni'
}

export class ApiService {
  private static read<T>(key: string, fallback: T): T {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback

    try {
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  }

  private static write<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value))
  }

  static seed(): void {
    UserService.seed()

    if (this.getProjects().length > 0) return

    const project: Project = {
      id: createId(),
      name: 'ManageMe',
      description: 'Aplikacja do zarządzania projektami',
    }

    this.write<Project[]>(STORAGE_KEYS.projects, [project])
    this.setActiveProjectId(project.id)

    const story: Story = {
      id: createId(),
      name: 'CRUD projektów',
      description: 'Jako użytkownik chcę dodawać, edytować i usuwać projekty.',
      priority: 'wysoki',
      projectId: project.id,
      createdAt: new Date().toISOString(),
      status: 'todo',
      ownerId: 'u-admin',
    }

    this.write<Story[]>(STORAGE_KEYS.stories, [story])

    const task: Task = {
      id: createId(),
      name: 'Utworzyć formularz projektu',
      description: 'Formularz powinien umożliwiać dodanie i edycję projektu.',
      priority: 'średni',
      storyId: story.id,
      estimatedHours: 3,
      actualHours: 0,
      status: 'todo',
      createdAt: new Date().toISOString(),
    }

    this.write<Task[]>(STORAGE_KEYS.tasks, [task])
  }

  static resetData(): void {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
    NotificationService.clear()
    UserService.clear()
    this.seed()
  }

  static getUsers(): User[] {
    return UserService.getUsers()
  }

  static getLoggedUser(): User {
    return UserService.getLoggedUser()
  }

  static getAssignableUsers(): User[] {
    return UserService.getAssignableUsers()
  }

  static getAdminUsers(): User[] {
    return UserService.getAdmins()
  }

  static getProjects(): Project[] {
    return this.read<Project[]>(STORAGE_KEYS.projects, [])
  }

  static createProject(data: Omit<Project, 'id'>): Project {
    const project: Project = { id: createId(), ...data }

    this.write<Project[]>(STORAGE_KEYS.projects, [...this.getProjects(), project])

    if (!this.getActiveProjectId()) {
      this.setActiveProjectId(project.id)
    }

    return project
  }

  static updateProject(project: Project): Project {
    const projects = this.getProjects().map((item) => (item.id === project.id ? project : item))

    this.write<Project[]>(STORAGE_KEYS.projects, projects)
    return project
  }

  static deleteProject(projectId: string): void {
    const storyIds = this.getStories()
      .filter((story) => story.projectId === projectId)
      .map((story) => story.id)

    this.write<Project[]>(
      STORAGE_KEYS.projects,
      this.getProjects().filter((project) => project.id !== projectId),
    )

    this.write<Story[]>(
      STORAGE_KEYS.stories,
      this.getStories().filter((story) => story.projectId !== projectId),
    )

    this.write<Task[]>(
      STORAGE_KEYS.tasks,
      this.getTasks().filter((task) => !storyIds.includes(task.storyId)),
    )

    if (this.getActiveProjectId() === projectId) {
      this.setActiveProjectId(this.getProjects()[0]?.id ?? '')
    }
  }

  static getActiveProjectId(): string {
    return localStorage.getItem(STORAGE_KEYS.activeProjectId) ?? ''
  }

  static setActiveProjectId(projectId: string): void {
    localStorage.setItem(STORAGE_KEYS.activeProjectId, projectId)
  }

  static getStories(): Story[] {
    return this.read<Story[]>(STORAGE_KEYS.stories, []).map((story) => ({
      ...story,
      priority: normalizePriority(story.priority),
    }))
  }

  static getStoriesByProject(projectId: string): Story[] {
    return this.getStories().filter((story) => story.projectId === projectId)
  }

  static createStory(data: Omit<Story, 'id' | 'createdAt' | 'status'>): Story {
    const story: Story = {
      id: createId(),
      createdAt: new Date().toISOString(),
      status: 'todo',
      ...data,
    }

    this.write<Story[]>(STORAGE_KEYS.stories, [...this.getStories(), story])
    return story
  }

  static updateStory(story: Story): Story {
    this.write<Story[]>(
      STORAGE_KEYS.stories,
      this.getStories().map((item) => (item.id === story.id ? story : item)),
    )

    return story
  }

  static deleteStory(storyId: string): void {
    this.write<Story[]>(
      STORAGE_KEYS.stories,
      this.getStories().filter((story) => story.id !== storyId),
    )

    this.write<Task[]>(
      STORAGE_KEYS.tasks,
      this.getTasks().filter((task) => task.storyId !== storyId),
    )
  }

  static getTasks(): Task[] {
    return this.read<Task[]>(STORAGE_KEYS.tasks, []).map((task) => ({
      ...task,
      priority: normalizePriority(task.priority),
    }))
  }

  static getTasksByStories(storyIds: string[]): Task[] {
    return this.getTasks().filter((task) => storyIds.includes(task.storyId))
  }

  static createTask(data: Omit<Task, 'id' | 'createdAt' | 'status' | 'actualHours'>): Task {
    const task: Task = {
      id: createId(),
      createdAt: new Date().toISOString(),
      status: 'todo',
      actualHours: 0,
      ...data,
    }

    this.write<Task[]>(STORAGE_KEYS.tasks, [...this.getTasks(), task])
    this.syncStoryStatus(task.storyId)

    return task
  }

  static updateTask(task: Task): Task {
    const previousTask = this.getTasks().find((item) => item.id === task.id)

    this.write<Task[]>(
      STORAGE_KEYS.tasks,
      this.getTasks().map((item) => (item.id === task.id ? task : item)),
    )

    this.syncStoryStatus(task.storyId)

    if (previousTask && previousTask.storyId !== task.storyId) {
      this.syncStoryStatus(previousTask.storyId)
    }

    return task
  }

  static deleteTask(taskId: string): void {
    const task = this.getTasks().find((item) => item.id === taskId)

    this.write<Task[]>(
      STORAGE_KEYS.tasks,
      this.getTasks().filter((item) => item.id !== taskId),
    )

    if (task) this.syncStoryStatus(task.storyId)
  }

  static assignUserToTask(taskId: string, userId: string): Task | null {
    const task = this.getTasks().find((item) => item.id === taskId)
    const user = UserService.getById(userId)

    if (!task || !user || !UserService.canTakeTask(user)) {
      return null
    }

    const updatedTask: Task = {
      ...task,
      assignedUserId: userId,
      status: 'doing',
      startDate: task.startDate ?? new Date().toISOString(),
    }

    this.write<Task[]>(
      STORAGE_KEYS.tasks,
      this.getTasks().map((item) => (item.id === taskId ? updatedTask : item)),
    )

    const story = this.getStories().find((item) => item.id === task.storyId)

    if (story && story.status === 'todo') {
      this.updateStory({ ...story, status: 'doing' })
    }

    return updatedTask
  }

  static completeTask(taskId: string, actualHours: number): Task | null {
    const task = this.getTasks().find((item) => item.id === taskId)
    if (!task || !task.assignedUserId) return null

    const updatedTask: Task = {
      ...task,
      status: 'done',
      actualHours,
      endDate: new Date().toISOString(),
    }

    this.write<Task[]>(
      STORAGE_KEYS.tasks,
      this.getTasks().map((item) => (item.id === taskId ? updatedTask : item)),
    )

    this.syncStoryStatus(task.storyId)
    return updatedTask
  }

  static getTheme(): 'light' | 'dark' {
    return this.read<'light' | 'dark'>(STORAGE_KEYS.theme, 'light')
  }

  static setTheme(theme: 'light' | 'dark'): void {
    this.write(STORAGE_KEYS.theme, theme)
  }

  static setStoryStatus(storyId: string, status: Status): void {
    const story = this.getStories().find((item) => item.id === storyId)
    if (!story) return

    this.updateStory({ ...story, status })
  }

  private static syncStoryStatus(storyId: string): void {
    const story = this.getStories().find((item) => item.id === storyId)
    if (!story) return

    const tasks = this.getTasks().filter((task) => task.storyId === storyId)

    if (tasks.length === 0) {
      this.updateStory({ ...story, status: 'todo' })
      return
    }

    if (tasks.every((task) => task.status === 'done')) {
      this.updateStory({ ...story, status: 'done' })
      return
    }

    if (tasks.some((task) => task.status === 'doing' || task.status === 'done')) {
      this.updateStory({ ...story, status: 'doing' })
      return
    }

    this.updateStory({ ...story, status: 'todo' })
  }
}
