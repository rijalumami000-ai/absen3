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
BASE_URL = "https://accessctrl-1.preview.emergentagent.com/api"
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
                if isinstance(riwayat_data, list) and len(riwayat_data) > 0:
                    # Check each summary item for masbuq field
                    masbuq_found = False
                    for item in riwayat_data:
                        if "masbuq" in item:
                            masbuq_found = True
                            masbuq_value = item["masbuq"]
                            self.log_test("Pengabsen Riwayat masbuq field", True, f"Found masbuq field with value: {masbuq_value}")
                            break
                    
                    if not masbuq_found:
                        # Check if masbuq field exists with default value 0
                        sample_item = riwayat_data[0]
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