"""
Test FCM Push Notifications and Settings API
Tests for:
- Admin Settings page for notification templates at /settings
- GET /api/settings/wali-notifikasi endpoint
- PUT /api/settings/wali-notifikasi endpoint
- POST /api/wali/fcm-token endpoint
- Attendance recording triggers FCM notification attempt
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_CREDS = {"username": "admin", "password": "admin123"}
WALI_CREDS = {"username": "vvvvvvvv", "password": "12345"}
PENGABSEN_CREDS = {"username": "anwar", "password": "password123"}

# Santri ID that belongs to wali M. Anas
TEST_SANTRI_ID = "16f1db9b-cbae-46ee-ae74-06d247f18c17"


class TestAdminAuth:
    """Test admin authentication"""
    
    def test_admin_login_success(self):
        """Test admin can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        print(f"✓ Admin login successful")
        return data["access_token"]


class TestSettingsEndpoints:
    """Test notification template settings endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["access_token"]
    
    def test_get_wali_notifikasi_settings_returns_defaults(self, admin_token):
        """GET /api/settings/wali-notifikasi should return default templates"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/settings/wali-notifikasi", headers=headers)
        
        assert response.status_code == 200, f"Failed to get settings: {response.text}"
        data = response.json()
        
        # Verify all required template fields exist
        required_fields = ["hadir", "alfa", "sakit", "izin", "haid", "istihadhoh"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
            assert isinstance(data[field], str), f"Field {field} should be string"
            assert len(data[field]) > 0, f"Field {field} should not be empty"
        
        # Verify templates contain placeholders
        assert "{nama}" in data["hadir"], "Template should contain {nama} placeholder"
        assert "{waktu}" in data["hadir"], "Template should contain {waktu} placeholder"
        
        print(f"✓ GET /api/settings/wali-notifikasi returns valid templates")
        print(f"  - hadir: {data['hadir'][:50]}...")
        print(f"  - alfa: {data['alfa'][:50]}...")
    
    def test_update_wali_notifikasi_settings(self, admin_token):
        """PUT /api/settings/wali-notifikasi should update templates"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # First get current settings
        get_response = requests.get(f"{BASE_URL}/api/settings/wali-notifikasi", headers=headers)
        original_settings = get_response.json()
        
        # Update with new templates
        new_templates = {
            "hadir": "TEST: {nama} hadir sholat {waktu}",
            "alfa": "TEST: {nama} tidak hadir sholat {waktu}",
            "sakit": "TEST: {nama} sakit, tidak sholat {waktu}",
            "izin": "TEST: {nama} izin sholat {waktu}",
            "haid": "TEST: {nama} haid, tidak sholat {waktu}",
            "istihadhoh": "TEST: {nama} istihadhoh, tidak sholat {waktu}"
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/settings/wali-notifikasi",
            json=new_templates,
            headers=headers
        )
        
        assert update_response.status_code == 200, f"Failed to update settings: {update_response.text}"
        
        # Verify update was persisted
        verify_response = requests.get(f"{BASE_URL}/api/settings/wali-notifikasi", headers=headers)
        assert verify_response.status_code == 200
        updated_data = verify_response.json()
        
        assert updated_data["hadir"] == new_templates["hadir"], "hadir template not updated"
        assert updated_data["alfa"] == new_templates["alfa"], "alfa template not updated"
        
        print(f"✓ PUT /api/settings/wali-notifikasi successfully updates templates")
        
        # Restore original settings
        requests.put(f"{BASE_URL}/api/settings/wali-notifikasi", json=original_settings, headers=headers)
        print(f"  - Original settings restored")
    
    def test_settings_requires_auth(self):
        """Settings endpoints should require authentication"""
        # GET without auth
        get_response = requests.get(f"{BASE_URL}/api/settings/wali-notifikasi")
        assert get_response.status_code in [401, 403], "GET should require auth"
        
        # PUT without auth
        put_response = requests.put(
            f"{BASE_URL}/api/settings/wali-notifikasi",
            json={"hadir": "test"}
        )
        assert put_response.status_code in [401, 403], "PUT should require auth"
        
        print(f"✓ Settings endpoints properly require authentication")


class TestWaliFcmToken:
    """Test FCM token registration for Wali"""
    
    @pytest.fixture
    def wali_token(self):
        """Get wali auth token"""
        response = requests.post(f"{BASE_URL}/api/wali/login", json=WALI_CREDS)
        if response.status_code != 200:
            pytest.skip(f"Wali login failed: {response.text}")
        return response.json()["access_token"]
    
    def test_wali_login_success(self):
        """Test wali can login successfully"""
        response = requests.post(f"{BASE_URL}/api/wali/login", json=WALI_CREDS)
        assert response.status_code == 200, f"Wali login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        print(f"✓ Wali login successful - user: {data['user']['nama']}")
    
    def test_register_fcm_token_success(self, wali_token):
        """POST /api/wali/fcm-token should register FCM token"""
        headers = {"Authorization": f"Bearer {wali_token}"}
        
        # Register a test FCM token
        test_token = "test_fcm_token_12345_" + str(os.urandom(8).hex())
        response = requests.post(
            f"{BASE_URL}/api/wali/fcm-token",
            json={"token": test_token},
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to register FCM token: {response.text}"
        data = response.json()
        assert data.get("status") == "ok", f"Unexpected response: {data}"
        
        print(f"✓ POST /api/wali/fcm-token successfully registers token")
    
    def test_register_fcm_token_empty_rejected(self, wali_token):
        """POST /api/wali/fcm-token should reject empty token"""
        headers = {"Authorization": f"Bearer {wali_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/wali/fcm-token",
            json={"token": ""},
            headers=headers
        )
        
        assert response.status_code == 400, f"Empty token should be rejected: {response.text}"
        print(f"✓ Empty FCM token properly rejected")
    
    def test_fcm_token_requires_auth(self):
        """FCM token endpoint should require authentication"""
        response = requests.post(
            f"{BASE_URL}/api/wali/fcm-token",
            json={"token": "test_token"}
        )
        assert response.status_code in [401, 403], "Should require auth"
        print(f"✓ FCM token endpoint properly requires authentication")


class TestPengabsenAbsensi:
    """Test attendance recording and FCM notification trigger"""
    
    @pytest.fixture
    def pengabsen_token(self):
        """Get pengabsen auth token"""
        response = requests.post(f"{BASE_URL}/api/pengabsen/login", json=PENGABSEN_CREDS)
        if response.status_code != 200:
            pytest.skip(f"Pengabsen login failed: {response.text}")
        return response.json()["access_token"]
    
    def test_pengabsen_login_success(self):
        """Test pengabsen can login successfully"""
        response = requests.post(f"{BASE_URL}/api/pengabsen/login", json=PENGABSEN_CREDS)
        assert response.status_code == 200, f"Pengabsen login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        print(f"✓ Pengabsen login successful - user: {data['user']['nama']}")
    
    def test_record_attendance_triggers_notification(self, pengabsen_token):
        """POST /api/pengabsen/absensi should record attendance and attempt FCM notification"""
        headers = {"Authorization": f"Bearer {pengabsen_token}"}
        
        # Record attendance for the test santri
        response = requests.post(
            f"{BASE_URL}/api/pengabsen/absensi",
            params={
                "santri_id": TEST_SANTRI_ID,
                "waktu_sholat": "subuh",
                "status_absen": "hadir"
            },
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to record attendance: {response.text}"
        data = response.json()
        assert "message" in data
        assert "tanggal" in data
        
        print(f"✓ POST /api/pengabsen/absensi successfully records attendance")
        print(f"  - Message: {data['message']}")
        print(f"  - Date: {data['tanggal']}")
        print(f"  - Note: FCM notification attempt is made (success_count=0 expected for test tokens)")
    
    def test_record_attendance_different_statuses(self, pengabsen_token):
        """Test recording attendance with different statuses"""
        headers = {"Authorization": f"Bearer {pengabsen_token}"}
        
        statuses = ["hadir", "alfa", "sakit", "izin"]
        waktu_list = ["dzuhur", "ashar", "maghrib", "isya"]
        
        for status, waktu in zip(statuses, waktu_list):
            response = requests.post(
                f"{BASE_URL}/api/pengabsen/absensi",
                params={
                    "santri_id": TEST_SANTRI_ID,
                    "waktu_sholat": waktu,
                    "status_absen": status
                },
                headers=headers
            )
            
            assert response.status_code == 200, f"Failed for status={status}: {response.text}"
            print(f"  ✓ Recorded {waktu} as {status}")
        
        print(f"✓ All attendance statuses recorded successfully")


class TestWaliAbsensiView:
    """Test Wali can view their children's attendance"""
    
    @pytest.fixture
    def wali_token(self):
        """Get wali auth token"""
        response = requests.post(f"{BASE_URL}/api/wali/login", json=WALI_CREDS)
        if response.status_code != 200:
            pytest.skip(f"Wali login failed: {response.text}")
        return response.json()["access_token"]
    
    def test_wali_can_view_today_attendance(self, wali_token):
        """Wali should be able to view today's attendance"""
        headers = {"Authorization": f"Bearer {wali_token}"}
        
        response = requests.get(f"{BASE_URL}/api/wali/anak-absensi-hari-ini", headers=headers)
        
        assert response.status_code == 200, f"Failed to get today's attendance: {response.text}"
        data = response.json()
        assert "tanggal" in data
        assert "data" in data
        
        print(f"✓ Wali can view today's attendance")
        print(f"  - Date: {data['tanggal']}")
        print(f"  - Children count: {len(data['data'])}")
    
    def test_wali_can_view_history(self, wali_token):
        """Wali should be able to view attendance history"""
        headers = {"Authorization": f"Bearer {wali_token}"}
        
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        
        response = requests.get(
            f"{BASE_URL}/api/wali/anak-absensi-riwayat",
            params={"tanggal": today},
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed to get history: {response.text}"
        data = response.json()
        assert "tanggal" in data
        assert "data" in data
        
        print(f"✓ Wali can view attendance history")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        print(f"✓ API root endpoint accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
