import React from 'react';
import SubscriptionProvider, { SubscriptionData } from '../../providers/Subscription.provider';
import { toast } from 'react-toastify';

interface State {
  plan: 'hourly' | 'monthly';
  hours: number;
  autoRenew: boolean;
  subscription: SubscriptionData | null;
}

export default class Assinaturas extends React.Component<{}, State> {
  private provider = new SubscriptionProvider();
  private timer?: number;

  constructor(props: {}) {
    super(props);
    this.state = {
      plan: 'hourly',
      hours: 1,
      autoRenew: false,
      subscription: this.provider.get(),
    };
    this.handlePurchase = this.handlePurchase.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
  }

  componentDidMount() {
    this.setupNotification();
  }

  componentWillUnmount() {
    if (this.timer) window.clearTimeout(this.timer);
  }

  setupNotification() {
    const sub = this.state.subscription;
    if (!sub) return;
    const end = new Date(sub.end).getTime();
    const now = Date.now();
    let notifyTime = 0;
    if (sub.type === 'hourly') {
      notifyTime = end - now - 10 * 60 * 1000; // 10 minutes before
    } else {
      notifyTime = end - now - 3 * 24 * 60 * 60 * 1000; // 3 days before
    }
    if (notifyTime > 0) {
      this.timer = window.setTimeout(() => toast.warn('Sua assinatura termina em breve!'), notifyTime);
    }
  }

  handlePurchase() {
    if (this.state.plan === 'hourly') {
      this.provider.createHourly(this.state.hours, this.state.autoRenew);
    } else {
      this.provider.createMonthly(this.state.autoRenew);
    }
    const subscription = this.provider.get();
    this.setState({ subscription }, () => this.setupNotification());
  }

  handleCancel() {
    this.provider.clear();
    this.setState({ subscription: null });
    if (this.timer) window.clearTimeout(this.timer);
  }

  renderForm() {
    return (
      <div className="space-y-4">
        <div>
          <label className="mr-4">
            <input
              type="radio"
              checked={this.state.plan === 'hourly'}
              onChange={() => this.setState({ plan: 'hourly' })}
            />{' '}
            Por Hora
          </label>
          <label className="ml-4">
            <input
              type="radio"
              checked={this.state.plan === 'monthly'}
              onChange={() => this.setState({ plan: 'monthly' })}
            />{' '}
            Por Mês
          </label>
        </div>
        {this.state.plan === 'hourly' && (
          <div>
            <label>
              Horas:
              <input
                type="number"
                min="1"
                value={this.state.hours}
                onChange={(e) => this.setState({ hours: parseInt(e.target.value) })}
                className="ml-2 border"
              />
            </label>
          </div>
        )}
        <div>
          <label>
            <input
              type="checkbox"
              checked={this.state.autoRenew}
              onChange={() => this.setState({ autoRenew: !this.state.autoRenew })}
            />{' '}
            Renovação automática
          </label>
        </div>
        <button
          onClick={this.handlePurchase}
          className="px-4 py-2 text-white bg-blue-600 rounded"
        >
          Confirmar Assinatura
        </button>
      </div>
    );
  }

  renderSubscription(sub: SubscriptionData) {
    return (
      <div className="space-y-2">
        <p>Plano: {sub.type === 'hourly' ? 'Por Hora' : 'Por Mês'}</p>
        <p>Início: {new Date(sub.start).toLocaleString()}</p>
        <p>Expira em: {new Date(sub.end).toLocaleString()}</p>
        <p>Renovação automática: {sub.autoRenew ? 'Ativada' : 'Desativada'}</p>
        <button onClick={this.handleCancel} className="px-4 py-2 text-white bg-red-500 rounded">
          Cancelar Assinatura
        </button>
      </div>
    );
  }

  render() {
    return (
      <div className="p-6">
        <h1 className="mb-4 text-xl font-bold">Assinaturas</h1>
        {this.state.subscription ? this.renderSubscription(this.state.subscription) : this.renderForm()}
      </div>
    );
  }
}
