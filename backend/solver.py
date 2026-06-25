from ortools.linear_solver import pywraplp
from sqlalchemy.orm import Session
from collections import defaultdict
import models


DNI = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"]
GODZINY = [
    "08:00-09:30",
    "09:45-11:15",
    "11:30-13:00",
    "13:15-14:45",
    "15:00-16:30",
    "16:45-18:15"
]

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

# Wagi funkcji celu
LATE_HOUR_WEIGHT = 10
PROFESSOR_FRIDAY_PENALTY = 100
ROOM_WASTE_WEIGHT = 1
ADJACENT_CLASSES_REWARD = 200


def czy_profesor(wykladowca) -> bool:
    """
    Sprawdza, czy prowadzący ma tytuł profesora.
    Obecnie wykorzystywana jest uproszczona reguła tekstowa.
    """
    if not wykladowca:
        return False

    tytul = (wykladowca.tytul_naukowy or "").lower()
    return "prof" in tytul


def sala_pasuje_do_zajec(sala, zajecia, przedmiot, grupa, liczba_sal: int) -> bool:
    """
    Sprawdza, czy sala może obsłużyć dane zajęcia.
    Ta funkcja odpowiada za wstępną redukcję przestrzeni decyzyjnej.
    """
    if not sala or not zajecia or not przedmiot or not grupa:
        return False

    wymagana_pojemnosc = grupa.liczba_studentow
    typ_przedmiotu = (przedmiot.typ or "").lower()

    # Sala nie może być za mała.
    if sala.pojemnosc < wymagana_pojemnosc:
        return False

    # Sala nie powinna być nieproporcjonalnie duża względem grupy.
    if sala.pojemnosc > wymagana_pojemnosc * 3:
        return False

    # Laboratoria wymagają sali komputerowej.
    if typ_przedmiotu == "laboratorium" and not sala.czy_komputerowa:
        return False

    # Wykłady nie powinny zajmować sal komputerowych,
    # jeżeli w systemie jest więcej niż 2 sale.
    if typ_przedmiotu == "wykład" and sala.czy_komputerowa and liczba_sal > 2:
        return False

    return True


def sprawdz_dane_wejsciowe(zajecia_lista, sale_lista, przedmioty, grupy, wykladowcy):
    """
    Waliduje dane przed uruchomieniem solvera.
    Dzięki temu można odróżnić błędne dane wejściowe od braku rozwiązania.
    """
    if not zajecia_lista:
        return False, "Brak zajęć do zaplanowania."

    if not sale_lista:
        return False, "Brak sal dydaktycznych."

    liczba_sal = len(sale_lista)

    for z in zajecia_lista:
        przedmiot = przedmioty.get(z.przedmiot_id)
        grupa = grupy.get(z.grupa_id)
        wykladowca = wykladowcy.get(z.wykladowca_id)

        if not przedmiot:
            return False, f"Zajęcia ID={z.id} nie mają poprawnie przypisanego przedmiotu."

        if not grupa:
            return False, f"Zajęcia ID={z.id} nie mają poprawnie przypisanej grupy."

        if not wykladowca:
            return False, f"Zajęcia ID={z.id} nie mają poprawnie przypisanego prowadzącego."

        dopuszczalne_sale = [
            sala for sala in sale_lista
            if sala_pasuje_do_zajec(sala, z, przedmiot, grupa, liczba_sal)
        ]

        if not dopuszczalne_sale:
            return (
                False,
                f"Brak dopuszczalnej sali dla zajęć ID={z.id} "
                f"({przedmiot.nazwa if hasattr(przedmiot, 'nazwa') else 'brak nazwy'})."
            )

    return True, "Dane wejściowe są poprawne."


def status_solvera_na_tekst(status: int) -> str:
    if status == pywraplp.Solver.OPTIMAL:
        return "OPTIMAL"
    if status == pywraplp.Solver.FEASIBLE:
        return "FEASIBLE"
    if status == pywraplp.Solver.INFEASIBLE:
        return "INFEASIBLE"
    if status == pywraplp.Solver.UNBOUNDED:
        return "UNBOUNDED"
    if status == pywraplp.Solver.ABNORMAL:
        return "ABNORMAL"
    if status == pywraplp.Solver.NOT_SOLVED:
        return "NOT_SOLVED"

    return f"UNKNOWN_STATUS_{status}"


def uruchom_harmonogramowanie(db: Session):
    print("--- START SOLVERA v7.0 ---")

    zajecia_lista = db.query(models.Zajecia).all()
    sale_lista = db.query(models.Sala).all()
    przedmioty = {p.id: p for p in db.query(models.Przedmiot).all()}
    grupy = {g.id: g for g in db.query(models.GrupaStudencka).all()}
    wykladowcy = {w.id: w for w in db.query(models.Wykladowca).all()}

    poprawne_dane, komunikat = sprawdz_dane_wejsciowe(
        zajecia_lista=zajecia_lista,
        sale_lista=sale_lista,
        przedmioty=przedmioty,
        grupy=grupy,
        wykladowcy=wykladowcy
    )

    if not poprawne_dane:
        return {
            "status": "error",
            "message": komunikat
        }

    solver = pywraplp.Solver.CreateSolver("SCIP")
    if not solver:
        return {
            "status": "error",
            "message": "Brak solvera SCIP."
        }

    solver.set_time_limit(LIMIT_CZASU_MS)

    solver_params = pywraplp.MPSolverParameters()
    solver_params.SetDoubleParam(
        pywraplp.MPSolverParameters.RELATIVE_MIP_GAP,
        GAP_TOLERANCJA
    )

    x = {}
    mozliwe_sloty = defaultdict(list)
    group_vars_by_time = defaultdict(lambda: defaultdict(list))
    objective = solver.Objective()

    print("Generowanie zmiennych...")

    count_vars = 0
    liczba_sal = len(sale_lista)

    for z in zajecia_lista:
        p = przedmioty.get(z.przedmiot_id)
        g = grupy.get(z.grupa_id)
        w = wykladowcy.get(z.wykladowca_id)

        wymagana_pojemnosc = g.liczba_studentow
        tytul_prof = czy_profesor(w)

        for s in sale_lista:
            if not sala_pasuje_do_zajec(s, z, p, g, liczba_sal):
                continue

            for slot in SLOTY_CONFIG:
                t_id = slot["global_id"]

                var = solver.IntVar(0, 1, f"x_{z.id}_{s.id}_{t_id}")
                x[(z.id, s.id, t_id)] = var

                mozliwe_sloty[z.id].append((s.id, t_id))
                group_vars_by_time[z.grupa_id][t_id].append(var)
                count_vars += 1

                koszt = 0

                # Preferowanie wcześniejszych godzin.
                koszt += slot["godzina_idx"] * LATE_HOUR_WEIGHT

                # Kara za zajęcia profesora w piątek.
                if tytul_prof and slot["dzien_idx"] == 4:
                    koszt += PROFESSOR_FRIDAY_PENALTY

                # Kara za niewykorzystaną pojemność sali.
                waste = s.pojemnosc - wymagana_pojemnosc
                koszt += waste * ROOM_WASTE_WEIGHT

                objective.SetCoefficient(var, koszt)

    print(f"Liczba zmiennych decyzyjnych x: {count_vars}")

    if count_vars == 0:
        return {
            "status": "error",
            "message": "Brak możliwych kombinacji zajęcia-sala-termin."
        }

    # Każde zajęcia muszą zostać zaplanowane dokładnie raz.
    for z in zajecia_lista:
        if not mozliwe_sloty[z.id]:
            return {
                "status": "error",
                "message": f"Brak możliwych terminów/sal dla zajęć ID={z.id}."
            }

        solver.Add(
            sum(x[(z.id, s, t)] for s, t in mozliwe_sloty[z.id]) == 1
        )

    # Jedna sala może być użyta w danym terminie najwyżej raz.
    for s in sale_lista:
        for slot in SLOTY_CONFIG:
            t = slot["global_id"]

            vars_in_cell = [
                x[(z.id, s.id, t)]
                for z in zajecia_lista
                if (z.id, s.id, t) in x
            ]

            if vars_in_cell:
                solver.Add(sum(vars_in_cell) <= 1)

    # Konflikty grup i prowadzących oraz limity dzienne.
    zasoby_ids = []
    zasoby_ids.extend([("g", g.id) for g in grupy.values()])
    zasoby_ids.extend([("w", w.id) for w in wykladowcy.values()])

    for r_type, r_id in zasoby_ids:
        if r_type == "g":
            zajecia_r = [z for z in zajecia_lista if z.grupa_id == r_id]
        else:
            zajecia_r = [z for z in zajecia_lista if z.wykladowca_id == r_id]

        if not zajecia_r:
            continue

        # Konflikt w pojedynczym slocie.
        for slot in SLOTY_CONFIG:
            t = slot["global_id"]
            vars_slot = []

            for z in zajecia_r:
                vars_slot.extend([
                    x[(z.id, s, tt)]
                    for s, tt in mozliwe_sloty[z.id]
                    if tt == t
                ])

            if vars_slot:
                solver.Add(sum(vars_slot) <= 1)

        # Limit dzienny: grupa maks. 3 zajęcia, prowadzący maks. 5 zajęć.
        # Stosowane tylko dla zasobów z więcej niż 3 zajęciami tygodniowo.
        if len(zajecia_r) > 3:
            limit = 3 if r_type == "g" else 5

            for d_idx in range(len(DNI)):
                vars_day = []

                for z in zajecia_r:
                    for s, t in mozliwe_sloty[z.id]:
                        if SLOTY_CONFIG[t]["dzien_idx"] == d_idx:
                            vars_day.append(x[(z.id, s, t)])

                if vars_day:
                    solver.Add(sum(vars_day) <= limit)

    print("Budowanie wiązań czasowych dla zwartości planu...")

    count_b_vars = 0

    # Zmienne pomocnicze premiujące sąsiadujące zajęcia tej samej grupy.
    for g_id in grupy:
        zajecia_grupy = [z for z in zajecia_lista if z.grupa_id == g_id]

        if len(zajecia_grupy) < 2:
            continue

        for d_idx in range(len(DNI)):
            sloty_dnia = [
                slot for slot in SLOTY_CONFIG
                if slot["dzien_idx"] == d_idx
            ]

            for i in range(len(sloty_dnia) - 1):
                t1 = sloty_dnia[i]["global_id"]
                t2 = sloty_dnia[i + 1]["global_id"]

                vars_t1 = group_vars_by_time[g_id][t1]
                vars_t2 = group_vars_by_time[g_id][t2]

                if vars_t1 and vars_t2:
                    y_t1 = sum(vars_t1)
                    y_t2 = sum(vars_t2)

                    b_adj = solver.IntVar(0, 1, f"adj_G{g_id}_T{t1}")
                    count_b_vars += 1

                    # b_adj = 1 tylko wtedy, gdy grupa ma zajęcia w obu sąsiednich slotach.
                    solver.Add(b_adj <= y_t1)
                    solver.Add(b_adj <= y_t2)
                    solver.Add(b_adj >= y_t1 + y_t2 - 1)

                    objective.SetCoefficient(
                        b_adj,
                        -ADJACENT_CLASSES_REWARD
                    )

    print(f"Liczba zmiennych pomocniczych b_adj: {count_b_vars}")

    objective.SetMinimization()

    print(f"Uruchamianie SCIP z limitem {LIMIT_CZASU_MS / 1000}s...")

    status = solver.Solve(solver_params)
    status_text = status_solvera_na_tekst(status)

    statystyki = {
        "status_solvera": status_text,
        "liczba_zmiennych": solver.NumVariables(),
        "liczba_ograniczen": solver.NumConstraints(),
        "czas_ms": solver.WallTime()
    }

    if status in [pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE]:
        statystyki["wartosc_funkcji_celu"] = solver.Objective().Value()

        print(f"✅ Wynik gotowy. Status: {status_text}")
        print(f"Statystyki modelu: {statystyki}")

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

        if status == pywraplp.Solver.OPTIMAL:
            msg = "Plan gotowy. Znaleziono rozwiązanie optymalne."
        else:
            msg = (
                "Plan gotowy. Znaleziono rozwiązanie dopuszczalne "
                "w zadanym limicie czasu."
            )

        return {
            "status": "ok",
            "message": f"{msg} Zaplanowano {count} zajęć.",
            "statystyki": statystyki
        }

    if status == pywraplp.Solver.INFEASIBLE:
        return {
            "status": "error",
            "message": "Brak rozwiązania spełniającego ograniczenia. Sprawdź dane wejściowe.",
            "statystyki": statystyki
        }

    return {
        "status": "error",
        "message": "Solver nie znalazł rozwiązania w zadanym czasie lub zakończył pracę niepoprawnie.",
        "statystyki": statystyki
    }