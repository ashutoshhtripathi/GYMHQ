import sys
import datetime
from decimal import Decimal
from app.database import SessionLocal
from app.models.user import User
from app.models.member import Member
from app.models.attendance import Attendance
from app.models.payment import Payment
from app.auth import hash_password


def seed(with_samples: bool = False):
    db = SessionLocal()
    try:
        # 1. Admin user
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@gymhq.com",
                password_hash=hash_password("adminpassword123"),
                gym_name="IronCore Gym HQ",
                role="admin",
            )
            db.add(admin)
            db.commit()
            print("✅ Created default admin user (admin / adminpassword123)")
        else:
            print("ℹ️ Admin user already exists")

        if with_samples and db.query(Member).count() == 0:
            today = datetime.date.today()
            sample_members = [
                {
                    "name": "Rahul Sharma",
                    "phone": "+91-9876500101",
                    "plan": "Monthly",
                    "status": "active",
                    "joining_date": today - datetime.timedelta(days=90),
                    "membership_start": today - datetime.timedelta(days=15),
                    "membership_end": today + datetime.timedelta(days=15),
                    "monthly_fee": Decimal("1500.00"),
                },
                {
                    "name": "Priya Patel",
                    "phone": "+91-9876500102",
                    "plan": "Quarterly",
                    "status": "active",
                    "joining_date": today - datetime.timedelta(days=120),
                    "membership_start": today - datetime.timedelta(days=45),
                    "membership_end": today + datetime.timedelta(days=45),
                    "monthly_fee": Decimal("4000.00"),
                },
            ]
            for m_data in sample_members:
                m = Member(**m_data)
                db.add(m)
            db.commit()
            print("✅ Seeded sample members for evaluation")
        else:
            print("✨ Clean slate maintained: 0 members, 0 payments, 0 attendances.")

        print("🎉 Database setup completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    with_samples = "--with-samples" in sys.argv
    seed(with_samples=with_samples)
