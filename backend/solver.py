from ortools.linear_solver import pywraplp
from sqlalchemy.orm import Session
from collections import defaultdict
import models

DNI = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"]
GODZINY = ["08:00-09:30", "09:45-11:15", "11:30-13:00", "13:15-14:45", "15:00-16:30", "16:45-18:15"]

SLOTY_CONFIG = []
global_idx = 0
for d_idx, dzien in enumerate(DNI):
    for h_idx, godzina in enumerate(GODZINY):
        SLOTY_CONFIG.append({
            "global_id": global_idx,
            "dzien_nazwa": dzien,
            "godzina": godzina,
            "dzien_idx": d_idx,
            "godzina_idx": h_idx
        })
        global_idx += 1

LIMIT_CZASU_MS = 30000
GAP_TOLERANCJA = 0.05


def uruchom_harmonogramowanie(db: Session):
    print(f"--- START SOLVERA v6.1 (TURBO) ---")

    zajecia_lista = db.query(models.Zajecia).all()
    sale_lista = db.query(models.Sala).all()
    przedmioty = {p.id: p for p in db.query(models.Przedmiot).all()}
    grupy = {g.id: g for g in db.query(models.GrupaStudencka).all()}
    wykladowcy = {w.id: w for w in db.query(models.Wykladowca).all()}

    if not zajecia_lista or not sale_lista:
        return {"status": "error", "message": "Brak danych wejściowych."}

    solver = pywraplp.Solver.CreateSolver('SCIP')
    if not solver: return {"status": "error", "message": "Brak solvera SCIP."}


    solver.set_time_limit(LIMIT_CZASU_MS)

    solver_params = pywraplp.MPSolverParameters()
    solver_params.SetDoubleParam(pywraplp.MPSolverParameters.RELATIVE_MIP_GAP, GAP_TOLERANCJA)

    x = {}
    mozliwe_sloty = defaultdict(list)
    group_vars_by_time = defaultdict(lambda: defaultdict(list))
    objective = solver.Objective()

    print("Generowanie zmiennych...")

    count_vars = 0
    for z in zajecia_lista:
        p = przedmioty.get(z.przedmiot_id)
        g = grupy.get(z.grupa_id)
        w = wykladowcy.get(z.wykladowca_id)
        wymagana = g.liczba_studentow
        jest_lab = (p.typ == "Laboratorium")
        tytul_prof = ("prof" in (w.tytul_naukowy or "").lower())

        for s in sale_lista:

            if s.pojemnosc < wymagana: continue

            if s.pojemnosc > wymagana * 3: continue

            if jest_lab and not s.czy_komputerowa: continue
            if p.typ == "Wykład" and s.czy_komputerowa and len(sale_lista) > 2: continue

            for slot in SLOTY_CONFIG:
                t_id = slot["global_id"]

                var = solver.IntVar(0, 1, f'x_{z.id}_{s.id}_{t_id}')
                x[(z.id, s.id, t_id)] = var

                mozliwe_sloty[z.id].append((s.id, t_id))
                group_vars_by_time[z.grupa_id][t_id].append(var)
                count_vars += 1

                koszt = 0
                koszt += slot["godzina_idx"] * 10
                if tytul_prof and slot["dzien_idx"] == 4: koszt += 100

                waste = s.pojemnosc - wymagana
                koszt += waste * 1

                objective.SetCoefficient(var, koszt)

    print(f"Liczba zmiennych: {count_vars}")
    if count_vars == 0: return {"status": "error", "message": "Brak możliwych kombinacji."}


    for z in zajecia_lista:
        solver.Add(sum(x[(z.id, s, t)] for s, t in mozliwe_sloty[z.id]) == 1)

    for s in sale_lista:
        for slot in SLOTY_CONFIG:
            t = slot["global_id"]
            vars_in_cell = [x[(z.id, s.id, t)] for z in zajecia_lista if (z.id, s.id, t) in x]
            if vars_in_cell: solver.Add(sum(vars_in_cell) <= 1)

    zasoby_ids = []
    zasoby_ids.extend([('g', g.id) for g in grupy.values()])
    zasoby_ids.extend([('w', w.id) for w in wykladowcy.values()])

    for r_type, r_id in zasoby_ids:
        zajecia_r = [z for z in zajecia_lista if (z.grupa_id == r_id if r_type == 'g' else z.wykladowca_id == r_id)]
        if not zajecia_r: continue

        for slot in SLOTY_CONFIG:
            t = slot["global_id"]
            vars_slot = []
            for z in zajecia_r:
                vars_slot.extend([x[(z.id, s, tt)] for s, tt in mozliwe_sloty[z.id] if tt == t])

            if vars_slot: solver.Add(sum(vars_slot) <= 1)

        if len(zajecia_r) > 3:
            limit = 3 if r_type == 'g' else 5
            for d_idx in range(5):
                vars_day = []
                for z in zajecia_r:
                    for s, t in mozliwe_sloty[z.id]:
                        if SLOTY_CONFIG[t]["dzien_idx"] == d_idx:
                            vars_day.append(x[(z.id, s, t)])
                if vars_day: solver.Add(sum(vars_day) <= limit)


    objective.SetMinimization()
    print("Budowanie wiązań czasowych...")

    for g_id in grupy:
        zajecia_grupy = [z for z in zajecia_lista if z.grupa_id == g_id]
        if len(zajecia_grupy) < 2: continue

        for d_idx in range(5):
            sloty_dnia = [s for s in SLOTY_CONFIG if s["dzien_idx"] == d_idx]

            for i in range(len(sloty_dnia) - 1):
                t1 = sloty_dnia[i]["global_id"]
                t2 = sloty_dnia[i + 1]["global_id"]

                vars_t1 = group_vars_by_time[g_id][t1]
                vars_t2 = group_vars_by_time[g_id][t2]

                if vars_t1 and vars_t2:

                    b_adj = solver.IntVar(0, 1, f'adj_G{g_id}_T{t1}')
                    solver.Add(b_adj <= sum(vars_t1))
                    solver.Add(b_adj <= sum(vars_t2))

                    objective.SetCoefficient(b_adj, -200)

    print(f"Uruchamianie SCIP z limitem {LIMIT_CZASU_MS / 1000}s...")

    status = solver.Solve(solver_params)

    if status in [pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE]:
        print(f"✅ Wynik gotowy! Status: {status}")

        db.query(models.Rezerwacja).delete()
        count = 0
        for (z_id, s_id, t_id), var in x.items():
            if var.solution_value() > 0.5:
                slot = SLOTY_CONFIG[t_id]
                db.add(models.Rezerwacja(
                    zajecia_id=z_id,
                    sala_id=s_id,
                    dzien=slot["dzien_nazwa"],
                    godzina=slot["godzina"]
                ))
                count += 1
        db.commit()

        msg = "Plan gotowy!"
        if status == pywraplp.Solver.FEASIBLE:
            msg += " (Znaleziono najlepsze rozwiązanie w dostępnym czasie)"
        else:
            msg += " (Rozwiązanie optymalne)"

        return {"status": "ok", "message": f"{msg}. Zaplanowano {count} zajęć."}
    else:
        return {"status": "error",
                "message": "Nie znaleziono rozwiązania w zadanym czasie (30s). Spróbuj uprościć dane."}