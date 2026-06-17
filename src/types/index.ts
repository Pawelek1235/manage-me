export type Priority = 'niski' | 'średni' | 'wysoki'
export type Status = 'todo' | 'doing' | 'done'
export type Role = 'admin' | 'devops' | 'developer'
export type NotificationPriority = 'low' | 'medium' | 'high'
export type AppSection = 'projects' | 'stories' | 'tasks' | 'kanban' | 'notifications'

export interface User {
  id: string
  firstName: string
  lastName: string
  role: Role
}

export interface Project {
  id: string
  name: string
  description: string
}

export interface Story {
  id: string
  name: string
  description: string
  priority: Priority
  projectId: string
  createdAt: string
  status: Status
  ownerId: string
}

export interface Task {
  id: string
  name: string
  description: string
  priority: Priority
  storyId: string
  estimatedHours: number
  actualHours: number
  status: Status
  createdAt: string
  startDate?: string
  endDate?: string
  assignedUserId?: string
}

export interface AppNotification {
  id: string
  title: string
  content: string
  createdAt: string
  priority: NotificationPriority
  isRead: boolean
  recipientUserId: string
}

export interface ProjectForm {
  id: string
  name: string
  description: string
}

export interface StoryForm {
  id: string
  name: string
  description: string
  priority: Priority
  ownerId: string
}

export interface TaskForm {
  id: string
  name: string
  description: string
  priority: Priority
  storyId: string
  estimatedHours: number
  actualHours: number
}
