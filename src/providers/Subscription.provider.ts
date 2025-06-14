export interface SubscriptionData {
  type: 'hourly' | 'monthly';
  start: string; // ISO date string
  end: string;   // ISO date string
  autoRenew: boolean;
}

export default class SubscriptionProvider {
  private storageKey = 'subscription-data';

  public save(data: SubscriptionData) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  public get(): SubscriptionData | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SubscriptionData;
    } catch {
      return null;
    }
  }

  public clear() {
    localStorage.removeItem(this.storageKey);
  }

  public createHourly(hours: number, autoRenew: boolean) {
    const start = new Date();
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
    this.save({ type: 'hourly', start: start.toISOString(), end: end.toISOString(), autoRenew });
  }

  public createMonthly(autoRenew: boolean) {
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    this.save({ type: 'monthly', start: start.toISOString(), end: end.toISOString(), autoRenew });
  }
}
