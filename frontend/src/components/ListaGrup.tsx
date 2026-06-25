import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000';

interface Grupa {
  id: number;
  nazwa: string;
  liczba_studentow: number;
  kierunek: string;
}

interface GrupaCreate {
  nazwa: string;
  liczba_studentow: number;
  kierunek: string;
}

const domyslnaGrupa: GrupaCreate = {
  nazwa: '',
  liczba_studentow: 20,
  kierunek: '',
};

const ListaGrup = () => {
  const [grupy, setGrupy] = useState<Grupa[]>([]);
  const [blad, setBlad] = useState<string>('');
  const [sukces, setSukces] = useState<string>('');
  const [pokazFormularz, setPokazFormularz] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [zapisuje, setZapisuje] = useState<boolean>(false);

  const [nowaGrupa, setNowaGrupa] = useState<GrupaCreate>(domyslnaGrupa);

  const fetchGrupy = () => {
    setLoading(true);

    axios
      .get<Grupa[]>(`${API_BASE}/grupy/`)
      .then((response) => {
        setGrupy(response.data);
        setBlad('');
      })
      .catch(() => {
        setBlad('Nie udało się pobrać grup. Sprawdź, czy backend działa.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGrupy();
  }, []);

  const handleZmiana = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setNowaGrupa((prev) => ({
      ...prev,
      [name]: name === 'liczba_studentow' ? Number(value) : value,
    }));
  };

  const walidujGrupe = () => {
    const nazwa = nowaGrupa.nazwa.trim();
    const kierunek = nowaGrupa.kierunek.trim();

    if (!nazwa) return 'Nazwa grupy jest wymagana.';
    if (/^\d+$/.test(nazwa)) return 'Nazwa grupy nie powinna składać się wyłącznie z cyfr.';
    if (!kierunek) return 'Kierunek jest wymagany.';
    if (!Number.isFinite(nowaGrupa.liczba_studentow) || nowaGrupa.liczba_studentow < 1) {
      return 'Liczba studentów musi być większa od 0.';
    }
    if (nowaGrupa.liczba_studentow > 300) {
      return 'Liczba studentów wygląda zbyt wysoko. Sprawdź poprawność danych.';
    }

    const istnieje = grupy.some(
      (g) => g.nazwa.trim().toLowerCase() === nazwa.toLowerCase()
    );

    if (istnieje) return 'Grupa o takiej nazwie już istnieje.';

    return '';
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBlad('');
    setSukces('');

    const bladWalidacji = walidujGrupe();
    if (bladWalidacji) {
      setBlad(bladWalidacji);
      return;
    }

    setZapisuje(true);

    const daneDoWyslania: GrupaCreate = {
      nazwa: nowaGrupa.nazwa.trim(),
      liczba_studentow: Number(nowaGrupa.liczba_studentow),
      kierunek: nowaGrupa.kierunek.trim(),
    };

    axios
      .post(`${API_BASE}/grupy/`, daneDoWyslania)
      .then(() => {
        fetchGrupy();
        setPokazFormularz(false);
        setNowaGrupa(domyslnaGrupa);
        setSukces('Dodano grupę studencką.');
      })
      .catch((error) => {
        setBlad(
          error.response?.data?.detail ||
            'Nie udało się dodać grupy. Sprawdź, czy nazwa jest unikalna.'
        );
      })
      .finally(() => setZapisuje(false));
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-xl">
      <div className="border-b border-gray-100 bg-gradient-to-r from-white to-indigo-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-900">Grupy studenckie</h3>
            <p className="mt-1 text-sm text-gray-500">
              Zdefiniuj grupy dziekańskie, które będą traktowane przez solver jako zasoby konfliktowe.
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
            {pokazFormularz ? 'Anuluj' : '+ Dodaj grupę'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {pokazFormularz && (
          <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-inner">
            <h4 className="mb-4 text-lg font-bold text-gray-800">Nowa grupa studencka</h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Nazwa grupy
                </label>
                <input
                  type="text"
                  name="nazwa"
                  placeholder="np. INF-S3-GR1"
                  value={nowaGrupa.nazwa}
                  onChange={handleZmiana}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Liczba studentów
                </label>
                <input
                  type="number"
                  name="liczba_studentow"
                  value={nowaGrupa.liczba_studentow}
                  onChange={handleZmiana}
                  className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  min="1"
                  max="300"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                  Kierunek
                </label>
                <input
                  type="text"
                  name="kierunek"
                  placeholder="np. Informatyka"
                  value={nowaGrupa.kierunek}
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
                {zapisuje ? 'Zapisywanie...' : 'Zapisz grupę'}
              </button>
              <p className="text-xs text-gray-500">
                Przykładowy format: INF-S3-GR1, INF-S3-LAB1, INF-S1-WYK.
              </p>
            </div>
          </form>
        )}

        {blad && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {blad}
          </div>
        )}

        {sukces && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {sukces}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Ładowanie grup...</p>
        ) : grupy.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
            <p className="font-bold text-gray-700">Brak grup studenckich.</p>
            <p className="mt-1 text-sm text-gray-500">Dodaj pierwszą grupę, aby można było utworzyć zajęcia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {grupy.map((g) => (
              <div
                key={g.id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="break-words text-lg font-extrabold text-indigo-700">{g.nazwa}</h4>
                    <p className="mt-1 text-sm font-medium text-gray-600">{g.kierunek}</p>
                    <p className="mt-2 text-xs text-gray-400">ID: {g.id}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-3xl font-extrabold text-gray-900">{g.liczba_studentow}</div>
                    <div className="text-xs font-medium text-gray-400">studentów</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaGrup;
