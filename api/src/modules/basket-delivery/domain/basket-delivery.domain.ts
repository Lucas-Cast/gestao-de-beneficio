import {
  multiplyStockQuantity,
  validatePositiveInteger,
} from '../../../common/domain/stock-quantity';
import { DomainError } from '../../../common/errors/domain-error';

interface DeliveryRecord {
  id: string;
  basketId: string;
  beneficiaryId: string;
  deliveredById: string;
  quantity: number;
  observation: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type CalendarDate = { year: number; month: number; day: number };

function getCalendarDate(date: Date, timeZone: string): CalendarDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: string) => {
    const part = parts.find((item) => item.type === type)?.value;
    if (!part) throw new Error(`Missing ${type} date part`);
    return Number(part);
  };
  return { year: value('year'), month: value('month'), day: value('day') };
}

function getStartOfDay(date: CalendarDate, timeZone: string): Date {
  const localMidnightAsUtc = Date.UTC(date.year, date.month - 1, date.day);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  let timestamp = localMidnightAsUtc;

  for (let attempt = 0; attempt < 4; attempt++) {
    const parts = formatter.formatToParts(new Date(timestamp));
    const value = (type: string) => {
      const part = parts.find((item) => item.type === type)?.value;
      if (!part) throw new Error(`Missing ${type} date part`);
      return Number(part);
    };
    const representedAsUtc = Date.UTC(
      value('year'),
      value('month') - 1,
      value('day'),
      value('hour'),
      value('minute'),
      value('second'),
    );
    const adjusted = localMidnightAsUtc - (representedAsUtc - timestamp);
    if (adjusted === timestamp) return new Date(timestamp);
    timestamp = adjusted;
  }

  return new Date(timestamp);
}

export class BasketDeliveryDomain {
  readonly id: string;
  readonly basketId: string;
  readonly beneficiaryId: string;
  readonly deliveredById: string;
  readonly quantity: number;
  readonly observation: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(record: DeliveryRecord) {
    this.id = record.id;
    this.basketId = record.basketId;
    this.beneficiaryId = record.beneficiaryId;
    this.deliveredById = record.deliveredById;
    this.quantity = record.quantity;
    this.observation = record.observation;
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
  }

  static consumption(
    items: { supplyId: string; quantity: number }[],
    count: number,
  ) {
    validatePositiveInteger(count);
    if (items.length === 0) throw new DomainError('EMPTY_BASKET');
    return items
      .map((item) => ({
        supplyId: item.supplyId,
        quantity: multiplyStockQuantity(item.quantity, count),
      }))
      .sort((a, b) => a.supplyId.localeCompare(b.supplyId));
  }

  static statisticsPeriods(now: Date, timeZone: string) {
    const today = getCalendarDate(now, timeZone);
    const tomorrowDate = new Date(
      Date.UTC(today.year, today.month - 1, today.day + 1),
    );
    const tomorrow = {
      year: tomorrowDate.getUTCFullYear(),
      month: tomorrowDate.getUTCMonth() + 1,
      day: tomorrowDate.getUTCDate(),
    };

    return {
      todayStart: getStartOfDay(today, timeZone),
      tomorrowStart: getStartOfDay(tomorrow, timeZone),
      monthStart: getStartOfDay({ ...today, day: 1 }, timeZone),
      now,
    };
  }

  static fromPrisma(record: DeliveryRecord) {
    return new BasketDeliveryDomain(record);
  }
  static fromPrismaMany(records: DeliveryRecord[]) {
    return records.map((record) => this.fromPrisma(record));
  }
}
