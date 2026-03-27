import {describe, expect, it} from "vitest";
import {
    cn,
    formatDate,
    randomId,
    truncate,
    isValidEmail,
    formatDistance,
    getInitials,
} from "../utils";

describe("cn", () => {
    it("merges class names correctly", () => {
        expect(cn("px-4", "py-2")).toBe("px-4 py-2");
    });

    it("handles conditional classes", () => {
        expect(cn("base", true && "active", false && "hidden")).toBe("base active");
    });

    it("deduplicates tailwind classes", () => {
        expect(cn("px-4", "px-6")).toBe("px-6");
    });
});

describe("isValidEmail", () => {
    it("validates correct email", () => {
        expect(isValidEmail("test@example.com")).toBe(true);
    });

    it("rejects invalid email", () => {
        expect(isValidEmail("invalid-email")).toBe(false);
    });

    it("rejects email without domain", () => {
        expect(isValidEmail("test@")).toBe(false);
    });
});

describe("formatDate", () => {
    it("formats date correctly", () => {
        const date = new Date("2024-01-15");
        expect(formatDate(date)).toContain("Jan");
        expect(formatDate(date)).toContain("15");
        expect(formatDate(date)).toContain("2024");
    });

    it("handles string dates", () => {
        const result = formatDate("2024-06-20");
        expect(result).toContain("Jun");
    });
});

describe("randomId", () => {
    it("generates unique ids", () => {
        const id1 = randomId();
        const id2 = randomId();
        expect(id1).not.toBe(id2);
    });

    it("returns a string", () => {
        expect(typeof randomId()).toBe("string");
    });
});

describe("truncate", () => {
    it("truncates long strings", () => {
        expect(truncate("Hello World", 5)).toBe("Hello...");
    });

    it("returns short strings unchanged", () => {
        expect(truncate("Hi", 5)).toBe("Hi");
    });
});

describe("getInitials", () => {
    it("returns initials for full name", () => {
        expect(getInitials("John Doe")).toBe("JD");
    });

    it("returns single initial for single name", () => {
        expect(getInitials("John")).toBe("J");
    });

    it("limits to two characters", () => {
        expect(getInitials("John Michael Doe")).toBe("JM");
    });
});

describe("formatDistance", () => {
    it("formats meters for distances under 1km", () => {
        expect(formatDistance(0.5)).toBe("500m");
    });

    it("formats kilometers with decimal for small distances", () => {
        expect(formatDistance(5.5)).toBe("5.5km");
    });

    it("formats whole kilometers for large distances", () => {
        expect(formatDistance(15.7)).toBe("16km");
    });
});
