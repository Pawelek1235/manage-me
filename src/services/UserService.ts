import type { User } from '../types'

const USERS_KEY = 'manageme_users'

const mockUsers: User[] = [
  { id: 'u-admin', firstName: 'Paweł', lastName: 'Admin', role: 'admin' },
  { id: 'u-dev', firstName: 'Anna', lastName: 'Developer', role: 'developer' },
  { id: 'u-devops', firstName: 'Jan', lastName: 'DevOps', role: 'devops' },
]

export class UserService {
  private static read(): User[] {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []

    try {
      return JSON.parse(raw) as User[]
    } catch {
      return []
    }
  }

  private static write(users: User[]): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }

  static seed(): void {
    this.write(mockUsers)
  }

  static clear(): void {
    localStorage.removeItem(USERS_KEY)
  }

  static getUsers(): User[] {
    const users = this.read()

    if (users.length === 0) {
      this.seed()
      return mockUsers
    }

    return users
  }

  static getLoggedUser(): User {
    return this.getUsers().find((user) => user.role === 'admin') ?? mockUsers[0]
  }

  static getById(userId: string): User | undefined {
    return this.getUsers().find((user) => user.id === userId)
  }

  static getAdmins(): User[] {
    return this.getUsers().filter((user) => user.role === 'admin')
  }

  static getAssignableUsers(): User[] {
    return this.getUsers().filter((user) => this.canTakeTask(user))
  }

  static canTakeTask(user: User): boolean {
    return user.role === 'developer' || user.role === 'devops'
  }
}
