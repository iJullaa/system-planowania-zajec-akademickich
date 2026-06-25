import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

interface Opcja {
  id: number;
  opis: string;
}

interface Wykladowca {
  id: number;
  imie?: string;
  nazwisko?: string;
  tytul_naukowy?: string;
}

interface Przedmiot {
  id: number;
  nazwa: string;
  typ: string;
}

interface Grupa {
  id: number;
  nazwa: string;
  liczba_studentow?: number;
  kierunek?: string;
}

interface ZajeciaDetale {
  id: number;
  przedmiot_id: number;
  wykladowca_id: number;
  grupa_id: number;
  czas_trwania: number;
}

interface Zlecenie {
  przedmiot_id: number;
  wykladowca_id: number;
  grupa_id: number;
  czas_trwania: number;
}

const API_URL = 'http://127.0.0.1:8000';

const DefiniowanieZajec = () => {
  const [wykladowcy, setWykladowcy] = useState<Opcja[]>([]);
  const [przedmioty, setPrzedmioty] = useState<Opcja[]>([]);
  const [grupy, setGrupy] = useState<Opcja[]>([]);

  const [mapaWykladowcow, setMapaWykladowcow] = useState<Record<number, string>>({});
  const [mapaPrzedmiotow, setMapaPrzedmiotow] = useState<Record<number, Przedmiot>>({});
  const [mapaGrup, setMapaGrup] = useState<Record<number, Grupa>>({});

  const [zajeciaLista, setZajeciaLista] = useState<ZajeciaDetale[]>([]);

  const [noweZajecia, setNoweZajecia] = useState<Zlecenie>({
    przedmiot_id: 0,
    wykladowca_id: 0,
    grupa_id: 0,
    czas_trwania: 90,
  });

  const [komunikat, setKomunikat] = useState('');
  const [blad, setBlad] = useState('');
  const [loadingDane, setLoadingDane] = useState(true);
  const [loadingSolver, setLoadingSolver] = useState(false);

  const pobierzDane = async () => {
    setLoadingDane(true);
    setBlad('');

    try {
      const [resW, resP, resG, resZ] = await Promise.all([
        axios.get(`${API_URL}/wykladowcy/`),
        axios.get(`${API_URL}/przedmioty/`),
        axios.get(`${API_URL}/grupy/`),
        axios.get(`${API_URL}/zajecia/`),
      ]);

      const wykladowcyRaw: Wykladowca[] = resW.data;
      const przedmiotyRaw: Przedmiot[] = resP.data;
      const grupyRaw: Grupa[] = resG.data;
      const zajeciaRaw: ZajeciaDetale[] = resZ.data;

      const mapaW: Record<number, string> = {};
      wykladowcyRaw.forEach((w) => {
        const pelnaNazwa = `${w.tytul_naukowy || ''} ${w.imie || ''} ${w.nazwisko || ''}`
          .replace(/\s+/g, ' ')
          .trim();

        mapaW[w.id] = pelnaNazwa || `Prowadzący ID ${w.id}`;
      });

      const mapaP: Record<number, Przedmiot> = {};
      przedmiotyRaw.forEach((p) => {
        mapaP[p.id] = p;
      });

      const mapaG: Record<number, Grupa> = {};
      grupyRaw.forEach((g) => {
        mapaG[g.id] = g;
      });

      setMapaWykladowcow(mapaW);
      setMapaPrzedmiotow(mapaP);
      setMapaGrup(mapaG);

      setWykladowcy(
        wykladowcyRaw.map((w) => ({
          id: w.id,
          opis: mapaW[w.id],
        }))
      );

      setPrzedmioty(
        przedmiotyRaw.map((p) => ({
          id: p.id,
          opis: `${p.nazwa} (${p.typ})`,
        }))
      );

      setGrupy(
        grupyRaw.map((g) => ({
          id: g.id,
          opis: `${g.nazwa}${g.kierunek ? ` — ${g.kierunek}` : ''}`,
        }))
      );

      setZajeciaLista(zajeciaRaw);
    } catch (err) {
      console.error('Błąd pobierania danych konfiguratora:', err);
      setBlad('Nie udało się pobrać danych. Sprawdź, czy backend jest uruchomiony.');
    } finally {
      setLoadingDane(false);
    }
  };

  useEffect(() => {
    pobierzDane();
  }, []);

  const czyBrakujeSlownikow = useMemo(() => {
    return wykladowcy.length === 0 || przedmioty.length === 0 || grupy.length === 0;
  }, [wykladowcy.length, przedmioty.length, grupy.length]);

  const handleZmiana = (e: ChangeEvent<HTMLSelectElement>) => {
    setNoweZajecia({
      ...noweZajecia,
      [e.target.name]: Number(e.target.value),
    });
  };

  const wyczyscFormularz = () => {
    setNoweZajecia({
      przedmiot_id: 0,
      wykladowca_id: 0,
      grupa_id: 0,
      czas_trwania: 90,
    });
  };

  const handleDodajDoPuli = async (e: FormEvent) => {
    e.preventDefault();
    setKomunikat('');
    setBlad('');

    if (
      noweZajecia.przedmiot_id === 0 ||
      noweZajecia.wykladowca_id === 0 ||
      noweZajecia.grupa_id === 0
    ) {
      setBlad('Wybierz przedmiot, prowadzącego oraz grupę studencką.');
      return;
    }

    const istniejePodobne = zajeciaLista.some(
      (z) =>
        z.przedmiot_id === noweZajecia.przedmiot_id &&
        z.wykladowca_id === noweZajecia.wykladowca_id &&
        z.grupa_id === noweZajecia.grupa_id
    );

    if (istniejePodobne) {
      const potwierdzenie = confirm(
        'Taka sama kombinacja przedmiotu, prowadzącego i grupy już istnieje w puli. Czy dodać ją ponownie jako osobny blok zajęć?'
      );

      if (!potwierdzenie) {
        return;
      }
    }

    try {
      await axios.post(`${API_URL}/zajecia/`, noweZajecia);

      setKomunikat('Dodano jednostkę zajęciową do puli.');
      wyczyscFormularz();
      await pobierzDane();

      setTimeout(() => setKomunikat(''), 3000);
    } catch (err: any) {
      setBlad(`Błąd dodawania zajęć: ${err.response?.data?.detail || err.message}`);
    }
  };

  const uruchomGenerator = async () => {
    setKomunikat('');
    setBlad('');

    if (zajeciaLista.length === 0) {
      setBlad('Nie można uruchomić generatora, ponieważ pula zajęć jest pusta.');
      return;
    }

    if (czyBrakujeSlownikow) {
      setBlad(
        'Przed uruchomieniem generatora muszą istnieć przedmioty, prowadzący oraz grupy studenckie.'
      );
      return;
    }

    const potwierdzenie = confirm(
      'Czy na pewno chcesz wygenerować nowy plan?\n\nObecny harmonogram zostanie usunięty i zastąpiony nowym wynikiem solvera.'
    );

    if (!potwierdzenie) {
      return;
    }

    setLoadingSolver(true);

    try {
      const res = await axios.post(`${API_URL}/generuj-plan/`);

      if (res.data.statystyki) {
        localStorage.setItem(
          'ostatnie_statystyki_solvera',
          JSON.stringify({
            ...res.data.statystyki,
            data_generowania: new Date().toLocaleString('pl-PL'),
          })
        );
      }

      let komunikatAlertu = `Plan został wygenerowany.\n\n${res.data.message}`;

      if (res.data.statystyki) {
        komunikatAlertu +=
          `\n\nStatus solvera: ${res.data.statystyki.status_solvera}` +
          `\nLiczba zmiennych: ${res.data.statystyki.liczba_zmiennych}` +
          `\nLiczba ograniczeń: ${res.data.statystyki.liczba_ograniczen}` +
          `\nCzas obliczeń: ${(res.data.statystyki.czas_ms / 1000).toFixed(2)} s`;
      }

      komunikatAlertu += "\n\nPrzejdź do zakładki „Wynik”, aby zobaczyć harmonogram.";

      alert(komunikatAlertu);
      setKomunikat('Plan został wygenerowany i zapisany jako harmonogram.');
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message;
      setBlad(`Błąd solvera: ${msg}`);
      alert(`Błąd solvera:\n${msg}`);
    } finally {
      setLoadingSolver(false);
    }
  };

  const opisZajec = (z: ZajeciaDetale) => {
    const przedmiot = mapaPrzedmiotow[z.przedmiot_id];
    const grupa = mapaGrup[z.grupa_id];
    const wykladowca = mapaWykladowcow[z.wykladowca_id];

    return {
      przedmiot: przedmiot?.nazwa || `Przedmiot ID ${z.przedmiot_id}`,
      typ: przedmiot?.typ || 'Zajęcia',
      grupa: grupa?.nazwa || `Grupa ID ${z.grupa_id}`,
      kierunek: grupa?.kierunek || '',
      liczbaStudentow: grupa?.liczba_studentow,
      wykladowca: wykladowca || `Prowadzący ID ${z.wykladowca_id}`,
      czas: z.czas_trwania || 90,
    };
  };

  if (loadingDane) {
    return (
      <div className="p-8 text-center text-lg font-semibold text-gray-500">
        Ładowanie konfiguratora zajęć...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">
          Konfigurator zajęć do harmonogramu
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Zdefiniuj jednostki zajęciowe, które solver ma następnie przypisać do sal i
          terminów.
        </p>
      </div>

      {komunikat && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
          {komunikat}
        </div>
      )}

      {blad && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
          {blad}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Przedmioty
          </p>
          <p className="mt-1 text-3xl font-extrabold text-gray-900">{przedmioty.length}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Prowadzący
          </p>
          <p className="mt-1 text-3xl font-extrabold text-gray-900">{wykladowcy.length}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Grupy
          </p>
          <p className="mt-1 text-3xl font-extrabold text-gray-900">{grupy.length}</p>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
            Zajęcia w puli
          </p>
          <p className="mt-1 text-3xl font-extrabold text-indigo-900">
            {zajeciaLista.length}
          </p>
        </div>
      </div>

      {czyBrakujeSlownikow && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Przed dodaniem zajęć upewnij się, że w systemie istnieje przynajmniej jeden
          przedmiot, jeden prowadzący oraz jedna grupa studencka.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-xl font-extrabold text-gray-900">
              Dodaj jednostkę zajęciową
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Każdy wpis oznacza jeden blok zajęć dla wskazanej grupy i prowadzącego.
              W obecnej wersji solver traktuje zajęcia jako pojedynczy slot 90-minutowy.
            </p>
          </div>

          <form onSubmit={handleDodajDoPuli} className="space-y-5 p-6">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Przedmiot
              </label>
              <select
                name="przedmiot_id"
                value={noweZajecia.przedmiot_id}
                onChange={handleZmiana}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                required
              >
                <option value="0">Wybierz przedmiot</option>
                {przedmioty.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.opis}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Prowadzący
              </label>
              <select
                name="wykladowca_id"
                value={noweZajecia.wykladowca_id}
                onChange={handleZmiana}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                required
              >
                <option value="0">Wybierz prowadzącego</option>
                {wykladowcy.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.opis}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Grupa studencka
              </label>
              <select
                name="grupa_id"
                value={noweZajecia.grupa_id}
                onChange={handleZmiana}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                required
              >
                <option value="0">Wybierz grupę</option>
                {grupy.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.opis}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              <p className="font-bold text-gray-800">Czas trwania: 90 minut</p>
              <p className="mt-1">
                Parametr jest wysyłany do backendu, ale aktualny solver planuje każdą
                jednostkę jako jeden slot czasowy.
              </p>
            </div>

            <button
              type="submit"
              disabled={czyBrakujeSlownikow}
              className={`w-full rounded-xl px-6 py-3 text-sm font-bold text-white shadow-sm transition ${
                czyBrakujeSlownikow
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              Dodaj do puli zajęć
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50 p-6 shadow-xl">
          <h2 className="text-xl font-extrabold text-gray-900">
            Generowanie harmonogramu
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Po przygotowaniu puli zajęć solver ILP przypisze jednostki zajęciowe do
            dostępnych sal i slotów czasowych, uwzględniając ograniczenia zasobowe oraz
            funkcję celu.
          </p>

          <div className="mt-5 rounded-xl border border-white/70 bg-white/80 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Przed uruchomieniem
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>-- zdefiniuj realistyczne sale dydaktyczne,</li>
              <li>-- dodaj prowadzących i grupy studenckie,</li>
              <li>-- utwórz listę zajęć do zaplanowania,</li>
              <li>-- sprawdź, czy każda grupa ma salę o odpowiedniej pojemności.</li>
            </ul>
          </div>

          <button
            onClick={uruchomGenerator}
            disabled={loadingSolver || zajeciaLista.length === 0}
            className={`mt-6 w-full rounded-xl px-6 py-4 text-base font-extrabold text-white shadow-xl transition ${
              loadingSolver || zajeciaLista.length === 0
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
            }`}
          >
            {loadingSolver ? 'Trwa obliczanie planu...' : 'Uruchom generator planu'}
          </button>

          {zajeciaLista.length === 0 && (
            <p className="mt-3 text-center text-xs font-semibold text-gray-500">
              Generator będzie dostępny po dodaniu co najmniej jednej jednostki zajęciowej.
            </p>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white shadow-xl">
        <div className="border-b border-gray-100 p-6">
          <h2 className="text-xl font-extrabold text-gray-900">
            Pula zajęć do zaplanowania
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Poniższe pozycje zostaną przekazane do solvera jako jednostki zajęciowe.
          </p>
        </div>

        {zajeciaLista.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-lg font-bold text-gray-700">Brak zajęć w puli.</p>
            <p className="mt-2 text-sm text-gray-500">
              Dodaj pierwszą jednostkę zajęciową za pomocą formularza powyżej.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-2">
            {zajeciaLista.map((z) => {
              const opis = opisZajec(z);

              return (
                <div
                  key={z.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-extrabold text-gray-900">
                        {opis.przedmiot}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-indigo-600">
                        {opis.typ}
                      </p>
                    </div>

                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                      ID: {z.id}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1 text-sm text-gray-600">
                    <p>
                      <span className="font-bold text-gray-800">Grupa:</span> {opis.grupa}
                      {opis.kierunek ? ` (${opis.kierunek})` : ''}
                    </p>
                    <p>
                      <span className="font-bold text-gray-800">Prowadzący:</span>{' '}
                      {opis.wykladowca}
                    </p>
                    <p>
                      <span className="font-bold text-gray-800">Czas trwania:</span>{' '}
                      {opis.czas} min
                    </p>
                    {typeof opis.liczbaStudentow === 'number' && (
                      <p>
                        <span className="font-bold text-gray-800">Liczba studentów:</span>{' '}
                        {opis.liczbaStudentow}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default DefiniowanieZajec;