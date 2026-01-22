from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

def pobierz_baze():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def strona_glowna():
    return {"status": "aktywny", "wiadomosc": "Witaj w API Systemu Planowania!"}

@app.post("/wykladowcy/", response_model=schemas.WykladowcaResponse)
def stworz_wykladowce(wykladowca: schemas.WykladowcaCreate, db: Session = Depends(pobierz_baze)):
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
def czytaj_wykladowcow(skip: int = 0, limit: int = 100, db: Session = Depends(pobierz_baze)):
    wykladowcy = db.query(models.Wykladowca).offset(skip).limit(limit).all()
    return wykladowcy

@app.post("/sale/", response_model=schemas.SalaResponse)
def stworz_sale(sala: schemas.SalaCreate, db: Session = Depends(pobierz_baze)):
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
def stworz_przedmiot(przedmiot: schemas.PrzedmiotCreate, db: Session = Depends(pobierz_baze)):
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
def stworz_grupe(grupa: schemas.GrupaCreate, db: Session = Depends(pobierz_baze)):
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
def stworz_zajecia(zajecia: schemas.ZajeciaCreate, db: Session = Depends(pobierz_baze)):
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