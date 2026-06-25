import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

interface Wykladowca {
  id: number;
  imie: string;
  nazwisko: string;
  tytul_naukowy: string | null;
}

interface WykladowcaCreate {
  imie: string;
  nazwisko: string;
  tytul_naukowy: string;
}

const domyslnyWykladowca: WykladowcaCreate = {
  imie: '',
  nazwisko: '',
  tytul_naukowy: 'dr inż.',
};

const ListaWykladowcow = () => {
  const [wykladowcy, setWykladowcy] = useState<Wykladowca[]>([]);
  const [blad, setBlad] = useState<string>('');
  const [sukces, setSukces] = useState<string>('');
  const [pokazFormularz, setPokazFormularz] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [zapisuje, setZapisuje] = useState<boolean>(false);

  const [nowyWykladowca, setNowyWykladowca] = useState<WykladowcaCreate>(domyslnyWykladowca);

  const fetchWykladowcy = () => {
    setLoading(true);

    axios
      .get<Wykladowca[]>(`${API_BASE}/wykladowcy/`)
      .then((response) => {
        setWykladowcy(response.data);
        setBlad('');
      })
      .catch(() => {
        setBlad('Nie udało się pobrać prowadzących. Sprawdź, czy backend działa.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWykladowcy();
  }, []);

  const handleZmiana = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNowyWykladowca((prev) => ({ ...prev, [name]: value }));
  };

  const pelnaNazwa = (w: Wykladowca | WykladowcaCreate) =>
    `${w.tytul_naukowy || ''} ${w.imie || ''} ${w.nazwisko || ''}`.replace(/\s+/g, ' ').trim();

  const walidujWykladowce = () => {
    const imie = nowyWykladowca.imie.trim();
    const nazwisko = nowyWykladowca.nazwisko.trim();

    if (!imie) return 'Imię prowadzącego jest wymagane.';
    if (!nazwisko) return 'Nazwisko prowadzącego jest wymagane.';
    if (/\d/.test(imie) || /\d/.test(nazwisko)) return 'Imię i nazwisko nie powinny zawierać cyfr.';

    const nowaPelnaNazwa = pelnaNazwa({
      ...nowyWykladowca,
      imie,
      nazwisko,
      tytul_naukowy: nowyWykladowca.tytul_naukowy.trim(),
    }).toLowerCase();

    const istnieje = wykladowcy.some((w) => pelnaNazwa(w).toLowerCase() === nowaPelnaNazwa);
    if (istnieje) return 'Taki prowadzący już istnieje.';

    return '';
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBlad('');
    setSukces('');

    const bladWalidacji = walidujWykladowce();
    if (bladWalidacji) {
      setBlad(bladWalidacji);
      return;
    }

    setZapisuje(true);

    const daneDoWyslania: WykladowcaCreate = {
      imie: nowyWykladowca.imie.trim(),
      nazwisko: nowyWykladowca.nazwisko.trim(),
      tytul_naukowy: nowyWykladowca.tytul_naukowy.trim(),
    };

    axios
      .post(`${API_BASE}/wykladowcy/`, daneDoWyslania)
      .then(() => {
        fetchWykladowcy();
        setPokazFormularz(false);
        setNowyWykladowca(domyslnyWykladowca);
        setSukces('Dodano prowadzącego.');
      })
      .catch((error) => {
        setBlad(error.response?.data?.detail || 'Nie udało się dodać prowadzącego.');
      })
      .finally(() => setZapisuje(false));
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-xl">
      <div className="border-b border-gray-100 bg-gradient-to-r from-white to-indigo-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-900">Prowadzący</h3>
            <p className="mt-1 text-sm text-gray-500">
              Zdefiniuj osoby prowadzące zajęcia. Solver traktuje prowadzącego jako zasób konfliktowy.
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
            {pokazFormularz ? 'Anuluj' : '+ Dodaj prowadzącego'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {pokazFormularz && (
          <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-inner">
            <h4 className="mb-4 text-lg font-bold text-gray-800">Nowy prowadzący</h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Tytuł naukowy
                </label>
                <input
                  type="text"
                  name="tytul_naukowy"
                  placeholder="np. dr inż."
                  value={nowyWykladowca.tytul_naukowy}
                  onChange={handleZmiana}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Imię
                </label>
                <input
                  type="text"
                  name="imie"
                  placeholder="np. Anna"
                  value={nowyWykladowca.imie}
                  onChange={handleZmiana}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Nazwisko
                </label>
                <input
                  type="text"
                  name="nazwisko"
                  placeholder="np. Kowalska"
                  value={nowyWykladowca.nazwisko}
                  onChange={handleZmiana}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={zapisuje}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {zapisuje ? 'Zapisywanie...' : 'Zapisz prowadzącego'}
              </button>
              <p className="text-xs text-gray-500">
                Tytuł z frazą „prof” jest później wykorzystywany przez funkcję celu solvera.
              </p>
            </div>
          </form>
        )}

        {blad && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{blad}</div>}
        {sukces && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{sukces}</div>}

        {loading ? (
          <p className="text-sm text-gray-500">Ładowanie prowadzących...</p>
        ) : wykladowcy.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
            <p className="font-bold text-gray-700">Brak prowadzących.</p>
            <p className="mt-1 text-sm text-gray-500">Dodaj co najmniej jednego prowadzącego, aby utworzyć zajęcia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {wykladowcy.map((w) => (
              <div key={w.id} className="rounded-xl border border-gray-200 border-l-4 border-l-indigo-500 bg-gray-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-extrabold text-gray-900">{pelnaNazwa(w)}</h4>
                    <p className="mt-2 text-xs text-gray-400">ID: {w.id}</p>
                  </div>

                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                    Prowadzący
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

export default ListaWykladowcow;
