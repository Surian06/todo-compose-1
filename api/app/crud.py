from sqlalchemy.orm import Session
from sqlalchemy import and_
from . import models, schemas

def _overlaps(db: Session, weekday: int, start, end, exclude_id: int | None = None) -> bool:
    """Hay traslape si (start < other.end) y (end > other.start)"""
    if start is None or end is None:
        return False
    q = db.query(models.Todo).filter(
        models.Todo.weekday == weekday,
        models.Todo.start_time.isnot(None),
        models.Todo.end_time.isnot(None),
    )
    if exclude_id:
        q = q.filter(models.Todo.id != exclude_id)
    q = q.filter(
        and_(models.Todo.start_time < end, models.Todo.end_time > start)
    )
    return db.query(q.exists()).scalar()

def get_todos(db: Session, weekday: int | None = None):
    q = db.query(models.Todo)
    if weekday is not None:
        q = q.filter(models.Todo.weekday == weekday)
    # NULLs al final, luego por hora y por id
    q = q.order_by(models.Todo.start_time.is_(None), models.Todo.start_time.asc(), models.Todo.id.desc())
    return q.all()

def get_todo(db: Session, todo_id: int):
    return db.query(models.Todo).filter(models.Todo.id == todo_id).first()

def create_todo(db: Session, todo: schemas.TodoCreate):
    if _overlaps(db, todo.weekday, todo.start_time, todo.end_time):
        raise ValueError("El horario indicado se traslapa con otra tarea de ese día")
    db_todo = models.Todo(
        title=todo.title,
        completed=todo.completed,
        weekday=todo.weekday,
        start_time=todo.start_time,
        end_time=todo.end_time,
    )
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

def update_todo(db: Session, todo_id: int, todo: schemas.TodoUpdate):
    db_todo = get_todo(db, todo_id)
    if not db_todo:
        return None
    if _overlaps(db, todo.weekday, todo.start_time, todo.end_time, exclude_id=todo_id):
        raise ValueError("El horario indicado se traslapa con otra tarea de ese día")
    db_todo.title = todo.title
    db_todo.completed = todo.completed
    db_todo.weekday = todo.weekday
    db_todo.start_time = todo.start_time
    db_todo.end_time = todo.end_time
    db.commit()
    db.refresh(db_todo)
    return db_todo

def delete_todo(db: Session, todo_id: int) -> bool:
    db_todo = get_todo(db, todo_id)
    if not db_todo:
        return False
    db.delete(db_todo)
    db.commit()
    return True
