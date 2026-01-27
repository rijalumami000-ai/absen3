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

    def test_legacy_endpoints(self) -> bool:
        """Test legacy endpoints to ensure no 500 errors"""
        legacy_endpoints = [
            "/absensi",
            "/santri", 
            "/wali",
            "/waktu-sholat?tanggal=01-01-2025"
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
        print("🚀 Starting Absensi Sholat Backend Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Step 1: Login
        if not self.login():
            print("❌ Cannot proceed without authentication")
            return False
        
        print("\n📋 Testing Updated Endpoints:")
        print("-" * 40)
        
        # Step 2: Test asrama endpoint
        asrama_success = self.test_asrama_endpoint()
        
        # Step 3: Test pengabsen endpoint  
        pengabsen_success = self.test_pengabsen_endpoint()
        
        # Step 4: Test pembimbing endpoint
        pembimbing_success = self.test_pembimbing_endpoint()
        
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