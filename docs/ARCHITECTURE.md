# Архитектура Спортивной Платформы «Точка Сбора»

## 1. Общая схема компонентов (Docker Compose)

```mermaid
flowchart LR
    Browser["Браузер пользователя (Desktop / Mobile)"]
    VKServer["Серверы ВКонтакте (api.vk.com)"]

    subgraph Docker_Network ["Docker Network: sportnet"]
        Nginx["Frontend Container (Nginx + React 18 SPA, port 3000:80)"]
        Backend["Backend Container (Java 21 + Spring Boot 3.4, port 8080)"]
        Postgres["Database Container (PostgreSQL 16, port 5432)"]
        UploadsVol[("Docker Volume: uploads_data")]
        PgVol[("Docker Volume: postgres_data")]
    end

    Browser -->|HTTP :3000| Nginx
    Nginx -->|/api/* Reverse Proxy| Backend
    Backend -->|JDBC + Flyway| Postgres
    Postgres --- PgVol
    Backend -->|Stream Read/Write| UploadsVol
    Backend <-->|VK Bots Long Poll API / messages.send| VKServer
```

## 2. Матрица ролей и прав доступа

| Операция | Гость | Обычный пользователь (`ROLE_USER`) | Личный организатор (`ROLE_USER` + автор события) | Представитель организации (`ROLE_USER` + владелец клуба) | Администратор (`ROLE_ADMIN`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Просмотр каталога, публичных профилей и обсуждений | ✅ | ✅ | ✅ | ✅ | ✅ |
| Регистрация физлица или организации | ✅ | — | — | — | — |
| Создание личного мероприятия и добавление нового вида спорта | ❌ | ✅ | ✅ | ✅ | ✅ |
| Публикация мероприятия от имени организации | ❌ | ❌ | ❌ | ✅ *(только при `APPROVED`)* | ✅ |
| Свободная запись (`OPEN`) и подача заявки (`APPROVAL_REQUIRED`) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Принятие / отклонение заявок участников на мероприятие | ❌ | ❌ | ✅ *(только своё событие)* | ✅ *(только событие клуба)* | ❌ *(не подменяет организатора)* |
| Поиск спортивных партнёров и управление знакомыми | ❌ | ✅ | ✅ | ✅ | ✅ |
| Отправка фото, видео, документов и ссылок в обсуждение | ❌ | ✅ | ✅ | ✅ | ✅ |
| Одобрение / отклонение организации с указанием причины | ❌ | ❌ | ❌ | ❌ | ✅ |
| Повторная отправка заявки организации после исправления | ❌ | ❌ | ❌ | ✅ *(владелец организации)* | — |
| Скрытие сообщения в обсуждении / снятие события с публикации | ❌ | ❌ | ❌ | ❌ | ✅ |
| Создание тикета / сообщения в чат техподдержки (свои) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Ответы на все тикеты и диалоги чата техподдержки | ❌ | ❌ | ❌ | ❌ | ✅ |

## 3. Жизненные циклы ключевых сущностей

### 3.1. Жизненный цикл заявки организации (`OrganizationStatus`)
```mermaid
stateDiagram-v2
    [*] --> PENDING_REVIEW : Регистрация организации (версия #1)
    PENDING_REVIEW --> APPROVED : Одобрено администратором
    PENDING_REVIEW --> REJECTED : Отклонено администратором (с причиной)
    PENDING_REVIEW --> NEEDS_REVISION : Запрошено уточнение
    REJECTED --> PENDING_REVIEW : Исправление сведений и повторная подача (версия #N+1)
    NEEDS_REVISION --> PENDING_REVIEW : Исправление сведений и повторная подача (версия #N+1)
```

### 3.2. Жизненный цикл мероприятия (`EventStatus`) и регулярных серий
```mermaid
stateDiagram-v2
    [*] --> PUBLISHED : Создание разовой встречи или генерация встречи серии
    PUBLISHED --> CANCELLED_BY_ORGANIZER : Отмена конкретной встречи (или всей серии) организатором
    PUBLISHED --> UNPUBLISHED_BY_ADMIN : Снятие с публикации администратором (с причиной)
    PUBLISHED --> COMPLETED : Завершение по времени
```

### 3.3. Жизненный цикл записи / заявки участника (`ParticipationStatus`)
```mermaid
stateDiagram-v2
    [*] --> CONFIRMED : Свободный вход (есть места)
    [*] --> WAITLISTED : Свободный вход (достигнут лимит мест)
    [*] --> PENDING : Запись по заявке (APPROVAL_REQUIRED)
    WAITLISTED --> CONFIRMED : Авто-продвижение при отмене записи другим участником
    PENDING --> CONFIRMED : Принято организатором
    PENDING --> REJECTED : Отклонено организатором
    CONFIRMED --> CANCELLED_BY_USER : Отмена участия пользователем
    PENDING --> CANCELLED_BY_USER : Отзыв заявки пользователем
```
