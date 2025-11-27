from fastapi.testclient import TestClient
from src.app import app, activities


client = TestClient(app)


def test_get_activities_returns_initial_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Should contain a known activity from the in-memory DB
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    test_email = "test_student@example.com"

    # Ensure test email not present
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert test_email not in data[activity]["participants"]

    # Sign up
    resp = client.post(f"/activities/{activity}/signup?email={test_email}")
    assert resp.status_code == 200
    body = resp.json()
    assert "Signed up" in body.get("message", "")

    # Verify added
    resp = client.get("/activities")
    data = resp.json()
    assert test_email in data[activity]["participants"]

    # Unregister
    resp = client.delete(f"/activities/{activity}/signup?email={test_email}")
    assert resp.status_code == 200
    body = resp.json()
    assert "Removed" in body.get("message", "")

    # Verify removed
    resp = client.get("/activities")
    data = resp.json()
    assert test_email not in data[activity]["participants"]
