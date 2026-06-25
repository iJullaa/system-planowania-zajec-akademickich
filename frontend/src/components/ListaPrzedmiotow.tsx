import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

interface Przedmiot {
  id: number;
  nazwa: string;
  typ: string;
}

interface PrzedmiotCreate {
  nazwa: string;
  typ: string;
}

const TYPY_ZAJEC = ['Wykład', 'Laboratorium', 'Ćwiczenia', 'Projekt'];

const domyslnyPrzedmiot: PrzedmiotCreate = {
  nazwa: '',
  typ: 'Wykład',
};

const stylTypu = (typ: string) => {
  const lower = typ.toLowerCase();

  if (lower.includes('wykład') || lower.includes('wyklad')) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (lower.includes('laboratorium')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (lower.includes('ćwiczenia') || lower.includes('cwiczenia')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (lower.includes('projekt')) return 'bg-amber-50 text-amber-700 border-amber-200';

  return 'bg-gray-50 text-gray-700 border-gray-200';
};

const ListaPrzedmiotow = () => {
  const [przedmioty, setPrzedmioty] = useState<Przedmiot[]>([]);
  const [blad, setBlad] = useState<string>('');
  const [sukces, setSukces] = useState<string>('');
  const [pokazFormularz, setPokazFormularz] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [zapisuje, setZapisuje] = useState<boolean>(false);

  const [nowyPrzedmiot, setNowyPrzedmiot] = useState<PrzedmiotCreate>(domyslnyPrzedmiot);

  const fetchPrzedmioty = () => {
    setLoading(true);

    axios
      .get<Przedmiot[]>(`${API_BASE}/przedmioty/`)
      .then((response) => {
        setPrzedmioty(response.data);
        setBlad('');
      })
      .catch(() => {
        setBlad('Nie udało się pobrać przedmiotów. Sprawdź, czy backend działa.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPrzedmioty();
  }, []);

  const handleZmiana = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNowyPrzedmiot((prev) => ({ ...prev, [name]: value }));
  };

  const walidujPrzedmiot = () => {
    const nazwa = nowyPrzedmiot.nazwa.trim();
    const typ = nowyPrzedmiot.typ.trim();

    if (!nazwa) return 'Nazwa przedmiotu jest wymagana.';
    if (/^\d+$/.test(nazwa)) return 'Nazwa przedmiotu nie powinna składać się wyłącznie z cyfr.';
    if (!typ) return 'Typ zajęć jest wymagany.';

    const istnieje = przedmioty.some(
      (p) =>
        p.nazwa.trim().toLowerCase() === nazwa.toLowerCase() &&
        p.typ.trim().toLowerCase() === typ.toLowerCase()
    );

    if (istnieje) return 'Taki przedmiot z tym typem zajęć już istnieje.';

    return '';
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBlad('');
    setSukces('');

    const bladWalidacji = walidujPrzedmiot();
    if (bladWalidacji) {
      setBlad(bladWalidacji);
      return;
    }

    setZapisuje(true);

    const daneDoWyslania: PrzedmiotCreate = {
      nazwa: nowyPrzedmiot.nazwa.trim(),
      typ: nowyPrzedmiot.typ.trim(),
    };

    axios
      .post(`${API_BASE}/przedmioty/`, daneDoWyslania)
      .then(() => {
        fetchPrzedmioty();
        setPokazFormularz(false);
        setNowyPrzedmiot(domyslnyPrzedmiot);
        setSukces('Dodano przedmiot.');
      })
      .catch((error) => {
        setBlad(error.response?.data?.detail || 'Nie udało się dodać przedmiotu.');
      })
      .finally(() => setZapisuje(false));
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-xl">
      <div className="border-b border-gray-100 bg-gradient-to-r from-white to-indigo-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-900">Przedmioty i formy zajęć</h3>
            <p className="mt-1 text-sm text-gray-500">
              Zdefiniuj przedmioty oraz ich typy, np. wykład, laboratorium lub ćwiczenia.
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
            {pokazFormularz ? 'Anuluj' : '+ Dodaj przedmiot'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {pokazFormularz && (
          <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-inner">
            <h4 className="mb-4 text-lg font-bold text-gray-800">Nowy przedmiot</h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Nazwa przedmiotu
                </label>
                <input
                  type="text"
                  name="nazwa"
                  placeholder="np. Programowanie obiektowe"
                  value={nowyPrzedmiot.nazwa}
                  onChange={handleZmiana}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Typ zajęć
                </label>
                <select
                  name="typ"
                  value={nowyPrzedmiot.typ}
                  onChange={handleZmiana}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  {TYPY_ZAJEC.map((typ) => (
                    <option key={typ} value={typ}>{typ}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={zapisuje}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {zapisuje ? 'Zapisywanie...' : 'Zapisz przedmiot'}
              </button>
              <p className="text-xs text-gray-500">
                Ten sam przedmiot może występować osobno jako wykład i laboratorium.
              </p>
            </div>
          </form>
        )}

        {blad && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{blad}</div>}
        {sukces && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{sukces}</div>}

        {loading ? (
          <p className="text-sm text-gray-500">Ładowanie przedmiotów...</p>
        ) : przedmioty.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
            <p className="font-bold text-gray-700">Brak przedmiotów.</p>
            <p className="mt-1 text-sm text-gray-500">Dodaj przedmiot, aby utworzyć jednostki zajęciowe.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {przedmioty.map((p) => (
              <div key={p.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="break-words text-lg font-extrabold text-gray-900">{p.nazwa}</h4>
                    <p className="mt-2 text-xs text-gray-400">ID: {p.id}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${stylTypu(p.typ)}`}>
                    {p.typ}
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

export default ListaPrzedmiotow;
