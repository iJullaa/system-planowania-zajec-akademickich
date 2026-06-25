import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

interface Sala {
  id: number;
  nazwa: string;
  pojemnosc: number;
  czy_komputerowa: boolean;
}

interface SalaCreate {
  nazwa: string;
  pojemnosc: number;
  czy_komputerowa: boolean;
}

const domyslnaSala: SalaCreate = {
  nazwa: '',
  pojemnosc: 30,
  czy_komputerowa: false,
};

const ListaSal = () => {
  const [sale, setSale] = useState<Sala[]>([]);
  const [blad, setBlad] = useState<string>('');
  const [sukces, setSukces] = useState<string>('');
  const [pokazFormularz, setPokazFormularz] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [zapisuje, setZapisuje] = useState<boolean>(false);

  const [nowaSala, setNowaSala] = useState<SalaCreate>(domyslnaSala);

  const fetchSale = () => {
    setLoading(true);

    axios
      .get<Sala[]>(`${API_BASE}/sale/`)
      .then((response) => {
        setSale(response.data);
        setBlad('');
      })
      .catch(() => {
        setBlad('Nie udało się pobrać sal. Sprawdź, czy backend działa.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSale();
  }, []);

  const handleZmiana = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setNowaSala((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'pojemnosc' ? Number(value) : value,
    }));
  };

  const walidujSale = () => {
    const nazwa = nowaSala.nazwa.trim();

    if (!nazwa) return 'Nazwa sali jest wymagana.';
    if (!Number.isFinite(nowaSala.pojemnosc) || nowaSala.pojemnosc < 1) {
      return 'Pojemność sali musi być większa od 0.';
    }
    if (nowaSala.pojemnosc > 500) {
      return 'Pojemność sali wygląda zbyt wysoko. Sprawdź poprawność danych.';
    }

    const istnieje = sale.some((s) => s.nazwa.trim().toLowerCase() === nazwa.toLowerCase());
    if (istnieje) return 'Sala o takiej nazwie już istnieje.';

    return '';
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBlad('');
    setSukces('');

    const bladWalidacji = walidujSale();
    if (bladWalidacji) {
      setBlad(bladWalidacji);
      return;
    }

    setZapisuje(true);

    const daneDoWyslania: SalaCreate = {
      nazwa: nowaSala.nazwa.trim(),
      pojemnosc: Number(nowaSala.pojemnosc),
      czy_komputerowa: nowaSala.czy_komputerowa,
    };

    axios
      .post(`${API_BASE}/sale/`, daneDoWyslania)
      .then(() => {
        fetchSale();
        setPokazFormularz(false);
        setNowaSala(domyslnaSala);
        setSukces('Dodano salę dydaktyczną.');
      })
      .catch((error) => {
        setBlad(error.response?.data?.detail || 'Nie udało się dodać sali.');
      })
      .finally(() => setZapisuje(false));
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-xl">
      <div className="border-b border-gray-100 bg-gradient-to-r from-white to-indigo-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-900">Sale dydaktyczne</h3>
            <p className="mt-1 text-sm text-gray-500">
              Zdefiniuj pomieszczenia, ich pojemność oraz informację, czy są salami komputerowymi.
            </p>
          </div>

          <button
            onClick={() => {
              setPokazFormularz((prev) => !prev);
              setBlad('');
              setSukces('');
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            {pokazFormularz ? 'Anuluj' : '+ Dodaj salę'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {pokazFormularz && (
          <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-inner">
            <h4 className="mb-4 text-lg font-bold text-gray-800">Nowa sala</h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Nazwa / numer sali
                </label>
                <input
                  type="text"
                  name="nazwa"
                  placeholder="np. Laboratorium 302"
                  value={nowaSala.nazwa}
                  onChange={handleZmiana}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Pojemność
                </label>
                <input
                  type="number"
                  name="pojemnosc"
                  value={nowaSala.pojemnosc}
                  onChange={handleZmiana}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  min="1"
                  max="500"
                  required
                />
              </div>

              <div className="flex items-center rounded-lg border border-gray-200 bg-white px-4 py-3">
                <input
                  type="checkbox"
                  name="czy_komputerowa"
                  id="czy_komputerowa"
                  checked={nowaSala.czy_komputerowa}
                  onChange={handleZmiana}
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="czy_komputerowa" className="ml-3 text-sm font-semibold text-gray-700">
                  Sala komputerowa
                </label>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={zapisuje}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {zapisuje ? 'Zapisywanie...' : 'Zapisz salę'}
              </button>
              <p className="text-xs text-gray-500">
                Laboratoria mogą wymagać sal komputerowych przy generowaniu harmonogramu.
              </p>
            </div>
          </form>
        )}

        {blad && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{blad}</div>}
        {sukces && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{sukces}</div>}

        {loading ? (
          <p className="text-sm text-gray-500">Ładowanie sal...</p>
        ) : sale.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
            <p className="font-bold text-gray-700">Brak sal dydaktycznych.</p>
            <p className="mt-1 text-sm text-gray-500">Dodaj co najmniej jedną salę, aby solver mógł utworzyć plan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sale.map((s) => (
              <div
                key={s.id}
                className={`rounded-xl border border-gray-200 border-l-4 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                  s.czy_komputerowa ? 'border-l-blue-500 bg-blue-50' : 'border-l-emerald-500 bg-emerald-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-extrabold text-gray-900">{s.nazwa}</h4>
                    <p className="mt-1 text-sm font-medium text-gray-600">
                      Pojemność: <strong>{s.pojemnosc}</strong> os.
                    </p>
                    <p className="mt-2 text-xs text-gray-400">ID: {s.id}</p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
                      s.czy_komputerowa
                        ? 'border-blue-200 bg-blue-100 text-blue-700'
                        : 'border-emerald-200 bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {s.czy_komputerowa ? 'PC' : 'Ogólna'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaSal;
