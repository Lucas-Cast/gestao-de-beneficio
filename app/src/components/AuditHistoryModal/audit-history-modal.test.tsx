import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuditHistoryModal } from "./audit-history-modal";
import { useAuditLogs } from "./hooks/use-audit-logs";

jest.mock("./hooks/use-audit-logs", () => ({
  useAuditLogs: jest.fn(),
}));

const mockUseAuditLogs = jest.mocked(useAuditLogs);
const refresh = jest.fn();
const loadMore = jest.fn();

const history = {
  rows: [],
  loading: false,
  refreshing: false,
  loadingMore: false,
  error: null,
  hasMore: false,
  refresh,
  loadMore,
};

function renderModal(onClose = jest.fn()) {
  return render(
    <AuditHistoryModal
      visible
      onClose={onClose}
      entityType="BENEFICIARY"
    />,
    {
      wrapper: ({ children }) => (
        <SafeAreaProvider
          initialMetrics={{
            frame: { x: 0, y: 0, width: 360, height: 800 },
            insets: { top: 0, right: 0, bottom: 0, left: 0 },
          }}
        >
          {children}
        </SafeAreaProvider>
      ),
    },
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuditLogs.mockReturnValue(history);
});

test("shows the entity history, date-range filters, and empty state", async () => {
  await renderModal();

  expect(screen.getByText("Histórico de beneficiários")).toBeTruthy();
  expect(screen.getByText("Data inicial")).toBeTruthy();
  expect(screen.getByText("Data final")).toBeTruthy();
  expect(
    screen.getByText("Nenhuma alteração encontrada neste período."),
  ).toBeTruthy();
  expect(mockUseAuditLogs).toHaveBeenCalledWith({
    entityType: "BENEFICIARY",
    entityId: undefined,
    changedById: undefined,
  });
});

test("closes the modal when the close action is pressed", async () => {
  const onClose = jest.fn();
  await renderModal(onClose);

  await fireEvent.press(
    screen.getByRole("button", { name: "Fechar Histórico de beneficiários" }),
  );

  expect(onClose).toHaveBeenCalledTimes(1);
});
