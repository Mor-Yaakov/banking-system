import TransactionForm from './features/transactions/TransactionForm/TransactionForm';
import TransactionHistory from './features/transactions/TransactionHistory/TransactionHistory';
import './App.css';

export default function App() {
  return (
    <div className="App">
      <header>
        <h1>מערכת הפקדות ומשיכות</h1>
      </header>

      <main>
        <section className="transaction-history-section">
          <TransactionHistory />
        </section>

        <section className="transaction-form-section">
          <TransactionForm />
        </section>
      </main>
    </div>
  );
}
