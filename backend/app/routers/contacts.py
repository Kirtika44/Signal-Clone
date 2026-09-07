from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.contact import Contact
from app.schemas.all_schemas import ContactAdd, ContactResponse, UserResponse
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/contacts", tags=["Contacts"])

@router.get("", response_model=List[ContactResponse])
def get_contacts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    contacts = db.query(Contact).filter(Contact.user_id == current_user.id).all()
    results = []
    for c in contacts:
        contact_user = db.query(User).filter(User.id == c.contact_user_id).first()
        if contact_user:
            results.append(ContactResponse(
                id=c.id,
                user_id=c.user_id,
                contact_user_id=c.contact_user_id,
                nickname=c.nickname,
                contact_user=UserResponse.from_orm(contact_user)
            ))
    return results

@router.post("", response_model=ContactResponse)
def add_contact(data: ContactAdd, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    identifier = data.contact_username_or_phone.strip().lower()

    target_user = db.query(User).filter(
        (User.username == identifier) | (User.phone == identifier)
    ).first()

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found with that username or phone")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot add yourself as a contact")

    existing = db.query(Contact).filter(
        Contact.user_id == current_user.id,
        Contact.contact_user_id == target_user.id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Contact already added")

    contact = Contact(
        user_id=current_user.id,
        contact_user_id=target_user.id,
        nickname=data.nickname
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)

    return ContactResponse(
        id=contact.id,
        user_id=contact.user_id,
        contact_user_id=contact.contact_user_id,
        nickname=contact.nickname,
        contact_user=UserResponse.from_orm(target_user)
    )

@router.delete("/{contact_id}")
def delete_contact(contact_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.user_id == current_user.id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return {"success": True, "message": "Contact removed"}
