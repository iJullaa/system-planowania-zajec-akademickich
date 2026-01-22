from ortools.linear_solver import pywraplp
from sqlalchemy.orm import Session
import models

SLOTY_CZASOWE = [
    ("Poniedziałek", "08:00-09:30"),
    ("Poniedziałek", "09:45-11:15"),
    ("Poniedziałek", "11:30-13:00"),
    ("Wtorek", "08:00-09:30"),
    ("Wtorek", "09:45-11:15"),
    ("Wtorek", "11:30-13:00"),
]


def uruchom_harmonogramowanie(db: Session):
    print("--- START OPTYMALIZACJI ---")

    zajecia_lista = db.query(models.Zajecia).all()
    sale_lista = db.query(models.Sala).all()

    if not zajecia_lista:
        return {"status": "error", "message": "Brak zajęć do zaplanowania!"}
    if not sale_lista:
        return {"status": "error", "message": "Brak sal w systemie!"}

    solver = pywraplp.Solver.CreateSolver('SCIP')
    if not solver:
        return {"status": "error", "message": "Nie znaleziono solvera SCIP/CBC"}

    # zmienne Decyzyjne
    # x[z_id, s_id, t_idx] = 1 jeśli zajęcie Z jest w sali S w czasie T, 0 w przeciwnym razie
    x = {}

    liczba_zmiennych = 0
    for z in zajecia_lista:
        for s in sale_lista:
            grupa = db.query(models.GrupaStudencka).filter_by(id=z.grupa_id).first()
            if grupa and s.pojemnosc < grupa.liczba_studentow:
                continue

            for t_idx, (dzien, godzina) in enumerate(SLOTY_CZASOWE):
                x[(z.id, s.id, t_idx)] = solver.IntVar(0, 1, f'x_{z.id}_{s.id}_{t_idx}')
                liczba_zmiennych += 1

    print(f"Utworzono {liczba_zmiennych} zmiennych decyzyjnych.")

    # 1. Każde zajęcie musi się odbyć DOKŁADNIE RAZ
    for z in zajecia_lista:
        solver.Add(
            sum(x[(z.id, s.id, t_idx)]
                for s in sale_lista
                for t_idx in range(len(SLOTY_CZASOWE))
                if (z.id, s.id, t_idx) in x
                ) == 1
        )

    # 2. W jednej sali w jednym czasie może być MAX JEDNO zajęcie
    for s in sale_lista:
        for t_idx in range(len(SLOTY_CZASOWE)):
            solver.Add(
                sum(x[(z.id, s.id, t_idx)]
                    for z in zajecia_lista
                    if (z.id, s.id, t_idx) in x
                    ) <= 1
            )

    # 3. Konflikty Prowadzących (Jeden nauczyciel nie może być w dwóch miejscach naraz)
    wykladowcy_ids = set(z.wykladowca_id for z in zajecia_lista)
    for w_id in wykladowcy_ids:
        zajecia_tego_wykladowcy = [z for z in zajecia_lista if z.wykladowca_id == w_id]

        for t_idx in range(len(SLOTY_CZASOWE)):
            solver.Add(
                sum(x[(z.id, s.id, t_idx)]
                    for z in zajecia_tego_wykladowcy
                    for s in sale_lista
                    if (z.id, s.id, t_idx) in x
                    ) <= 1
            )

    # 4. Konflikty Grup (Jedna grupa nie może mieć dwóch lekcji naraz)
    grupy_ids = set(z.grupa_id for z in zajecia_lista)
    for g_id in grupy_ids:
        zajecia_tej_grupy = [z for z in zajecia_lista if z.grupa_id == g_id]

        for t_idx in range(len(SLOTY_CZASOWE)):
            solver.Add(
                sum(x[(z.id, s.id, t_idx)]
                    for z in zajecia_tej_grupy
                    for s in sale_lista
                    if (z.id, s.id, t_idx) in x
                    ) <= 1
            )

    print("Rozpoczynam obliczenia solvera")
    status = solver.Solve()

    if status == pywraplp.Solver.OPTIMAL:
        print("ZNALEZIONO ROZWIĄZANIE OPTYMALNE!")

        db.query(models.Rezerwacja).delete()

        licznik = 0
        for (z_id, s_id, t_idx), zmienna in x.items():
            if zmienna.solution_value() > 0.5:
                dzien, godzina = SLOTY_CZASOWE[t_idx]

                nowa_rezerwacja = models.Rezerwacja(
                    zajecia_id=z_id,
                    sala_id=s_id,
                    dzien=dzien,
                    godzina=godzina
                )
                db.add(nowa_rezerwacja)
                licznik += 1

        db.commit()
        return {"status": "ok", "message": f"Zaplanowano {licznik} zajęć."}
    else:
        print("Nie znaleziono rozwiązania.")
        return {"status": "error", "message": "Nie udało się ułożyć planu przy obecnych ograniczeniach."}