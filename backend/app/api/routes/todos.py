import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import selectinload
from sqlmodel import func, select

from app.api.deps import SessionDep, get_current_active_superuser
from app.models import (
    Message,
    Todo,
    TodoCreate,
    TodoPublic,
    TodoReorder,
    TodoUpdate,
    TodosPublic,
)

router = APIRouter(
    prefix="/todos",
    tags=["todos"],
    dependencies=[Depends(get_current_active_superuser)],
)


def get_related_todos(session: SessionDep, related_ids: list[uuid.UUID]) -> list[Todo]:
    if not related_ids:
        return []
    statement = select(Todo).where(Todo.id.in_(related_ids))  # type: ignore[union-attr]
    related = list(session.exec(statement).all())
    if len(related) != len(set(related_ids)):
        raise HTTPException(status_code=404, detail="Related todo not found")
    return related


@router.get("/", response_model=TodosPublic)
def read_todos(session: SessionDep) -> Any:
    """
    Retrieve todos ordered by position.
    """
    count_statement = select(func.count()).select_from(Todo)
    count = session.exec(count_statement).one()
    statement = (
        select(Todo)
        .options(selectinload(Todo.related), selectinload(Todo.related_by))
        .order_by(Todo.position)  # type: ignore[arg-type]
    )
    todos = session.exec(statement).all()
    return TodosPublic(data=[TodoPublic.from_todo(todo) for todo in todos], count=count)


@router.post("/", response_model=TodoPublic)
def create_todo(*, session: SessionDep, todo_in: TodoCreate) -> Any:
    """
    Create new todo. Appended at the end of the list.
    """
    related = get_related_todos(session, todo_in.related_ids)
    max_position = session.exec(select(func.max(Todo.position))).one()
    todo = Todo(
        title=todo_in.title,
        description=todo_in.description,
        deadline=todo_in.deadline,
        position=(max_position or 0) + 1,
        related=related,
    )
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return TodoPublic.from_todo(todo)


@router.patch("/{id}", response_model=TodoPublic)
def update_todo(*, session: SessionDep, id: uuid.UUID, todo_in: TodoUpdate) -> Any:
    """
    Update a todo.
    """
    statement = (
        select(Todo)
        .options(selectinload(Todo.related), selectinload(Todo.related_by))
        .where(Todo.id == id)
    )
    todo = session.exec(statement).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    update_dict = todo_in.model_dump(exclude_unset=True)
    related_ids = update_dict.pop("related_ids", None)
    todo.sqlmodel_update(update_dict)
    if related_ids is not None:
        related_ids = [rid for rid in related_ids if rid != todo.id]
        todo.related = get_related_todos(session, related_ids)
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return TodoPublic.from_todo(todo)


@router.post("/reorder", response_model=TodosPublic)
def reorder_todos(*, session: SessionDep, reorder_in: TodoReorder) -> Any:
    """
    Reorder todos by drag and drop. ordered_ids must contain every todo id.
    """
    statement = (
        select(Todo)
        .options(selectinload(Todo.related), selectinload(Todo.related_by))
        .order_by(Todo.position)  # type: ignore[arg-type]
    )
    todos = session.exec(statement).all()
    if len(reorder_in.ordered_ids) != len(set(reorder_in.ordered_ids)):
        raise HTTPException(status_code=400, detail="ordered_ids contains duplicates")
    if set(reorder_in.ordered_ids) != {todo.id for todo in todos}:
        raise HTTPException(
            status_code=400, detail="ordered_ids must include every todo id"
        )
    by_id = {todo.id: todo for todo in todos}
    for position, todo_id in enumerate(reorder_in.ordered_ids):
        by_id[todo_id].position = position
        session.add(by_id[todo_id])
    session.commit()
    todos = session.exec(statement).all()
    return TodosPublic(data=[TodoPublic.from_todo(todo) for todo in todos], count=len(todos))


@router.delete("/{id}")
def delete_todo(session: SessionDep, id: uuid.UUID) -> Message:
    """
    Delete a todo.
    """
    todo = session.get(Todo, id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    session.delete(todo)
    session.commit()
    return Message(message="Todo deleted successfully")
