from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base


class Wykladowca(Base):
    __tablename__ = "wykladowcy"

    id = Column(Integer, primary_key=True, index=True)
    imie = Column(String, nullable=False)
    nazwisko = Column(String, nullable=False)
    tytul_naukowy = Column(String, nullable=True)

    zajecia = relationship("Zajecia", back_populates="wykladowca")


class Sala(Base):
    __tablename__ = "sale"

    id = Column(Integer, primary_key=True, index=True)
    nazwa = Column(String, unique=True, nullable=False)
    pojemnosc = Column(Integer, nullable=False)
    czy_komputerowa = Column(Boolean, default=False)


class GrupaStudencka(Base):
    __tablename__ = "grupy_studenckie"

    id = Column(Integer, primary_key=True, index=True)
    nazwa = Column(String, unique=True, nullable=False)
    liczba_studentow = Column(Integer, nullable=False)
    kierunek = Column(String, nullable=True)


class Przedmiot(Base):
    __tablename__ = "przedmioty"

    id = Column(Integer, primary_key=True, index=True)
    nazwa = Column(String, unique=True, nullable=False)
    typ = Column(String, nullable=True)


class Zajecia(Base):
    __tablename__ = "zajecia"

    id = Column(Integer, primary_key=True, index=True)
    czas_trwania = Column(Integer, default=90)

    przedmiot_id = Column(Integer, ForeignKey("przedmioty.id"))
    wykladowca_id = Column(Integer, ForeignKey("wykladowcy.id"))
    grupa_id = Column(Integer, ForeignKey("grupy_studenckie.id"))

    przedmiot = relationship("Przedmiot")
    wykladowca = relationship("Wykladowca", back_populates="zajecia")
    grupa = relationship("GrupaStudencka")