import { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import axios from 'axios';

interface Wykladowca {
  id: number;
  imie: string;
  nazwisko: string;
  tytul_naukowy: string;
}

interface WykladowcaCreate {
    imie: string;
    nazwisko: string;
    tytul_naukowy: string;
}

const ListaWykladowcow = () => {
  const [wykladowcy, setWykladowcy] = useState<Wykladowca[]>([]);
  const [blad, setBlad] = useState<string>("");
  const [pokazFormularz, setPokazFormularz] = useState<boolean>(false);
  const [nowyWykladowca, setNowyWykladowca] = useState<WykladowcaCreate>({
    imie: '',
    nazwisko: '',
    tytul_naukowy: 'dr inż.'
  });

  const fetchWykladowcy = () => {
    axios.get<Wykladowca[]>('http://127.0.0.1:8000/wykladowcy/')
      .then(response => {
        setWykladowcy(response.data);
        setBlad("");
      })
      .catch(() => {
        setBlad("Nie udało się pobrać listy wykładowców. Sprawdź, czy backend działa (uvicorn).");
      });
  };

  useEffect(() => {
    fetchWykladowcy();
  }, []);

  const handleZmiana = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNowyWykladowca(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    axios.post('http://127.0.0.1:8000/wykladowcy/', nowyWykladowca)
      .then(() => {
        fetchWykladowcy(); 
        setPokazFormularz(false);
        setNowyWykladowca({ imie: '', nazwisko: '', tytul_naukowy: 'dr inż.' });
      })
      .catch(error => {
        setBlad(`Błąd dodawania: ${error.message}. Sprawdź, czy wszystkie pola są poprawne.`);
      });
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h3 className="text-2xl font-bold text-gray-800">Wykładowcy zarejestrowani w systemie</h3>
        <button
          onClick={() => setPokazFormularz(!pokazFormularz)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-md transition duration-150"
        >
          {pokazFormularz ? 'Ukryj formularz' : '+ Dodaj Wykładowcę'}
        </button>
      </div>

      {pokazFormularz && (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-inner">
          <h4 className="text-xl font-semibold mb-4 text-gray-700">Wprowadź dane nowego Wykładowcy</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <input 
              type="text" 
              name="imie" 
              placeholder="Imię" 
              value={nowyWykladowca.imie} 
              onChange={handleZmiana} 
              className="p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              required 
            />
            <input 
              type="text" 
              name="nazwisko" 
              placeholder="Nazwisko" 
              value={nowyWykladowca.nazwisko} 
              onChange={handleZmiana} 
              className="p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              required 
            />
            <input 
              type="text" 
              name="tytul_naukowy" 
              placeholder="Tytuł naukowy (np. dr inż.)" 
              value={nowyWykladowca.tytul_naukowy} 
              onChange={handleZmiana} 
              className="p-3 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg shadow-md transition duration-150"
          >
            Zapisz Wykładowcę
          </button>
        </form>
      )}

      {blad && <p className="text-red-600 font-semibold mb-4">{blad}</p>}

      <div className="space-y-4">
        {wykladowcy.length === 0 && !blad ? (
          <p className="text-gray-500">Brak wykładowców do wyświetlenia.</p>
        ) : (
          wykladowcy.map((w) => (
            <div key={w.id} className="border-l-4 border-indigo-500 p-4 bg-gray-50 flex justify-between items-center">
              <div>
                <strong className="text-lg text-gray-800">{w.tytul_naukowy} {w.imie} {w.nazwisko}</strong>
                <div className="text-sm text-gray-500">ID: {w.id}</div>
              </div>
              <span className="text-sm text-gray-400">Akcje</span> 
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ListaWykladowcow;