# API Documentation

This document describes the REST API endpoints available in the Daily Task Automation application.

## Base URL

```text
http://localhost:3000/api
```

For production, replace the base URL with your deployed application URL.

## Authentication

The application uses JWT-based authentication.

After successful login, the server sets a cookie named `token`.

### Authentication Details

| Property | Value |
|---|---|
| Authentication Type | JWT |
| Cookie Name | `token` |
| HTTP Only | Yes |
| SameSite | Lax |
| Cookie Path | `/` |
| Expiration | 7 days |

Protected endpoints require a valid authentication cookie.

If authentication fails, the API returns:

**Status:** `401 Unauthorized`

```json
{
  "message": "Unauthorized"
}
```

---

# 1. Authentication APIs

## Register User

Creates a new user account.

**Endpoint:** `/api/auth/register`

**Method:** `POST`

**Authentication:** Not required.

### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Validation

- Name, email, and password are required.
- Password must contain at least 8 characters.
- Email is normalized to lowercase.
- Duplicate email addresses are not allowed.

### Success Response

**Status:** `201 Created`

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Error Responses

| Status | Description |
|---|---|
| 400 | Missing required fields or invalid password |
| 409 | User already exists |
| 500 | Registration failed |

---

## Login User

Authenticates an existing user.

**Endpoint:** `/api/auth/login`

**Method:** `POST`

**Authentication:** Not required.

### Request Body

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Success Response

**Status:** `200 OK`

```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

The response also sets an HTTP-only JWT cookie.

### Error Responses

| Status | Description |
|---|---|
| 400 | Missing email or password |
| 401 | Invalid email or password |
| 500 | Login failed |

---

# 2. Task Management APIs

All task management endpoints require authentication.

## Get Tasks

Retrieves the user's active tasks and today's task history.

**Endpoint:** `/api/tasks`

**Method:** `GET`

**Authentication:** Required.

### Success Response

**Status:** `200 OK`

```json
{
  "activeTasks": [
    {
      "_id": "task_id",
      "taskTitle": "Learn TypeScript"
    }
  ],
  "today": {
    "date": "2026-11-19",
    "inTime": "09:00",
    "outTime": null,
    "taskList": []
  }
}
```

If no task document exists, the API returns empty active tasks and an empty daily history.

### Error Responses

| Status | Description |
|---|---|
| 401 | Unauthorized |
| 500 | Failed to fetch tasks |

---

## Add Task

Creates a new task in the user's active task list.

**Endpoint:** `/api/tasks`

**Method:** `POST`

**Authentication:** Required.

### Request Body

```json
{
  "taskTitle": "Build Todo API"
}
```

### Validation

- Task title is required.
- Empty or whitespace-only titles are not allowed.
- Leading and trailing whitespace is removed.

### Success Response

**Status:** `201 Created`

```json
{
  "message": "Task added successfully",
  "task": {}
}
```

The `task` property contains the updated task document.

### Error Responses

| Status | Description |
|---|---|
| 400 | Invalid or missing task title |
| 401 | Unauthorized |
| 500 | Failed to add task |

---

## Update Task

Updates the title of an existing active task.

**Endpoint:** `/api/tasks/:id`

**Method:** `PATCH`

**Authentication:** Required.

### URL Parameters

| Parameter | Description |
|---|---|
| `id` | ID of the task to update |

### Request Body

```json
{
  "taskTitle": "Complete TypeScript project"
}
```

### Success Response

**Status:** `200 OK`

```json
{
  "message": "Task updated successfully"
}
```

### Error Responses

| Status | Description |
|---|---|
| 400 | Missing or invalid task title |
| 401 | Unauthorized |
| 404 | Task not found |
| 500 | Failed to update task |

---

## Delete Task

Removes a task from the active task list.

**Endpoint:** `/api/tasks/:id`

**Method:** `DELETE`

**Authentication:** Required.

### URL Parameters

| Parameter | Description |
|---|---|
| `id` | ID of the task to delete |

### Success Response

**Status:** `200 OK`

```json
{
  "message": "Task deleted successfully"
}
```

### Error Responses

| Status | Description |
|---|---|
| 401 | Unauthorized |
| 404 | Task not found |
| 500 | Failed to delete task |

---

## Complete Task

Marks an active task as completed.

The task is removed from the active task list and added to today's completed task history.

**Endpoint:** `/api/tasks/:id`

**Method:** `POST`

**Authentication:** Required.

### URL Parameters

| Parameter | Description |
|---|---|
| `id` | ID of the task to complete |

### Request Body

No request body is required.

### Success Response

**Status:** `200 OK`

```json
{
  "message": "Task completed successfully"
}
```

The completed task records its title, completion time, and time taken in minutes.

### Error Responses

| Status | Description |
|---|---|
| 400 | Invalid task ID or today's check-in is missing |
| 401 | Unauthorized |
| 404 | Task or task document not found |
| 500 | Failed to complete task |

---

# 3. Daily Workflow APIs

## Start Day

Records the user's daily check-in time.

**Endpoint:** `/api/startDay`

**Method:** `POST`

**Authentication:** Required.

### Request Body

```json
{
  "inTime": "09:00"
}
```

### Validation

- Time must use the 24-hour `HH:mm` format.
- The current date is determined using the Asia/Kolkata timezone.
- If today's history already exists, its check-in time is updated.
- Otherwise, a new daily history entry is created.

### Success Response

**Status:** `200 OK`

```json
{
  "message": "In-time saved successfully",
  "inTime": "09:00"
}
```

### Error Responses

| Status | Description |
|---|---|
| 400 | Invalid or missing time |
| 401 | Unauthorized |
| 500 | Failed to save in-time |

---

## End Day

Ends the user's working day and generates a daily report.

**Endpoint:** `/api/endDay`

**Method:** `POST`

**Authentication:** Required.

### Request Body

```json
{
  "date": "2026-11-19"
}
```

### Validation

- Date must follow the `YYYY-MM-DD` format.
- A task document must exist.
- Today's daily history must exist.
- At least one completed task is required.
- Completed task times must be in valid chronological order.
- Checkout time must be later than check-in time.

### Processing

1. Retrieves the user's daily task history.
2. Calculates the checkout time.
3. Validates completed task timings.
4. Calculates total working hours and task time breakdown.
5. Saves the checkout time.
6. Sends the daily report through Zoho Mail.
7. Updates the Zoho Sheet with daily information.

### Success Response

**Status:** `200 OK`

Returns the generated daily report, including working-time and task summary information.

The exact response fields depend on the report object returned by the implementation.

### Error Responses

| Status | Description |
|---|---|
| 400 | Invalid date, no completed tasks, or invalid task timings |
| 401 | Unauthorized |
| 404 | Task document or today's history not found |
| 500 | Failed to generate or process the daily report |

---

# 4. External Integrations

## Zoho Mail API

Used to send automated daily task reports.

The report contains daily task information and working-time details.

Authentication is performed using Zoho OAuth access tokens.

## Zoho Sheet API

Used to update the spreadsheet with daily task information.

The integration uses OAuth authentication to authorize spreadsheet operations.

### Integration Flow

1. Obtain an access token using the Zoho OAuth refresh token.
2. Send the daily report through Zoho Mail.
3. Update the corresponding Zoho Sheet.
4. Handle API failures and return an appropriate response.

---

# 5. HTTP Status Code Reference

| Status Code | Meaning |
|---|---|
| 200 | Request successful |
| 201 | Resource created successfully |
| 400 | Bad request or validation error |
| 401 | Unauthorized |
| 404 | Resource not found |
| 409 | Resource conflict |
| 500 | Internal server error |

---

# 6. Important Notes

- Protected endpoints require the JWT authentication cookie.
- Dates and daily history calculations use the Asia/Kolkata timezone.
- Task completion time is recorded when the completion endpoint is called.
- Tasks are associated with individual users.
- Zoho integrations are performed as part of the end-of-day workflow.
- Keep OAuth credentials and database connection strings in environment variables.
