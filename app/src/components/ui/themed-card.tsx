import { View, type ViewProps } from "react-native";

export function ThemedCard({
  className,
  ...props
}: ViewProps & { className?: string }) {
  return (
    <View
      className={[
        "gap-4 rounded-2xl border border-border bg-background2 p-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
