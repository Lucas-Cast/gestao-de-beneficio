import {
  formatSupplyQuantity,
  supplyUnitLabel,
  supplyUnitName,
} from "./supply-format";

describe("supply formatting", () => {
  it("provides a shared display name and label for known units", () => {
    expect(supplyUnitName("KILOGRAM")).toBe("Quilograma (kg)");
    expect(supplyUnitLabel("UNIT")).toBe("unidade");
  });

  it("formats quantities and pluralizes packages", () => {
    expect(formatSupplyQuantity(2, "KILOGRAM")).toBe("2 kg");
    expect(formatSupplyQuantity(1, "PACKAGE")).toBe("1 pacote");
    expect(formatSupplyQuantity(2, "PACKAGE")).toBe("2 pacotes");
  });

  it("preserves unknown unit values", () => {
    expect(supplyUnitName("UNKNOWN")).toBe("UNKNOWN");
    expect(formatSupplyQuantity(2, "UNKNOWN")).toBe("2 UNKNOWN");
  });
});
