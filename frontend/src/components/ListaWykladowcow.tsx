import { useState, useEffect } from 'react';
import axios from 'axios';

interface Wykladowca {
  id: number;
  imie: string;
  nazwisko: string;
  tytul_naukowy: string;
}

const ListaWykladowcow = () => {
  const [wykladowcy, setWykladowcy] = useState<Wykladowca[]>([]);
  const [blad, setBlad] = useState<string>("");

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/wykladowcy/')
      .then(response => {
        setWykladowcy(response.data);
      })
      .catch(() => {
        setBlad("Nie udało się pobrać listy wykładowców. Sprawdź, czy backend działa.");
      });
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">Wykładowcy zarejestrowani w systemie</h3>
      
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
              <button className="text-sm text-red-500 hover:text-red-700">Usuń</button> 
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ListaWykladowcow;