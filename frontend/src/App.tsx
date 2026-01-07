import { useState, useEffect } from 'react'
import axios from 'axios'

interface Wykladowca {
  id: number;
  imie: string;
  nazwisko: string;
  tytul_naukowy: string;
}

function App() {
  const [wykladowcy, setWykladowcy] = useState<Wykladowca[]>([])

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/wykladowcy/')
      .then(response => {
        setWykladowcy(response.data)
        console.log("Pobrano dane:", response.data)
      })
      .catch(error => {
        console.error("Błąd połączenia z API:", error)
      })
  }, [])

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>System Planowania Zajęć</h1>
      <h2>Lista Wykładowców (z Bazy Danych)</h2>

      {wykladowcy.length === 0 ? (
        <p>Ładowanie danych lub brak wykładowców...</p>
      ) : (
        <ul>
          {wykladowcy.map((wykladowca) => (
            <li key={wykladowca.id} style={{ marginBottom: "10px", padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
              <strong>{wykladowca.tytul_naukowy} {wykladowca.imie} {wykladowca.nazwisko}</strong>
              <br />
              <span style={{ fontSize: "0.8em", color: "gray" }}>ID w bazie: {wykladowca.id}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App