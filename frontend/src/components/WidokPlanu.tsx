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

  useEffect(() => {
    const fetchData = async () => {
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

        const mapaZajec: Record<number, string> = {};
        
        const nazwyPrzedmiotow = Object.fromEntries(resPrzedmioty.data.map((p: any) => [p.id, p.nazwa]));
        const nazwyWykladowcow = Object.fromEntries(resWykladowcy.data.map((w: any) => [w.id, `${w.tytul_naukowy} ${w.nazwisko}`]));
        const nazwyGrup = Object.fromEntries(resGrupy.data.map((g: any) => [g.id, g.nazwa]));

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
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const dniTygodnia = ["Poniedziałek", "Wtorek"];
  const godziny = ["08:00-09:30", "09:45-11:15", "11:30-13:00"];

  const znajdzZajecia = (dzien: string, godzina: string) => {
    return rezerwacje.filter(r => r.dzien === dzien && r.godzina === godzina);
  };

  if (loading) return <div className="p-8">Ładowanie planu...</div>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-xl overflow-x-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Wygenerowany Plan Zajęć</h2>
      
      {rezerwacje.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
            Brak zaplanowanych zajęć. Przejdź do zakładki "Generuj Plan" i uruchom algorytm.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dniTygodnia.map(dzien => (
            <div key={dzien} className="border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-indigo-600 text-white text-center py-2 font-bold text-lg">
                {dzien}
              </div>
              <div className="divide-y divide-gray-200">
                {godziny.map(godz => {
                  const zajeciaWSlotcie = znajdzZajecia(dzien, godz);
                  
                  return (
                    <div key={godz} className="flex min-h-[100px]">
                      <div className="w-24 bg-gray-50 p-4 text-xs font-bold text-gray-500 border-r flex items-center justify-center">
                        {godz}
                      </div>
                      
                      <div className="flex-1 p-2 bg-white relative">
                        {zajeciaWSlotcie.length === 0 ? (
                            <span className="text-gray-300 text-sm italic p-2">- wolne -</span>
                        ) : (
                            zajeciaWSlotcie.map(rez => (
                                <div key={rez.id} className="mb-2 p-3 bg-blue-50 border-l-4 border-blue-500 rounded shadow-sm hover:shadow-md transition">
                                    <div className="text-sm font-bold text-gray-800 whitespace-pre-line">
                                        {zajeciaInfo[rez.zajecia_id] || "Ładowanie..."}
                                    </div>
                                    <div className="mt-1 flex items-center text-xs text-gray-600 font-semibold">
                                         Sala: {sale[rez.sala_id] || rez.sala_id}
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