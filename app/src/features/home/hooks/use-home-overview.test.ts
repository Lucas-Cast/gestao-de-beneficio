import { renderHook } from "@testing-library/react-native";
import { useHomeOverview } from "./use-home-overview";
test("institution-wide mock source remains independent of real deliveries", async () => {
  const { result, rerender } = await renderHook(useHomeOverview);
  const original = result.current;
  await rerender(undefined);
  expect(result.current).toBe(original);
  expect(result.current.indicators.map((item) => item.value)).toEqual([
    12, 10, 148,
  ]);
  expect(result.current.indicators[1].label).toBe(
    "Beneficiários atendidos hoje",
  );
  expect(result.current.recent).toHaveLength(3);
});
