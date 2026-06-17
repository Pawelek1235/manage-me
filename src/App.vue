<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import NotificationDialog from './components/NotificationDialog.vue'
import NotificationsView from './components/NotificationsView.vue'
import { priorities, statuses } from './constants/appOptions'
import { ApiService } from './services/ApiService'
import { NotificationService } from './services/NotificationService'
import { UserService } from './services/UserService'
import type {
  AppNotification,
  NotificationPriority,
  Priority,
  Project,
  Status,
  Story,
  Task,
  User,
} from './types'
import { formatDate } from './utils/formatters'

type Section = 'projects' | 'stories' | 'tasks' | 'kanban' | 'notifications'

const projects = ref<Project[]>([])
const stories = ref<Story[]>([])
const tasks = ref<Task[]>([])
const users = ref<User[]>([])
const notifications = ref<AppNotification[]>([])
const loggedUser = ref<User | null>(null)
const activeProjectId = ref('')
const activeSection = ref<Section>('projects')
const selectedTaskId = ref('')
const selectedNotificationId = ref('')
const notificationDialog = ref<AppNotification | null>(null)
const theme = ref<'light' | 'dark'>('light')

const emptyProject = () => ({ id: '', name: '', description: '' })
const emptyStory = () => ({
  id: '',
  name: '',
  description: '',
  priority: 'średni' as Priority,
  ownerId: '',
})
const emptyTask = () => ({
  id: '',
  name: '',
  description: '',
  priority: 'średni' as Priority,
  storyId: '',
  estimatedHours: 1,
  actualHours: 0,
})

const projectForm = reactive(emptyProject())
const storyForm = reactive(emptyStory())
const taskForm = reactive(emptyTask())
const completionHours = ref(0)

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

const assignableUsers = computed(() =>
  UserService.getAssignableUsers(),
)

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
  return UserService.getAdmins().map((user) => user.id)
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
  const story = stories.value.find((item) => item.id === storyId) ?? ApiService.getStories().find((item) => item.id === storyId)
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

  resetForm(projectForm, emptyProject())
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

function assignSelectedUser(event: Event, taskId: string) {
  const userId = (event.target as HTMLSelectElement).value
  assignUser(taskId, userId)
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

function storyName(storyId: string) {
  return stories.value.find((story) => story.id === storyId)?.name ?? 'Brak historyjki'
}

function userName(userId?: string) {
  const user = users.value.find((item) => item.id === userId)
  return user ? `${user.firstName} ${user.lastName} (${user.role})` : 'Nieprzypisany'
}

function tasksByStatus(status: Status) {
  return projectTasks.value.filter((task) => task.status === status)
}

function storiesByStatus(status: Status) {
  return projectStories.value.filter((story) => story.status === status)
}

function setTheme(nextTheme: 'light' | 'dark') {
  theme.value = nextTheme
  ApiService.setTheme(nextTheme)
  document.documentElement.dataset.theme = nextTheme
}

function toggleTheme() {
  setTheme(theme.value === 'light' ? 'dark' : 'light')
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
  resetForm(projectForm, emptyProject())
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
    <header class="topbar">
      <div>
        <p class="eyebrow">ManageMe</p>
        <h1>Zarządzanie projektami</h1>
        <p v-if="loggedUser" class="muted">
          Zalogowany:
          <strong>{{ loggedUser.firstName }} {{ loggedUser.lastName }}</strong>
          - {{ loggedUser.role }}
        </p>
      </div>

      <div class="topbar-actions">
        <button class="notification-counter" type="button" @click="openNotifications">
          Powiadomienia
          <span>{{ unreadNotificationsCount }}</span>
        </button>
        <button class="secondary" type="button" @click="toggleTheme">
          {{ theme === 'light' ? 'Tryb ciemny' : 'Tryb jasny' }}
        </button>
        <button class="danger ghost" type="button" @click="resetData">Reset danych</button>
      </div>
    </header>

    <section class="panel active-project">
      <div>
        <label for="active-project">Aktywny projekt</label>
        <select id="active-project" v-model="activeProjectId" @change="setActiveProject(activeProjectId)">
          <option disabled value="">Wybierz projekt</option>
          <option v-for="project in projects" :key="project.id" :value="project.id">
            {{ project.name }}
          </option>
        </select>
      </div>
      <p v-if="activeProject" class="muted">{{ activeProject.description }}</p>
      <p v-else class="muted">Dodaj projekt, aby rozpocząć pracę.</p>
    </section>

    <nav class="tabs" aria-label="Główna nawigacja">
      <button :class="{ active: activeSection === 'projects' }" type="button" @click="activeSection = 'projects'">
        Projekty
      </button>
      <button :class="{ active: activeSection === 'stories' }" type="button" @click="activeSection = 'stories'">
        Historyjki
      </button>
      <button :class="{ active: activeSection === 'tasks' }" type="button" @click="activeSection = 'tasks'">
        Zadania
      </button>
      <button :class="{ active: activeSection === 'kanban' }" type="button" @click="activeSection = 'kanban'">
        Kanban
      </button>
      <button
        :class="{ active: activeSection === 'notifications' }"
        type="button"
        @click="openNotifications"
      >
        Powiadomienia
      </button>
    </nav>

    <section v-if="activeSection === 'projects'" class="grid two">
      <form class="panel" @submit.prevent="saveProject">
        <h2>{{ projectForm.id ? 'Edytuj projekt' : 'Nowy projekt' }}</h2>

        <label for="project-name">Nazwa</label>
        <input id="project-name" v-model="projectForm.name" required placeholder="np. ManageMe" />

        <label for="project-description">Opis</label>
        <textarea id="project-description" v-model="projectForm.description" placeholder="Krótki opis projektu" />

        <div class="row">
          <button type="submit">{{ projectForm.id ? 'Zapisz zmiany' : 'Dodaj projekt' }}</button>
          <button type="button" class="secondary" @click="resetForm(projectForm, emptyProject())">
            Wyczyść
          </button>
        </div>
      </form>

      <section class="panel">
        <h2>Lista projektów</h2>

        <article v-for="project in projects" :key="project.id" class="card">
          <div>
            <h3>{{ project.name }}</h3>
            <p>{{ project.description }}</p>
            <span v-if="project.id === activeProjectId" class="badge">aktywny</span>
          </div>
          <div class="row">
            <button class="secondary" type="button" @click="setActiveProject(project.id)">Wybierz</button>
            <button class="secondary" type="button" @click="editProject(project)">Edytuj</button>
            <button class="danger" type="button" @click="deleteProject(project.id)">Usuń</button>
          </div>
        </article>
      </section>
    </section>

    <section v-if="activeSection === 'stories'" class="grid two">
      <form class="panel" @submit.prevent="saveStory">
        <h2>{{ storyForm.id ? 'Edytuj historyjkę' : 'Nowa historyjka' }}</h2>

        <label for="story-name">Nazwa</label>
        <input id="story-name" v-model="storyForm.name" required :disabled="!activeProjectId" />

        <label for="story-description">Opis</label>
        <textarea id="story-description" v-model="storyForm.description" :disabled="!activeProjectId" />

        <label for="story-priority">Priorytet</label>
        <select id="story-priority" v-model="storyForm.priority" :disabled="!activeProjectId">
          <option v-for="priority in priorities" :key="priority" :value="priority">
            {{ priority }}
          </option>
        </select>

        <label for="story-owner">Właściciel</label>
        <select id="story-owner" v-model="storyForm.ownerId" :disabled="!activeProjectId">
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.firstName }} {{ user.lastName }} - {{ user.role }}
          </option>
        </select>

        <div class="row">
          <button type="submit" :disabled="!activeProjectId">
            {{ storyForm.id ? 'Zapisz zmiany' : 'Dodaj historyjkę' }}
          </button>
          <button type="button" class="secondary" @click="resetStoryForm">Wyczyść</button>
        </div>
      </form>

      <section class="panel">
        <h2>Historyjki projektu</h2>

        <div class="status-grid">
          <div v-for="status in statuses" :key="status" class="status-column">
            <h3>{{ status }}</h3>

            <article v-for="story in storiesByStatus(status)" :key="story.id" class="card compact">
              <h4>{{ story.name }}</h4>
              <p>{{ story.description }}</p>
              <div class="meta">
                <span class="badge">{{ story.priority }}</span>
                <span>{{ formatDate(story.createdAt) }}</span>
                <span>{{ userName(story.ownerId) }}</span>
              </div>
              <div class="row">
                <button class="secondary" type="button" @click="editStory(story)">Edytuj</button>
                <button class="danger" type="button" @click="deleteStory(story.id)">Usuń</button>
              </div>
            </article>
          </div>
        </div>
      </section>
    </section>

    <section v-if="activeSection === 'tasks'" class="grid two">
      <form class="panel" @submit.prevent="saveTask">
        <h2>{{ taskForm.id ? 'Edytuj zadanie' : 'Nowe zadanie' }}</h2>

        <label for="task-name">Nazwa</label>
        <input id="task-name" v-model="taskForm.name" required :disabled="projectStories.length === 0" />

        <label for="task-description">Opis</label>
        <textarea id="task-description" v-model="taskForm.description" :disabled="projectStories.length === 0" />

        <label for="task-story">Historyjka</label>
        <select id="task-story" v-model="taskForm.storyId" required :disabled="projectStories.length === 0">
          <option disabled value="">Wybierz historyjkę</option>
          <option v-for="story in projectStories" :key="story.id" :value="story.id">
            {{ story.name }}
          </option>
        </select>

        <label for="task-priority">Priorytet</label>
        <select id="task-priority" v-model="taskForm.priority" :disabled="projectStories.length === 0">
          <option v-for="priority in priorities" :key="priority" :value="priority">
            {{ priority }}
          </option>
        </select>

        <label for="task-hours">Przewidywany czas wykonania / h</label>
        <input
          id="task-hours"
          v-model.number="taskForm.estimatedHours"
          type="number"
          min="1"
          :disabled="projectStories.length === 0"
        />

        <div class="row">
          <button type="submit" :disabled="projectStories.length === 0">
            {{ taskForm.id ? 'Zapisz zmiany' : 'Dodaj zadanie' }}
          </button>
          <button type="button" class="secondary" @click="resetTaskForm">Wyczyść</button>
        </div>
      </form>

      <section class="panel">
        <h2>Lista zadań</h2>

        <article v-for="task in projectTasks" :key="task.id" class="card">
          <div>
            <h3>{{ task.name }}</h3>
            <p>{{ task.description }}</p>
            <div class="meta">
              <span class="badge">{{ task.status }}</span>
              <span class="badge">{{ task.priority }}</span>
              <span>{{ storyName(task.storyId) }}</span>
              <span>{{ userName(task.assignedUserId) }}</span>
            </div>
          </div>

          <div class="row">
            <button class="secondary" type="button" @click="selectedTaskId = task.id">Szczegóły</button>
            <button class="secondary" type="button" @click="editTask(task)">Edytuj</button>
            <button class="danger" type="button" @click="deleteTask(task.id)">Usuń</button>
          </div>
        </article>
      </section>

      <section class="panel details">
        <h2>Szczegóły zadania</h2>

        <div v-if="selectedTask" class="details-grid">
          <p><strong>Nazwa:</strong> {{ selectedTask.name }}</p>
          <p><strong>Opis:</strong> {{ selectedTask.description }}</p>
          <p><strong>Historyjka:</strong> {{ storyName(selectedTask.storyId) }}</p>
          <p><strong>Priorytet:</strong> {{ selectedTask.priority }}</p>
          <p><strong>Stan:</strong> {{ selectedTask.status }}</p>
          <p><strong>Dodano:</strong> {{ formatDate(selectedTask.createdAt) }}</p>
          <p><strong>Start:</strong> {{ formatDate(selectedTask.startDate) }}</p>
          <p><strong>Koniec:</strong> {{ formatDate(selectedTask.endDate) }}</p>
          <p><strong>Szacowany czas:</strong> {{ selectedTask.estimatedHours }} h</p>
          <p><strong>Zrealizowane roboczogodziny:</strong> {{ selectedTask.actualHours }} h</p>
          <p><strong>Przypisana osoba:</strong> {{ userName(selectedTask.assignedUserId) }}</p>

          <div>
            <label for="task-assignee">Przypisz osobę</label>
            <select
              id="task-assignee"
              :value="selectedTask.assignedUserId || ''"
              :disabled="selectedTask.status === 'done'"
              @change="assignSelectedUser($event, selectedTask.id)"
            >
              <option disabled value="">Wybierz osobę</option>
              <option v-for="user in assignableUsers" :key="user.id" :value="user.id">
                {{ user.firstName }} {{ user.lastName }} - {{ user.role }}
              </option>
            </select>
          </div>

          <div>
            <label for="completion-hours">Roboczogodziny przy zamknięciu</label>
            <input id="completion-hours" v-model.number="completionHours" type="number" min="0" />
          </div>

          <button
            class="success"
            type="button"
            :disabled="selectedTask.status === 'done' || !selectedTask.assignedUserId"
            @click="completeSelectedTask"
          >
            Oznacz jako done
          </button>
        </div>

        <p v-else class="muted">Wybierz zadanie z listy.</p>
      </section>
    </section>

    <section v-if="activeSection === 'kanban'" class="panel">
      <h2>Tablica Kanban</h2>

      <div class="kanban">
        <div v-for="status in statuses" :key="status" class="kanban-column">
          <h3>{{ status }}</h3>

          <article v-for="task in tasksByStatus(status)" :key="task.id" class="card compact">
            <h4>{{ task.name }}</h4>
            <p>{{ task.description }}</p>
            <div class="meta">
              <span class="badge">{{ task.priority }}</span>
              <span>{{ storyName(task.storyId) }}</span>
              <span>{{ userName(task.assignedUserId) }}</span>
            </div>
            <button class="secondary full" type="button" @click="activeSection = 'tasks'; selectedTaskId = task.id">
              Szczegóły
            </button>
          </article>
        </div>
      </div>
    </section>

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
