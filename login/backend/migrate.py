"""
migrate.py — One-time migration script
Run this ONCE after adding authentication to:
1. Create the default admin user
2. Assign all existing stories to the admin user

Usage: python migrate.py
"""
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.database import async_session, create_tables
from models.user_model import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ADMIN_EMAIL = "admin@cartooncare.com"
ADMIN_PASSWORD = "Admin@123456"
ADMIN_NAME = "Admin"

async def run_migration():
    await create_tables()
    async with async_session() as db:
        # Check if admin already exists
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.email == ADMIN_EMAIL))
        admin = result.scalar_one_or_none()
        
        if not admin:
            admin = User(
                name=ADMIN_NAME,
                email=ADMIN_EMAIL,
                password_hash=pwd_context.hash(ADMIN_PASSWORD),
                role="admin"
            )
            db.add(admin)
            await db.commit()
            await db.refresh(admin)
            print(f"✅ Admin user created: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        else:
            print(f"ℹ️  Admin user already exists: {ADMIN_EMAIL}")
        
        # Assign all stories with no user_id to admin
        await db.execute(
            text(f"UPDATE stories SET user_id = {admin.id} WHERE user_id IS NULL")
        )
        await db.commit()
        print(f"✅ All existing stories assigned to admin (id={admin.id})")

if __name__ == "__main__":
    asyncio.run(run_migration())
