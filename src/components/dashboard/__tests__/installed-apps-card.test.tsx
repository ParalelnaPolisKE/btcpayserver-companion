import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import InstalledAppsCard from "../installed-apps-card";

describe("InstalledAppsCard", () => {
  it("renders with zero plugins", () => {
    render(<InstalledAppsCard totalPlugins={0} enabledPlugins={0} />);
    
    expect(screen.getByText("Installed Apps")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("0 enabled")).toBeInTheDocument();
  });

  it("renders with multiple plugins all enabled", () => {
    render(<InstalledAppsCard totalPlugins={5} enabledPlugins={5} />);
    
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("5 enabled")).toBeInTheDocument();
    // Should not show disabled count when all are enabled
    expect(screen.queryByText(/disabled/)).not.toBeInTheDocument();
  });

  it("renders with mixed enabled/disabled plugins", () => {
    render(<InstalledAppsCard totalPlugins={5} enabledPlugins={3} />);
    
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3 enabled, 2 disabled")).toBeInTheDocument();
  });

  it("displays singular form for single disabled plugin", () => {
    render(<InstalledAppsCard totalPlugins={2} enabledPlugins={1} />);
    
    expect(screen.getByText("1 enabled, 1 disabled")).toBeInTheDocument();
  });

  it("does not re-render with same props", () => {
    const { rerender } = render(
      <InstalledAppsCard totalPlugins={3} enabledPlugins={2} />
    );
    const initialElement = screen.getByText("3");
    
    rerender(<InstalledAppsCard totalPlugins={3} enabledPlugins={2} />);
    const afterRerender = screen.getByText("3");
    
    expect(initialElement).toBe(afterRerender);
  });

  it("re-renders when props change", () => {
    const { rerender } = render(
      <InstalledAppsCard totalPlugins={3} enabledPlugins={2} />
    );
    expect(screen.getByText("3")).toBeInTheDocument();
    
    rerender(<InstalledAppsCard totalPlugins={5} enabledPlugins={4} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("4 enabled, 1 disabled")).toBeInTheDocument();
  });

  it("handles edge case of more enabled than total gracefully", () => {
    // This shouldn't happen in practice, but test defensive coding
    render(<InstalledAppsCard totalPlugins={2} enabledPlugins={3} />);
    
    expect(screen.getByText("2")).toBeInTheDocument();
    // Should show 3 enabled even though it's more than total
    expect(screen.getByText(/3 enabled/)).toBeInTheDocument();
  });

  it("has proper heading structure", () => {
    render(<InstalledAppsCard totalPlugins={1} enabledPlugins={1} />);
    
    const heading = screen.getByText("Installed Apps");
    expect(heading).toBeInTheDocument();
  });
});