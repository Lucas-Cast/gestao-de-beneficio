import type { AuditEntityType, AuditLog } from "../types/audit";
import { formatDateForDisplay } from "@/utils/date-format";

const entityLabels: Record<AuditEntityType, string> = {
  BENEFICIARY: "Beneficiário",
  BASKET: "Cesta",
};
const entityPluralLabels: Record<AuditEntityType, string> = {
  BENEFICIARY: "beneficiários",
  BASKET: "cestas",
};

const fieldLabels: Record<string, string> = {
  name: "Nome",
  description: "Descrição",
  birthDate: "Data de nascimento",
  sex: "Sexo",
  cpf: "CPF",
  phone: "Telefone",
  deletedAt: "Situação",
  address: "Endereço",
  street: "Rua",
  number: "Número",
  complement: "Complemento",
  neighborhood: "Bairro",
  city: "Cidade",
  state: "Estado",
  postalCode: "CEP",
  supplies: "Mantimentos da cesta",
  supplyId: "Identificador do mantimento",
  quantity: "Quantidade",
};

const ignoredKeys = new Set(["id", "createdAt", "updatedAt"]);

export type AuditChange = {
  label: string;
  before?: string;
  after: string;
};

function asObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function fieldLabel(key: string) {
  return fieldLabels[key] ?? key.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function formatValue(key: string, value: unknown): string {
  if (key === "deletedAt") return value ? "Excluído" : "Ativo";
  if (value === null || value === undefined || value === "")
    return "Não informado";
  if (key === "sex" && typeof value === "string")
    return value === "F" ? "Feminino" : "Masculino";
  if (key === "supplies" && Array.isArray(value)) {
    return (
      value
        .map((item) => {
          const supply = asObject(item);
          const id = supply.supplyId ?? supply.id ?? "";
          const shortId = String(id).slice(0, 8);
          const name =
            typeof supply.supplyName === "string"
              ? supply.supplyName.trim()
              : "";
          const label = name
            ? `${name} (${shortId})`
            : `Mantimento ${shortId}`;
          return `${label}: ${String(supply.quantity ?? "—")}`;
        })
        .join("; ") || "Nenhum mantimento"
    );
  }
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "string" && key === "birthDate") {
    return formatDateForDisplay(value);
  }
  return String(value);
}

export function auditEntityLabel(entityType: AuditEntityType) {
  return entityLabels[entityType];
}

export function auditEntityPluralLabel(entityType: AuditEntityType) {
  return entityPluralLabels[entityType];
}

export function auditSubject(log: AuditLog) {
  const name = log.to?.name ?? log.from?.name;
  return typeof name === "string" && name
    ? name
    : `${entityLabels[log.entityType]} ${log.entityId.slice(0, 8)}`;
}

export function auditAction(log: AuditLog) {
  if (log.from === null) return "Cadastro criado";
  if (log.to && "deletedAt" in log.to) {
    const adjective = log.entityType === "BASKET" ? "excluída" : "excluído";
    const restored = log.entityType === "BASKET" ? "restaurada" : "restaurado";
    return log.to.deletedAt
      ? `${entityLabels[log.entityType]} ${adjective}`
      : `${entityLabels[log.entityType]} ${restored}`;
  }
  return "Dados atualizados";
}

export function auditChanges(log: AuditLog): AuditChange[] {
  const before = log.from ?? {};
  const after = log.to ?? {};
  const creation = log.from === null;
  const changes: AuditChange[] = [];

  function collect(path: string[], previous: unknown, next: unknown) {
    const key = path[path.length - 1];
    if (ignoredKeys.has(key)) return;

    const previousObject = asObject(previous);
    const nextObject = asObject(next);
    const isObjectValue =
      (previous !== null &&
        typeof previous === "object" &&
        !Array.isArray(previous)) ||
      (next !== null && typeof next === "object" && !Array.isArray(next));
    if (isObjectValue) {
      const keys = creation
        ? Object.keys(nextObject)
        : [
            ...new Set([
              ...Object.keys(previousObject),
              ...Object.keys(nextObject),
            ]),
          ];
      for (const child of keys)
        collect([...path, child], previousObject[child], nextObject[child]);
      return;
    }

    if (!creation && JSON.stringify(previous) === JSON.stringify(next)) return;
    changes.push({
      label: path.map(fieldLabel).join(" · "),
      ...(creation ? {} : { before: formatValue(key, previous) }),
      after: formatValue(key, next),
    });
  }

  for (const key of Object.keys(after)) collect([key], before[key], after[key]);
  return changes;
}

export function auditDate(log: AuditLog) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(log.createdAt));
}
