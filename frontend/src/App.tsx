import { useState } from 'react';
import ListaWykladowcow from './components/ListaWykladowcow';
import ListaSal from './components/ListaSal';
import ListaPrzedmiotow from './components/ListaPrzedmiotow';

type Widok = 'glowny' | 'wykladowcy' | 'sale' | 'przedmioty' | 'grupy' | 'plan';

function App() {
  const [aktualnyWidok, setAktualnyWidok] = useState<Widok>('wykladowcy');

  const renderujWidok = () => {
    switch (aktualnyWidok) {
      case 'wykladowcy':
        return <ListaWykladowcow />;
      
      case 'sale':
        return <ListaSal />;

      case 'przedmioty':
        return <ListaPrzedmiotow />;
        
      case 'grupy':
        return <div className="p-8">Panel zarządzania Grupami (W BUDOWIE)</div>;
      case 'plan':
        return <div className="p-8">Wizualizacja planu (GŁÓWNY CEL PRACY)</div>;
      case 'glowny':
      default:
        return <div className="p-8">Witaj w Systemie Planowania Zajęć! Wybierz opcję z menu.</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <nav className="w-64 bg-gray-800 text-white flex flex-col p-4 shadow-lg">
        <div className="text-2xl font-bold mb-8 text-indigo-400">Scheduler ILP</div>
        
        <button className={`p-3 text-left rounded-md transition duration-150 ease-in-out ${aktualnyWidok === 'glowny' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`} onClick={() => setAktualnyWidok('glowny')}>
          Pulpit Główny
        </button>
        <div className="mt-6 mb-2 text-sm font-semibold text-gray-400">Zarządzanie Zasobami</div>
        
        {([
          { key: 'wykladowcy', label: 'Wykładowcy' },
          { key: 'sale', label: 'Sale' },
          { key: 'przedmioty', label: 'Przedmioty' },
          { key: 'grupy', label: 'Grupy Studenckie' },
        ] as { key: Widok; label: string }[]).map(item => (
          <button
            key={item.key}
            className={`p-3 text-left rounded-md transition duration-150 ease-in-out ${aktualnyWidok === item.key ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}
            onClick={() => setAktualnyWidok(item.key)}
          >
            {item.label}
          </button>
        ))}
        
        <div className="mt-8 mb-2 text-sm font-semibold text-gray-400">Optymalizacja</div>
        <button className={`p-3 text-left rounded-md transition duration-150 ease-in-out ${aktualnyWidok === 'plan' ? 'bg-green-600' : 'hover:bg-gray-700'}`} onClick={() => setAktualnyWidok('plan')}>
          Generuj Plan
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow p-4">
            <h1 className="text-xl font-semibold text-gray-900">
                {aktualnyWidok === 'glowny' ? 'Pulpit Główny' : `Zarządzanie: ${aktualnyWidok.charAt(0).toUpperCase() + aktualnyWidok.slice(1)}`}
            </h1>
        </header>
        <div className="p-6">
          {renderujWidok()}
        </div>
      </main>
    </div>
  );
}

export default App;