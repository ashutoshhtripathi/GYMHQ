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


def _get_super_admin_headers():
    login_res = client.post(
        "/api/auth/login",
        json={"username": "admin", "password": "adminpassword123"}
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_platform_overview():
    """Verify platform overview statistics endpoint requires super_admin."""
    headers = _get_super_admin_headers()
    response = client.get("/api/platform/overview", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_gyms" in data
    assert "active_gyms" in data
    assert data["total_gyms"] >= 1


def test_platform_users():
    """Verify platform user listing requires super_admin."""
    headers = _get_super_admin_headers()
    response = client.get("/api/platform/users", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "is_active" in data[0]


def test_platform_status_toggle():
    """Verify platform user activation toggle."""
    headers = _get_super_admin_headers()
    response = client.put("/api/platform/users/2/status", json={"is_active": False}, headers=headers)
    assert response.status_code == 200
    assert response.json()["is_active"] is False

    response2 = client.put("/api/platform/users/2/status", json={"is_active": True}, headers=headers)
    assert response2.status_code == 200
    assert response2.json()["is_active"] is True


def test_platform_forbidden_for_regular_gym_owner():
    """Verify regular gym owners get 403 Forbidden when attempting to access platform admin."""
    # Register/login a regular gym owner
    client.post(
        "/api/auth/register",
        json={
            "username": "isolated_gym_owner",
            "password": "ownerpassword123",
            "gym_name": "Isolated Fitness Club",
        }
    )
    reg_login = client.post(
        "/api/auth/login",
        json={"username": "isolated_gym_owner", "password": "ownerpassword123"}
    )
    token = reg_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Must be 403 Forbidden
    overview_res = client.get("/api/platform/overview", headers=headers)
    assert overview_res.status_code == 403

    users_res = client.get("/api/platform/users", headers=headers)
    assert users_res.status_code == 403


def test_platform_subscription_management():
    """Verify platform owner can set gym subscription fee and extend validity."""
    headers = _get_super_admin_headers()
    # Update gym subscription fee to ₹1,499 and extend by 30 days
    sub_res = client.put(
        "/api/platform/users/2/subscription",
        json={
            "subscription_fee": 1499.00,
            "subscription_plan": "Growth Pro",
            "extend_days": 30,
            "admin_notes": "Paid quarterly advance",
        },
        headers=headers,
    )
    assert sub_res.status_code == 200
    data = sub_res.json()
    assert float(data["subscription_fee"]) == 1499.00
    assert data["subscription_plan"] == "Growth Pro"
    assert data["days_remaining"] > 0
    assert data["is_active"] is True
