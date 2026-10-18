import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """Verify health check endpoint returns 200 and healthy database status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "GYMHQ"


def test_login_success():
    """Verify admin login with seed credentials."""
    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "adminpassword123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == "admin"


def test_login_invalid_password():
    """Verify wrong password returns 401."""
    response = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_dashboard_endpoint():
    """Verify dashboard aggregations endpoint."""
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "stats" in data
    assert "current_month_collection" in data
    assert "today_attendance_count" in data
    assert "monthly_graph" in data
    assert len(data["monthly_graph"]) == 6
    assert "collection" in data["monthly_graph"][0]
    assert "month_label" in data["monthly_graph"][0]


def test_members_list():
    """Verify member listing endpoint."""
    response = client.get("/api/members")
    assert response.status_code == 200
    data = response.json()
    assert "members" in data
    assert "total" in data
    assert data["total"] >= 0


def test_attendance_list():
    """Verify attendance list endpoint."""
    response = client.get("/api/attendance")
    assert response.status_code == 200
    data = response.json()
    assert "records" in data


def test_payments_list():
    """Verify payments list endpoint."""
    response = client.get("/api/payments")
    assert response.status_code == 200
    data = response.json()
    assert "payments" in data


def test_monthly_fee_report():
    """Verify monthly fee report generation."""
    response = client.get("/api/reports/monthly-fees?month=2026-10")
    assert response.status_code == 200
    data = response.json()
    assert "expected_fees" in data
    assert "total_paid" in data
    assert "outstanding_dues" in data
    assert "member_details" in data


def test_export_monthly_fees_csv():
    """Verify CSV export endpoint returns text/csv."""
    response = client.get("/api/reports/export/monthly-fees?month=2026-10")
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")


def test_google_auth():
    """Verify Google OAuth login/registration endpoint."""
    response = client.post(
        "/api/auth/google",
        json={
            "email": "testowner@gmail.com",
            "name": "Test Owner",
            "sub": "google-test-9999",
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "testowner@gmail.com"
    assert data["user"]["role"] == "admin"


def test_platform_overview():
    """Verify platform overview statistics endpoint."""
    response = client.get("/api/platform/overview")
    assert response.status_code == 200
    data = response.json()
    assert "total_gyms" in data
    assert "active_gyms" in data
    assert data["total_gyms"] >= 1


def test_platform_users():
    """Verify platform user listing and search endpoint."""
    response = client.get("/api/platform/users")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "is_active" in data[0]


def test_platform_status_toggle():
    """Verify platform user activation toggle."""
    # Toggle user 2 status to False then True
    response = client.put("/api/platform/users/2/status", json={"is_active": False})
    assert response.status_code == 200
    assert response.json()["is_active"] is False

    response2 = client.put("/api/platform/users/2/status", json={"is_active": True})
    assert response2.status_code == 200
    assert response2.json()["is_active"] is True
