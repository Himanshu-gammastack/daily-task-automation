
export interface Task {
  _id: string;
  taskTitle: string;
}

export interface CompletedTask {
  _id: string;
  taskTitle: string;
  endTime: string;
  timeTaken: number;
}

export interface TaskHistory {
  _id: string;
  date: string;
  inTime: string;
  outTime: string;
  taskList: CompletedTask[];
}
