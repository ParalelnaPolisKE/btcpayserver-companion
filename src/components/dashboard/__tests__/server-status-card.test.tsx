import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ServerStatusCard from "../server-status-card";

describe("ServerStatusCard", () => {
  it("renders connected status correctly", () => {
    render(<ServerStatusCard status="connected" />);
    
    expect(screen.getByText("Server Status")).toBeInTheDocument();
    expect(screen.getByText("connected")).toBeInTheDocument();
    expect(screen.getByText("BTCPayServer connected")).toBeInTheDocument();
    
    // Check for green status indicator
    const statusIndicator = screen.getByLabelText("Status: connected");
    expect(statusIndicator).toHaveClass("bg-green-500");
  });

  it("renders disconnected status correctly", () => {
    render(<ServerStatusCard status="disconnected" />);
    
    expect(screen.getByText("disconnected")).toBeInTheDocument();
    expect(screen.getByText("Configure in settings")).toBeInTheDocument();
    
    // Check for red status indicator
    const statusIndicator = screen.getByLabelText("Status: disconnected");
    expect(statusIndicator).toHaveClass("bg-red-500");
  });

  it("renders checking status correctly", () => {
    render(<ServerStatusCard status="checking" />);
    
    expect(screen.getByText("checking")).toBeInTheDocument();
    expect(screen.getByText("Checking connection...")).toBeInTheDocument();
    
    // Check for yellow status indicator
    const statusIndicator = screen.getByLabelText("Status: checking");
    expect(statusIndicator).toHaveClass("bg-yellow-500");
  });

  it("does not re-render when props haven't changed", () => {
    const { rerender } = render(<ServerStatusCard status="connected" />);
    const initialElement = screen.getByText("connected");
    
    // Re-render with same props
    rerender(<ServerStatusCard status="connected" />);
    const afterRerender = screen.getByText("connected");
    
    // Elements should be the same reference (not re-created)
    expect(initialElement).toBe(afterRerender);
  });

  it("re-renders when status changes", () => {
    const { rerender } = render(<ServerStatusCard status="connected" />);
    expect(screen.getByText("connected")).toBeInTheDocument();
    
    rerender(<ServerStatusCard status="disconnected" />);
    expect(screen.getByText("disconnected")).toBeInTheDocument();
    expect(screen.queryByText("connected")).not.toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(<ServerStatusCard status="connected" />);
    
    // Check for aria-label on status indicator
    expect(screen.getByLabelText("Status: connected")).toBeInTheDocument();
    
    // Check that the title is rendered
    const heading = screen.getByText("Server Status");
    expect(heading).toBeInTheDocument();
  });
});