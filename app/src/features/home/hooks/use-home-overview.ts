const overview = {
  indicators: [
    { label: "Cestas entregues hoje", value: 12 },
    { label: "Beneficiários atendidos hoje", value: 10 },
    { label: "Cestas entregues no mês", value: 148 },
  ],
  recent: [
    {
      id: "demo-1",
      name: "Ana Souza",
      basket: "Cesta padrão",
      quantity: 1,
      time: "10:45",
    },
    {
      id: "demo-2",
      name: "José Santos",
      basket: "Cesta padrão",
      quantity: 2,
      time: "10:20",
    },
    {
      id: "demo-3",
      name: "Maria Oliveira",
      basket: "Cesta padrão",
      quantity: 1,
      time: "09:55",
    },
  ],
} as const;
export function useHomeOverview() {
  return overview;
}
