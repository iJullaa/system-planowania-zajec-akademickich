import { Fragment, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

interface Rezerwacja {
  id: number;
  zajecia_id: number;
  sala_id: number;
  dzien: string;
  godzina: string;
}

interface Sala {
  id: number;
  nazwa: string;
  [key: string]: any;
}

interface Przedmiot {
  id: number;
  nazwa: string;
  typ?: string;
  [key: string]: any;
}

interface Wykladowca {
  id: number;
  tytul_naukowy?: string;
  imie?: string;
  nazwisko?: string;
  [key: string]: any;
}

interface Grupa {
  id: number;
  nazwa: string;
  [key: string]: any;
}

interface ZajeciaDetale {
  id: number;
  przedmiot_id: number;
  wykladowca_id: number;
  grupa_id: number;
}

interface ZajeciaInfo {
  przedmiot: string;
  typ: string;
  wykladowca: string;
  grupa: string;
}

interface StatystykiSolvera {
  status_solvera?: string;
  liczba_zmiennych?: number;
  liczba_ograniczen?: number;
  czas_ms?: number;
  wartosc_funkcji_celu?: number;
  data_generowania?: string;
}

const DNI_TYGODNIA = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek'];

const GODZINY = [
  '08:00-09:30',
  '09:45-11:15',
  '11:30-13:00',
  '13:15-14:45',
  '15:00-16:30',
  '16:45-18:15',
];

const WidokPlanu = () => {
  const [rezerwacje, setRezerwacje] = useState<Rezerwacja[]>([]);
  const [loading, setLoading] = useState(true);

  const [sale, setSale] = useState<Record<number, string>>({});
  const [zajeciaInfo, setZajeciaInfo] = useState<Record<number, ZajeciaInfo>>({});

  const [statystykiSolvera, setStatystykiSolvera] = useState<StatystykiSolvera | null>(null);

  const [grupyOpcje, setGrupyOpcje] = useState<string[]>([]);
  const [wykladowcyOpcje, setWykladowcyOpcje] = useState<string[]>([]);
  const [saleOpcje, setSaleOpcje] = useState<Sala[]>([]);

  const [filtrGrupy, setFiltrGrupy] = useState('ALL');
  const [filtrWykladowcy, setFiltrWykladowcy] = useState('ALL');
  const [filtrSali, setFiltrSali] = useState('ALL');

  const odswiezDane = async () => {
    setLoading(true);

    try {
      const resPlan = await axios.get('http://127.0.0.1:8000/harmonogram/');

      const [resSale, resZajecia, resPrzedmioty, resWykladowcy, resGrupy] =
        await Promise.all([
          axios.get('http://127.0.0.1:8000/sale/'),
          axios.get('http://127.0.0.1:8000/zajecia/'),
          axios.get('http://127.0.0.1:8000/przedmioty/'),
          axios.get('http://127.0.0.1:8000/wykladowcy/'),
          axios.get('http://127.0.0.1:8000/grupy/'),
        ]);

      setRezerwacje(resPlan.data);

      const zapisaneStatystyki = localStorage.getItem('ostatnie_statystyki_solvera');
      if (zapisaneStatystyki) {
        try {
          setStatystykiSolvera(JSON.parse(zapisaneStatystyki));
        } catch {
          setStatystykiSolvera(null);
        }
      }

      const mapaSal: Record<number, string> = {};
      resSale.data.forEach((s: Sala) => {
        mapaSal[s.id] = s.nazwa;
      });
      setSale(mapaSal);
      setSaleOpcje(resSale.data);

      const mapaPrzedmiotow: Record<number, Przedmiot> = Object.fromEntries(
        resPrzedmioty.data.map((p: Przedmiot) => [p.id, p])
      );

      const mapaWykladowcow: Record<number, string> = Object.fromEntries(
        resWykladowcy.data.map((w: Wykladowca) => {
          const pelnaNazwa = `${w.tytul_naukowy || ''} ${w.imie || ''} ${w.nazwisko || ''}`
            .replace(/\s+/g, ' ')
            .trim();

          return [w.id, pelnaNazwa || 'Nieznany prowadzący'];
        })
      );

      const mapaGrup: Record<number, string> = Object.fromEntries(
        resGrupy.data.map((g: Grupa) => [g.id, g.nazwa])
      );

      const mapaZajec: Record<number, ZajeciaInfo> = {};

      resZajecia.data.forEach((z: ZajeciaDetale) => {
        const przedmiot = mapaPrzedmiotow[z.przedmiot_id];
        const wykladowca = mapaWykladowcow[z.wykladowca_id] || 'Nieznany prowadzący';
        const grupa = mapaGrup[z.grupa_id] || 'Brak grupy';

        mapaZajec[z.id] = {
          przedmiot: przedmiot?.nazwa || 'Nieznany przedmiot',
          typ: przedmiot?.typ || 'Zajęcia',
          wykladowca,
          grupa,
        };
      });

      setZajeciaInfo(mapaZajec);

      const grupy = Array.from(new Set(Object.values(mapaZajec).map((z) => z.grupa))).sort();
      const wykladowcy = Array.from(
        new Set(Object.values(mapaZajec).map((z) => z.wykladowca))
      ).sort();

      setGrupyOpcje(grupy);
      setWykladowcyOpcje(wykladowcy);
    } catch (error) {
      console.error('Błąd pobierania danych:', error);
      alert('Nie udało się pobrać planu. Sprawdź backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    odswiezDane();
  }, []);

  const rezerwacjeFiltrowane = useMemo(() => {
    return rezerwacje.filter((rez) => {
      const info = zajeciaInfo[rez.zajecia_id];

      if (!info) return true;

      const pasujeGrupa = filtrGrupy === 'ALL' || info.grupa === filtrGrupy;
      const pasujeWykladowca =
        filtrWykladowcy === 'ALL' || info.wykladowca === filtrWykladowcy;
      const pasujeSala = filtrSali === 'ALL' || String(rez.sala_id) === filtrSali;

      return pasujeGrupa && pasujeWykladowca && pasujeSala;
    });
  }, [rezerwacje, zajeciaInfo, filtrGrupy, filtrWykladowcy, filtrSali]);

  const znajdzZajecia = (dzien: string, godzina: string) => {
    return rezerwacjeFiltrowane.filter((r) => r.dzien === dzien && r.godzina === godzina);
  };

  const resetujFiltry = () => {
    setFiltrGrupy('ALL');
    setFiltrWykladowcy('ALL');
    setFiltrSali('ALL');
  };

  const stylTypu = (typ?: string) => {
    const lower = (typ || '').toLowerCase();

    if (lower.includes('laboratorium')) {
      return {
        border: 'border-blue-500',
        tag: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    }

    if (lower.includes('wykład') || lower.includes('wyklad')) {
      return {
        border: 'border-purple-500',
        tag: 'bg-purple-50 text-purple-700 border-purple-200',
      };
    }

    if (lower.includes('ćwiczenia') || lower.includes('cwiczenia')) {
      return {
        border: 'border-emerald-500',
        tag: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }

    return {
      border: 'border-indigo-500',
      tag: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
  };

  const edytujZajecia = async (rez: Rezerwacja) => {
    const nowyDzien = prompt(
      'Zmień dzień (Poniedziałek, Wtorek, Środa, Czwartek, Piątek):',
      rez.dzien
    );

    if (!nowyDzien) return;

    const nowaGodzina = prompt('Zmień godzinę (np. 08:00-09:30):', rez.godzina);

    if (!nowaGodzina) return;

    try {
      await axios.put(`http://127.0.0.1:8000/rezerwacje/${rez.id}`, {
        nowy_dzien: nowyDzien,
        nowa_godzina: nowaGodzina,
        nowa_sala_id: rez.sala_id,
      });

      alert('Zaktualizowano termin zajęć!');
      odswiezDane();
    } catch (err: any) {
      alert('Błąd edycji: ' + (err.response?.data?.detail || err.message));
    }
  };

  const eksportujCSV = () => {
    if (rezerwacjeFiltrowane.length === 0) {
      alert('Brak danych do eksportu.');
      return;
    }

    const naglowki = [
      'Dzień',
      'Godzina',
      'Przedmiot',
      'Typ zajęć',
      'Grupa',
      'Prowadzący',
      'Sala',
    ];

    const wiersze = rezerwacjeFiltrowane.map((rez) => {
      const info = zajeciaInfo[rez.zajecia_id];

      return [
        rez.dzien,
        rez.godzina,
        info?.przedmiot || 'Nieznany przedmiot',
        info?.typ || 'Zajęcia',
        info?.grupa || 'Brak grupy',
        info?.wykladowca || 'Nieznany prowadzący',
        sale[rez.sala_id] || `Sala ID ${rez.sala_id}`,
      ];
    });

    const csv = [naglowki, ...wiersze]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(';')
      )
      .join('\n');

    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'harmonogram_zajec.csv';
    link.click();

    URL.revokeObjectURL(url);
  };

  const aktywneFiltry =
    filtrGrupy !== 'ALL' || filtrWykladowcy !== 'ALL' || filtrSali !== 'ALL';

  if (loading) {
    return (
      <div className="p-8 text-center text-xl text-gray-500">
        Ładowanie planu...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-white to-indigo-50">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              Wygenerowany plan zajęć
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Widok tygodniowy utworzony na podstawie rezerwacji zapisanych po działaniu solvera.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={eksportujCSV}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Eksportuj CSV
            </button>

            <button
              onClick={odswiezDane}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Odśwież dane
            </button>

            {aktywneFiltry && (
              <button
                onClick={resetujFiltry}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Wyczyść filtry
              </button>
            )}
          </div>
        </div>

        {statystykiSolvera && (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
                Status solvera
              </p>
              <p className="mt-1 text-xl font-extrabold text-indigo-900">
                {statystykiSolvera.status_solvera || 'Brak danych'}
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-500">
                Zmienne
              </p>
              <p className="mt-1 text-xl font-extrabold text-blue-900">
                {statystykiSolvera.liczba_zmiennych ?? '—'}
              </p>
            </div>

            <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-purple-500">
                Ograniczenia
              </p>
              <p className="mt-1 text-xl font-extrabold text-purple-900">
                {statystykiSolvera.liczba_ograniczen ?? '—'}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                Czas obliczeń
              </p>
              <p className="mt-1 text-xl font-extrabold text-gray-900">
                {typeof statystykiSolvera.czas_ms === 'number'
                  ? `${(statystykiSolvera.czas_ms / 1000).toFixed(2)} s`
                  : '—'}
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Grupa
            </label>
            <select
              value={filtrGrupy}
              onChange={(e) => setFiltrGrupy(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">Wszystkie grupy</option>
              {grupyOpcje.map((grupa) => (
                <option key={grupa} value={grupa}>
                  {grupa}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Prowadzący
            </label>
            <select
              value={filtrWykladowcy}
              onChange={(e) => setFiltrWykladowcy(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">Wszyscy prowadzący</option>
              {wykladowcyOpcje.map((wykladowca) => (
                <option key={wykladowca} value={wykladowca}>
                  {wykladowca}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Sala
            </label>
            <select
              value={filtrSali}
              onChange={(e) => setFiltrSali(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">Wszystkie sale</option>
              {saleOpcje.map((sala) => (
                <option key={sala.id} value={String(sala.id)}>
                  {sala.nazwa}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Zaplanowane zajęcia
            </p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">
              {rezerwacjeFiltrowane.length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Dni planistyczne
            </p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">
              {DNI_TYGODNIA.length}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Sloty czasowe
            </p>
            <p className="mt-1 text-2xl font-extrabold text-gray-900">
              {GODZINY.length}
            </p>
          </div>
        </div>
      </div>

      {rezerwacje.length === 0 ? (
        <div className="m-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
          <p className="text-lg font-bold text-gray-700">Plan jest pusty.</p>
          <p className="mt-2 text-sm text-gray-500">
            Przejdź do zakładki „1. Konfigurator”, zdefiniuj zajęcia i uruchom generator.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto p-6">
          <div className="min-w-[1180px] overflow-hidden rounded-xl border border-gray-200">
            <div className="grid grid-cols-[110px_repeat(5,minmax(190px,1fr))] bg-gray-50">
              <div className="sticky left-0 z-20 border-r border-gray-200 bg-gray-100 px-3 py-4 text-center text-xs font-extrabold uppercase tracking-wide text-gray-500">
                Godzina
              </div>

              {DNI_TYGODNIA.map((dzien) => (
                <div
                  key={dzien}
                  className="bg-indigo-600 px-3 py-4 text-center text-sm font-extrabold uppercase tracking-wider text-white"
                >
                  {dzien}
                </div>
              ))}

              {GODZINY.map((godzina) => (
                <Fragment key={godzina}>
                  <div className="sticky left-0 z-10 flex min-h-[116px] items-center justify-center border-r border-t border-gray-200 bg-gray-100 px-2 text-center text-xs font-bold text-gray-600">
                    {godzina}
                  </div>

                  {DNI_TYGODNIA.map((dzien) => {
                    const zajeciaWSlocie = znajdzZajecia(dzien, godzina);

                    return (
                      <div
                        key={`${dzien}-${godzina}`}
                        className={`min-h-[116px] border-t border-l border-gray-200 p-2 ${
                          zajeciaWSlocie.length === 0 ? 'bg-gray-50/70' : 'bg-white'
                        }`}
                      >
                        {zajeciaWSlocie.length === 0 ? (
                          <div className="flex h-full items-center justify-center text-xs text-gray-300">
                            —
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {zajeciaWSlocie.map((rez) => {
                              const info = zajeciaInfo[rez.zajecia_id];
                              const styl = stylTypu(info?.typ);

                              return (
                                <button
                                  key={rez.id}
                                  onClick={() => edytujZajecia(rez)}
                                  title="Kliknij, aby edytować termin"
                                  className={`group w-full rounded-lg border border-gray-100 border-l-4 ${styl.border} bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-50 hover:shadow-md`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="break-words text-sm font-extrabold leading-snug text-gray-900">
                                        {info?.przedmiot || 'Ładowanie...'}
                                      </p>
                                      <p className="mt-1 text-xs font-semibold text-gray-600">
                                        {info?.grupa || 'Brak grupy'}
                                      </p>
                                    </div>

                                    <span
                                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${styl.tag}`}
                                    >
                                      {info?.typ || 'Zajęcia'}
                                    </span>
                                  </div>

                                  <div className="mt-3 space-y-1 text-xs text-gray-600">
                                    <p className="font-semibold">
                                      👤 {info?.wykladowca || 'Nieznany prowadzący'}
                                    </p>
                                    <p className="font-semibold">
                                      🏫 {sale[rez.sala_id] || `Sala ID ${rez.sala_id}`}
                                    </p>
                                  </div>

                                  <p className="mt-2 text-right text-[11px] font-bold text-indigo-600 opacity-0 transition group-hover:opacity-100">
                                    Edytuj
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WidokPlanu;