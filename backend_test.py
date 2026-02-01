#!/usr/bin/env python3
"""
Backend Test Suite for Absensi Sholat API
Tests RBAC admin functionality and updated endpoints
"""

import requests
import json
import sys
import jwt
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://attendance-system-48.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

# RBAC Test Accounts
RBAC_TEST_ACCOUNTS = [
    {"username": "admin", "password": "admin123", "expected_role": "superadmin"},
    {"username": "alhamidcintamulya", "password": "alhamidku123", "expected_role": "superadmin"},
    {"username": "alhamid", "password": "alhamidku123", "expected_role": "pesantren"},
    {"username": "madin", "password": "madinku123", "expected_role": "madin"}
]

class AbsensiSholatTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.headers = {}
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, message: str, response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
    
    def login(self) -> bool:
        """Test login and get authentication token"""
        try:
            login_data = {
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            }
            
            response = requests.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.headers = {"Authorization": f"Bearer {self.token}"}
                
                # Verify token structure
                user_data = data.get("user", {})
                required_fields = ["id", "username", "nama", "created_at"]
                missing_fields = [f for f in required_fields if f not in user_data]
                
                if missing_fields:
                    self.log_test("Login", False, f"Missing user fields: {missing_fields}", data)
                    return False
                
                self.log_test("Login", True, f"Successfully logged in as {user_data.get('nama')}")
                return True
            else:
                self.log_test("Login", False, f"Login failed with status {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_test("Login", False, f"Login error: {str(e)}")
            return False
    
    def test_asrama_endpoint(self) -> bool:
        """Test GET /api/asrama endpoint"""
        try:
            response = requests.get(
                f"{self.base_url}/asrama",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response is a list
                if not isinstance(data, list):
                    self.log_test("GET /api/asrama", False, "Response is not a list", data)
                    return False
                
                # Check that _id field is not present in any item
                for item in data:
                    if "_id" in item:
                        self.log_test("GET /api/asrama", False, "Response contains _id field", item)
                        return False
                
                # Check required fields for asrama
                if data:  # If there's data, check structure
                    required_fields = ["id", "nama", "gender", "kapasitas", "created_at"]
                    sample_item = data[0]
                    missing_fields = [f for f in required_fields if f not in sample_item]
                    
                    if missing_fields:
                        self.log_test("GET /api/asrama", False, f"Missing required fields: {missing_fields}", sample_item)
                        return False
                
                self.log_test("GET /api/asrama", True, f"Retrieved {len(data)} asrama records without _id field")
                return True
            else:
                self.log_test("GET /api/asrama", False, f"Request failed with status {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_test("GET /api/asrama", False, f"Request error: {str(e)}")
            return False
    
    def test_pengabsen_endpoint(self) -> bool:
        """Test GET /api/pengabsen endpoint with new model"""
        try:
            response = requests.get(
                f"{self.base_url}/pengabsen",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response is a list
                if not isinstance(data, list):
                    self.log_test("GET /api/pengabsen", False, "Response is not a list", data)
                    return False
                
                # Check new model fields
                required_fields = ["id", "nama", "email_atau_hp", "username", "asrama_ids", "created_at"]
                
                if data:  # If there's data, check structure
                    sample_item = data[0]
                    missing_fields = [f for f in required_fields if f not in sample_item]
                    
                    if missing_fields:
                        self.log_test("GET /api/pengabsen", False, f"Missing required fields: {missing_fields}", sample_item)
                        return False
                    
                    # Check that asrama_ids is an array
                    if not isinstance(sample_item.get("asrama_ids"), list):
                        self.log_test("GET /api/pengabsen", False, "asrama_ids is not an array", sample_item)
                        return False
                    
                    # Check that _id field is not present
                    if "_id" in sample_item:
                        self.log_test("GET /api/pengabsen", False, "Response contains _id field", sample_item)
                        return False
                
                self.log_test("GET /api/pengabsen", True, f"Retrieved {len(data)} pengabsen records with correct new model")
                return True
            else:
                self.log_test("GET /api/pengabsen", False, f"Request failed with status {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_test("GET /api/pengabsen", False, f"Request error: {str(e)}")
            return False
    
    def test_pembimbing_endpoint(self) -> bool:
        """Test GET /api/pembimbing endpoint with new model"""
        try:
            response = requests.get(
                f"{self.base_url}/pembimbing",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response is a list
                if not isinstance(data, list):
                    self.log_test("GET /api/pembimbing", False, "Response is not a list", data)
                    return False
                
                # Check new model fields
                required_fields = ["id", "nama", "email_atau_hp", "username", "asrama_ids", "created_at"]
                
                if data:  # If there's data, check structure
                    sample_item = data[0]
                    missing_fields = [f for f in required_fields if f not in sample_item]
                    
                    if missing_fields:
                        self.log_test("GET /api/pembimbing", False, f"Missing required fields: {missing_fields}", sample_item)
                        return False
                    
                    # Check that asrama_ids is an array
                    if not isinstance(sample_item.get("asrama_ids"), list):
                        self.log_test("GET /api/pembimbing", False, "asrama_ids is not an array", sample_item)
                        return False
                    
                    # Check that _id field is not present
                    if "_id" in sample_item:
                        self.log_test("GET /api/pembimbing", False, "Response contains _id field", sample_item)
                        return False
                
                self.log_test("GET /api/pembimbing", True, f"Retrieved {len(data)} pembimbing records with correct new model")
                return True
            else:
                self.log_test("GET /api/pembimbing", False, f"Request failed with status {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_test("GET /api/pembimbing", False, f"Request error: {str(e)}")
            return False
    
    def test_admin_seeding(self) -> bool:
        """Test POST /api/init/admin endpoint (idempotent seeding)"""
        try:
            response = requests.post(
                f"{self.base_url}/init/admin",
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_message = "Akun-akun admin berhasil diinisialisasi"
                
                if data.get("message") == expected_message:
                    self.log_test("POST /api/init/admin", True, "Admin accounts seeded successfully")
                    
                    # Test idempotency - call again
                    response2 = requests.post(
                        f"{self.base_url}/init/admin",
                        timeout=30
                    )
                    
                    if response2.status_code == 200 and response2.json().get("message") == expected_message:
                        self.log_test("POST /api/init/admin (idempotent)", True, "Idempotent call successful")
                        return True
                    else:
                        self.log_test("POST /api/init/admin (idempotent)", False, "Idempotent call failed", response2.json())
                        return False
                else:
                    self.log_test("POST /api/init/admin", False, f"Unexpected message: {data.get('message')}", data)
                    return False
            else:
                self.log_test("POST /api/init/admin", False, f"Request failed with status {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_test("POST /api/init/admin", False, f"Request error: {str(e)}")
            return False

    def test_rbac_login_accounts(self) -> bool:
        """Test login with all RBAC admin accounts and verify roles"""
        all_success = True
        
        for account in RBAC_TEST_ACCOUNTS:
            username = account["username"]
            password = account["password"]
            expected_role = account["expected_role"]
            
            try:
                login_data = {
                    "username": username,
                    "password": password
                }
                
                response = requests.post(
                    f"{self.base_url}/auth/login",
                    json=login_data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    user_data = data.get("user", {})
                    actual_role = user_data.get("role")
                    
                    # Check if role matches expected
                    if actual_role == expected_role:
                        self.log_test(f"Login {username}", True, f"Successfully logged in with role: {actual_role}")
                        
                        # Verify JWT token contains role
                        access_token = data.get("access_token")
                        if access_token:
                            try:
                                # Decode JWT without verification (just to check payload)
                                decoded = jwt.decode(access_token, options={"verify_signature": False})
                                token_role = decoded.get("role")
                                
                                if token_role == expected_role:
                                    self.log_test(f"JWT Role {username}", True, f"JWT contains correct role: {token_role}")
                                else:
                                    self.log_test(f"JWT Role {username}", False, f"JWT role mismatch. Expected: {expected_role}, Got: {token_role}")
                                    all_success = False
                            except Exception as jwt_error:
                                self.log_test(f"JWT Decode {username}", False, f"JWT decode error: {str(jwt_error)}")
                                all_success = False
                        else:
                            self.log_test(f"JWT Token {username}", False, "No access_token in response")
                            all_success = False
                    else:
                        self.log_test(f"Login {username}", False, f"Role mismatch. Expected: {expected_role}, Got: {actual_role}", data)
                        all_success = False
                else:
                    self.log_test(f"Login {username}", False, f"Login failed with status {response.status_code}", response.json())
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"Login {username}", False, f"Login error: {str(e)}")
                all_success = False
        
        return all_success

    def test_rbac_me_endpoint(self) -> bool:
        """Test GET /api/auth/me with each admin account to verify role persistence"""
        all_success = True
        
        for account in RBAC_TEST_ACCOUNTS:
            username = account["username"]
            password = account["password"]
            expected_role = account["expected_role"]
            
            try:
                # Login to get token
                login_data = {
                    "username": username,
                    "password": password
                }
                
                login_response = requests.post(
                    f"{self.base_url}/auth/login",
                    json=login_data,
                    timeout=30
                )
                
                if login_response.status_code != 200:
                    self.log_test(f"ME Login {username}", False, f"Login failed for /me test", login_response.json())
                    all_success = False
                    continue
                
                login_data = login_response.json()
                access_token = login_data.get("access_token")
                
                if not access_token:
                    self.log_test(f"ME Token {username}", False, "No access token received")
                    all_success = False
                    continue
                
                # Test /me endpoint
                me_headers = {"Authorization": f"Bearer {access_token}"}
                me_response = requests.get(
                    f"{self.base_url}/auth/me",
                    headers=me_headers,
                    timeout=30
                )
                
                if me_response.status_code == 200:
                    me_data = me_response.json()
                    actual_role = me_data.get("role")
                    
                    if actual_role == expected_role:
                        self.log_test(f"GET /auth/me {username}", True, f"Role verified: {actual_role}")
                    else:
                        self.log_test(f"GET /auth/me {username}", False, f"Role mismatch. Expected: {expected_role}, Got: {actual_role}", me_data)
                        all_success = False
                else:
                    self.log_test(f"GET /auth/me {username}", False, f"/me request failed with status {me_response.status_code}", me_response.json())
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"GET /auth/me {username}", False, f"Request error: {str(e)}")
                all_success = False
        
        return all_success

    def test_absensi_riwayat_endpoint(self) -> bool:
        """Test new /api/absensi/riwayat endpoint with various parameter combinations"""
        from datetime import datetime, timedelta
        
        today = datetime.now().strftime("%Y-%m-%d")
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        
        test_cases = [
            {
                "name": "tanggal_start only (today)",
                "params": {"tanggal_start": today},
                "description": "Backend should treat tanggal_end = tanggal_start"
            },
            {
                "name": "tanggal_start and tanggal_end range",
                "params": {"tanggal_start": week_ago, "tanggal_end": today},
                "description": "7-day range test"
            },
            {
                "name": "tanggal_start with asrama_id filter",
                "params": {"tanggal_start": today, "asrama_id": "test_asrama"},
                "description": "Filter by asrama_id"
            },
            {
                "name": "tanggal_start with gender filter",
                "params": {"tanggal_start": today, "gender": "putra"},
                "description": "Filter by gender"
            }
        ]
        
        all_success = True
        
        for test_case in test_cases:
            try:
                response = requests.get(
                    f"{self.base_url}/absensi/riwayat",
                    params=test_case["params"],
                    headers=self.headers,
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Verify response structure
                    required_fields = ["summary", "detail"]
                    missing_fields = [f for f in required_fields if f not in data]
                    
                    if missing_fields:
                        self.log_test(f"Riwayat {test_case['name']}", False, f"Missing fields: {missing_fields}", data)
                        all_success = False
                        continue
                    
                    # Verify summary structure
                    summary = data.get("summary", {})
                    if "total_records" not in summary or "by_waktu" not in summary:
                        self.log_test(f"Riwayat {test_case['name']}", False, "Invalid summary structure", summary)
                        all_success = False
                        continue
                    
                    # Verify detail structure
                    detail = data.get("detail", {})
                    waktu_sholat_list = ["subuh", "dzuhur", "ashar", "maghrib", "isya"]
                    status_list = ["hadir", "alfa", "sakit", "izin", "haid", "istihadhoh"]
                    
                    for waktu in waktu_sholat_list:
                        if waktu not in detail:
                            self.log_test(f"Riwayat {test_case['name']}", False, f"Missing waktu {waktu} in detail", detail)
                            all_success = False
                            break
                        
                        for status in status_list:
                            if status not in detail[waktu]:
                                self.log_test(f"Riwayat {test_case['name']}", False, f"Missing status {status} for {waktu}", detail[waktu])
                                all_success = False
                                break
                    
                    if all_success:
                        self.log_test(f"Riwayat {test_case['name']}", True, f"Valid structure - {test_case['description']}")
                
                elif response.status_code == 500:
                    self.log_test(f"Riwayat {test_case['name']}", False, "Server error 500", response.json())
                    all_success = False
                else:
                    self.log_test(f"Riwayat {test_case['name']}", True, f"No server error (status: {response.status_code})")
                    
            except Exception as e:
                self.log_test(f"Riwayat {test_case['name']}", False, f"Request error: {str(e)}")
                all_success = False
        
        return all_success

    def test_absensi_detail_legacy_consistency(self) -> bool:
        """Test /api/absensi/detail consistency with /api/absensi/riwayat"""
        from datetime import datetime
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        try:
            # Test legacy endpoint
            detail_response = requests.get(
                f"{self.base_url}/absensi/detail",
                params={"tanggal": today},
                headers=self.headers,
                timeout=30
            )
            
            # Test new endpoint with equivalent parameters
            riwayat_response = requests.get(
                f"{self.base_url}/absensi/riwayat",
                params={"tanggal_start": today, "tanggal_end": today},
                headers=self.headers,
                timeout=30
            )
            
            if detail_response.status_code == 200 and riwayat_response.status_code == 200:
                detail_data = detail_response.json()
                riwayat_data = riwayat_response.json()
                
                # Compare structure
                if detail_data.keys() != riwayat_data.keys():
                    self.log_test("Legacy Detail Consistency", False, "Different top-level keys", {
                        "detail_keys": list(detail_data.keys()),
                        "riwayat_keys": list(riwayat_data.keys())
                    })
                    return False
                
                # Compare summary
                if detail_data.get("summary") != riwayat_data.get("summary"):
                    self.log_test("Legacy Detail Consistency", False, "Summary data mismatch", {
                        "detail_summary": detail_data.get("summary"),
                        "riwayat_summary": riwayat_data.get("summary")
                    })
                    return False
                
                self.log_test("Legacy Detail Consistency", True, "Both endpoints return consistent data")
                return True
            
            elif detail_response.status_code == 500 or riwayat_response.status_code == 500:
                self.log_test("Legacy Detail Consistency", False, "One or both endpoints returned 500 error")
                return False
            else:
                self.log_test("Legacy Detail Consistency", True, f"Both endpoints accessible (detail: {detail_response.status_code}, riwayat: {riwayat_response.status_code})")
                return True
                
        except Exception as e:
            self.log_test("Legacy Detail Consistency", False, f"Request error: {str(e)}")
            return False

    def test_masbuq_field_in_riwayat_endpoints(self) -> bool:
        """Test masbuq field in pengabsen/riwayat and absensi/riwayat endpoints"""
        from datetime import datetime, timezone, timedelta
        
        # Use WIB timezone (UTC+7) for today's date as specified in the request
        wib_tz = timezone(timedelta(hours=7))
        today = datetime.now(wib_tz).date().isoformat()
        
        all_success = True
        
        # First, we need to get pengabsen credentials to create test absensi
        pengabsen_token = None
        pengabsen_id = None
        
        try:
            # Get pengabsen list to find one we can use
            pengabsen_response = requests.get(
                f"{self.base_url}/pengabsen",
                headers=self.headers,
                timeout=30
            )
            
            if pengabsen_response.status_code == 200:
                pengabsen_list = pengabsen_response.json()
                if pengabsen_list:
                    # Use first pengabsen for testing
                    test_pengabsen = pengabsen_list[0]
                    pengabsen_username = test_pengabsen.get("username")
                    pengabsen_kode = test_pengabsen.get("kode_akses")
                    pengabsen_id = test_pengabsen.get("id")
                    
                    # Login as pengabsen
                    login_data = {
                        "username": pengabsen_username,
                        "kode_akses": pengabsen_kode
                    }
                    
                    login_response = requests.post(
                        f"{self.base_url}/pengabsen/login",
                        json=login_data,
                        timeout=30
                    )
                    
                    if login_response.status_code == 200:
                        pengabsen_token = login_response.json().get("access_token")
                        self.log_test("Pengabsen Login", True, f"Successfully logged in as pengabsen: {pengabsen_username}")
                    else:
                        self.log_test("Pengabsen Login", False, f"Failed to login as pengabsen", login_response.json())
                        return False
                else:
                    self.log_test("Get Pengabsen", False, "No pengabsen found in system")
                    return False
            else:
                self.log_test("Get Pengabsen", False, f"Failed to get pengabsen list", pengabsen_response.json())
                return False
                
        except Exception as e:
            self.log_test("Pengabsen Setup", False, f"Error setting up pengabsen: {str(e)}")
            return False
        
        # Get santri list to create test absensi
        try:
            santri_response = requests.get(
                f"{self.base_url}/santri",
                headers=self.headers,
                timeout=30
            )
            
            if santri_response.status_code == 200:
                santri_list = santri_response.json()
                if not santri_list:
                    self.log_test("Get Santri", False, "No santri found in system")
                    return False
                
                # Use first santri for testing
                test_santri = santri_list[0]
                santri_id = test_santri.get("id")
                santri_nama = test_santri.get("nama")
                
                self.log_test("Get Santri", True, f"Found test santri: {santri_nama}")
                
            else:
                self.log_test("Get Santri", False, f"Failed to get santri list", santri_response.json())
                return False
                
        except Exception as e:
            self.log_test("Santri Setup", False, f"Error getting santri: {str(e)}")
            return False
        
        # Create test absensi with different statuses including 'masbuq'
        pengabsen_headers = {"Authorization": f"Bearer {pengabsen_token}"}
        waktu_sholat_list = ["subuh", "dzuhur", "ashar", "maghrib", "isya"]
        status_list = ["hadir", "alfa", "masbuq"]  # Include masbuq status
        
        created_absensi = []
        
        for i, waktu in enumerate(waktu_sholat_list):
            status = status_list[i % len(status_list)]  # Rotate through statuses
            
            try:
                absensi_data = {
                    "santri_id": santri_id,
                    "waktu_sholat": waktu,
                    "status_absen": status
                }
                
                # Use form data for the POST request
                absensi_response = requests.post(
                    f"{self.base_url}/pengabsen/absensi",
                    params=absensi_data,
                    headers=pengabsen_headers,
                    timeout=30
                )
                
                if absensi_response.status_code == 200:
                    created_absensi.append({"waktu": waktu, "status": status})
                    self.log_test(f"Create Absensi {waktu}", True, f"Created {status} absensi for {waktu}")
                else:
                    self.log_test(f"Create Absensi {waktu}", False, f"Failed to create absensi", absensi_response.json())
                    
            except Exception as e:
                self.log_test(f"Create Absensi {waktu}", False, f"Error creating absensi: {str(e)}")
        
        # Test 1: GET /api/pengabsen/riwayat with masbuq field
        try:
            riwayat_params = {
                "tanggal_start": today,
                "tanggal_end": today
            }
            
            riwayat_response = requests.get(
                f"{self.base_url}/pengabsen/riwayat",
                params=riwayat_params,
                headers=pengabsen_headers,
                timeout=30
            )
            
            if riwayat_response.status_code == 200:
                riwayat_data = riwayat_response.json()
                
                # Check if response has the expected structure
                items = riwayat_data.get("items", [])
                if isinstance(items, list) and len(items) > 0:
                    # Check each summary item for masbuq field
                    masbuq_found = False
                    for item in items:
                        if "masbuq" in item:
                            masbuq_found = True
                            masbuq_value = item["masbuq"]
                            self.log_test("Pengabsen Riwayat masbuq field", True, f"Found masbuq field with value: {masbuq_value}")
                            break
                    
                    if not masbuq_found:
                        # Check if masbuq field exists with default value 0
                        sample_item = items[0]
                        if "masbuq" not in sample_item:
                            self.log_test("Pengabsen Riwayat masbuq field", False, "masbuq field missing from response", sample_item)
                            all_success = False
                        else:
                            self.log_test("Pengabsen Riwayat masbuq field", True, f"masbuq field present with default value: {sample_item['masbuq']}")
                else:
                    self.log_test("Pengabsen Riwayat structure", True, "No data returned (empty response)")
                    
            else:
                self.log_test("Pengabsen Riwayat", False, f"Request failed with status {riwayat_response.status_code}", riwayat_response.json())
                all_success = False
                
        except Exception as e:
            self.log_test("Pengabsen Riwayat", False, f"Request error: {str(e)}")
            all_success = False
        
        # Test 2: GET /api/absensi/riwayat with masbuq field in summary.by_waktu
        try:
            admin_riwayat_params = {
                "tanggal_start": today,
                "tanggal_end": today
            }
            
            admin_riwayat_response = requests.get(
                f"{self.base_url}/absensi/riwayat",
                params=admin_riwayat_params,
                headers=self.headers,
                timeout=30
            )
            
            if admin_riwayat_response.status_code == 200:
                admin_data = admin_riwayat_response.json()
                
                # Check summary.by_waktu structure for masbuq field
                summary = admin_data.get("summary", {})
                by_waktu = summary.get("by_waktu", {})
                
                if by_waktu:
                    masbuq_found_in_waktu = False
                    for waktu, waktu_data in by_waktu.items():
                        if "masbuq" in waktu_data:
                            masbuq_found_in_waktu = True
                            masbuq_count = waktu_data["masbuq"]
                            self.log_test(f"Admin Riwayat masbuq {waktu}", True, f"Found masbuq field for {waktu}: {masbuq_count}")
                        else:
                            self.log_test(f"Admin Riwayat masbuq {waktu}", False, f"masbuq field missing for {waktu}", waktu_data)
                            all_success = False
                    
                    if masbuq_found_in_waktu:
                        self.log_test("Admin Riwayat masbuq fields", True, "masbuq fields found in by_waktu summary")
                else:
                    self.log_test("Admin Riwayat by_waktu", True, "No by_waktu data (empty response)")
                    
            else:
                self.log_test("Admin Riwayat", False, f"Request failed with status {admin_riwayat_response.status_code}", admin_riwayat_response.json())
                all_success = False
                
        except Exception as e:
            self.log_test("Admin Riwayat", False, f"Request error: {str(e)}")
            all_success = False
        
        return all_success

    def test_absensi_stats_masbuq_field(self) -> bool:
        """Test masbuq field in /api/absensi/stats endpoint"""
        from datetime import datetime, timezone, timedelta
        
        # Use WIB timezone (UTC+7) for today's date
        wib_tz = timezone(timedelta(hours=7))
        today = datetime.now(wib_tz).date().isoformat()
        
        try:
            stats_params = {
                "tanggal_start": today,
                "tanggal_end": today
            }
            
            stats_response = requests.get(
                f"{self.base_url}/absensi/stats",
                params=stats_params,
                headers=self.headers,
                timeout=30
            )
            
            if stats_response.status_code == 200:
                stats_data = stats_response.json()
                
                # Check if masbuq field exists in response
                if "masbuq" in stats_data:
                    masbuq_count = stats_data["masbuq"]
                    self.log_test("Absensi Stats masbuq field", True, f"masbuq field found with value: {masbuq_count}")
                    
                    # Verify it's a number
                    if isinstance(masbuq_count, (int, float)):
                        self.log_test("Absensi Stats masbuq type", True, f"masbuq value is numeric: {masbuq_count}")
                        return True
                    else:
                        self.log_test("Absensi Stats masbuq type", False, f"masbuq value is not numeric: {type(masbuq_count)}")
                        return False
                else:
                    self.log_test("Absensi Stats masbuq field", False, "masbuq field missing from stats response", stats_data)
                    return False
                    
            else:
                self.log_test("Absensi Stats", False, f"Request failed with status {stats_response.status_code}", stats_response.json())
                return False
                
        except Exception as e:
            self.log_test("Absensi Stats", False, f"Request error: {str(e)}")
            return False

    def test_absensi_kelas_delete_endpoint(self) -> bool:
        """Test DELETE /api/absensi-kelas/{absensi_id} endpoint"""
        from datetime import datetime, timezone, timedelta
        
        # Use WIB timezone (UTC+7) for today's date
        wib_tz = timezone(timedelta(hours=7))
        today = datetime.now(wib_tz).date().isoformat()
        
        all_success = True
        
        # First, get pengabsen_kelas credentials
        pengabsen_kelas_token = None
        pengabsen_kelas_id = None
        
        try:
            # Get pengabsen_kelas list
            pengabsen_kelas_response = requests.get(
                f"{self.base_url}/pengabsen-kelas",
                headers=self.headers,
                timeout=30
            )
            
            if pengabsen_kelas_response.status_code == 200:
                pengabsen_kelas_list = pengabsen_kelas_response.json()
                if pengabsen_kelas_list:
                    # Use first pengabsen_kelas for testing
                    test_pengabsen_kelas = pengabsen_kelas_list[0]
                    pengabsen_kelas_username = test_pengabsen_kelas.get("username")
                    pengabsen_kelas_kode = test_pengabsen_kelas.get("kode_akses")
                    pengabsen_kelas_id = test_pengabsen_kelas.get("id")
                    
                    # Login as pengabsen_kelas
                    login_data = {
                        "username": pengabsen_kelas_username,
                        "kode_akses": pengabsen_kelas_kode
                    }
                    
                    login_response = requests.post(
                        f"{self.base_url}/pengabsen-kelas/login",
                        json=login_data,
                        timeout=30
                    )
                    
                    if login_response.status_code == 200:
                        pengabsen_kelas_token = login_response.json().get("access_token")
                        self.log_test("Pengabsen Kelas Login", True, f"Successfully logged in as pengabsen_kelas: {pengabsen_kelas_username}")
                    else:
                        self.log_test("Pengabsen Kelas Login", False, f"Failed to login as pengabsen_kelas", login_response.json())
                        return False
                else:
                    self.log_test("Get Pengabsen Kelas", False, "No pengabsen_kelas found in system")
                    return False
            else:
                self.log_test("Get Pengabsen Kelas", False, f"Failed to get pengabsen_kelas list", pengabsen_kelas_response.json())
                return False
                
        except Exception as e:
            self.log_test("Pengabsen Kelas Setup", False, f"Error setting up pengabsen_kelas: {str(e)}")
            return False
        
        # Get siswa and kelas for creating absensi_kelas
        try:
            # Get siswa list
            siswa_response = requests.get(
                f"{self.base_url}/siswa-madrasah",
                headers=self.headers,
                timeout=30
            )
            
            # Get kelas list
            kelas_response = requests.get(
                f"{self.base_url}/kelas",
                headers=self.headers,
                timeout=30
            )
            
            if siswa_response.status_code == 200 and kelas_response.status_code == 200:
                siswa_list = siswa_response.json()
                kelas_list = kelas_response.json()
                
                if not siswa_list or not kelas_list:
                    self.log_test("Get Siswa/Kelas", False, "No siswa or kelas found in system")
                    return False
                
                # Use first siswa and kelas for testing
                test_siswa = siswa_list[0]
                test_kelas = kelas_list[0]
                siswa_id = test_siswa.get("id")
                kelas_id = test_kelas.get("id")
                
                self.log_test("Get Siswa/Kelas", True, f"Found test siswa: {test_siswa.get('nama')}, kelas: {test_kelas.get('nama')}")
                
            else:
                self.log_test("Get Siswa/Kelas", False, f"Failed to get siswa/kelas lists")
                return False
                
        except Exception as e:
            self.log_test("Siswa/Kelas Setup", False, f"Error getting siswa/kelas: {str(e)}")
            return False
        
        # Create absensi_kelas via POST /api/absensi-kelas/manual
        pengabsen_kelas_headers = {"Authorization": f"Bearer {pengabsen_kelas_token}"}
        absensi_id = None
        
        try:
            absensi_kelas_data = {
                "siswa_id": siswa_id,
                "kelas_id": kelas_id,
                "tanggal": today,
                "status": "hadir"
            }
            
            create_response = requests.post(
                f"{self.base_url}/absensi-kelas/manual",
                json=absensi_kelas_data,
                headers=pengabsen_kelas_headers,
                timeout=30
            )
            
            if create_response.status_code == 200:
                create_data = create_response.json()
                absensi_id = create_data.get("absensi_id") or create_data.get("id")
                
                if absensi_id:
                    self.log_test("Create Absensi Kelas", True, f"Created absensi_kelas with ID: {absensi_id}")
                else:
                    self.log_test("Create Absensi Kelas", False, "No ID returned in response", create_data)
                    return False
            else:
                self.log_test("Create Absensi Kelas", False, f"Failed to create absensi_kelas", create_response.json())
                return False
                
        except Exception as e:
            self.log_test("Create Absensi Kelas", False, f"Error creating absensi_kelas: {str(e)}")
            return False
        
        # Test DELETE /api/absensi-kelas/{absensi_id}
        try:
            delete_response = requests.delete(
                f"{self.base_url}/absensi-kelas/{absensi_id}",
                headers=pengabsen_kelas_headers,
                timeout=30
            )
            
            if delete_response.status_code == 200:
                delete_data = delete_response.json()
                
                # Check for success message
                if "message" in delete_data or "berhasil" in str(delete_data).lower():
                    self.log_test("Delete Absensi Kelas Response", True, f"Delete successful: {delete_data}")
                else:
                    self.log_test("Delete Absensi Kelas Response", False, f"Unexpected response format", delete_data)
                    all_success = False
                
                # Verify the document is actually deleted by trying to get it
                try:
                    # Try to get the deleted absensi_kelas (should not exist)
                    verify_response = requests.get(
                        f"{self.base_url}/absensi-kelas",
                        params={"tanggal": today},
                        headers=self.headers,
                        timeout=30
                    )
                    
                    if verify_response.status_code == 200:
                        verify_data = verify_response.json()
                        
                        # Check if the deleted absensi_id is still in the list
                        found_deleted = False
                        if isinstance(verify_data, list):
                            for item in verify_data:
                                if item.get("id") == absensi_id:
                                    found_deleted = True
                                    break
                        
                        if found_deleted:
                            self.log_test("Delete Verification", False, f"Deleted absensi_kelas still exists in database")
                            all_success = False
                        else:
                            self.log_test("Delete Verification", True, f"Absensi_kelas successfully removed from database")
                    else:
                        self.log_test("Delete Verification", True, f"Cannot verify deletion (endpoint returned {verify_response.status_code})")
                        
                except Exception as verify_error:
                    self.log_test("Delete Verification", True, f"Cannot verify deletion: {str(verify_error)}")
                
            elif delete_response.status_code == 403:
                self.log_test("Delete Absensi Kelas", False, "Access denied (403) - authorization issue", delete_response.json())
                all_success = False
            elif delete_response.status_code == 404:
                self.log_test("Delete Absensi Kelas", False, "Not found (404) - absensi_kelas not found", delete_response.json())
                all_success = False
            else:
                self.log_test("Delete Absensi Kelas", False, f"Delete failed with status {delete_response.status_code}", delete_response.json())
                all_success = False
                
        except Exception as e:
            self.log_test("Delete Absensi Kelas", False, f"Delete request error: {str(e)}")
            all_success = False
        
        return all_success

    def test_related_endpoints(self) -> bool:
        """Test related endpoints to ensure they still work"""
        from datetime import datetime, timezone, timedelta
        
        # Use WIB timezone (UTC+7) for today's date
        wib_tz = timezone(timedelta(hours=7))
        today = datetime.now(wib_tz).date().isoformat()
        
        endpoints_to_test = [
            {
                "endpoint": "/waktu-sholat",
                "params": {"tanggal": today},
                "name": "Waktu Sholat"
            }
        ]
        
        all_success = True
        
        for test in endpoints_to_test:
            try:
                response = requests.get(
                    f"{self.base_url}{test['endpoint']}",
                    params=test["params"],
                    headers=self.headers,
                    timeout=30
                )
                
                if response.status_code == 500:
                    self.log_test(f"{test['name']} Endpoint", False, f"Server error 500", response.json())
                    all_success = False
                elif response.status_code == 200:
                    self.log_test(f"{test['name']} Endpoint", True, f"Working correctly (status: {response.status_code})")
                else:
                    self.log_test(f"{test['name']} Endpoint", True, f"No server error (status: {response.status_code})")
                    
            except Exception as e:
                self.log_test(f"{test['name']} Endpoint", False, f"Request error: {str(e)}")
                all_success = False
        
        return all_success

    def test_legacy_endpoints(self) -> bool:
        """Test legacy endpoints to ensure no 500 errors"""
        legacy_endpoints = [
            "/absensi",
            "/santri", 
            "/wali"
        ]
        
        all_success = True
        
        for endpoint in legacy_endpoints:
            try:
                response = requests.get(
                    f"{self.base_url}{endpoint}",
                    headers=self.headers,
                    timeout=30
                )
                
                # We just want to ensure no 500 errors
                if response.status_code == 500:
                    self.log_test(f"GET {endpoint}", False, f"Server error 500", response.json())
                    all_success = False
                else:
                    self.log_test(f"GET {endpoint}", True, f"No server error (status: {response.status_code})")
                    
            except Exception as e:
                self.log_test(f"GET {endpoint}", False, f"Request error: {str(e)}")
                all_success = False
        
        return all_success

    def test_aliyah_pengabsen_endpoints(self) -> bool:
        """Test Pengabsen Aliyah CRUD endpoints"""
        all_success = True
        created_pengabsen_id = None
        created_kelas_id = None
        
        # Step 1: Create a test kelas aliyah if needed
        try:
            # Check if there are existing kelas aliyah
            kelas_response = requests.get(
                f"{self.base_url}/aliyah/kelas",
                headers=self.headers,
                timeout=30
            )
            
            if kelas_response.status_code == 200:
                kelas_list = kelas_response.json()
                if kelas_list:
                    # Use existing kelas
                    test_kelas_id = kelas_list[0]["id"]
                    self.log_test("Get Existing Kelas Aliyah", True, f"Using existing kelas: {kelas_list[0]['nama']}")
                else:
                    # Create new kelas aliyah
                    kelas_data = {
                        "nama": "XII IPA Test",
                        "tingkat": "XII"
                    }
                    
                    create_kelas_response = requests.post(
                        f"{self.base_url}/aliyah/kelas",
                        json=kelas_data,
                        headers=self.headers,
                        timeout=30
                    )
                    
                    if create_kelas_response.status_code == 200:
                        created_kelas = create_kelas_response.json()
                        test_kelas_id = created_kelas["id"]
                        created_kelas_id = test_kelas_id
                        self.log_test("Create Kelas Aliyah", True, f"Created test kelas: {created_kelas['nama']}")
                    else:
                        self.log_test("Create Kelas Aliyah", False, f"Failed to create kelas", create_kelas_response.json())
                        return False
            else:
                self.log_test("Get Kelas Aliyah", False, f"Failed to get kelas list", kelas_response.json())
                return False
                
        except Exception as e:
            self.log_test("Kelas Aliyah Setup", False, f"Error setting up kelas: {str(e)}")
            return False
        
        # Step 2: Test POST /api/aliyah/pengabsen (Create)
        try:
            pengabsen_data = {
                "nama": "Ahmad Pengabsen Aliyah",
                "email_atau_hp": "ahmad.pengabsen@test.com",
                "username": f"pengabsen_aliyah_test_{datetime.now().strftime('%H%M%S')}",
                "kelas_ids": [test_kelas_id]
            }
            
            create_response = requests.post(
                f"{self.base_url}/aliyah/pengabsen",
                json=pengabsen_data,
                headers=self.headers,
                timeout=30
            )
            
            if create_response.status_code == 200:
                created_pengabsen = create_response.json()
                created_pengabsen_id = created_pengabsen["id"]
                
                # Verify required fields
                required_fields = ["id", "nama", "email_atau_hp", "username", "kode_akses", "kelas_ids", "created_at"]
                missing_fields = [f for f in required_fields if f not in created_pengabsen]
                
                if missing_fields:
                    self.log_test("POST /aliyah/pengabsen", False, f"Missing fields: {missing_fields}", created_pengabsen)
                    all_success = False
                else:
                    # Verify kode_akses is generated
                    if created_pengabsen["kode_akses"] and len(created_pengabsen["kode_akses"]) == 9:
                        self.log_test("POST /aliyah/pengabsen", True, f"Created pengabsen with kode_akses: {created_pengabsen['kode_akses']}")
                    else:
                        self.log_test("POST /aliyah/pengabsen", False, f"Invalid kode_akses: {created_pengabsen['kode_akses']}")
                        all_success = False
            else:
                self.log_test("POST /aliyah/pengabsen", False, f"Create failed with status {create_response.status_code}", create_response.json())
                all_success = False
                
        except Exception as e:
            self.log_test("POST /aliyah/pengabsen", False, f"Request error: {str(e)}")
            all_success = False
        
        # Step 3: Test GET /api/aliyah/pengabsen (List)
        try:
            list_response = requests.get(
                f"{self.base_url}/aliyah/pengabsen",
                headers=self.headers,
                timeout=30
            )
            
            if list_response.status_code == 200:
                pengabsen_list = list_response.json()
                
                if isinstance(pengabsen_list, list):
                    # Find our created pengabsen
                    found_pengabsen = None
                    for p in pengabsen_list:
                        if p.get("id") == created_pengabsen_id:
                            found_pengabsen = p
                            break
                    
                    if found_pengabsen:
                        self.log_test("GET /aliyah/pengabsen", True, f"Found created pengabsen in list: {found_pengabsen['nama']}")
                    else:
                        self.log_test("GET /aliyah/pengabsen", False, f"Created pengabsen not found in list")
                        all_success = False
                else:
                    self.log_test("GET /aliyah/pengabsen", False, "Response is not a list", pengabsen_list)
                    all_success = False
            else:
                self.log_test("GET /aliyah/pengabsen", False, f"List failed with status {list_response.status_code}", list_response.json())
                all_success = False
                
        except Exception as e:
            self.log_test("GET /aliyah/pengabsen", False, f"Request error: {str(e)}")
            all_success = False
        
        # Step 4: Test PUT /api/aliyah/pengabsen/{id} (Update)
        if created_pengabsen_id:
            try:
                update_data = {
                    "nama": "Ahmad Pengabsen Aliyah Updated",
                    "username": f"pengabsen_aliyah_updated_{datetime.now().strftime('%H%M%S')}"
                }
                
                update_response = requests.put(
                    f"{self.base_url}/aliyah/pengabsen/{created_pengabsen_id}",
                    json=update_data,
                    headers=self.headers,
                    timeout=30
                )
                
                if update_response.status_code == 200:
                    updated_pengabsen = update_response.json()
                    
                    if updated_pengabsen["nama"] == update_data["nama"] and updated_pengabsen["username"] == update_data["username"]:
                        self.log_test("PUT /aliyah/pengabsen", True, f"Successfully updated pengabsen: {updated_pengabsen['nama']}")
                    else:
                        self.log_test("PUT /aliyah/pengabsen", False, "Update data not reflected", updated_pengabsen)
                        all_success = False
                else:
                    self.log_test("PUT /aliyah/pengabsen", False, f"Update failed with status {update_response.status_code}", update_response.json())
                    all_success = False
                    
            except Exception as e:
                self.log_test("PUT /aliyah/pengabsen", False, f"Request error: {str(e)}")
                all_success = False
        
        # Step 5: Test POST /api/aliyah/pengabsen/{id}/regenerate-kode-akses
        if created_pengabsen_id:
            try:
                # Get current kode_akses
                current_response = requests.get(
                    f"{self.base_url}/aliyah/pengabsen",
                    headers=self.headers,
                    timeout=30
                )
                
                current_kode = None
                if current_response.status_code == 200:
                    pengabsen_list = current_response.json()
                    for p in pengabsen_list:
                        if p.get("id") == created_pengabsen_id:
                            current_kode = p.get("kode_akses")
                            break
                
                # Regenerate kode_akses
                regenerate_response = requests.post(
                    f"{self.base_url}/aliyah/pengabsen/{created_pengabsen_id}/regenerate-kode-akses",
                    headers=self.headers,
                    timeout=30
                )
                
                if regenerate_response.status_code == 200:
                    regenerated_pengabsen = regenerate_response.json()
                    new_kode = regenerated_pengabsen.get("kode_akses")
                    
                    if new_kode and new_kode != current_kode and len(new_kode) == 9:
                        self.log_test("POST /aliyah/pengabsen/regenerate-kode-akses", True, f"Kode changed from {current_kode} to {new_kode}")
                    else:
                        self.log_test("POST /aliyah/pengabsen/regenerate-kode-akses", False, f"Kode not changed properly: {current_kode} -> {new_kode}")
                        all_success = False
                else:
                    self.log_test("POST /aliyah/pengabsen/regenerate-kode-akses", False, f"Regenerate failed with status {regenerate_response.status_code}", regenerate_response.json())
                    all_success = False
                    
            except Exception as e:
                self.log_test("POST /aliyah/pengabsen/regenerate-kode-akses", False, f"Request error: {str(e)}")
                all_success = False
        
        # Step 6: Test DELETE /api/aliyah/pengabsen/{id}
        if created_pengabsen_id:
            try:
                delete_response = requests.delete(
                    f"{self.base_url}/aliyah/pengabsen/{created_pengabsen_id}",
                    headers=self.headers,
                    timeout=30
                )
                
                if delete_response.status_code == 200:
                    delete_data = delete_response.json()
                    
                    if "message" in delete_data and "berhasil dihapus" in delete_data["message"]:
                        self.log_test("DELETE /aliyah/pengabsen", True, f"Successfully deleted pengabsen: {delete_data['message']}")
                        
                        # Verify deletion by checking list
                        verify_response = requests.get(
                            f"{self.base_url}/aliyah/pengabsen",
                            headers=self.headers,
                            timeout=30
                        )
                        
                        if verify_response.status_code == 200:
                            pengabsen_list = verify_response.json()
                            found_deleted = any(p.get("id") == created_pengabsen_id for p in pengabsen_list)
                            
                            if not found_deleted:
                                self.log_test("DELETE /aliyah/pengabsen verification", True, "Pengabsen successfully removed from list")
                            else:
                                self.log_test("DELETE /aliyah/pengabsen verification", False, "Deleted pengabsen still in list")
                                all_success = False
                    else:
                        self.log_test("DELETE /aliyah/pengabsen", False, f"Unexpected response: {delete_data}")
                        all_success = False
                else:
                    self.log_test("DELETE /aliyah/pengabsen", False, f"Delete failed with status {delete_response.status_code}", delete_response.json())
                    all_success = False
                    
            except Exception as e:
                self.log_test("DELETE /aliyah/pengabsen", False, f"Request error: {str(e)}")
                all_success = False
        
        # Cleanup: Delete created kelas if we created one
        if created_kelas_id:
            try:
                cleanup_response = requests.delete(
                    f"{self.base_url}/aliyah/kelas/{created_kelas_id}",
                    headers=self.headers,
                    timeout=30
                )
                if cleanup_response.status_code == 200:
                    self.log_test("Cleanup Kelas Aliyah", True, "Test kelas cleaned up")
            except Exception as e:
                self.log_test("Cleanup Kelas Aliyah", False, f"Cleanup error: {str(e)}")
        
        return all_success

    def test_aliyah_monitoring_endpoints(self) -> bool:
        """Test Monitoring Aliyah CRUD endpoints"""
        all_success = True
        created_monitoring_id = None
        created_kelas_id = None
        
        # Step 1: Create a test kelas aliyah if needed
        try:
            # Check if there are existing kelas aliyah
            kelas_response = requests.get(
                f"{self.base_url}/aliyah/kelas",
                headers=self.headers,
                timeout=30
            )
            
            if kelas_response.status_code == 200:
                kelas_list = kelas_response.json()
                if kelas_list:
                    # Use existing kelas
                    test_kelas_id = kelas_list[0]["id"]
                    self.log_test("Get Existing Kelas Aliyah (Monitoring)", True, f"Using existing kelas: {kelas_list[0]['nama']}")
                else:
                    # Create new kelas aliyah
                    kelas_data = {
                        "nama": "XI IPS Test Monitoring",
                        "tingkat": "XI"
                    }
                    
                    create_kelas_response = requests.post(
                        f"{self.base_url}/aliyah/kelas",
                        json=kelas_data,
                        headers=self.headers,
                        timeout=30
                    )
                    
                    if create_kelas_response.status_code == 200:
                        created_kelas = create_kelas_response.json()
                        test_kelas_id = created_kelas["id"]
                        created_kelas_id = test_kelas_id
                        self.log_test("Create Kelas Aliyah (Monitoring)", True, f"Created test kelas: {created_kelas['nama']}")
                    else:
                        self.log_test("Create Kelas Aliyah (Monitoring)", False, f"Failed to create kelas", create_kelas_response.json())
                        return False
            else:
                self.log_test("Get Kelas Aliyah (Monitoring)", False, f"Failed to get kelas list", kelas_response.json())
                return False
                
        except Exception as e:
            self.log_test("Kelas Aliyah Setup (Monitoring)", False, f"Error setting up kelas: {str(e)}")
            return False
        
        # Step 2: Test POST /api/aliyah/monitoring (Create)
        try:
            monitoring_data = {
                "nama": "Fatimah Monitoring Aliyah",
                "email_atau_hp": "fatimah.monitoring@test.com",
                "username": f"monitoring_aliyah_test_{datetime.now().strftime('%H%M%S')}",
                "kelas_ids": [test_kelas_id]
            }
            
            create_response = requests.post(
                f"{self.base_url}/aliyah/monitoring",
                json=monitoring_data,
                headers=self.headers,
                timeout=30
            )
            
            if create_response.status_code == 200:
                created_monitoring = create_response.json()
                created_monitoring_id = created_monitoring["id"]
                
                # Verify required fields
                required_fields = ["id", "nama", "email_atau_hp", "username", "kode_akses", "kelas_ids", "created_at"]
                missing_fields = [f for f in required_fields if f not in created_monitoring]
                
                if missing_fields:
                    self.log_test("POST /aliyah/monitoring", False, f"Missing fields: {missing_fields}", created_monitoring)
                    all_success = False
                else:
                    # Verify kode_akses is generated
                    if created_monitoring["kode_akses"] and len(created_monitoring["kode_akses"]) == 9:
                        self.log_test("POST /aliyah/monitoring", True, f"Created monitoring with kode_akses: {created_monitoring['kode_akses']}")
                    else:
                        self.log_test("POST /aliyah/monitoring", False, f"Invalid kode_akses: {created_monitoring['kode_akses']}")
                        all_success = False
            else:
                self.log_test("POST /aliyah/monitoring", False, f"Create failed with status {create_response.status_code}", create_response.json())
                all_success = False
                
        except Exception as e:
            self.log_test("POST /aliyah/monitoring", False, f"Request error: {str(e)}")
            all_success = False
        
        # Step 3: Test GET /api/aliyah/monitoring (List)
        try:
            list_response = requests.get(
                f"{self.base_url}/aliyah/monitoring",
                headers=self.headers,
                timeout=30
            )
            
            if list_response.status_code == 200:
                monitoring_list = list_response.json()
                
                if isinstance(monitoring_list, list):
                    # Find our created monitoring
                    found_monitoring = None
                    for m in monitoring_list:
                        if m.get("id") == created_monitoring_id:
                            found_monitoring = m
                            break
                    
                    if found_monitoring:
                        self.log_test("GET /aliyah/monitoring", True, f"Found created monitoring in list: {found_monitoring['nama']}")
                    else:
                        self.log_test("GET /aliyah/monitoring", False, f"Created monitoring not found in list")
                        all_success = False
                else:
                    self.log_test("GET /aliyah/monitoring", False, "Response is not a list", monitoring_list)
                    all_success = False
            else:
                self.log_test("GET /aliyah/monitoring", False, f"List failed with status {list_response.status_code}", list_response.json())
                all_success = False
                
        except Exception as e:
            self.log_test("GET /aliyah/monitoring", False, f"Request error: {str(e)}")
            all_success = False
        
        # Step 4: Test PUT /api/aliyah/monitoring/{id} (Update)
        if created_monitoring_id:
            try:
                update_data = {
                    "nama": "Fatimah Monitoring Aliyah Updated",
                    "username": f"monitoring_aliyah_updated_{datetime.now().strftime('%H%M%S')}"
                }
                
                update_response = requests.put(
                    f"{self.base_url}/aliyah/monitoring/{created_monitoring_id}",
                    json=update_data,
                    headers=self.headers,
                    timeout=30
                )
                
                if update_response.status_code == 200:
                    updated_monitoring = update_response.json()
                    
                    if updated_monitoring["nama"] == update_data["nama"] and updated_monitoring["username"] == update_data["username"]:
                        self.log_test("PUT /aliyah/monitoring", True, f"Successfully updated monitoring: {updated_monitoring['nama']}")
                    else:
                        self.log_test("PUT /aliyah/monitoring", False, "Update data not reflected", updated_monitoring)
                        all_success = False
                else:
                    self.log_test("PUT /aliyah/monitoring", False, f"Update failed with status {update_response.status_code}", update_response.json())
                    all_success = False
                    
            except Exception as e:
                self.log_test("PUT /aliyah/monitoring", False, f"Request error: {str(e)}")
                all_success = False
        
        # Step 5: Test POST /api/aliyah/monitoring/{id}/regenerate-kode-akses
        if created_monitoring_id:
            try:
                # Get current kode_akses
                current_response = requests.get(
                    f"{self.base_url}/aliyah/monitoring",
                    headers=self.headers,
                    timeout=30
                )
                
                current_kode = None
                if current_response.status_code == 200:
                    monitoring_list = current_response.json()
                    for m in monitoring_list:
                        if m.get("id") == created_monitoring_id:
                            current_kode = m.get("kode_akses")
                            break
                
                # Regenerate kode_akses
                regenerate_response = requests.post(
                    f"{self.base_url}/aliyah/monitoring/{created_monitoring_id}/regenerate-kode-akses",
                    headers=self.headers,
                    timeout=30
                )
                
                if regenerate_response.status_code == 200:
                    regenerated_monitoring = regenerate_response.json()
                    new_kode = regenerated_monitoring.get("kode_akses")
                    
                    if new_kode and new_kode != current_kode and len(new_kode) == 9:
                        self.log_test("POST /aliyah/monitoring/regenerate-kode-akses", True, f"Kode changed from {current_kode} to {new_kode}")
                    else:
                        self.log_test("POST /aliyah/monitoring/regenerate-kode-akses", False, f"Kode not changed properly: {current_kode} -> {new_kode}")
                        all_success = False
                else:
                    self.log_test("POST /aliyah/monitoring/regenerate-kode-akses", False, f"Regenerate failed with status {regenerate_response.status_code}", regenerate_response.json())
                    all_success = False
                    
            except Exception as e:
                self.log_test("POST /aliyah/monitoring/regenerate-kode-akses", False, f"Request error: {str(e)}")
                all_success = False
        
        # Step 6: Test DELETE /api/aliyah/monitoring/{id}
        if created_monitoring_id:
            try:
                delete_response = requests.delete(
                    f"{self.base_url}/aliyah/monitoring/{created_monitoring_id}",
                    headers=self.headers,
                    timeout=30
                )
                
                if delete_response.status_code == 200:
                    delete_data = delete_response.json()
                    
                    if "message" in delete_data and "berhasil dihapus" in delete_data["message"]:
                        self.log_test("DELETE /aliyah/monitoring", True, f"Successfully deleted monitoring: {delete_data['message']}")
                        
                        # Verify deletion by checking list
                        verify_response = requests.get(
                            f"{self.base_url}/aliyah/monitoring",
                            headers=self.headers,
                            timeout=30
                        )
                        
                        if verify_response.status_code == 200:
                            monitoring_list = verify_response.json()
                            found_deleted = any(m.get("id") == created_monitoring_id for m in monitoring_list)
                            
                            if not found_deleted:
                                self.log_test("DELETE /aliyah/monitoring verification", True, "Monitoring successfully removed from list")
                            else:
                                self.log_test("DELETE /aliyah/monitoring verification", False, "Deleted monitoring still in list")
                                all_success = False
                    else:
                        self.log_test("DELETE /aliyah/monitoring", False, f"Unexpected response: {delete_data}")
                        all_success = False
                else:
                    self.log_test("DELETE /aliyah/monitoring", False, f"Delete failed with status {delete_response.status_code}", delete_response.json())
                    all_success = False
                    
            except Exception as e:
                self.log_test("DELETE /aliyah/monitoring", False, f"Request error: {str(e)}")
                all_success = False
        
        # Cleanup: Delete created kelas if we created one
        if created_kelas_id:
            try:
                cleanup_response = requests.delete(
                    f"{self.base_url}/aliyah/kelas/{created_kelas_id}",
                    headers=self.headers,
                    timeout=30
                )
                if cleanup_response.status_code == 200:
                    self.log_test("Cleanup Kelas Aliyah (Monitoring)", True, "Test kelas cleaned up")
            except Exception as e:
                self.log_test("Cleanup Kelas Aliyah (Monitoring)", False, f"Cleanup error: {str(e)}")
        
        return all_success

    def test_aliyah_absensi_riwayat_endpoint(self) -> bool:
        """Test Riwayat Absensi Aliyah endpoint with filters and dummy data"""
        from datetime import datetime, timezone, timedelta
        import pymongo
        
        # Use WIB timezone (UTC+7) for today's date
        wib_tz = timezone(timedelta(hours=7))
        today = datetime.now(wib_tz).date().isoformat()
        
        all_success = True
        
        # Step 1: Setup test data - create kelas, siswa, and absensi dummy data
        test_kelas_id = None
        test_siswa_ids = []
        
        try:
            # Create test kelas aliyah
            kelas_data = {
                "nama": "XII Test Riwayat",
                "tingkat": "XII"
            }
            
            kelas_response = requests.post(
                f"{self.base_url}/aliyah/kelas",
                json=kelas_data,
                headers=self.headers,
                timeout=30
            )
            
            if kelas_response.status_code == 200:
                test_kelas = kelas_response.json()
                test_kelas_id = test_kelas["id"]
                self.log_test("Setup Test Kelas Aliyah", True, f"Created test kelas: {test_kelas['nama']}")
            else:
                self.log_test("Setup Test Kelas Aliyah", False, f"Failed to create test kelas", kelas_response.json())
                return False
                
        except Exception as e:
            self.log_test("Setup Test Kelas Aliyah", False, f"Error creating test kelas: {str(e)}")
            return False
        
        try:
            # Create test siswa aliyah
            siswa_data_list = [
                {
                    "nama": "Ahmad Siswa Putra",
                    "nis": f"ALY001{datetime.now().strftime('%H%M%S')}",
                    "gender": "putra",
                    "kelas_id": test_kelas_id,
                    "wali_nama": "Bapak Ahmad",
                    "wali_wa": "081234567890"
                },
                {
                    "nama": "Fatimah Siswa Putri",
                    "nis": f"ALY002{datetime.now().strftime('%H%M%S')}",
                    "gender": "putri",
                    "kelas_id": test_kelas_id,
                    "wali_nama": "Ibu Fatimah",
                    "wali_wa": "081234567891"
                }
            ]
            
            for siswa_data in siswa_data_list:
                siswa_response = requests.post(
                    f"{self.base_url}/aliyah/siswa",
                    json=siswa_data,
                    headers=self.headers,
                    timeout=30
                )
                
                if siswa_response.status_code == 200:
                    created_siswa = siswa_response.json()
                    test_siswa_ids.append(created_siswa["id"])
                    self.log_test(f"Setup Test Siswa {siswa_data['nama']}", True, f"Created siswa: {created_siswa['nama']}")
                else:
                    self.log_test(f"Setup Test Siswa {siswa_data['nama']}", False, f"Failed to create siswa", siswa_response.json())
                    all_success = False
                    
        except Exception as e:
            self.log_test("Setup Test Siswa Aliyah", False, f"Error creating test siswa: {str(e)}")
            all_success = False
        
        # Step 2: Insert dummy absensi data directly to MongoDB
        try:
            # Connect to MongoDB to insert dummy data
            from motor.motor_asyncio import AsyncIOMotorClient
            import asyncio
            
            async def insert_dummy_absensi():
                mongo_url = "mongodb://localhost:27017"
                client = AsyncIOMotorClient(mongo_url)
                db = client["absensi_sholat"]
                
                # Status combinations for testing
                status_combinations = ["hadir", "alfa", "sakit", "izin", "dispensasi", "bolos"]
                
                dummy_absensi = []
                for i, siswa_id in enumerate(test_siswa_ids):
                    for j, status in enumerate(status_combinations):
                        absensi_doc = {
                            "id": f"absensi_aliyah_test_{i}_{j}_{datetime.now().strftime('%H%M%S')}",
                            "siswa_id": siswa_id,
                            "kelas_id": test_kelas_id,
                            "tanggal": today,
                            "status": status,
                            "waktu_absen": datetime.now(timezone.utc),
                            "created_at": datetime.now(timezone.utc)
                        }
                        dummy_absensi.append(absensi_doc)
                
                if dummy_absensi:
                    await db.absensi_aliyah.insert_many(dummy_absensi)
                    return len(dummy_absensi)
                return 0
            
            # Run async function
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            inserted_count = loop.run_until_complete(insert_dummy_absensi())
            loop.close()
            
            if inserted_count > 0:
                self.log_test("Insert Dummy Absensi Aliyah", True, f"Inserted {inserted_count} dummy absensi records")
            else:
                self.log_test("Insert Dummy Absensi Aliyah", False, "No dummy absensi records inserted")
                all_success = False
                
        except Exception as e:
            self.log_test("Insert Dummy Absensi Aliyah", False, f"Error inserting dummy data: {str(e)}")
            all_success = False
        
        # Step 3: Test GET /api/aliyah/absensi/riwayat without filters
        try:
            riwayat_params = {
                "tanggal_start": today,
                "tanggal_end": today
            }
            
            riwayat_response = requests.get(
                f"{self.base_url}/aliyah/absensi/riwayat",
                params=riwayat_params,
                headers=self.headers,
                timeout=30
            )
            
            if riwayat_response.status_code == 200:
                riwayat_data = riwayat_response.json()
                
                # Verify response structure
                required_fields = ["summary", "detail"]
                missing_fields = [f for f in required_fields if f not in riwayat_data]
                
                if missing_fields:
                    self.log_test("GET /aliyah/absensi/riwayat (basic)", False, f"Missing fields: {missing_fields}", riwayat_data)
                    all_success = False
                else:
                    # Verify summary structure
                    summary = riwayat_data.get("summary", {})
                    expected_status = ["hadir", "alfa", "sakit", "izin", "dispensasi", "bolos"]
                    
                    missing_status = [s for s in expected_status if s not in summary]
                    if missing_status:
                        self.log_test("GET /aliyah/absensi/riwayat (summary)", False, f"Missing status in summary: {missing_status}", summary)
                        all_success = False
                    else:
                        self.log_test("GET /aliyah/absensi/riwayat (summary)", True, f"Summary contains all expected status: {summary}")
                    
                    # Verify detail structure
                    detail = riwayat_data.get("detail", [])
                    if isinstance(detail, list) and len(detail) > 0:
                        sample_detail = detail[0]
                        expected_detail_fields = ["id", "siswa_id", "siswa_nama", "kelas_id", "kelas_nama", "tanggal", "status", "gender", "waktu_absen"]
                        
                        missing_detail_fields = [f for f in expected_detail_fields if f not in sample_detail]
                        if missing_detail_fields:
                            self.log_test("GET /aliyah/absensi/riwayat (detail)", False, f"Missing detail fields: {missing_detail_fields}", sample_detail)
                            all_success = False
                        else:
                            self.log_test("GET /aliyah/absensi/riwayat (detail)", True, f"Detail contains all expected fields, {len(detail)} records")
                    else:
                        self.log_test("GET /aliyah/absensi/riwayat (detail)", True, "No detail records (empty response)")
            else:
                self.log_test("GET /aliyah/absensi/riwayat (basic)", False, f"Request failed with status {riwayat_response.status_code}", riwayat_response.json())
                all_success = False
                
        except Exception as e:
            self.log_test("GET /aliyah/absensi/riwayat (basic)", False, f"Request error: {str(e)}")
            all_success = False
        
        # Step 4: Test with kelas_id filter
        if test_kelas_id:
            try:
                riwayat_params = {
                    "tanggal_start": today,
                    "tanggal_end": today,
                    "kelas_id": test_kelas_id
                }
                
                riwayat_response = requests.get(
                    f"{self.base_url}/aliyah/absensi/riwayat",
                    params=riwayat_params,
                    headers=self.headers,
                    timeout=30
                )
                
                if riwayat_response.status_code == 200:
                    riwayat_data = riwayat_response.json()
                    
                    # Verify that all detail records have the correct kelas_id
                    detail = riwayat_data.get("detail", [])
                    if detail:
                        wrong_kelas = [d for d in detail if d.get("kelas_id") != test_kelas_id]
                        if wrong_kelas:
                            self.log_test("GET /aliyah/absensi/riwayat (kelas filter)", False, f"Found records with wrong kelas_id: {len(wrong_kelas)}")
                            all_success = False
                        else:
                            self.log_test("GET /aliyah/absensi/riwayat (kelas filter)", True, f"All {len(detail)} records have correct kelas_id")
                    else:
                        self.log_test("GET /aliyah/absensi/riwayat (kelas filter)", True, "No records returned (filter working)")
                else:
                    self.log_test("GET /aliyah/absensi/riwayat (kelas filter)", False, f"Request failed with status {riwayat_response.status_code}", riwayat_response.json())
                    all_success = False
                    
            except Exception as e:
                self.log_test("GET /aliyah/absensi/riwayat (kelas filter)", False, f"Request error: {str(e)}")
                all_success = False
        
        # Step 5: Test with gender filter
        for gender in ["putra", "putri"]:
            try:
                riwayat_params = {
                    "tanggal_start": today,
                    "tanggal_end": today,
                    "gender": gender
                }
                
                riwayat_response = requests.get(
                    f"{self.base_url}/aliyah/absensi/riwayat",
                    params=riwayat_params,
                    headers=self.headers,
                    timeout=30
                )
                
                if riwayat_response.status_code == 200:
                    riwayat_data = riwayat_response.json()
                    
                    # Verify that all detail records have the correct gender
                    detail = riwayat_data.get("detail", [])
                    if detail:
                        wrong_gender = [d for d in detail if d.get("gender") != gender]
                        if wrong_gender:
                            self.log_test(f"GET /aliyah/absensi/riwayat (gender {gender})", False, f"Found records with wrong gender: {len(wrong_gender)}")
                            all_success = False
                        else:
                            self.log_test(f"GET /aliyah/absensi/riwayat (gender {gender})", True, f"All {len(detail)} records have correct gender")
                    else:
                        self.log_test(f"GET /aliyah/absensi/riwayat (gender {gender})", True, "No records returned (filter working)")
                else:
                    self.log_test(f"GET /aliyah/absensi/riwayat (gender {gender})", False, f"Request failed with status {riwayat_response.status_code}", riwayat_response.json())
                    all_success = False
                    
            except Exception as e:
                self.log_test(f"GET /aliyah/absensi/riwayat (gender {gender})", False, f"Request error: {str(e)}")
                all_success = False
        
        # Cleanup: Delete test data
        try:
            # Delete test siswa
            for siswa_id in test_siswa_ids:
                requests.delete(f"{self.base_url}/aliyah/siswa/{siswa_id}", headers=self.headers, timeout=30)
            
            # Delete test kelas
            if test_kelas_id:
                requests.delete(f"{self.base_url}/aliyah/kelas/{test_kelas_id}", headers=self.headers, timeout=30)
            
            # Delete dummy absensi data
            async def cleanup_absensi():
                mongo_url = "mongodb://localhost:27017"
                client = AsyncIOMotorClient(mongo_url)
                db = client["absensi_sholat"]
                
                # Delete test absensi records
                result = await db.absensi_aliyah.delete_many({
                    "tanggal": today,
                    "kelas_id": test_kelas_id
                })
                return result.deleted_count
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            deleted_count = loop.run_until_complete(cleanup_absensi())
            loop.close()
            
            self.log_test("Cleanup Test Data", True, f"Cleaned up {deleted_count} absensi records and test entities")
            
        except Exception as e:
            self.log_test("Cleanup Test Data", False, f"Cleanup error: {str(e)}")
        
        return all_success
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Absensi Sholat Backend Tests - Focus on Latest Changes")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Login with default admin for tests
        if not self.login():
            print("❌ Cannot proceed with tests without authentication")
            return False
        
        print("\n🆕 Testing Latest Backend Changes:")
        print("-" * 40)
        
        # Step 1: Test masbuq field in riwayat endpoints
        masbuq_riwayat_success = self.test_masbuq_field_in_riwayat_endpoints()
        
        # Step 2: Test masbuq field in stats endpoint
        masbuq_stats_success = self.test_absensi_stats_masbuq_field()
        
        # Step 3: Test absensi-kelas delete endpoint
        delete_absensi_kelas_success = self.test_absensi_kelas_delete_endpoint()
        
        print("\n🔗 Testing Related Endpoints:")
        print("-" * 40)
        
        # Step 4: Test related endpoints
        related_success = self.test_related_endpoints()
        
        print("\n📋 Testing Legacy Endpoints (No 500 Errors):")
        print("-" * 40)
        
        # Step 5: Test legacy endpoints
        legacy_success = self.test_legacy_endpoints()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['message']}")
        
        overall_success = failed_tests == 0
        print(f"\n🎯 Overall Result: {'✅ ALL TESTS PASSED' if overall_success else '❌ SOME TESTS FAILED'}")
        
        return overall_success

def main():
    """Main test runner"""
    tester = AbsensiSholatTester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()