#!/usr/bin/env python3
"""
Backend Test Suite for Absensi Sholat API
Tests the updated endpoints after model changes
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://dini-monitor.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

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