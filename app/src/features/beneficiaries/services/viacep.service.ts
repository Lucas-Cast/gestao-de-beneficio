export type CepLookupResult = {
  postalCode: string;
  address: {
    street: string;
    neighborhood: string;
    city: string;
    state: string;
  };
};

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function lookupAddressByCep(
  postalCode: string,
  signal: AbortSignal,
): Promise<CepLookupResult | null> {
  const response = await fetch(
    `https://viacep.com.br/ws/${postalCode}/json/`,
    { signal },
  );

  if (!response.ok) throw new Error("A consulta do CEP falhou.");

  const data: unknown = await response.json();
  if (!data || typeof data !== "object")
    throw new Error("A resposta da consulta do CEP é inválida.");

  const result = data as Record<string, unknown>;
  if (result.erro === true) return null;
  if (typeof result.cep !== "string")
    throw new Error("A resposta da consulta do CEP é inválida.");

  return {
    postalCode,
    address: {
      street: readText(result.logradouro),
      neighborhood: readText(result.bairro),
      city: readText(result.localidade),
      state: readText(result.uf),
    },
  };
}
