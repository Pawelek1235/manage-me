<script setup lang="ts">
import { computed } from 'vue'
import type { AppNotification } from '../types'
import { formatDate } from '../utils/formatters'

const props = defineProps<{
  notifications: AppNotification[]
  selectedNotificationId: string
}>()

const emit = defineEmits<{
  select: [id: string]
  markRead: [id: string]
  markAll: []
}>()

const selectedNotification = computed(() =>
  props.notifications.find((notification) => notification.id === props.selectedNotificationId),
)
</script>

<template>
  <section class="panel notifications-view">
    <div class="section-header">
      <div>
        <h2>Powiadomienia</h2>
        <p class="muted">Wiadomości przypisane do zalogowanego użytkownika.</p>
      </div>
      <button class="secondary" type="button" @click="emit('markAll')">
        Oznacz wszystkie jako przeczytane
      </button>
    </div>

    <div v-if="notifications.length" class="notifications-layout">
      <div class="notification-list">
        <article
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{
            active: notification.id === selectedNotificationId,
            unread: !notification.isRead,
          }"
          @click="emit('select', notification.id)"
        >
          <div class="notification-item-top">
            <h3>{{ notification.title }}</h3>
            <span class="badge" :class="`priority-${notification.priority}`">
              {{ notification.priority }}
            </span>
          </div>
          <p>{{ notification.content }}</p>
          <div class="meta">
            <span>{{ formatDate(notification.createdAt) }}</span>
            <span>{{ notification.isRead ? 'przeczytane' : 'nieprzeczytane' }}</span>
          </div>
          <button
            v-if="!notification.isRead"
            class="secondary small"
            type="button"
            @click.stop="emit('markRead', notification.id)"
          >
            Oznacz jako przeczytane
          </button>
        </article>
      </div>

      <article class="notification-details">
        <template v-if="selectedNotification">
          <div class="notification-item-top">
            <h2>{{ selectedNotification.title }}</h2>
            <span class="badge" :class="`priority-${selectedNotification.priority}`">
              {{ selectedNotification.priority }}
            </span>
          </div>
          <p>{{ selectedNotification.content }}</p>
          <p class="muted">{{ formatDate(selectedNotification.createdAt) }}</p>
        </template>

        <p v-else class="muted">Wybierz powiadomienie z listy.</p>
      </article>
    </div>

    <p v-else class="muted">Brak powiadomień.</p>
  </section>
</template>
