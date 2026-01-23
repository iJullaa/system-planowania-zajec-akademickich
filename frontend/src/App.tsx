import { useState } from 'react';

import ListaWykladowcow from './components/ListaWykladowcow';
import ListaSal from './components/ListaSal';
import ListaPrzedmiotow from './components/ListaPrzedmiotow';
import ListaGrup from './components/ListaGrup';
import DefiniowanieZajec from './components/DefiniowanieZajec';
import WidokPlanu from './components/WidokPlanu';

type Widok = 'glowny' | 'wykladowcy' | 'sale' | 'przedmioty' | 'grupy' | 'generator' | 'harmonogram';

function App() {
  const [aktualnyWidok, setAktualnyWidok] = useState<Widok>('glowny');

  const renderujWidok = () => {
    switch (aktualnyWidok) {
      case 'wykladowcy':
        return <ListaWykladowcow />;
      
      case 'sale':
        return <ListaSal />;

      case 'przedmioty':
        return <ListaPrzedmiotow />;

      case 'grupy':
        return <ListaGrup />;
      
      case 'generator':
        return <DefiniowanieZajec />;
      case 'harmonogram':
        return <WidokPlanu />;

      case 'glowny':
      default:
        return (
          <div className="p-8 bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Witaj w Systemie Planowania! 🎓</h2>
            <p className="text-gray-600 mb-6">
              To jest system wspomagający układanie planów zajęć z wykorzystaniem algorytmów optymalizacyjnych (ILP).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-2">1. Wprowadź Dane</h3>
                <p className="text-sm text-blue-600">Zdefiniuj wykładowców, sale, przedmioty i grupy w menu po lewej stronie.</p>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-bold text-purple-800 mb-2">2. Skonfiguruj i Generuj</h3>
                <p className="text-sm text-purple-600">Przejdź do zakładki "Konfigurator", aby połączyć zasoby, a następnie uruchom Solver.</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <nav className="w-64 bg-gray-900 text-white flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-800">
            <h1 className="text-xl font-bold text-indigo-400 tracking-wider">Scheduler ILP</h1>
            <p className="text-xs text-gray-500 mt-1">System Inżynierski</p>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
            <button 
                className={`w-full text-left px-6 py-3 transition border-l-4 ${aktualnyWidok === 'glowny' ? 'bg-gray-800 border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:bg-gray-800 hover:text-white'}`} 
                onClick={() => setAktualnyWidok('glowny')}
            >
              Pulpit Główny
            </button>

            <div className="px-6 mt-8 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Baza Danych
            </div>
            
            <button 
                className={`w-full text-left px-6 py-2 transition ${aktualnyWidok === 'wykladowcy' ? 'text-indigo-400 font-bold' : 'text-gray-300 hover:text-white'}`}
                onClick={() => setAktualnyWidok('wykladowcy')}
            >
                👨‍🏫 Wykładowcy
            </button>
            <button 
                className={`w-full text-left px-6 py-2 transition ${aktualnyWidok === 'sale' ? 'text-indigo-400 font-bold' : 'text-gray-300 hover:text-white'}`}
                onClick={() => setAktualnyWidok('sale')}
            >
                🏫 Sale
            </button>
            <button 
                className={`w-full text-left px-6 py-2 transition ${aktualnyWidok === 'przedmioty' ? 'text-indigo-400 font-bold' : 'text-gray-300 hover:text-white'}`}
                onClick={() => setAktualnyWidok('przedmioty')}
            >
                📚 Przedmioty
            </button>
            <button 
                className={`w-full text-left px-6 py-2 transition ${aktualnyWidok === 'grupy' ? 'text-indigo-400 font-bold' : 'text-gray-300 hover:text-white'}`}
                onClick={() => setAktualnyWidok('grupy')}
            >
                👥 Grupy
            </button>

            <div className="px-6 mt-8 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Optymalizacja
            </div>

            <button 
                className={`w-full text-left px-6 py-3 transition border-l-4 ${aktualnyWidok === 'generator' ? 'bg-gray-800 border-purple-500 text-white' : 'border-transparent text-gray-400 hover:bg-gray-800 hover:text-white'}`} 
                onClick={() => setAktualnyWidok('generator')}
            >
              ⚙️ 1. Konfigurator
            </button>

            <button 
                className={`w-full text-left px-6 py-3 transition border-l-4 ${aktualnyWidok === 'harmonogram' ? 'bg-gray-800 border-green-500 text-white' : 'border-transparent text-gray-400 hover:bg-gray-800 hover:text-white'}`} 
                onClick={() => setAktualnyWidok('harmonogram')}
            >
              📅 2. Wynik (Plan)
            </button>
        </div>
        
        <div className="p-4 border-t border-gray-800 text-xs text-gray-600 text-center">
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-8 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">
                {aktualnyWidok === 'glowny' && 'Pulpit Sterowniczy'}
                {aktualnyWidok === 'wykladowcy' && 'Rejestr Wykładowców'}
                {aktualnyWidok === 'sale' && 'Rejestr Sal Dydaktycznych'}
                {aktualnyWidok === 'przedmioty' && 'Katalog Przedmiotów'}
                {aktualnyWidok === 'grupy' && 'Grupy Dziekańskie'}
                {aktualnyWidok === 'generator' && 'Definiowanie Siatki (Input)'}
                {aktualnyWidok === 'harmonogram' && 'Wygenerowany Harmonogram'}
            </h2>
        </header>
        
        <div className="animate-fade-in-up">
            {renderujWidok()}
        </div>
      </main>
    </div>
  );
}

export default App;