import os
import uuid
import shutil
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.models.user import User
from app.auth.security import get_current_user

router = APIRouter(prefix="/api/upload", tags=["Uploads"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    try:
        ext = os.path.splitext(file.filename)[1]
        unique_name = f"{uuid.uuid4().hex}{ext}"
        destination = os.path.join(UPLOAD_DIR, unique_name)

        with open(destination, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        size = os.path.getsize(destination)
        file_url = f"/uploads/{unique_name}"

        return {
            "url": file_url,
            "name": file.filename,
            "size": size,
            "type": file.content_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
