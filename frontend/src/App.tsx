import { useMemo, useState } from 'react';

import ListaWykladowcow from './components/ListaWykladowcow';
import ListaSal from './components/ListaSal';
import ListaPrzedmiotow from './components/ListaPrzedmiotow';
import ListaGrup from './components/ListaGrup';
import DefiniowanieZajec from './components/DefiniowanieZajec';
import WidokPlanu from './components/WidokPlanu';

type Widok =
  | 'glowny'
  | 'wykladowcy'
  | 'sale'
  | 'przedmioty'
  | 'grupy'
  | 'generator'
  | 'harmonogram';

interface ElementMenu {
  id: Widok;
  label: string;
  icon: string;
  group: 'main' | 'database' | 'optimization';
}

const elementyMenu: ElementMenu[] = [
  {
    id: 'glowny',
    label: 'Pulpit główny',
    icon: '🏠',
    group: 'main',
  },
  {
    id: 'wykladowcy',
    label: 'Wykładowcy',
    icon: '👨‍🏫',
    group: 'database',
  },
  {
    id: 'sale',
    label: 'Sale',
    icon: '🏫',
    group: 'database',
  },
  {
    id: 'przedmioty',
    label: 'Przedmioty',
    icon: '📚',
    group: 'database',
  },
  {
    id: 'grupy',
    label: 'Grupy',
    icon: '👥',
    group: 'database',
  },
  {
    id: 'generator',
    label: 'Konfigurator',
    icon: '⚙️',
    group: 'optimization',
  },
  {
    id: 'harmonogram',
    label: 'Wynik planu',
    icon: '📅',
    group: 'optimization',
  },
];

const tytulyWidokow: Record<Widok, { title: string; subtitle: string }> = {
  glowny: {
    title: 'Pulpit sterowniczy',
    subtitle: 'Przegląd procesu przygotowania danych i generowania harmonogramu.',
  },
  wykladowcy: {
    title: 'Rejestr wykładowców',
    subtitle: 'Zarządzanie prowadzącymi wykorzystywanymi przez solver.',
  },
  sale: {
    title: 'Rejestr sal dydaktycznych',
    subtitle: 'Definicja pomieszczeń, pojemności i wyposażenia komputerowego.',
  },
  przedmioty: {
    title: 'Katalog przedmiotów',
    subtitle: 'Lista przedmiotów oraz typów zajęć uwzględnianych w harmonogramie.',
  },
  grupy: {
    title: 'Grupy studenckie',
    subtitle: 'Definicja grup, kierunków i liczby studentów.',
  },
  generator: {
    title: 'Konfigurator zajęć',
    subtitle: 'Tworzenie puli jednostek zajęciowych i uruchamianie modelu ILP.',
  },
  harmonogram: {
    title: 'Wygenerowany harmonogram',
    subtitle: 'Tygodniowy wynik pracy solvera wraz z możliwością przeglądu i eksportu.',
  },
};

function App() {
  const [aktualnyWidok, setAktualnyWidok] = useState<Widok>('glowny');

  const aktualnyTytul = tytulyWidokow[aktualnyWidok];

  const grupyMenu = useMemo(() => {
    return {
      main: elementyMenu.filter((item) => item.group === 'main'),
      database: elementyMenu.filter((item) => item.group === 'database'),
      optimization: elementyMenu.filter((item) => item.group === 'optimization'),
    };
  }, []);

  const klasyPrzyciskuMenu = (id: Widok) => {
    const aktywny = aktualnyWidok === id;

    return [
      'group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition',
      aktywny
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/30'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white',
    ].join(' ');
  };

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
          <div className="space-y-6">
            <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl">
              <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-8 py-10 text-white">
                <div className="max-w-4xl">
                  <p className="text-sm font-bold uppercase tracking-[0.25em] text-indigo-100">
                    Scheduler ILP
                  </p>

                  <h2 className="mt-3 text-4xl font-extrabold tracking-tight">
                    System układania planów zajęć akademickich
                  </h2>

                  <p className="mt-4 max-w-3xl text-base leading-7 text-indigo-50">
                    Aplikacja wspiera przygotowanie danych wejściowych, budowę puli zajęć
                    oraz wygenerowanie harmonogramu z wykorzystaniem modelu optymalizacyjnego
                    opartego na programowaniu całkowitoliczbowym.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-4">
                <button
                  onClick={() => setAktualnyWidok('wykladowcy')}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                >
                  <div className="text-3xl">👨‍🏫</div>
                  <h3 className="mt-4 text-lg font-extrabold text-gray-900">
                    1. Dane kadrowe
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Dodaj prowadzących, którzy będą przypisywani do jednostek zajęciowych.
                  </p>
                </button>

                <button
                  onClick={() => setAktualnyWidok('sale')}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                >
                  <div className="text-3xl">🏫</div>
                  <h3 className="mt-4 text-lg font-extrabold text-gray-900">
                    2. Sale i zasoby
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Określ pojemność sal oraz informację, czy są salami komputerowymi.
                  </p>
                </button>

                <button
                  onClick={() => setAktualnyWidok('generator')}
                  className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                >
                  <div className="text-3xl">⚙️</div>
                  <h3 className="mt-4 text-lg font-extrabold text-indigo-900">
                    3. Konfigurator
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-indigo-700">
                    Połącz przedmioty, grupy i prowadzących w pulę zajęć do zaplanowania.
                  </p>
                </button>

                <button
                  onClick={() => setAktualnyWidok('harmonogram')}
                  className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                >
                  <div className="text-3xl">📅</div>
                  <h3 className="mt-4 text-lg font-extrabold text-emerald-900">
                    4. Wynik
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-emerald-700">
                    Przejrzyj wygenerowany harmonogram i wyeksportuj plan do pliku CSV.
                  </p>
                </button>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.8fr]">
              <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl">
                <h3 className="text-xl font-extrabold text-gray-900">
                  Jak działa proces?
                </h3>

                <div className="mt-5 space-y-4">
                  <div className="flex gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-extrabold text-white">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Uzupełnienie danych bazowych</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Wprowadzane są sale, przedmioty, grupy i prowadzący. Te dane tworzą
                        zasoby wykorzystywane przez solver.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-extrabold text-white">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Definicja jednostek zajęciowych</p>
                      <p className="mt-1 text-sm text-gray-500">
                        W konfiguratorze wskazuje się, jaki przedmiot ma zostać zaplanowany
                        dla danej grupy i prowadzącego.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-extrabold text-white">
                      3
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Optymalizacja ILP</p>
                      <p className="mt-1 text-sm text-gray-500">
                        Solver przypisuje zajęcia do sal i terminów, uwzględniając konflikty
                        grup, prowadzących i sal oraz kryteria jakości harmonogramu.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-xl">
                <h3 className="text-xl font-extrabold text-gray-900">
                  Zakres aktualnego modelu
                </h3>

                <ul className="mt-5 space-y-3 text-sm text-gray-700">
                  <li className="flex gap-3">
                    <span className="font-bold text-indigo-600">✓</span>
                    Planowanie w tygodniu roboczym od poniedziałku do piątku.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-indigo-600">✓</span>
                    Jednostka zajęciowa traktowana jako jeden slot 90-minutowy.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-indigo-600">✓</span>
                    Uwzględnienie konfliktów sal, grup i prowadzących.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-indigo-600">✓</span>
                    Dopasowanie typu i pojemności sali do zajęć.
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-indigo-600">✓</span>
                    Ocena jakości harmonogramu przez funkcję celu.
                  </li>
                </ul>

                <button
                  onClick={() => setAktualnyWidok('generator')}
                  className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-900/20 transition hover:bg-indigo-700"
                >
                  Przejdź do konfiguratora
                </button>
              </aside>
            </section>
          </div>
        );
    }
  };

  const renderujGrupeMenu = (tytul: string, grupa: ElementMenu[]) => (
    <div className="mt-6">
      <p className="px-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        {tytul}
      </p>

      <div className="mt-2 space-y-1">
        {grupa.map((item) => (
          <button
            key={item.id}
            onClick={() => setAktualnyWidok(item.id)}
            className={klasyPrzyciskuMenu(item.id)}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-800 bg-slate-950 text-white shadow-2xl lg:flex">
        <div className="border-b border-slate-800 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-xl shadow-lg shadow-indigo-950/30">
              🎓
            </div>

            <div>
              <h1 className="text-lg font-extrabold tracking-wide text-white">
                Scheduler ILP
              </h1>
              <p className="mt-0.5 text-xs font-medium text-slate-400">
                System planowania zajęć
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          {renderujGrupeMenu('Start', grupyMenu.main)}
          {renderujGrupeMenu('Baza danych', grupyMenu.database)}
          {renderujGrupeMenu('Optymalizacja', grupyMenu.optimization)}
        </nav>

        <div className="border-t border-slate-800 px-6 py-5">
          <p className="text-xs leading-5 text-slate-500">
            Model ILP wspiera dobór sal i terminów z zachowaniem ograniczeń zasobowych.
          </p>
        </div>
      </aside>

      <main className="min-h-screen flex-1 lg:ml-72">
        <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 lg:px-10">
          <header className="mb-6 rounded-3xl border border-white/70 bg-white/80 px-6 py-5 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">
                  {aktualnyTytul.title}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {aktualnyTytul.subtitle}
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-indigo-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Backend lokalny
              </div>
            </div>
          </header>

          <div className="animate-fade-in-up">
            {renderujWidok()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;