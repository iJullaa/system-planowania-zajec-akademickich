from ortools.linear_solver import pywraplp
from sqlalchemy.orm import Session
import models

SLOTY_CZASOWE = [
    ("Poniedziałek", "08:00-09:30"), ("Poniedziałek", "09:45-11:15"), ("Poniedziałek", "11:30-13:00"),
    ("Poniedziałek", "13:15-14:45"),
    ("Wtorek", "08:00-09:30"), ("Wtorek", "09:45-11:15"), ("Wtorek", "11:30-13:00"), ("Wtorek", "13:15-14:45"),
    ("Środa", "08:00-09:30"), ("Środa", "09:45-11:15"), ("Środa", "11:30-13:00"), ("Środa", "13:15-14:45"),
]


def uruchom_harmonogramowanie(db: Session):
    print("--- START ZAAWANSOWANEJ OPTYMALIZACJI (ILP) ---")

    zajecia_lista = db.query(models.Zajecia).all()
    sale_lista = db.query(models.Sala).all()
    przedmioty_dict = {p.id: p for p in db.query(models.Przedmiot).all()}

    if not zajecia_lista or not sale_lista:
        return {"status": "error", "message": "Brak danych wejściowych (zajęć lub sal)."}

    solver = pywraplp.Solver.CreateSolver('SCIP')
    if not solver:
        return {"status": "error", "message": "Brak solvera SCIP/CBC."}


    x = {}

    liczba_zmiennych = 0

    for z in zajecia_lista:
        przedmiot = przedmioty_dict.get(z.przedmiot_id)
        jest_labem = (przedmiot.typ == "Laboratorium")

        grupa = db.query(models.GrupaStudencka).filter_by(id=z.grupa_id).first()
        wymagana_pojemnosc = grupa.liczba_studentow if grupa else 0

        for s in sale_lista:

            if s.pojemnosc < wymagana_pojemnosc:
                continue


            if jest_labem and not s.czy_komputerowa:
                continue


            if przedmiot.typ == "Wykład" and s.czy_komputerowa:
                continue

            for t_idx, _ in enumerate(SLOTY_CZASOWE):
                x[(z.id, s.id, t_idx)] = solver.IntVar(0, 1, f'x_{z.id}_{s.id}_{t_idx}')
                liczba_zmiennych += 1

    print(f"Liczba zmiennych decyzyjnych: {liczba_zmiennych}")

    if liczba_zmiennych == 0:
        return {"status": "error", "message": "Brak możliwych kombinacji! Sprawdź pojemności sal lub typy zajęć."}


    for z in zajecia_lista:
        mozliwe_kombinacje = [x[(z.id, s.id, t)] for s in sale_lista for t in range(len(SLOTY_CZASOWE)) if
                              (z.id, s.id, t) in x]
        if not mozliwe_kombinacje:
            return {"status": "error", "message": f"Nie można zaplanować zajęć ID {z.id} (brak pasującej sali)."}
        solver.Add(sum(mozliwe_kombinacje) == 1)

    for s in sale_lista:
        for t in range(len(SLOTY_CZASOWE)):
            zajecia_w_tym_miejscu = [x[(z.id, s.id, t)] for z in zajecia_lista if (z.id, s.id, t) in x]
            solver.Add(sum(zajecia_w_tym_miejscu) <= 1)

    wykladowcy_ids = set(z.wykladowca_id for z in zajecia_lista)
    for w_id in wykladowcy_ids:
        zajecia_wykladowcy = [z for z in zajecia_lista if z.wykladowca_id == w_id]
        for t in range(len(SLOTY_CZASOWE)):
            kolizje = [x[(z.id, s.id, t)] for z in zajecia_wykladowcy for s in sale_lista if (z.id, s.id, t) in x]
            solver.Add(sum(kolizje) <= 1)

    grupy_ids = set(z.grupa_id for z in zajecia_lista)
    for g_id in grupy_ids:
        zajecia_grupy = [z for z in zajecia_lista if z.grupa_id == g_id]
        for t in range(len(SLOTY_CZASOWE)):
            kolizje = [x[(z.id, s.id, t)] for z in zajecia_grupy for s in sale_lista if (z.id, s.id, t) in x]
            solver.Add(sum(kolizje) <= 1)


    objective = solver.Objective()
    for (z_id, s_id, t_idx), var in x.items():
        koszt = t_idx * 10
        objective.SetCoefficient(var, koszt)

    objective.SetMinimization()

    print("Solver startuje...")
    status = solver.Solve()

    if status in [pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE]:
        print(f"Rozwiązanie znalezione! Funkcja celu: {objective.Value()}")

        db.query(models.Rezerwacja).delete()

        licznik = 0
        for (z_id, s_id, t_idx), var in x.items():
            if var.solution_value() > 0.5:
                dzien, godzina = SLOTY_CZASOWE[t_idx]
                db.add(models.Rezerwacja(
                    zajecia_id=z_id,
                    sala_id=s_id,
                    dzien=dzien,
                    godzina=godzina
                ))
                licznik += 1

        db.commit()
        return {"status": "ok", "message": f"Ułożono plan dla {licznik} zajęć (Optymalizacja zakończona)."}
    else:
        return {"status": "error", "message": "Nie udało się znaleźć rozwiązania spełniającego wszystkie wymagania."}