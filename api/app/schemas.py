from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime, time as dtime

class TodoBase(BaseModel):
    title: str
    completed: bool = False
    weekday: int = 0
    start_time: dtime | None = None
    end_time:   dtime | None = None

    @field_validator("weekday")
    @classmethod
    def _weekday_range(cls, v: int) -> int:
        if v < 0 or v > 6:
            raise ValueError("weekday debe estar entre 0 y 6 (Lun..Dom)")
        return v

    @field_validator("end_time")
    @classmethod
    def _range_ok(cls, end, info):
        start = info.data.get("start_time")
        # si se especifica uno, debe venir el otro
        if (start is None) ^ (end is None):
            raise ValueError("Si defines horario, start_time y end_time son obligatorios")
        # si ambos existen, start < end
        if start is not None and end is not None and not (start < end):
            raise ValueError("start_time debe ser menor que end_time")
        return end

class TodoCreate(TodoBase): pass
class TodoUpdate(TodoBase): pass

class TodoOut(TodoBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
