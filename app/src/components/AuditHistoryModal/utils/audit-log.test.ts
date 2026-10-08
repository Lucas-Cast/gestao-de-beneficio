import { auditChanges } from "./audit-log";

const baseLog = {
  id: "audit-id",
  entityType: "BASKET" as const,
  entityId: "basket-id",
  from: null,
  changedBy: { id: "user-id", name: "Lucas" },
  createdAt: "2026-10-07T12:00:00.000Z",
  updatedAt: "2026-10-07T12:00:00.000Z",
};

describe("auditChanges basket composition labels", () => {
  it("shows a supply name followed by its short ID", () => {
    const changes = auditChanges({
      ...baseLog,
      to: {
        supplies: [
          {
            supplyId: "5dc78f5a-1234-4567-8901-123456789012",
            supplyName: "Feijão",
            quantity: 2,
          },
        ],
      },
    });

    expect(changes).toContainEqual({
      label: "Mantimentos da cesta",
      after: "Feijão (5dc78f5a): 2",
    });
  });

  it("keeps displaying the ID for older audit snapshots without a name", () => {
    const changes = auditChanges({
      ...baseLog,
      to: {
        supplies: [
          {
            supplyId: "5dc78f5a-1234-4567-8901-123456789012",
            quantity: 2,
          },
        ],
      },
    });

    expect(changes).toContainEqual({
      label: "Mantimentos da cesta",
      after: "Mantimento 5dc78f5a: 2",
    });
  });
});
