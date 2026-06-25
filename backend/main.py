from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List

import solver
import models
import schemas
from database import engine, SessionLocal, Base


Base.metadata.create_all(bind=engine)

app = FastAPI(title="System Planowania Zajęć Akademickich")

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DNI = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"]

GODZINY = [
    "08:00-09:30",
    "09:45-11:15",
    "11:30-13:00",
    "13:15-14:45",
    "15:00-16:30",
    "16:45-18:15",
]


class EdycjaRezerwacji(BaseModel):
    nowy_dzien: str
    nowa_godzina: str
    nowa_sala_id: int


def pobierz_baze():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def sala_pasuje_do_zajec(sala, zajecia, przedmiot, grupa, liczba_sal: int) -> bool:
    """
    Sprawdza, czy sala jest zgodna z wymaganiami danych zajęć.
    Ta sama logika jest używana przy ręcznej edycji rezerwacji,
    aby użytkownik nie mógł przenieść zajęć do niedopuszczalnej sali.
    """
    if not sala or not zajecia or not przedmiot or not grupa:
        return False

    typ_przedmiotu = (przedmiot.typ or "").lower()
    wymagana_pojemnosc = grupa.liczba_studentow

    if sala.pojemnosc < wymagana_pojemnosc:
        return False

    if sala.pojemnosc > wymagana_pojemnosc * 3:
        return False

    if typ_przedmiotu == "laboratorium" and not sala.czy_komputerowa:
        return False

    if typ_przedmiotu == "wykład" and sala.czy_komputerowa and liczba_sal > 2:
        return False

    return True


@app.get("/")
def strona_glowna():
    return {
        "status": "aktywny",
        "wiadomosc": "Witaj w API Systemu Planowania!"
    }


@app.post("/wykladowcy/", response_model=schemas.WykladowcaResponse)
def stworz_wykladowce(
    wykladowca: schemas.WykladowcaCreate,
    db: Session = Depends(pobierz_baze)
):
    nowy_wykladowca = models.Wykladowca(
        imie=wykladowca.imie,
        nazwisko=wykladowca.nazwisko,
        tytul_naukowy=wykladowca.tytul_naukowy
    )

    db.add(nowy_wykladowca)
    db.commit()
    db.refresh(nowy_wykladowca)

    return nowy_wykladowca


@app.get("/wykladowcy/", response_model=List[schemas.WykladowcaResponse])
def czytaj_wykladowcow(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(pobierz_baze)
):
    return db.query(models.Wykladowca).offset(skip).limit(limit).all()


@app.post("/sale/", response_model=schemas.SalaResponse)
def stworz_sale(
    sala: schemas.SalaCreate,
    db: Session = Depends(pobierz_baze)
):
    nowa_sala = models.Sala(
        nazwa=sala.nazwa,
        pojemnosc=sala.pojemnosc,
        czy_komputerowa=sala.czy_komputerowa
    )

    db.add(nowa_sala)
    db.commit()
    db.refresh(nowa_sala)

    return nowa_sala


@app.get("/sale/", response_model=List[schemas.SalaResponse])
def czytaj_sale(db: Session = Depends(pobierz_baze)):
    return db.query(models.Sala).all()


@app.post("/przedmioty/", response_model=schemas.PrzedmiotResponse)
def stworz_przedmiot(
    przedmiot: schemas.PrzedmiotCreate,
    db: Session = Depends(pobierz_baze)
):
    nowy_przedmiot = models.Przedmiot(
        nazwa=przedmiot.nazwa,
        typ=przedmiot.typ
    )

    db.add(nowy_przedmiot)
    db.commit()
    db.refresh(nowy_przedmiot)

    return nowy_przedmiot


@app.get("/przedmioty/", response_model=List[schemas.PrzedmiotResponse])
def czytaj_przedmioty(db: Session = Depends(pobierz_baze)):
    return db.query(models.Przedmiot).all()


@app.post("/grupy/", response_model=schemas.GrupaResponse)
def stworz_grupe(
    grupa: schemas.GrupaCreate,
    db: Session = Depends(pobierz_baze)
):
    nowa_grupa = models.GrupaStudencka(
        nazwa=grupa.nazwa,
        liczba_studentow=grupa.liczba_studentow,
        kierunek=grupa.kierunek
    )

    db.add(nowa_grupa)
    db.commit()
    db.refresh(nowa_grupa)

    return nowa_grupa


@app.get("/grupy/", response_model=List[schemas.GrupaResponse])
def czytaj_grupy(db: Session = Depends(pobierz_baze)):
    return db.query(models.GrupaStudencka).all()


@app.post("/zajecia/", response_model=schemas.ZajeciaCreate)
def stworz_zajecia(
    zajecia: schemas.ZajeciaCreate,
    db: Session = Depends(pobierz_baze)
):
    nowe_zajecia = models.Zajecia(
        przedmiot_id=zajecia.przedmiot_id,
        wykladowca_id=zajecia.wykladowca_id,
        grupa_id=zajecia.grupa_id,
        czas_trwania=zajecia.czas_trwania
    )

    db.add(nowe_zajecia)
    db.commit()
    db.refresh(nowe_zajecia)

    return nowe_zajecia


@app.get("/zajecia/", response_model=List[schemas.ZajeciaResponse])
def czytaj_zajecia(db: Session = Depends(pobierz_baze)):
    return db.query(models.Zajecia).all()


@app.post("/generuj-plan/")
def generuj_plan(db: Session = Depends(pobierz_baze)):
    wynik = solver.uruchom_harmonogramowanie(db)

    if wynik["status"] == "error":
        raise HTTPException(status_code=400, detail=wynik["message"])

    return wynik


@app.get("/harmonogram/")
def pobierz_harmonogram(db: Session = Depends(pobierz_baze)):
    return db.query(models.Rezerwacja).all()


@app.put("/rezerwacje/{rezerwacja_id}")
def aktualizuj_rezerwacje(
    rezerwacja_id: int,
    dane: EdycjaRezerwacji,
    db: Session = Depends(pobierz_baze)
):
    rezerwacja = (
        db.query(models.Rezerwacja)
        .filter(models.Rezerwacja.id == rezerwacja_id)
        .first()
    )

    if not rezerwacja:
        raise HTTPException(
            status_code=404,
            detail="Rezerwacja nie została znaleziona."
        )

    if dane.nowy_dzien not in DNI:
        raise HTTPException(
            status_code=400,
            detail="Niepoprawny dzień tygodnia."
        )

    if dane.nowa_godzina not in GODZINY:
        raise HTTPException(
            status_code=400,
            detail="Niepoprawny slot czasowy."
        )

    nowa_sala = (
        db.query(models.Sala)
        .filter(models.Sala.id == dane.nowa_sala_id)
        .first()
    )

    if not nowa_sala:
        raise HTTPException(
            status_code=404,
            detail="Wybrana sala nie istnieje."
        )

    zajecia = (
        db.query(models.Zajecia)
        .filter(models.Zajecia.id == rezerwacja.zajecia_id)
        .first()
    )

    if not zajecia:
        raise HTTPException(
            status_code=404,
            detail="Zajęcia przypisane do rezerwacji nie istnieją."
        )

    przedmiot = (
        db.query(models.Przedmiot)
        .filter(models.Przedmiot.id == zajecia.przedmiot_id)
        .first()
    )

    grupa = (
        db.query(models.GrupaStudencka)
        .filter(models.GrupaStudencka.id == zajecia.grupa_id)
        .first()
    )

    liczba_sal = db.query(models.Sala).count()

    if not sala_pasuje_do_zajec(
        sala=nowa_sala,
        zajecia=zajecia,
        przedmiot=przedmiot,
        grupa=grupa,
        liczba_sal=liczba_sal
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Wybrana sala nie spełnia wymagań tych zajęć "
                "(pojemność lub typ sali są niezgodne)."
            )
        )

    inne_rezerwacje_w_slocie = (
        db.query(models.Rezerwacja)
        .filter(models.Rezerwacja.id != rezerwacja_id)
        .filter(models.Rezerwacja.dzien == dane.nowy_dzien)
        .filter(models.Rezerwacja.godzina == dane.nowa_godzina)
        .all()
    )

    for inna_rezerwacja in inne_rezerwacje_w_slocie:
        if inna_rezerwacja.sala_id == dane.nowa_sala_id:
            raise HTTPException(
                status_code=400,
                detail="Konflikt sali: wybrana sala jest już zajęta w tym terminie."
            )

        inne_zajecia = (
            db.query(models.Zajecia)
            .filter(models.Zajecia.id == inna_rezerwacja.zajecia_id)
            .first()
        )

        if not inne_zajecia:
            continue

        if inne_zajecia.grupa_id == zajecia.grupa_id:
            raise HTTPException(
                status_code=400,
                detail="Konflikt grupy: ta grupa ma już zajęcia w wybranym terminie."
            )

        if inne_zajecia.wykladowca_id == zajecia.wykladowca_id:
            raise HTTPException(
                status_code=400,
                detail="Konflikt prowadzącego: prowadzący ma już zajęcia w wybranym terminie."
            )

    rezerwacja.dzien = dane.nowy_dzien
    rezerwacja.godzina = dane.nowa_godzina
    rezerwacja.sala_id = dane.nowa_sala_id

    db.commit()
    db.refresh(rezerwacja)

    return {
        "message": "Zaktualizowano plan.",
        "rezerwacja_id": rezerwacja.id
    }


@app.delete("/rezerwacje/{rezerwacja_id}")
def usun_rezerwacje(
    rezerwacja_id: int,
    db: Session = Depends(pobierz_baze)
):
    rezerwacja = (
        db.query(models.Rezerwacja)
        .filter(models.Rezerwacja.id == rezerwacja_id)
        .first()
    )

    if not rezerwacja:
        raise HTTPException(
            status_code=404,
            detail="Rezerwacja nie została znaleziona."
        )

    db.delete(rezerwacja)
    db.commit()

    return {"message": "Usunięto rezerwację z planu."}