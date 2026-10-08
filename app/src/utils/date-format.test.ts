import { formatDateForDisplay } from "./date-format";

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
