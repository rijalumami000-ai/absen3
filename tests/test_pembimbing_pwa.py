"""
Test suite for Pembimbing PWA feature
Tests:
- Pembimbing PWA Login (POST /api/pembimbing/login)
- Pembimbing PWA Me (GET /api/pembimbing/me)
- Pembimbing PWA Today's Attendance (GET /api/pembimbing/santri-absensi-hari-ini)
- Pembimbing PWA History (GET /api/pembimbing/absensi-riwayat)
- Pembimbing PWA Statistics (GET /api/pembimbing/statistik)
- Admin Pembimbing CRUD (GET/POST/PUT/DELETE /api/pembimbing)
- Admin Regenerate Kode Akses (POST /api/pembimbing/{id}/regenerate-kode-akses)
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://absensi-pesantren.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"
PEMBIMBING_USERNAME = "Wafa"
PEMBIMBING_KODE_AKSES = "258064095"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Admin authentication failed - skipping admin tests")


@pytest.fixture(scope="module")
def pembimbing_token():
    """Get pembimbing authentication token"""
    response = requests.post(f"{BASE_URL}/api/pembimbing/login", json={
        "username": PEMBIMBING_USERNAME,
        "kode_akses": PEMBIMBING_KODE_AKSES
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Pembimbing authentication failed - skipping pembimbing tests")


@pytest.fixture
def admin_client(admin_token):
    """Session with admin auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}"
    })
    return session


@pytest.fixture
def pembimbing_client(pembimbing_token):
    """Session with pembimbing auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {pembimbing_token}"
    })
    return session


class TestPembimbingPWALogin:
    """Test Pembimbing PWA Login endpoint"""
    
    def test_login_success(self):
        """Test successful login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/pembimbing/login", json={
            "username": PEMBIMBING_USERNAME,
            "kode_akses": PEMBIMBING_KODE_AKSES
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["username"] == PEMBIMBING_USERNAME
        assert "id" in data["user"]
        assert "nama" in data["user"]
        assert "asrama_ids" in data["user"]
        # kode_akses should NOT be in user response for security
        assert "kode_akses" not in data["user"]
        print(f"✓ Login successful for pembimbing: {data['user']['nama']}")
    
    def test_login_invalid_kode_akses(self):
        """Test login with invalid kode_akses"""
        response = requests.post(f"{BASE_URL}/api/pembimbing/login", json={
            "username": PEMBIMBING_USERNAME,
            "kode_akses": "000000000"  # Wrong code
        })
        
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"✓ Invalid kode_akses correctly rejected")
    
    def test_login_invalid_username(self):
        """Test login with invalid username"""
        response = requests.post(f"{BASE_URL}/api/pembimbing/login", json={
            "username": "nonexistent_user",
            "kode_akses": PEMBIMBING_KODE_AKSES
        })
        
        assert response.status_code == 401
        print(f"✓ Invalid username correctly rejected")


class TestPembimbingPWAMe:
    """Test Pembimbing PWA Me endpoint"""
    
    def test_get_me_success(self, pembimbing_client):
        """Test getting current pembimbing info"""
        response = pembimbing_client.get(f"{BASE_URL}/api/pembimbing/me")
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "nama" in data
        assert "username" in data
        assert "asrama_ids" in data
        # kode_akses should NOT be exposed
        assert "kode_akses" not in data
        print(f"✓ Got pembimbing info: {data['nama']}")
    
    def test_get_me_unauthorized(self):
        """Test getting me without auth"""
        response = requests.get(f"{BASE_URL}/api/pembimbing/me")
        assert response.status_code in [401, 403]
        print(f"✓ Unauthorized access correctly rejected")


class TestPembimbingPWATodayAttendance:
    """Test Pembimbing PWA Today's Attendance endpoint"""
    
    def test_get_today_attendance_all(self, pembimbing_client):
        """Test getting today's attendance for all waktu sholat"""
        response = pembimbing_client.get(f"{BASE_URL}/api/pembimbing/santri-absensi-hari-ini")
        
        assert response.status_code == 200
        data = response.json()
        assert "tanggal" in data
        assert "data" in data
        assert isinstance(data["data"], list)
        
        # Check data structure if there are santri
        if len(data["data"]) > 0:
            santri = data["data"][0]
            assert "santri_id" in santri
            assert "nama" in santri
            assert "nis" in santri
            assert "asrama_id" in santri
            assert "nama_asrama" in santri
            assert "status" in santri
            print(f"✓ Got today's attendance: {len(data['data'])} santri")
        else:
            print(f"✓ Got today's attendance: No santri in pembimbing's asrama")
    
    def test_get_today_attendance_filtered(self, pembimbing_client):
        """Test getting today's attendance filtered by waktu sholat"""
        waktu_list = ["subuh", "dzuhur", "ashar", "maghrib", "isya"]
        
        for waktu in waktu_list:
            response = pembimbing_client.get(
                f"{BASE_URL}/api/pembimbing/santri-absensi-hari-ini",
                params={"waktu_sholat": waktu}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["waktu_sholat"] == waktu
            print(f"✓ Got attendance for {waktu}: {len(data['data'])} santri")


class TestPembimbingPWAHistory:
    """Test Pembimbing PWA History endpoint"""
    
    def test_get_history(self, pembimbing_client):
        """Test getting historical attendance"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        response = pembimbing_client.get(
            f"{BASE_URL}/api/pembimbing/absensi-riwayat",
            params={"tanggal": today}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "tanggal" in data
        assert "data" in data
        assert data["tanggal"] == today
        print(f"✓ Got history for {today}: {len(data['data'])} santri")
    
    def test_get_history_with_waktu_filter(self, pembimbing_client):
        """Test getting historical attendance with waktu filter"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        response = pembimbing_client.get(
            f"{BASE_URL}/api/pembimbing/absensi-riwayat",
            params={"tanggal": today, "waktu_sholat": "subuh"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["waktu_sholat"] == "subuh"
        print(f"✓ Got history for {today} subuh: {len(data['data'])} santri")


class TestPembimbingPWAStatistik:
    """Test Pembimbing PWA Statistics endpoint"""
    
    def test_get_statistik(self, pembimbing_client):
        """Test getting attendance statistics"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        response = pembimbing_client.get(
            f"{BASE_URL}/api/pembimbing/statistik",
            params={"tanggal": today}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "tanggal" in data
        assert "total_santri" in data
        assert "stats" in data
        
        # Check stats structure
        stats = data["stats"]
        waktu_list = ["subuh", "dzuhur", "ashar", "maghrib", "isya"]
        for waktu in waktu_list:
            assert waktu in stats
            assert "hadir" in stats[waktu]
            assert "alfa" in stats[waktu]
            assert "sakit" in stats[waktu]
            assert "izin" in stats[waktu]
            assert "belum" in stats[waktu]
        
        print(f"✓ Got statistics for {today}: {data['total_santri']} total santri")


class TestAdminPembimbingCRUD:
    """Test Admin Pembimbing CRUD endpoints"""
    
    def test_get_all_pembimbing(self, admin_client):
        """Test getting all pembimbing"""
        response = admin_client.get(f"{BASE_URL}/api/pembimbing")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Check data structure if there are pembimbing
        if len(data) > 0:
            pembimbing = data[0]
            assert "id" in pembimbing
            assert "nama" in pembimbing
            assert "username" in pembimbing
            assert "kode_akses" in pembimbing  # Admin should see kode_akses
            assert "asrama_ids" in pembimbing
            print(f"✓ Got {len(data)} pembimbing")
        else:
            print(f"✓ Got pembimbing list (empty)")
    
    def test_create_pembimbing(self, admin_client):
        """Test creating a new pembimbing"""
        test_data = {
            "nama": "TEST_Pembimbing_New",
            "username": "TEST_pembimbing_new",
            "email_atau_hp": "test@example.com",
            "asrama_ids": []
        }
        
        response = admin_client.post(f"{BASE_URL}/api/pembimbing", json=test_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["nama"] == test_data["nama"]
        assert data["username"] == test_data["username"]
        assert "kode_akses" in data
        assert len(data["kode_akses"]) == 9  # 9-digit code
        assert data["kode_akses"].isdigit()  # All digits
        
        print(f"✓ Created pembimbing with kode_akses: {data['kode_akses']}")
        
        # Store ID for cleanup
        return data["id"]
    
    def test_update_pembimbing(self, admin_client):
        """Test updating a pembimbing"""
        # First create a pembimbing
        create_data = {
            "nama": "TEST_Pembimbing_Update",
            "username": "TEST_pembimbing_update",
            "email_atau_hp": "update@example.com",
            "asrama_ids": []
        }
        create_response = admin_client.post(f"{BASE_URL}/api/pembimbing", json=create_data)
        assert create_response.status_code == 200
        pembimbing_id = create_response.json()["id"]
        
        # Update the pembimbing
        update_data = {
            "nama": "TEST_Pembimbing_Updated",
            "email_atau_hp": "updated@example.com"
        }
        response = admin_client.put(f"{BASE_URL}/api/pembimbing/{pembimbing_id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["nama"] == update_data["nama"]
        assert data["email_atau_hp"] == update_data["email_atau_hp"]
        
        print(f"✓ Updated pembimbing: {data['nama']}")
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/pembimbing/{pembimbing_id}")
    
    def test_regenerate_kode_akses(self, admin_client):
        """Test regenerating kode_akses for a pembimbing"""
        # First create a pembimbing
        create_data = {
            "nama": "TEST_Pembimbing_Regen",
            "username": "TEST_pembimbing_regen",
            "email_atau_hp": "regen@example.com",
            "asrama_ids": []
        }
        create_response = admin_client.post(f"{BASE_URL}/api/pembimbing", json=create_data)
        assert create_response.status_code == 200
        pembimbing_id = create_response.json()["id"]
        old_kode = create_response.json()["kode_akses"]
        
        # Regenerate kode_akses
        response = admin_client.post(f"{BASE_URL}/api/pembimbing/{pembimbing_id}/regenerate-kode-akses")
        
        assert response.status_code == 200
        data = response.json()
        assert "kode_akses" in data
        assert len(data["kode_akses"]) == 9
        assert data["kode_akses"].isdigit()
        assert data["kode_akses"] != old_kode  # Should be different
        
        print(f"✓ Regenerated kode_akses: {old_kode} -> {data['kode_akses']}")
        
        # Cleanup
        admin_client.delete(f"{BASE_URL}/api/pembimbing/{pembimbing_id}")
    
    def test_delete_pembimbing(self, admin_client):
        """Test deleting a pembimbing"""
        # First create a pembimbing
        create_data = {
            "nama": "TEST_Pembimbing_Delete",
            "username": "TEST_pembimbing_delete",
            "email_atau_hp": "delete@example.com",
            "asrama_ids": []
        }
        create_response = admin_client.post(f"{BASE_URL}/api/pembimbing", json=create_data)
        assert create_response.status_code == 200
        pembimbing_id = create_response.json()["id"]
        
        # Delete the pembimbing
        response = admin_client.delete(f"{BASE_URL}/api/pembimbing/{pembimbing_id}")
        
        assert response.status_code == 200
        
        # Verify deletion
        get_response = admin_client.get(f"{BASE_URL}/api/pembimbing")
        pembimbing_list = get_response.json()
        assert not any(p["id"] == pembimbing_id for p in pembimbing_list)
        
        print(f"✓ Deleted pembimbing: {pembimbing_id}")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_pembimbing(self, admin_client):
        """Clean up any TEST_ prefixed pembimbing"""
        response = admin_client.get(f"{BASE_URL}/api/pembimbing")
        if response.status_code == 200:
            pembimbing_list = response.json()
            for p in pembimbing_list:
                if p["nama"].startswith("TEST_") or p["username"].startswith("TEST_"):
                    admin_client.delete(f"{BASE_URL}/api/pembimbing/{p['id']}")
                    print(f"✓ Cleaned up test pembimbing: {p['nama']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
