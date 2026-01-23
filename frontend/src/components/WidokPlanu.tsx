import { useState, useEffect } from 'react';
import axios from 'axios';

interface Rezerwacja {
  id: number;
  zajecia_id: number;
  sala_id: number;
  dzien: string;
  godzina: string;
}

interface Zasob { id: number; nazwa: string; [key: string]: any; }
interface ZajeciaDetale { id: number; przedmiot_id: number; wykladowca_id: number; grupa_id: number; }

const WidokPlanu = () => {
  const [rezerwacje, setRezerwacje] = useState<Rezerwacja[]>([]);
  const [loading, setLoading] = useState(true);

  const [sale, setSale] = useState<Record<number, string>>({});
  const [zajeciaInfo, setZajeciaInfo] = useState<Record<number, string>>({});

  const odswiezDane = async () => {
    setLoading(true);
    try {
      const resPlan = await axios.get('http://127.0.0.1:8000/harmonogram/');
      setRezerwacje(resPlan.data);

      const [resSale, resZajecia, resPrzedmioty, resWykladowcy, resGrupy] = await Promise.all([
          axios.get('http://127.0.0.1:8000/sale/'),
          axios.get('http://127.0.0.1:8000/zajecia/'),
          axios.get('http://127.0.0.1:8000/przedmioty/'),
          axios.get('http://127.0.0.1:8000/wykladowcy/'),
          axios.get('http://127.0.0.1:8000/grupy/'),
      ]);

      
      const mapaSal: Record<number, string> = {};
      resSale.data.forEach((s: Zasob) => mapaSal[s.id] = s.nazwa);
      setSale(mapaSal);

      const nazwyPrzedmiotow = Object.fromEntries(resPrzedmioty.data.map((p: any) => [p.id, p.nazwa]));
      const nazwyWykladowcow = Object.fromEntries(resWykladowcy.data.map((w: any) => [w.id, `${w.tytul_naukowy} ${w.nazwisko}`]));
      const nazwyGrup = Object.fromEntries(resGrupy.data.map((g: any) => [g.id, g.nazwa]));

      const mapaZajec: Record<number, string> = {};
      resZajecia.data.forEach((z: ZajeciaDetale) => {
          const przedmiot = nazwyPrzedmiotow[z.przedmiot_id] || "Nieznany";
          const wykladowca = nazwyWykladowcow[z.wykladowca_id] || "Nieznany";
          const grupa = nazwyGrup[z.grupa_id] || "Brak grupy";
          
          mapaZajec[z.id] = `${przedmiot} (${grupa})\n${wykladowca}`;
      });
      setZajeciaInfo(mapaZajec);

      setLoading(false);
    } catch (error) {
      console.error("Błąd pobierania danych:", error);
      alert("Nie udało się pobrać planu. Sprawdź backend.");
      setLoading(false);
    }
  };

  useEffect(() => {
    odswiezDane();
  }, []);

  const dniTygodnia = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"];
  const godziny = ["08:00-09:30", "09:45-11:15", "11:30-13:00", "13:15-14:45", "15:00-16:30", "16:45-18:15"];

  const znajdzZajecia = (dzien: string, godzina: string) => {
    return rezerwacje.filter(r => r.dzien === dzien && r.godzina === godzina);
  };

  const edytujZajecia = async (rez: Rezerwacja) => {
      const nowyDzien = prompt("Zmień dzień (Poniedziałek, Wtorek, Środa):", rez.dzien);
      if (!nowyDzien) return;
      
      const nowaGodzina = prompt("Zmień godzinę (np. 08:00-09:30):", rez.godzina);
      if (!nowaGodzina) return;

      try {
          await axios.put(`http://127.0.0.1:8000/rezerwacje/${rez.id}`, {
              nowy_dzien: nowyDzien,
              nowa_godzina: nowaGodzina,
              nowa_sala_id: rez.sala_id 
          });
          alert("Zaktualizowano termin zajęć!");
          odswiezDane();
      } catch (err: any) {
          alert("Błąd edycji: " + (err.response?.data?.detail || err.message));
      }
  };

  if (loading) return <div className="p-8 text-center text-xl text-gray-500">Ładowanie planu...</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-xl overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Wygenerowany Plan Zajęć</h2>
        <button onClick={odswiezDane} className="text-sm text-indigo-600 hover:text-indigo-800 underline">Odśwież dane</button>
      </div>
      
      {rezerwacje.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-lg font-semibold">Plan jest pusty.</p>
            <p className="text-sm mt-2">Przejdź do zakładki "1. Konfigurator", zdefiniuj zajęcia i uruchom generator.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dniTygodnia.map(dzien => (
            <div key={dzien} className="border rounded-lg overflow-hidden shadow-sm bg-gray-50">
              <div className="bg-indigo-600 text-white text-center py-3 font-bold text-lg uppercase tracking-wider">
                {dzien}
              </div>
              
              <div className="divide-y divide-gray-200">
                {godziny.map(godz => {
                  const zajeciaWSlotcie = znajdzZajecia(dzien, godz);
                  
                  return (
                    <div key={godz} className="flex min-h-[100px]">
                      <div className="w-24 bg-gray-100 p-2 text-xs font-bold text-gray-500 border-r flex items-center justify-center text-center">
                        {godz}
                      </div>
                      
                      <div className="flex-1 p-2 relative">
                        {zajeciaWSlotcie.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <span className="text-gray-300 text-xs italic">-</span>
                            </div>
                        ) : (
                            zajeciaWSlotcie.map(rez => (
                                <div 
                                    key={rez.id} 
                                    onClick={() => edytujZajecia(rez)}
                                    className="mb-2 p-3 bg-white border-l-4 border-blue-500 rounded shadow-sm hover:shadow-md hover:bg-blue-50 transition cursor-pointer group"
                                    title="Kliknij, aby edytować termin"
                                >
                                    <div className="text-sm font-bold text-gray-800 whitespace-pre-line leading-snug">
                                        {zajeciaInfo[rez.zajecia_id] || "Ładowanie..."}
                                    </div>
                                    <div className="mt-2 flex items-center text-xs text-gray-600 font-semibold">
                                        🏫 {sale[rez.sala_id] || rez.sala_id}
                                    </div>
                                    <div className="hidden group-hover:block text-xs text-blue-600 mt-1 font-bold text-right">
                                        Edytuj ✏️
                                    </div>
                                </div>
                            ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WidokPlanu;