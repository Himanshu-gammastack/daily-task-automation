# Daily Task Automation

A web-based daily task management application built with **Next.js, TypeScript, MongoDB, and Zoho APIs**.

The application helps users organize their daily work, track working hours, maintain a history of completed tasks, and automate daily work reports through Zoho Mail and Zoho Sheet.

## Features

### Task Management
- Create daily tasks.
- Edit existing tasks.
- Delete pending tasks.
- Mark tasks as completed.
- View pending and completed tasks separately.

### Daily Work Tracking
- Record daily check-in time.
- Track task completion times.
- Calculate time spent on tasks.
- Record daily checkout time.

### Report Automation
- Generate a daily work summary.
- Calculate total working hours.
- Generate a task-wise time breakdown.
- Send daily reports through Zoho Mail.
- Update daily work records in Zoho Sheet.

### Additional Features
- User authentication.
- Persistent MongoDB storage.
- Dark and light themes.
- Indian Standard Time (IST) support.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js | Full-stack application framework |
| React | User interface |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| MongoDB | Database |
| Mongoose | Database modeling |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Zoho Mail API | Automated email reports |
| Zoho Sheet API | Spreadsheet updates |
| Jest | Testing |
| React Testing Library | Component testing |

## Project Structure

```text
daily-task-automation/
│
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── endDay/
│   │   │   ├── controller/
│   │   │   │   ├── getAuthToken.ts
│   │   │   │   ├── sendMail.ts
│   │   │   │   └── updateSheet.ts
│   │   │   └── route.ts
│   │   ├── startDay/
│   │   └── tasks/
│   │       ├── [id]/
│   │       └── route.ts
│   ├── login/
│   ├── page.tsx
│   └── layout.tsx
│
├── components/
│   └── tasks/
│       ├── AddTaskForm.tsx
│       ├── CompletedTasks.tsx
│       ├── PendingTasks.tsx
│       └── TaskHeader.tsx
│
├── model/
│   ├── Tasks.ts
│   └── User.ts
│
├── types/
│   └── task.ts
│
├── utils/
│   ├── auth.ts
│   ├── db.ts
│   └── me.ts
│
├── tests/
│
├── public/
├── README.md
└── package.json
```

## Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- MongoDB (local instance or MongoDB Atlas)
- A Zoho account with API access

### 1. Clone the repository

```bash
git clone <repository-url>
cd daily-task-automation
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

To run this project, you will need to add the environment variables to your `.env` file.

1. Copy the example file to create your local configuration:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your values:

Add the required configuration

Use the exact environment variable names referenced in your source code. Never commit `.env` or expose credentials through client-side environment variables.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the production application |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests |

## Application Workflow

1. **Authentication:** The user logs into the application.
2. **Start Day:** The user records their daily check-in time.
3. **Create Tasks:** Tasks are added to the pending task list.
4. **Complete Tasks:** Completed tasks are moved into the daily history with their completion times.
5. **End Day:** The user checks out and generates a daily work summary.
6. **Email Report:** The application sends the summary through Zoho Mail.
7. **Sheet Update:** The application updates the corresponding record in Zoho Sheet.

## Time Tracking

The application uses the `Asia/Kolkata` timezone for daily date and time calculations.

- Check-in time is stored in `HH:mm` format.
- Task completion time is stored in `HH:mm` format.
- Checkout time is stored in `HH:mm` format.
- Working durations are calculated in hours.
- Daily history is maintained using MongoDB Date values.

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/tasks` | Retrieve task information |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/[id]` | Update a task |
| DELETE | `/api/tasks/[id]` | Delete a task |
| POST | `/api/tasks/[id]` | Complete a task |
| POST | `/api/startDay` | Start the working day |
| POST | `/api/endDay` | End the day and generate the report |

## Testing

The project uses Jest and React Testing Library.

Run the test suite:

```bash
npm test
```

Detailed test cases, test execution instructions, and verification results will be documented in `docs/TESTING.md`.

## Security Considerations

- Passwords should be stored as hashes.
- Protected API routes should validate user authentication.
- OAuth credentials must remain server-side.
- User input should be validated before database operations.
- Email content should be escaped before being inserted into HTML.
- Sensitive environment variables must not be committed to version control.
