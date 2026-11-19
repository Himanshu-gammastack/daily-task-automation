/**
 * @jest-environment jsdom
 */

import { fireEvent, render, screen } from "@testing-library/react";
import AddTaskForm from "@/components/tasks/AddTaskForm";

describe("AddTaskForm", () => {
  const mockOnChange = jest.fn();
  const mockOnAdd = jest.fn();

  const defaultProps = {
    value: "",
    dark: false,
    loading: false,
    onChange: mockOnChange,
    onAdd: mockOnAdd,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the input and add button", () => {
    render(<AddTaskForm {...defaultProps} />);

    expect(
      screen.getByPlaceholderText("Add a new task...")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button")
    ).toBeInTheDocument();
  });

  it("should display the provided input value", () => {
    render(<AddTaskForm {...defaultProps} value="Complete project" />);

    expect(
      screen.getByPlaceholderText("Add a new task...")
    ).toHaveValue("Complete project");
  });

  it("should call onChange when the user types", () => {
    render(<AddTaskForm {...defaultProps} />);

    const input = screen.getByPlaceholderText("Add a new task...");

    fireEvent.change(input, {
      target: { value: "Learn testing" },
    });

    expect(mockOnChange).toHaveBeenCalledWith("Learn testing");
  });

  it("should call onAdd when the button is clicked", () => {
    render(<AddTaskForm {...defaultProps} value="Learn Jest" />);

    fireEvent.click(screen.getByRole("button"));

    expect(mockOnAdd).toHaveBeenCalledTimes(1);
  });

  it("should call onAdd when Enter is pressed", () => {
    render(<AddTaskForm {...defaultProps} value="Learn Jest" />);

    const input = screen.getByPlaceholderText("Add a new task...");

    fireEvent.keyDown(input, { key: "Enter" });

    expect(mockOnAdd).toHaveBeenCalledTimes(1);
  });

  it("should disable the button when input is empty", () => {
    render(<AddTaskForm {...defaultProps} value="" />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should disable the button when input contains only whitespace", () => {
    render(<AddTaskForm {...defaultProps} value="   " />);

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should disable the button while loading", () => {
    render(
      <AddTaskForm {...defaultProps} value="Learn Jest" loading={true} />
    );

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should enable the button when a valid task is entered", () => {
    render(<AddTaskForm {...defaultProps} value="Complete project" />);

    expect(screen.getByRole("button")).toBeEnabled();
  });

  it("should call onAdd only once when Enter is pressed", () => {
    render(<AddTaskForm {...defaultProps} value="Complete project" />);

    fireEvent.keyDown(
      screen.getByPlaceholderText("Add a new task..."),
      { key: "Enter" }
    );

    expect(mockOnAdd).toHaveBeenCalledTimes(1);
  });
});
