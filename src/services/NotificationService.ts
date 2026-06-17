import type { AppNotification, NotificationPriority } from '../types'

const NOTIFICATIONS_KEY = 'manageme_notifications'

type NewNotification = {
  title: string
  content: string
  priority: NotificationPriority
  recipientUserId: string
}

type NotificationMessage = Omit<NewNotification, 'recipientUserId'>

const createId = () => crypto.randomUUID()

export class NotificationService {
  private static read(): AppNotification[] {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY)
    if (!raw) return []

    try {
      return JSON.parse(raw) as AppNotification[]
    } catch {
      return []
    }
  }

  private static write(notifications: AppNotification[]): void {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications))
  }

  static getAll(): AppNotification[] {
    return this.read().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  static getForUser(userId: string): AppNotification[] {
    return this.getAll().filter((notification) => notification.recipientUserId === userId)
  }

  static getUnreadCount(userId: string): number {
    return this.getForUser(userId).filter((notification) => !notification.isRead).length
  }

  static create(data: NewNotification): AppNotification {
    const notification: AppNotification = {
      id: createId(),
      createdAt: new Date().toISOString(),
      isRead: false,
      ...data,
    }

    this.write([notification, ...this.read()])
    return notification
  }

  static createForUsers(userIds: string[], message: NotificationMessage): AppNotification[] {
    const uniqueUserIds = [...new Set(userIds)]

    return uniqueUserIds.map((recipientUserId) =>
      this.create({
        ...message,
        recipientUserId,
      }),
    )
  }

  static markAsRead(notificationId: string): AppNotification | null {
    let updatedNotification: AppNotification | null = null

    const notifications = this.read().map((notification) => {
      if (notification.id !== notificationId) return notification

      updatedNotification = {
        ...notification,
        isRead: true,
      }

      return updatedNotification
    })

    this.write(notifications)
    return updatedNotification
  }

  static markAllAsRead(userId: string): void {
    const notifications = this.read().map((notification) =>
      notification.recipientUserId === userId ? { ...notification, isRead: true } : notification,
    )

    this.write(notifications)
  }

  static clear(): void {
    localStorage.removeItem(NOTIFICATIONS_KEY)
  }
}
