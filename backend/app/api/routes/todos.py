import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, select

from app.api.deps import SessionDep, get_current_active_superuser
from app.models import (
    TODO_RELATION_INVERSE,
    Message,
    Todo,
    TodoCreate,
    TodoLink,
    TodoPublic,
    TodoRelation,
    TodoReorder,
    TodoUpdate,
    TodosPublic,
)

router = APIRouter(
    prefix="/todos",
    tags=["todos"],
    dependencies=[Depends(get_current_active_superuser)],
)


def _related_by_todo(session: SessionDep) -> dict[uuid.UUID, list[TodoRelation]]:
    """Map every todo id to its relations, computing inverse kinds for the
    `to_id` side of each stored link."""
    by_todo: dict[uuid.UUID, list[TodoRelation]] = {}
    for link in session.exec(select(TodoLink)).all():
        by_todo.setdefault(link.from_id, []).append(
            TodoRelation(id=link.to_id, relation=link.relation)
        )
        by_todo.setdefault(link.to_id, []).append(
            TodoRelation(
                id=link.from_id,
                relation=TODO_RELATION_INVERSE[link.relation],
            )
        )
    return by_todo


def _check_related_exist(session: SessionDep, related: list[TodoRelation]) -> None:
    related_ids = [rel.id for rel in related]
    if not related_ids:
        return
    statement = select(Todo).where(Todo.id.in_(related_ids))  # type: ignore[union-attr]
    found = list(session.exec(statement).all())
    if len(found) != len(set(related_ids)):
        raise HTTPException(status_code=404, detail="Related todo not found")


def _replace_related(
    session: SessionDep, todo_id: uuid.UUID, related: list[TodoRelation]
) -> None:
    """Replace all links touching todo_id with links expressing the given
    relations from todo_id's perspective."""
    statement = select(TodoLink).where(
        (TodoLink.from_id == todo_id) | (TodoLink.to_id == todo_id)
    )
    for link in session.exec(statement).all():
        session.delete(link)
    session.flush()  # delete old links before re-inserting the same pair
    seen: set[uuid.UUID] = set()
    for rel in related:
        if rel.id == todo_id or rel.id in seen:
            continue
        seen.add(rel.id)
        session.add(TodoLink(from_id=todo_id, to_id=rel.id, relation=rel.relation))


@router.get("/", response_model=TodosPublic)
def read_todos(session: SessionDep) -> Any:
    """
    Retrieve todos ordered by position.
    """
    count_statement = select(func.count()).select_from(Todo)
    count = session.exec(count_statement).one()
    statement = select(Todo).order_by(Todo.position)  # type: ignore[arg-type]
    todos = session.exec(statement).all()
    related_by_todo = _related_by_todo(session)
    return TodosPublic(
        data=[
            TodoPublic.from_todo(todo, related_by_todo.get(todo.id, []))
            for todo in todos
        ],
        count=count,
    )


@router.post("/", response_model=TodoPublic)
def create_todo(*, session: SessionDep, todo_in: TodoCreate) -> Any:
    """
    Create new todo. Appended at the end of the list.
    """
    _check_related_exist(session, todo_in.related)
    max_position = session.exec(select(func.max(Todo.position))).one()
    todo = Todo(
        title=todo_in.title,
        description=todo_in.description,
        deadline=todo_in.deadline,
        position=(max_position or 0) + 1,
    )
    session.add(todo)
    _replace_related(session, todo.id, todo_in.related)
    session.commit()
    session.refresh(todo)
    related_by_todo = _related_by_todo(session)
    return TodoPublic.from_todo(todo, related_by_todo.get(todo.id, []))


@router.patch("/{id}", response_model=TodoPublic)
def update_todo(*, session: SessionDep, id: uuid.UUID, todo_in: TodoUpdate) -> Any:
    """
    Update a todo.
    """
    todo = session.get(Todo, id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    update_dict = todo_in.model_dump(exclude_unset=True, exclude={"related"})
    todo.sqlmodel_update(update_dict)
    if "related" in todo_in.model_fields_set and todo_in.related is not None:
        _check_related_exist(session, todo_in.related)
        _replace_related(session, todo.id, todo_in.related)
    session.add(todo)
    session.commit()
    session.refresh(todo)
    related_by_todo = _related_by_todo(session)
    return TodoPublic.from_todo(todo, related_by_todo.get(todo.id, []))


@router.post("/reorder", response_model=TodosPublic)
def reorder_todos(*, session: SessionDep, reorder_in: TodoReorder) -> Any:
    """
    Reorder todos by drag and drop. ordered_ids must contain every todo id.
    """
    statement = select(Todo).order_by(Todo.position)  # type: ignore[arg-type]
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
    related_by_todo = _related_by_todo(session)
    return TodosPublic(
        data=[
            TodoPublic.from_todo(todo, related_by_todo.get(todo.id, []))
            for todo in todos
        ],
        count=len(todos),
    )


@router.delete("/{id}")
def delete_todo(session: SessionDep, id: uuid.UUID) -> Message:
    """
    Delete a todo.
    """
    todo = session.get(Todo, id)
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    statement = select(TodoLink).where(
        (TodoLink.from_id == id) | (TodoLink.to_id == id)
    )
    for link in session.exec(statement).all():
        session.delete(link)
    session.flush()  # ensure link rows are gone before the todo row is deleted
    session.delete(todo)
    session.commit()
    return Message(message="Todo deleted successfully")
