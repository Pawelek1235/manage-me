# ManageMe - mapa plikow

Ten plik pomaga szybko odpowiedziec, gdzie jest przycisk i jaka funkcja go obsluguje.

## Glowne miejsce logiki

- `src/App.vue` - trzyma stan aplikacji i funkcje akcji, np. `saveProject`, `deleteTask`, `openNotifications`.
- `src/services/ApiService.ts` - zapis projektow, historyjek i zadan w `localStorage`.
- `src/services/UserService.ts` - mock uzytkownikow i zalogowany admin.
- `src/services/NotificationService.ts` - zapis i odczyt powiadomien.

## Przyciski i widoki

- `src/components/AppHeader.vue`
  - `Powiadomienia` -> `openNotifications` w `App.vue`
  - `Tryb ciemny/jasny` -> `toggleTheme` w `App.vue`
  - `Reset danych` -> `resetData` w `App.vue`

- `src/components/ActiveProjectPanel.vue`
  - lista wyboru aktywnego projektu -> `setActiveProject` w `App.vue`

- `src/components/MainTabs.vue`
  - zakladki `Projekty`, `Historyjki`, `Zadania`, `Kanban`, `Powiadomienia` -> `changeSection` w `App.vue`

- `src/components/ProjectsSection.vue`
  - `Dodaj projekt` / `Zapisz zmiany` -> `saveProject` w `App.vue`
  - `Wyczyść` -> `resetProjectForm` w `App.vue`
  - `Wybierz` -> `setActiveProject` w `App.vue`
  - `Edytuj` -> `editProject` w `App.vue`
  - `Usuń` -> `deleteProject` w `App.vue`

- `src/components/StoriesSection.vue`
  - `Dodaj historyjkę` / `Zapisz zmiany` -> `saveStory` w `App.vue`
  - `Wyczyść` -> `resetStoryForm` w `App.vue`
  - `Edytuj` -> `editStory` w `App.vue`
  - `Usuń` -> `deleteStory` w `App.vue`

- `src/components/TasksSection.vue`
  - `Dodaj zadanie` / `Zapisz zmiany` -> `saveTask` w `App.vue`
  - `Wyczyść` -> `resetTaskForm` w `App.vue`
  - `Szczegóły` -> `selectTask` w `App.vue`
  - `Edytuj` -> `editTask` w `App.vue`
  - `Usuń` -> `deleteTask` w `App.vue`
  - pole `Przypisz osobę` -> `assignUser` w `App.vue`
  - `Oznacz jako done` -> `completeSelectedTask` w `App.vue`

- `src/components/KanbanBoard.vue`
  - `Szczegóły` na karcie zadania -> `openTaskDetails` w `App.vue`

- `src/components/NotificationsView.vue`
  - klik w powiadomienie -> `openNotification` w `App.vue`
  - `Oznacz jako przeczytane` -> `markNotificationAsRead` w `App.vue`
  - `Oznacz wszystkie jako przeczytane` -> `markAllNotificationsAsRead` w `App.vue`

- `src/components/NotificationDialog.vue`
  - `Oznacz jako przeczytane` -> `markDialogNotificationAsRead` w `App.vue`
  - `Zamknij` -> zamyka modal w `App.vue`
