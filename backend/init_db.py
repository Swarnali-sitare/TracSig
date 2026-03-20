"""
Run this script once to create all tables and seed initial data.
Usage: py init_db.py  (or: python init_db.py)
"""
from dotenv import load_dotenv

load_dotenv()

from sqlalchemy.exc import OperationalError

from app import create_app
from app.extensions import db, bcrypt
from app.models import User, Batch, Course, BatchCourse, Assignment, Submission, Notification
from datetime import datetime, timezone, timedelta

app = create_app()

with app.app_context():
    try:
        db.create_all()
    except OperationalError as e:
        if "Connection refused" in str(e) or "could not connect" in str(e).lower():
            print(
                "Cannot reach PostgreSQL at the URL in DATABASE_URL "
                "(default: localhost:5432).\n"
                "Start PostgreSQL, or from the repo root run: docker compose up -d\n"
                "Then run this script again."
            )
        raise SystemExit(1) from e
    print("Tables created.")

    # Seed only if empty
    if User.query.count() > 0:
        print("Data already seeded, skipping.")
    else:
        # Admin
        admin = User(
            name="Admin User",
            email="admin@tracsig.com",
            password_hash=bcrypt.generate_password_hash("admin123").decode("utf-8"),
            role="admin",
            department="Administration",
        )
        db.session.add(admin)

        # Batch
        batch2024 = Batch(name="Batch 2024", year=2024)
        batch2025 = Batch(name="Batch 2025", year=2025)
        db.session.add_all([batch2024, batch2025])
        db.session.flush()

        # Staff
        staff1 = User(
            name="Dr. Sarah Johnson",
            email="staff@tracsig.com",
            password_hash=bcrypt.generate_password_hash("staff123").decode("utf-8"),
            role="staff",
            department="Computer Science",
        )
        db.session.add(staff1)
        db.session.flush()

        # Courses
        cs101 = Course(
            code="CS101", name="Introduction to Programming",
            department="Computer Science", credits=3, staff_id=staff1.id
        )
        cs201 = Course(
            code="CS201", name="Data Structures",
            department="Computer Science", credits=4, staff_id=staff1.id
        )
        db.session.add_all([cs101, cs201])
        db.session.flush()

        # BatchCourse
        db.session.add_all([
            BatchCourse(batch_id=batch2024.id, course_id=cs101.id),
            BatchCourse(batch_id=batch2024.id, course_id=cs201.id),
            BatchCourse(batch_id=batch2025.id, course_id=cs101.id),
        ])

        # Students
        student1 = User(
            name="Alice Smith",
            email="student@tracsig.com",
            password_hash=bcrypt.generate_password_hash("student123").decode("utf-8"),
            role="student",
            department="Computer Science",
            batch_id=batch2024.id,
        )
        student2 = User(
            name="Bob Jones",
            email="bob@tracsig.com",
            password_hash=bcrypt.generate_password_hash("student123").decode("utf-8"),
            role="student",
            department="Computer Science",
            batch_id=batch2024.id,
        )
        db.session.add_all([student1, student2])
        db.session.flush()

        # Assignment
        now = datetime.now(timezone.utc)
        a1 = Assignment(
            title="Hello World Program",
            description="Write a simple hello world program in Python.",
            course_id=cs101.id,
            staff_id=staff1.id,
            due_date=now + timedelta(days=7),
        )
        a2 = Assignment(
            title="Linked List Implementation",
            description="Implement a singly linked list with insert, delete and search operations.",
            course_id=cs201.id,
            staff_id=staff1.id,
            due_date=now + timedelta(days=14),
        )
        db.session.add_all([a1, a2])
        db.session.flush()

        # Sample submission
        sub = Submission(
            assignment_id=a1.id,
            student_id=student1.id,
            content="print('Hello, World!')",
            status="submitted",
            submitted_at=now,
        )
        db.session.add(sub)

        # Welcome notifications
        for user in [admin, staff1, student1, student2]:
            db.session.add(Notification(
                user_id=user.id,
                type="system",
                title="Welcome to TracSig!",
                message="Your account is ready. Explore the dashboard to get started.",
                icon_key="Bell",
            ))

        db.session.commit()
        print("Seed data inserted successfully.")
        print("\nTest credentials:")
        print("  Admin:   admin@tracsig.com   / admin123")
        print("  Staff:   staff@tracsig.com   / staff123")
        print("  Student: student@tracsig.com / student123")
