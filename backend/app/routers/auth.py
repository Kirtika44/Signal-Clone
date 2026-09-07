from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.all_schemas import UserRegister, UserLogin, TokenResponse, UserResponse
from app.auth.security import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    # Check if username exists
    existing = db.query(User).filter(User.username == data.username.strip().lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")

    if data.phone:
        existing_phone = db.query(User).filter(User.phone == data.phone.strip()).first()
        if existing_phone:
            raise HTTPException(status_code=400, detail="Phone number already registered")

    hashed = get_password_hash(data.password)
    user = User(
        username=data.username.strip().lower(),
        phone=data.phone.strip() if data.phone else None,
        display_name=data.display_name.strip(),
        password_hash=hashed,
        avatar_url=data.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={data.username.strip().lower()}",
        is_online=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )

@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    login_id = data.login.strip().lower()
    user = db.query(User).filter(
        (User.username == login_id) | (User.phone == login_id)
    ).first()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.from_orm(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.from_orm(current_user)

@router.post("/verify-otp")
def verify_otp(payload: dict):
    # Mock OTP endpoint - accepts 123456 or any 6-digit code for quick testing
    otp = payload.get("otp", "").strip()
    if otp == "123456" or len(otp) == 6:
        return {"success": True, "message": "OTP verified successfully"}
    raise HTTPException(status_code=400, detail="Invalid OTP code. Try 123456")
