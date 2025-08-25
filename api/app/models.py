from sqlalchemy import Column, Integer, String, Boolean, DateTime, Time, func
from .database import Base

class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    completed = Column(Boolean, default=False, nullable=False)
    weekday = Column(Integer, nullable=False, server_default="0")  # 0..6 (Lun..Dom)

    # NUEVO: horario
    start_time = Column(Time, nullable=True)  # HH:MM[:SS]
    end_time   = Column(Time, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
