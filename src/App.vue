<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import ActiveProjectPanel from './components/ActiveProjectPanel.vue'
import AppHeader from './components/AppHeader.vue'
import KanbanBoard from './components/KanbanBoard.vue'
import MainTabs from './components/MainTabs.vue'
import NotificationDialog from './components/NotificationDialog.vue'
import NotificationsView from './components/NotificationsView.vue'
import ProjectsSection from './components/ProjectsSection.vue'
import StoriesSection from './components/StoriesSection.vue'
import TasksSection from './components/TasksSection.vue'
import { priorities, statuses } from './constants/appOptions'
import { ApiService } from './services/ApiService'
import { NotificationService } from './services/NotificationService'
import { UserService } from './services/UserService'
import type {
  AppNotification,
  AppSection,
  NotificationPriority,
  Priority,
  Project,
  ProjectForm,
  Story,
  StoryForm,
  Task,
  TaskForm,
  User,
} from './types'

const projects = ref<Project[]>([])
const stories = ref<Story[]>([])
const tasks = ref<Task[]>([])
const users = ref<User[]>([])
const notifications = ref<AppNotification[]>([])
const loggedUser = ref<User | null>(null)
const activeProjectId = ref('')
const activeSection = ref<AppSection>('projects')
const selectedTaskId = ref('')
const selectedNotificationId = ref('')
const notificationDialog = ref<AppNotification | null>(null)
const theme = ref<'light' | 'dark'>('light')
const completionHours = ref(0)

const emptyProject = (): ProjectForm => ({ id: '', name: '', description: '' })
const emptyStory = (): StoryForm => ({
  id: '',
  name: '',
  description: '',
  priority: 'średni' as Priority,
  ownerId: '',
})
const emptyTask = (): TaskForm => ({
  id: '',
  name: '',
  description: '',
  priority: 'średni' as Priority,
  storyId: '',
  estimatedHours: 1,
  actualHours: 0,
})

const projectForm = reactive<ProjectForm>(emptyProject())
const storyForm = reactive<StoryForm>(emptyStory())
const taskForm = reactive<TaskForm>(emptyTask())

const activeProject = computed(() =>
  projects.value.find((project) => project.id === activeProjectId.value),
)

const projectStories = computed(() =>
  stories.value.filter((story) => story.projectId === activeProjectId.value),
)

const projectStoryIds = computed(() => projectStories.value.map((story) => story.id))

const projectTasks = computed(() =>
  tasks.value.filter((task) => projectStoryIds.value.includes(task.storyId)),
)

const selectedTask = computed(() =>
  projectTasks.value.find((task) => task.id === selectedTaskId.value),
)

const assignableUsers = computed(() => users.value.filter((user) => UserService.canTakeTask(user)))

const unreadNotificationsCount = computed(
  () => notifications.value.filter((notification) => !notification.isRead).length,
)

function refreshNotifications() {
  notifications.value = loggedUser.value ? NotificationService.getForUser(loggedUser.value.id) : []

  const selectedExists = notifications.value.some(
    (notification) => notification.id === selectedNotificationId.value,
  )

  if (!selectedExists) {
    selectedNotificationId.value = notifications.value[0]?.id ?? ''
  }
}

function refresh() {
  projects.value = ApiService.getProjects()
  users.value = UserService.getUsers()
  loggedUser.value = UserService.getLoggedUser()
  activeProjectId.value = ApiService.getActiveProjectId()
  stories.value = ApiService.getStories()
  tasks.value = ApiService.getTasks()

  if (projects.value.length === 0) {
    activeProjectId.value = ''
  }

  if (projects.value.length > 0 && !projects.value.some((project) => project.id === activeProjectId.value)) {
    activeProjectId.value = projects.value[0].id
    ApiService.setActiveProjectId(activeProjectId.value)
  }

  if (!selectedTask.value) {
    selectedTaskId.value = projectTasks.value[0]?.id ?? ''
  }

  if (!storyForm.ownerId && loggedUser.value) {
    storyForm.ownerId = loggedUser.value.id
  }

  if (projectStories.value.length === 0) {
    taskForm.storyId = ''
  } else if (!projectStories.value.some((story) => story.id === taskForm.storyId)) {
    taskForm.storyId = projectStories.value[0].id
  }

  refreshNotifications()
}

function resetForm<T extends object>(target: T, source: T) {
  Object.assign(target, source)
}

function resetProjectForm() {
  resetForm(projectForm, emptyProject())
}

function resetStoryForm() {
  resetForm(storyForm, {
    ...emptyStory(),
    ownerId: loggedUser.value?.id ?? '',
  })
}

function resetTaskForm() {
  resetForm(taskForm, {
    ...emptyTask(),
    storyId: projectStories.value[0]?.id ?? '',
  })
}

function adminIds() {
  return users.value.filter((user) => user.role === 'admin').map((user) => user.id)
}

function notifyUsers(
  userIds: string[],
  title: string,
  content: string,
  priority: NotificationPriority,
) {
  const created = NotificationService.createForUsers(userIds, {
    title,
    content,
    priority,
  })

  refreshNotifications()

  const dialogNotification = created.find(
    (notification) =>
      notification.recipientUserId === loggedUser.value?.id && notification.priority !== 'low',
  )

  if (dialogNotification) {
    notificationDialog.value = dialogNotification
  }
}

function notifyUser(
  userId: string | undefined,
  title: string,
  content: string,
  priority: NotificationPriority,
) {
  if (!userId) return
  notifyUsers([userId], title, content, priority)
}

function notifyStoryOwner(
  storyId: string,
  title: string,
  content: string,
  priority: NotificationPriority,
) {
  const story =
    stories.value.find((item) => item.id === storyId) ??
    ApiService.getStories().find((item) => item.id === storyId)

  notifyUser(story?.ownerId, title, content, priority)
}

function saveProject() {
  if (!projectForm.name.trim()) return

  if (projectForm.id) {
    ApiService.updateProject({
      id: projectForm.id,
      name: projectForm.name,
      description: projectForm.description,
    })
  } else {
    const created = ApiService.createProject({
      name: projectForm.name,
      description: projectForm.description,
    })

    ApiService.setActiveProjectId(created.id)
    activeProjectId.value = created.id

    notifyUsers(
      adminIds(),
      'Utworzono nowy projekt',
      `Projekt "${created.name}" został utworzony.`,
      'high',
    )
  }

  resetProjectForm()
  refresh()
}

function editProject(project: Project) {
  Object.assign(projectForm, project)
}

function deleteProject(projectId: string) {
  if (!confirm('Usunąć projekt razem z jego historyjkami i zadaniami?')) return

  ApiService.deleteProject(projectId)
  refresh()
}

function setActiveProject(projectId: string) {
  ApiService.setActiveProjectId(projectId)
  activeProjectId.value = projectId
  selectedTaskId.value = ''
  resetTaskForm()
  refresh()
}

function saveStory() {
  if (!activeProjectId.value || !storyForm.name.trim() || !loggedUser.value) return

  const ownerId = storyForm.ownerId || loggedUser.value.id

  if (storyForm.id) {
    const existing = stories.value.find((story) => story.id === storyForm.id)
    if (!existing) return

    const updated = ApiService.updateStory({
      ...existing,
      name: storyForm.name,
      description: storyForm.description,
      priority: storyForm.priority,
      ownerId,
    })

    if (existing.ownerId !== updated.ownerId) {
      notifyUser(
        updated.ownerId,
        'Przypisano do historyjki',
        `Historyjka "${updated.name}" została do Ciebie przypisana.`,
        'high',
      )
    }
  } else {
    const created = ApiService.createStory({
      name: storyForm.name,
      description: storyForm.description,
      priority: storyForm.priority,
      projectId: activeProjectId.value,
      ownerId,
    })

    notifyUser(
      created.ownerId,
      'Przypisano do historyjki',
      `Historyjka "${created.name}" została do Ciebie przypisana.`,
      'high',
    )
  }

  resetStoryForm()
  refresh()
}

function editStory(story: Story) {
  Object.assign(storyForm, {
    id: story.id,
    name: story.name,
    description: story.description,
    priority: story.priority,
    ownerId: story.ownerId,
  })
}

function deleteStory(storyId: string) {
  if (!confirm('Usunąć historyjkę razem z zadaniami?')) return

  ApiService.deleteStory(storyId)
  refresh()
}

function saveTask() {
  if (!taskForm.name.trim() || !taskForm.storyId) return

  if (taskForm.id) {
    const existing = tasks.value.find((task) => task.id === taskForm.id)
    if (!existing) return

    ApiService.updateTask({
      ...existing,
      name: taskForm.name,
      description: taskForm.description,
      priority: taskForm.priority,
      storyId: taskForm.storyId,
      estimatedHours: Number(taskForm.estimatedHours),
      actualHours: Number(taskForm.actualHours),
    })
  } else {
    const created = ApiService.createTask({
      name: taskForm.name,
      description: taskForm.description,
      priority: taskForm.priority,
      storyId: taskForm.storyId,
      estimatedHours: Number(taskForm.estimatedHours),
      startDate: undefined,
      endDate: undefined,
      assignedUserId: undefined,
    })

    notifyStoryOwner(
      created.storyId,
      'Nowe zadanie w historyjce',
      `Dodano zadanie "${created.name}" do Twojej historyjki.`,
      'medium',
    )
  }

  resetTaskForm()
  refresh()
}

function editTask(task: Task) {
  Object.assign(taskForm, {
    id: task.id,
    name: task.name,
    description: task.description,
    priority: task.priority,
    storyId: task.storyId,
    estimatedHours: task.estimatedHours,
    actualHours: task.actualHours,
  })

  selectedTaskId.value = task.id
}

function deleteTask(taskId: string) {
  const task = tasks.value.find((item) => item.id === taskId)
  if (!task) return
  if (!confirm('Usunąć zadanie?')) return

  ApiService.deleteTask(taskId)

  notifyStoryOwner(
    task.storyId,
    'Usunięto zadanie z historyjki',
    `Usunięto zadanie "${task.name}" z Twojej historyjki.`,
    'medium',
  )

  refresh()
}

function selectTask(taskId: string) {
  selectedTaskId.value = taskId
}

function openTaskDetails(taskId: string) {
  selectedTaskId.value = taskId
  activeSection.value = 'tasks'
}

function assignUser(taskId: string, userId: string) {
  const updated = ApiService.assignUserToTask(taskId, userId)
  if (!updated) return

  notifyUser(
    updated.assignedUserId,
    'Przypisano zadanie',
    `Zadanie "${updated.name}" zostało do Ciebie przypisane.`,
    'high',
  )

  notifyStoryOwner(
    updated.storyId,
    'Zmieniono status zadania',
    `Zadanie "${updated.name}" ma status doing.`,
    'low',
  )

  refresh()
}

function completeSelectedTask() {
  if (!selectedTask.value) return

  const doneTask = ApiService.completeTask(
    selectedTask.value.id,
    Number(completionHours.value || selectedTask.value.actualHours || 0),
  )

  if (doneTask) {
    notifyStoryOwner(
      doneTask.storyId,
      'Zadanie zakończone',
      `Zadanie "${doneTask.name}" ma status done.`,
      'medium',
    )
  }

  completionHours.value = 0
  refresh()
}

function setTheme(nextTheme: 'light' | 'dark') {
  theme.value = nextTheme
  ApiService.setTheme(nextTheme)
  document.documentElement.dataset.theme = nextTheme
}

function toggleTheme() {
  setTheme(theme.value === 'light' ? 'dark' : 'light')
}

function changeSection(section: AppSection) {
  if (section === 'notifications') {
    openNotifications()
    return
  }

  activeSection.value = section
}

function openNotifications() {
  activeSection.value = 'notifications'
  refreshNotifications()
}

function openNotification(notificationId: string) {
  NotificationService.markAsRead(notificationId)
  selectedNotificationId.value = notificationId
  refreshNotifications()
}

function markNotificationAsRead(notificationId: string) {
  NotificationService.markAsRead(notificationId)
  refreshNotifications()
}

function markAllNotificationsAsRead() {
  if (!loggedUser.value) return

  NotificationService.markAllAsRead(loggedUser.value.id)
  refreshNotifications()
}

function markDialogNotificationAsRead(notificationId: string) {
  NotificationService.markAsRead(notificationId)
  notificationDialog.value = null
  refreshNotifications()
}

function resetData() {
  if (!confirm('Zresetować dane testowe w localStorage?')) return

  ApiService.resetData()
  resetProjectForm()
  resetStoryForm()
  resetTaskForm()
  refresh()
}

onMounted(() => {
  ApiService.seed()
  setTheme(ApiService.getTheme())
  refresh()
})
</script>

<template>
  <main class="app">
    <AppHeader
      :logged-user="loggedUser"
      :unread-notifications-count="unreadNotificationsCount"
      :theme="theme"
      @open-notifications="openNotifications"
      @toggle-theme="toggleTheme"
      @reset-data="resetData"
    />

    <ActiveProjectPanel
      :projects="projects"
      :active-project="activeProject"
      :active-project-id="activeProjectId"
      @set-active-project="setActiveProject"
    />

    <MainTabs :active-section="activeSection" @change-section="changeSection" />

    <ProjectsSection
      v-if="activeSection === 'projects'"
      :projects="projects"
      :active-project-id="activeProjectId"
      :project-form="projectForm"
      @save="saveProject"
      @reset="resetProjectForm"
      @set-active-project="setActiveProject"
      @edit="editProject"
      @delete="deleteProject"
    />

    <StoriesSection
      v-if="activeSection === 'stories'"
      :active-project-id="activeProjectId"
      :priorities="priorities"
      :statuses="statuses"
      :stories="projectStories"
      :story-form="storyForm"
      :users="users"
      @save="saveStory"
      @reset="resetStoryForm"
      @edit="editStory"
      @delete="deleteStory"
    />

    <TasksSection
      v-if="activeSection === 'tasks'"
      :priorities="priorities"
      :project-stories="projectStories"
      :project-tasks="projectTasks"
      :task-form="taskForm"
      :selected-task="selectedTask"
      :assignable-users="assignableUsers"
      :users="users"
      :completion-hours="completionHours"
      @save="saveTask"
      @reset="resetTaskForm"
      @select-task="selectTask"
      @edit="editTask"
      @delete="deleteTask"
      @assign-user="assignUser"
      @complete-task="completeSelectedTask"
      @update-completion-hours="completionHours = $event"
    />

    <KanbanBoard
      v-if="activeSection === 'kanban'"
      :statuses="statuses"
      :tasks="projectTasks"
      :stories="projectStories"
      :users="users"
      @open-task-details="openTaskDetails"
    />

    <NotificationsView
      v-if="activeSection === 'notifications'"
      :notifications="notifications"
      :selected-notification-id="selectedNotificationId"
      @select="openNotification"
      @mark-read="markNotificationAsRead"
      @mark-all="markAllNotificationsAsRead"
    />

    <NotificationDialog
      :notification="notificationDialog"
      @close="notificationDialog = null"
      @mark-read="markDialogNotificationAsRead"
    />
  </main>
</template>
