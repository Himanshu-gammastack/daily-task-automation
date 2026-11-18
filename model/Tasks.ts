
import mongoose, { Schema, Model } from "mongoose";

interface IActiveTask {
  taskTitle: string;
  _id?: mongoose.Types.ObjectId;
}

interface ICompletedTask {
  taskTitle: string;
  endTime: string;
  timeTaken: number;
}

interface ITaskHistory {
  date: Date;
  inTime: string;
  outTime: string;
  taskList: ICompletedTask[];
}

export interface ITask {
  userId: string;
  activeTasks: IActiveTask[];
  tasksHistory: ITaskHistory[];
}

const ActiveTaskSchema = new Schema<IActiveTask>(
  {
    taskTitle: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const CompletedTaskSchema = new Schema<ICompletedTask>(
  {
    taskTitle: {
      type: String,
      required: true,
      trim: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    timeTaken: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const TaskHistorySchema = new Schema<ITaskHistory>(
  {
    date: {
      type: Date,
      required: true,
    },
    inTime: {
      type: String,
      required: true,
    },
    outTime: {
      type: String,
      default: "",
    },
    taskList: {
      type: [CompletedTaskSchema],
      default: [],
    },
  },
  { _id: true }
);

const TaskSchema = new Schema<ITask>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    activeTasks: {
      type: [ActiveTaskSchema],
      default: [],
    },
    tasksHistory: {
      type: [TaskHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Task: Model<ITask> =
  mongoose.models.Task ||
  mongoose.model<ITask>("Task", TaskSchema);

export default Task;
