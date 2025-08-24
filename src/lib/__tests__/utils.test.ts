import { cn } from "../utils";

describe("cn utility function", () => {
  it("merges single class name", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("merges multiple class names", () => {
    expect(cn("text-red-500", "bg-blue-100")).toBe("text-red-500 bg-blue-100");
  });

  it("handles conditional classes with clsx", () => {
    const isActive = true;
    const isDisabled = false;
    
    expect(cn(
      "base-class",
      isActive && "active-class",
      isDisabled && "disabled-class"
    )).toBe("base-class active-class");
  });

  it("merges conflicting Tailwind classes correctly", () => {
    // tailwind-merge should handle conflicts
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    expect(cn("p-4", "p-8")).toBe("p-8");
    expect(cn("mt-4", "mt-8")).toBe("mt-8");
  });

  it("handles arrays of classes", () => {
    expect(cn(["text-red-500", "bg-blue-100"])).toBe("text-red-500 bg-blue-100");
  });

  it("handles nested arrays", () => {
    expect(cn(["text-red-500", ["bg-blue-100", "p-4"]])).toBe("text-red-500 bg-blue-100 p-4");
  });

  it("filters out falsy values", () => {
    expect(cn(
      "text-red-500",
      null,
      undefined,
      false,
      "",
      "bg-blue-100"
    )).toBe("text-red-500 bg-blue-100");
  });

  it("handles object syntax", () => {
    expect(cn({
      "text-red-500": true,
      "bg-blue-100": true,
      "hidden": false,
    })).toBe("text-red-500 bg-blue-100");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
    expect(cn(null)).toBe("");
    expect(cn(undefined)).toBe("");
  });

  it("preserves important modifiers", () => {
    expect(cn("!text-red-500", "text-blue-500")).toBe("!text-red-500 text-blue-500");
  });

  it("handles responsive prefixes", () => {
    expect(cn("sm:text-red-500", "sm:text-blue-500")).toBe("sm:text-blue-500");
    expect(cn("md:p-4", "lg:p-8")).toBe("md:p-4 lg:p-8");
  });

  it("handles hover and focus states", () => {
    expect(cn("hover:text-red-500", "hover:text-blue-500")).toBe("hover:text-blue-500");
    expect(cn("focus:ring-2", "focus:ring-4")).toBe("focus:ring-4");
  });

  it("preserves custom classes", () => {
    expect(cn("custom-class", "text-red-500")).toBe("custom-class text-red-500");
  });

  it("handles dark mode classes", () => {
    expect(cn("dark:text-white", "dark:text-gray-300")).toBe("dark:text-gray-300");
  });

  it("handles complex real-world scenarios", () => {
    const result = cn(
      "base-button",
      "px-4 py-2",
      "text-white bg-blue-500",
      "hover:bg-blue-600",
      "focus:outline-none focus:ring-2 focus:ring-blue-500",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      false && "hidden",
      true && "inline-flex items-center",
      {
        "animate-spin": false,
        "transition-colors": true,
      }
    );

    expect(result).toContain("base-button");
    expect(result).toContain("px-4");
    expect(result).toContain("py-2");
    expect(result).toContain("inline-flex");
    expect(result).toContain("transition-colors");
    expect(result).not.toContain("hidden");
    expect(result).not.toContain("animate-spin");
  });

  it("maintains class order for specificity", () => {
    const result = cn(
      "text-base",
      "text-sm",
      "text-lg"
    );
    
    // Should keep the last one
    expect(result).toBe("text-lg");
  });

  it("handles arbitrary values", () => {
    expect(cn("top-[117px]", "top-[200px]")).toBe("top-[200px]");
    expect(cn("text-[#1da1f2]", "text-[#ff0000]")).toBe("text-[#ff0000]");
  });

  it("preserves non-conflicting utilities", () => {
    const result = cn(
      "text-red-500",
      "bg-blue-500",
      "p-4",
      "m-2",
      "rounded-lg",
      "shadow-md"
    );

    expect(result).toBe("text-red-500 bg-blue-500 p-4 m-2 rounded-lg shadow-md");
  });
});