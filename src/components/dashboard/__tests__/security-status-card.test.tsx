import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SecurityStatusCard from "../security-status-card";

describe("SecurityStatusCard", () => {
  it("renders secure status by default", () => {
    render(<SecurityStatusCard />);
    
    expect(screen.getByText("Security Status")).toBeInTheDocument();
    expect(screen.getByText("Secure")).toBeInTheDocument();
    expect(screen.getByText("All systems operational")).toBeInTheDocument();
    
    // Check for green check icon
    const checkIcon = screen.getByLabelText("Secure");
    expect(checkIcon).toHaveClass("text-green-500");
  });

  it("renders with custom secure status", () => {
    render(<SecurityStatusCard isSecure={true} message="Custom secure message" />);
    
    expect(screen.getByText("Secure")).toBeInTheDocument();
    expect(screen.getByText("Custom secure message")).toBeInTheDocument();
  });

  it("renders warning status", () => {
    render(<SecurityStatusCard isSecure={false} message="Security check required" />);
    
    expect(screen.getByText("Check Required")).toBeInTheDocument();
    expect(screen.getByText("Security check required")).toBeInTheDocument();
    
    // Check for yellow warning icon
    const warningIcon = screen.getByLabelText("Warning");
    expect(warningIcon).toHaveClass("text-yellow-500");
  });

  it("memoizes component correctly", () => {
    const { rerender } = render(<SecurityStatusCard isSecure={true} />);
    const initialElement = screen.getByText("Secure");
    
    // Re-render with same props (defaults)
    rerender(<SecurityStatusCard isSecure={true} />);
    const afterRerender = screen.getByText("Secure");
    
    // Since React.memo is used, elements should be the same
    expect(initialElement).toBe(afterRerender);
  });

  it("updates when props change", () => {
    const { rerender } = render(<SecurityStatusCard isSecure={true} />);
    expect(screen.getByText("Secure")).toBeInTheDocument();
    
    rerender(<SecurityStatusCard isSecure={false} />);
    expect(screen.getByText("Check Required")).toBeInTheDocument();
    expect(screen.queryByText("Secure")).not.toBeInTheDocument();
  });

  it("has proper accessibility labels", () => {
    const { rerender } = render(<SecurityStatusCard isSecure={true} />);
    expect(screen.getByLabelText("Secure")).toBeInTheDocument();
    
    rerender(<SecurityStatusCard isSecure={false} />);
    expect(screen.getByLabelText("Warning")).toBeInTheDocument();
  });

  it("handles undefined props with defaults", () => {
    render(<SecurityStatusCard isSecure={undefined} message={undefined} />);
    
    // Should use default values
    expect(screen.getByText("Secure")).toBeInTheDocument();
    expect(screen.getByText("All systems operational")).toBeInTheDocument();
  });

  it("displays Shield icon", () => {
    render(<SecurityStatusCard />);
    
    // Check that the Shield icon is rendered (by checking for the card header with icon)
    const cardHeader = screen.getByText("Security Status").parentElement;
    expect(cardHeader).toContainHTML("svg");
  });
});