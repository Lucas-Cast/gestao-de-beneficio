import {
  formatDateForDisplay,
  formatDateTimeForDisplay,
  formatTimeForDisplay,
} from "./date-format";

describe("formatDateForDisplay", () => {
  it("formats an ISO date in Brazilian format without timezone drift", () => {
    expect(formatDateForDisplay("2026-10-07T23:30:00.000Z")).toBe(
      "07/10/2026",
    );
    expect(formatDateForDisplay("2026-10-07")).toBe("07/10/2026");
  });

  it("uses the provided fallback for an invalid date", () => {
    expect(formatDateForDisplay("data inválida", "Data indisponível")).toBe(
      "Data indisponível",
    );
  });
});

describe("formatDateTimeForDisplay", () => {
  it("formats a timestamp using Brazilian date and time conventions", () => {
    const value = "2026-10-07T15:30:00.000Z";
    const expected = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
    expect(formatDateTimeForDisplay(value)).toBe(expected);
  });

  it("uses a safe fallback for an invalid timestamp", () => {
    expect(formatDateTimeForDisplay("data inválida")).toBe(
      "Data indisponível",
    );
  });
});

describe("formatTimeForDisplay", () => {
  it("formats the time in the device's local timezone", () => {
    const value = "2026-10-07T15:30:00.000Z";
    const expected = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
    expect(formatTimeForDisplay(value)).toBe(expected);
  });

  it("uses a safe fallback for an invalid timestamp", () => {
    expect(formatTimeForDisplay("data inválida")).toBe("Horário indisponível");
  });
});
