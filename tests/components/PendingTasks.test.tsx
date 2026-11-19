/**
 * @jest-environment jsdom
 */

import {
  render,
  screen,
  fireEvent,
} from "@testing-library/react";

import PendingTasks from "@/components/tasks/PendingTasks";
import userEvent from "@testing-library/user-event";
import { Task } from "@/types/task";

jest.mock("lucide-react", () => ({
  Check: () => <span data-testid="check-icon" />,
  Pencil: () => <span data-testid="pencil-icon" />,
  Save: () => <span data-testid="save-icon" />,
  Trash2: () => <span data-testid="trash-icon" />,
  X: () => <span data-testid="cancel-icon" />,
}));

const mockTasks: Task[] = [
  {
    _id: "task1",
    taskTitle: "Learn TypeScript",
  },
  {
    _id: "task2",
    taskTitle: "Build API",
  },
];

describe("PendingTasks Component", () => {
  const onEdit = jest.fn();
  const onDelete = jest.fn();
  const onComplete = jest.fn();

  const renderComponent = (
    tasks: Task[] = mockTasks,
    outTime?: string,
    dark = false
  ) =>
    render(
      <PendingTasks
        tasks={tasks}
        dark={dark}
        onEdit={onEdit}
        onDelete={onDelete}
        onComplete={onComplete}
        outTime={outTime}
      />
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the component heading", () => {
    renderComponent();

    expect(
      screen.getByText("Pending Tasks")
    ).toBeInTheDocument();
  });

  test("displays empty state when there are no pending tasks", () => {
    renderComponent([]);

    expect(
      screen.getByText("No pending tasks.")
    ).toBeInTheDocument();
  });

  test("displays zero task count when list is empty", () => {
    renderComponent([]);

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  test("renders all pending task titles", () => {
    renderComponent();

    expect(
      screen.getByText("Learn TypeScript")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Build API")
    ).toBeInTheDocument();
  });

  test("displays the correct pending task count", () => {
    renderComponent();

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("calls onComplete with the correct task ID", () => {
    renderComponent();

    fireEvent.click(screen.getAllByTitle("Mark complete")[0]);

    expect(onComplete).toHaveBeenCalledWith("task1");
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test("calls onDelete with the correct task ID", () => {
    renderComponent();

    fireEvent.click(screen.getAllByTitle("Delete task")[0]);

    expect(onDelete).toHaveBeenCalledWith("task1");
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test("enters edit mode when edit button is clicked", () => {
    renderComponent();

    fireEvent.click(screen.getAllByTitle("Edit task")[0]);

    expect(
      screen.getByDisplayValue("Learn TypeScript")
    ).toBeInTheDocument();
  });

  test("calls onEdit with updated task title when save is clicked", () => {
    renderComponent();

    fireEvent.click(screen.getAllByTitle("Edit task")[0]);

    const input = screen.getByDisplayValue("Learn TypeScript");

    fireEvent.change(input, {
      target: {
        value: "Learn Advanced TypeScript",
      },
    });

    fireEvent.click(screen.getByTitle("Save"));

    expect(onEdit).toHaveBeenCalledWith(
      "task1",
      "Learn Advanced TypeScript"
    );

    expect(onEdit).toHaveBeenCalledTimes(1);

    expect(
      screen.queryByDisplayValue("Learn Advanced TypeScript")
    ).not.toBeInTheDocument();
  });

  test("trims whitespace before saving edited title", () => {
    renderComponent();

    fireEvent.click(screen.getAllByTitle("Edit task")[0]);

    const input = screen.getByDisplayValue("Learn TypeScript");

    fireEvent.change(input, {
      target: {
        value: "  Updated task  ",
      },
    });

    fireEvent.click(screen.getByTitle("Save"));

    expect(onEdit).toHaveBeenCalledWith(
      "task1",
      "Updated task"
    );
  });

  test("saves edited title when Enter is pressed", () => {
    renderComponent();

    fireEvent.click(screen.getAllByTitle("Edit task")[0]);

    const input = screen.getByDisplayValue("Learn TypeScript");

    fireEvent.change(input, {
      target: {
        value: "Updated using Enter",
      },
    });

    fireEvent.keyDown(input, {
      key: "Enter",
      code: "Enter",
    });

    expect(onEdit).toHaveBeenCalledWith(
      "task1",
      "Updated using Enter"
    );
  });

  test("cancels editing when cancel button is clicked", () => {
    renderComponent();

    fireEvent.click(screen.getAllByTitle("Edit task")[0]);

    expect(
      screen.getByDisplayValue("Learn TypeScript")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Cancel"));

    expect(
      screen.queryByDisplayValue("Learn TypeScript")
    ).not.toBeInTheDocument();

    expect(onEdit).not.toHaveBeenCalled();
  });

  test("cancels editing when Escape is pressed", () => {
    renderComponent();

    fireEvent.click(screen.getAllByTitle("Edit task")[0]);

    const input = screen.getByDisplayValue("Learn TypeScript");

    fireEvent.keyDown(input, {
      key: "Escape",
      code: "Escape",
    });

    expect(
      screen.queryByDisplayValue("Learn TypeScript")
    ).not.toBeInTheDocument();

    expect(onEdit).not.toHaveBeenCalled();
  });

  test("disables task completion when outTime is set", () => {
    renderComponent(mockTasks, "18:00");

    const completeButtons = screen.getAllByTitle(
      "Day has been ended"
    );

    expect(completeButtons).toHaveLength(2);

    completeButtons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  test("allows task completion when outTime is not set", () => {
    renderComponent(mockTasks, "");

    const completeButtons = screen.getAllByTitle("Mark complete");

    completeButtons.forEach((button) => {
      expect(button).toBeEnabled();
    });
  });

  test("applies dark theme styles", () => {
    const { container } = renderComponent(mockTasks, undefined, true);
  
    const header = container.querySelector("section > div");
  
    expect(header).toHaveClass("border-neutral-800");
  });

  test("applies light theme styles", () => {
    const { container } = renderComponent(mockTasks, undefined, false);
  
    const header = container.querySelector("section > div");
  
    expect(header).toHaveClass("border-neutral-200");
  });
});
