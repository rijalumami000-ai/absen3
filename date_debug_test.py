#!/usr/bin/env python3
"""
Date Debug Test Suite for Absensi Sholat API
Tests date consistency and visibility issues for prayer attendance
"""

import requests
import json
import sys
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
import uuid

# Configuration
BASE_URL = "https://accessctrl-1.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class DateDebugTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.admin_token = None
        self.admin_headers = {}
        self.pengabsen_token = None
        self.pengabsen_headers = {}
        self.wali_token = None
        self.wali_headers = {}
        self.test_results = []
        self.test_santri_id = None
        self.test_pengabsen_id = None
        self.test_wali_id = None
        
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
    
    def get_today_value(self) -> str:
        """Get today value using same logic as backend"""
        return datetime.now(timezone.utc).astimezone().date().isoformat()
    
    def login_admin(self) -> bool:
        """Login as admin"""
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
                self.admin_token = data.get("access_token")
                self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
                self.log_test("Admin Login", True, "Successfully logged in as admin")
                return True
            else:
                self.log_test("Admin Login", False, f"Login failed with status {response.status_code}", response.json())
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Login error: {str(e)}")
            return False
    
    def setup_test_data(self) -> bool:
        """Setup test data: asrama, santri, pengabsen, wali"""
        try:
            # 1. Get or create test asrama
            asrama_response = requests.get(
                f"{self.base_url}/asrama",
                headers=self.admin_headers,
                timeout=30
            )
            
            if asrama_response.status_code == 200:
                asrama_list = asrama_response.json()
                if asrama_list:
                    test_asrama_id = asrama_list[0]["id"]
                    self.log_test("Get Test Asrama", True, f"Using existing asrama: {test_asrama_id}")
                else:
                    # Create test asrama
                    asrama_data = {
                        "nama": "Test Asrama Putra",
                        "gender": "putra",
                        "kapasitas": 50
                    }
                    create_response = requests.post(
                        f"{self.base_url}/asrama",
                        json=asrama_data,
                        headers=self.admin_headers,
                        timeout=30
                    )
                    if create_response.status_code == 200:
                        test_asrama_id = create_response.json()["id"]
                        self.log_test("Create Test Asrama", True, f"Created test asrama: {test_asrama_id}")
                    else:
                        self.log_test("Create Test Asrama", False, "Failed to create test asrama", create_response.json())
                        return False
            else:
                self.log_test("Get Test Asrama", False, "Failed to get asrama list", asrama_response.json())
                return False
            
            # 2. Create test santri
            santri_data = {
                "nama": "Ahmad Zaki Test",
                "nis": f"TEST{datetime.now().strftime('%H%M%S')}",
                "gender": "putra",
                "asrama_id": test_asrama_id,
                "nama_wali": "Bapak Ahmad Test",
                "nomor_hp_wali": f"08123456{datetime.now().strftime('%H%M')}",
                "email_wali": "ahmad.test@email.com"
            }
            
            santri_response = requests.post(
                f"{self.base_url}/santri",
                json=santri_data,
                headers=self.admin_headers,
                timeout=30
            )
            
            if santri_response.status_code == 200:
                self.test_santri_id = santri_response.json()["id"]
                self.log_test("Create Test Santri", True, f"Created test santri: {self.test_santri_id}")
            else:
                self.log_test("Create Test Santri", False, "Failed to create test santri", santri_response.json())
                return False
            
            # 3. Create test pengabsen
            pengabsen_data = {
                "nama": "Pengabsen Test",
                "email_atau_hp": "pengabsen.test@email.com",
                "username": f"pengabsen_test_{datetime.now().strftime('%H%M%S')}",
                "asrama_ids": [test_asrama_id]
            }
            
            pengabsen_response = requests.post(
                f"{self.base_url}/pengabsen",
                json=pengabsen_data,
                headers=self.admin_headers,
                timeout=30
            )
            
            if pengabsen_response.status_code == 200:
                pengabsen_created = pengabsen_response.json()
                self.test_pengabsen_id = pengabsen_created["id"]
                pengabsen_username = pengabsen_created["username"]
                pengabsen_kode = pengabsen_created["kode_akses"]
                
                # Login as pengabsen
                pengabsen_login = {
                    "username": pengabsen_username,
                    "kode_akses": pengabsen_kode
                }
                
                login_response = requests.post(
                    f"{self.base_url}/pengabsen/login",
                    json=pengabsen_login,
                    timeout=30
                )
                
                if login_response.status_code == 200:
                    self.pengabsen_token = login_response.json()["access_token"]
                    self.pengabsen_headers = {"Authorization": f"Bearer {self.pengabsen_token}"}
                    self.log_test("Create & Login Pengabsen", True, f"Created and logged in pengabsen: {self.test_pengabsen_id}")
                else:
                    self.log_test("Login Pengabsen", False, "Failed to login pengabsen", login_response.json())
                    return False
            else:
                self.log_test("Create Test Pengabsen", False, "Failed to create test pengabsen", pengabsen_response.json())
                return False
            
            # 4. Get wali (auto-generated from santri) - wait for sync
            import time
            time.sleep(3)  # Wait for wali sync
            
            wali_response = requests.get(
                f"{self.base_url}/wali",
                headers=self.admin_headers,
                timeout=30
            )
            
            if wali_response.status_code == 200:
                wali_list = wali_response.json()
                # Find wali for our test santri
                test_wali = None
                for wali in wali_list:
                    if self.test_santri_id in wali.get("anak_ids", []):
                        test_wali = wali
                        break
                
                if test_wali:
                    self.test_wali_id = test_wali["id"]
                    wali_username = test_wali["username"]
                    
                    # Login as wali (default password: 12345)
                    wali_login = {
                        "username": wali_username,
                        "password": "12345"
                    }
                    
                    wali_login_response = requests.post(
                        f"{self.base_url}/wali/login",
                        json=wali_login,
                        timeout=30
                    )
                    
                    if wali_login_response.status_code == 200:
                        self.wali_token = wali_login_response.json()["access_token"]
                        self.wali_headers = {"Authorization": f"Bearer {self.wali_token}"}
                        self.log_test("Login Wali", True, f"Logged in wali: {self.test_wali_id}")
                    else:
                        self.log_test("Login Wali", False, "Failed to login wali", wali_login_response.json())
                        # Continue without wali for now
                        self.log_test("Wali Skip", True, "Continuing tests without wali login")
                else:
                    self.log_test("Find Test Wali", False, "Could not find wali for test santri - continuing without wali")
                    # Continue without wali for now
            else:
                self.log_test("Get Test Wali", False, "Failed to get wali list - continuing without wali", wali_response.json())
            
            return True
            
        except Exception as e:
            self.log_test("Setup Test Data", False, f"Setup error: {str(e)}")
            return False
    
    def test_absensi_creation_and_date_consistency(self) -> bool:
        """Test creating absensi and checking date consistency across endpoints"""
        try:
            today = self.get_today_value()
            current_time = datetime.now(timezone.utc).isoformat()
            
            print(f"\n📅 Testing with today = {today}")
            print(f"🕐 Current UTC time = {current_time}")
            
            # Test different prayer times
            prayer_times = ["subuh", "dzuhur", "ashar", "maghrib", "isya"]
            
            for waktu_sholat in prayer_times:
                print(f"\n🕌 Testing {waktu_sholat} prayer...")
                
                # 1. Create absensi via pengabsen
                absensi_params = {
                    "santri_id": self.test_santri_id,
                    "waktu_sholat": waktu_sholat,
                    "status_absen": "hadir"
                }
                
                absensi_response = requests.post(
                    f"{self.base_url}/pengabsen/absensi",
                    params=absensi_params,
                    headers=self.pengabsen_headers,
                    timeout=30
                )
                
                if absensi_response.status_code == 200:
                    absensi_data = absensi_response.json()
                    saved_date = absensi_data.get("tanggal")
                    
                    self.log_test(f"Create Absensi {waktu_sholat}", True, f"Created absensi for {waktu_sholat}, saved_date: {saved_date}")
                    
                    # Verify saved date matches today
                    if saved_date != today:
                        self.log_test(f"Date Consistency {waktu_sholat}", False, f"Date mismatch! Expected: {today}, Saved: {saved_date}")
                        return False
                    
                    # 2. Check via pengabsen "hari ini" endpoint
                    hari_ini_response = requests.get(
                        f"{self.base_url}/pengabsen/santri-absensi-hari-ini",
                        headers=self.pengabsen_headers,
                        timeout=30
                    )
                    
                    if hari_ini_response.status_code == 200:
                        hari_ini_data = hari_ini_response.json()
                        hari_ini_date = hari_ini_data.get("tanggal")
                        
                        # Find our santri in the data
                        found_santri = None
                        for santri_data in hari_ini_data.get("data", []):
                            if santri_data.get("santri_id") == self.test_santri_id:
                                found_santri = santri_data
                                break
                        
                        if found_santri:
                            status = found_santri.get("status", {}).get(waktu_sholat)
                            if status == "hadir":
                                self.log_test(f"Pengabsen Hari Ini {waktu_sholat}", True, f"Found {waktu_sholat} data in hari ini (date: {hari_ini_date})")
                            else:
                                self.log_test(f"Pengabsen Hari Ini {waktu_sholat}", False, f"Status mismatch in hari ini. Expected: hadir, Got: {status}")
                                return False
                        else:
                            self.log_test(f"Pengabsen Hari Ini {waktu_sholat}", False, f"Santri not found in hari ini data")
                            return False
                    else:
                        self.log_test(f"Pengabsen Hari Ini {waktu_sholat}", False, f"Failed to get hari ini data", hari_ini_response.json())
                        return False
                    
                    # 3. Check via wali "anak absensi hari ini" endpoint (if wali is available)
                    if self.wali_headers:
                        wali_hari_ini_response = requests.get(
                            f"{self.base_url}/wali/anak-absensi-hari-ini",
                            headers=self.wali_headers,
                            timeout=30
                        )
                        
                        if wali_hari_ini_response.status_code == 200:
                            wali_hari_ini_data = wali_hari_ini_response.json()
                            wali_hari_ini_date = wali_hari_ini_data.get("tanggal")
                            
                            # Find our santri in wali data
                            found_santri_wali = None
                            for santri_data in wali_hari_ini_data.get("data", []):
                                if santri_data.get("santri_id") == self.test_santri_id:
                                    found_santri_wali = santri_data
                                    break
                            
                            if found_santri_wali:
                                status_wali = found_santri_wali.get("status", {}).get(waktu_sholat)
                                if status_wali == "hadir":
                                    self.log_test(f"Wali Hari Ini {waktu_sholat}", True, f"Found {waktu_sholat} data in wali hari ini (date: {wali_hari_ini_date})")
                                else:
                                    self.log_test(f"Wali Hari Ini {waktu_sholat}", False, f"Status mismatch in wali hari ini. Expected: hadir, Got: {status_wali}")
                                    return False
                            else:
                                self.log_test(f"Wali Hari Ini {waktu_sholat}", False, f"Santri not found in wali hari ini data")
                                return False
                        else:
                            self.log_test(f"Wali Hari Ini {waktu_sholat}", False, f"Failed to get wali hari ini data", wali_hari_ini_response.json())
                            return False
                    else:
                        self.log_test(f"Wali Hari Ini {waktu_sholat}", True, f"Skipped wali test (no wali login available)")
                    
                    # 4. Check via admin riwayat endpoint
                    riwayat_response = requests.get(
                        f"{self.base_url}/absensi/riwayat",
                        params={"tanggal_start": today, "tanggal_end": today},
                        headers=self.admin_headers,
                        timeout=30
                    )
                    
                    if riwayat_response.status_code == 200:
                        riwayat_data = riwayat_response.json()
                        
                        # Check if our absensi is in the summary
                        summary = riwayat_data.get("summary", {})
                        by_waktu = summary.get("by_waktu", {})
                        waktu_data = by_waktu.get(waktu_sholat, {})
                        hadir_count = waktu_data.get("hadir", 0)
                        
                        if hadir_count > 0:
                            self.log_test(f"Admin Riwayat {waktu_sholat}", True, f"Found {waktu_sholat} data in admin riwayat (hadir: {hadir_count})")
                        else:
                            self.log_test(f"Admin Riwayat {waktu_sholat}", False, f"No {waktu_sholat} hadir data found in admin riwayat")
                            return False
                    else:
                        self.log_test(f"Admin Riwayat {waktu_sholat}", False, f"Failed to get admin riwayat data", riwayat_response.json())
                        return False
                    
                else:
                    self.log_test(f"Create Absensi {waktu_sholat}", False, f"Failed to create absensi for {waktu_sholat}", absensi_response.json())
                    return False
            
            return True
            
        except Exception as e:
            self.log_test("Absensi Date Consistency", False, f"Test error: {str(e)}")
            return False
    
    def test_date_values_across_endpoints(self) -> bool:
        """Test that all endpoints use consistent 'today' values"""
        try:
            backend_today = self.get_today_value()
            print(f"\n📅 Expected today value: {backend_today}")
            
            endpoints_to_test = [
                {
                    "name": "Pengabsen Hari Ini",
                    "url": f"{self.base_url}/pengabsen/santri-absensi-hari-ini",
                    "headers": self.pengabsen_headers,
                    "date_field": "tanggal"
                },
                {
                    "name": "Wali Anak Hari Ini", 
                    "url": f"{self.base_url}/wali/anak-absensi-hari-ini",
                    "headers": self.wali_headers,
                    "date_field": "tanggal"
                } if self.wali_headers else None
            ]
            
            all_consistent = True
            
            for endpoint in endpoints_to_test:
                try:
                    response = requests.get(
                        endpoint["url"],
                        headers=endpoint["headers"],
                        timeout=30
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        endpoint_date = data.get(endpoint["date_field"])
                        
                        if endpoint_date == backend_today:
                            self.log_test(f"Date Value {endpoint['name']}", True, f"Consistent date: {endpoint_date}")
                        else:
                            self.log_test(f"Date Value {endpoint['name']}", False, f"Date mismatch! Expected: {backend_today}, Got: {endpoint_date}")
                            all_consistent = False
                    else:
                        self.log_test(f"Date Value {endpoint['name']}", False, f"Failed to get data from {endpoint['name']}", response.json())
                        all_consistent = False
                        
                except Exception as e:
                    self.log_test(f"Date Value {endpoint['name']}", False, f"Request error: {str(e)}")
                    all_consistent = False
            
            return all_consistent
            
        except Exception as e:
            self.log_test("Date Values Consistency", False, f"Test error: {str(e)}")
            return False
    
    def test_timezone_edge_cases(self) -> bool:
        """Test timezone edge cases around midnight"""
        try:
            # Get current time info
            utc_now = datetime.now(timezone.utc)
            local_now = utc_now.astimezone()
            
            print(f"\n🌍 Timezone Analysis:")
            print(f"UTC Time: {utc_now.isoformat()}")
            print(f"Local Time: {local_now.isoformat()}")
            print(f"Timezone: {local_now.tzinfo}")
            print(f"UTC Offset: {local_now.utcoffset()}")
            
            # Check if we're close to midnight (within 2 hours)
            utc_hour = utc_now.hour
            local_hour = local_now.hour
            
            is_near_utc_midnight = utc_hour < 2 or utc_hour > 22
            is_near_local_midnight = local_hour < 2 or local_hour > 22
            
            if is_near_utc_midnight or is_near_local_midnight:
                self.log_test("Timezone Edge Case", True, f"Testing near midnight - UTC: {utc_hour}:xx, Local: {local_hour}:xx")
                
                # Test if dates are different between UTC and local
                utc_date = utc_now.date().isoformat()
                local_date = local_now.date().isoformat()
                
                if utc_date != local_date:
                    self.log_test("Date Difference", True, f"UTC date ({utc_date}) differs from local date ({local_date}) - potential issue!")
                else:
                    self.log_test("Date Consistency", True, f"UTC and local dates are the same: {utc_date}")
            else:
                self.log_test("Timezone Edge Case", True, f"Not near midnight - UTC: {utc_hour}:xx, Local: {local_hour}:xx")
            
            return True
            
        except Exception as e:
            self.log_test("Timezone Edge Cases", False, f"Test error: {str(e)}")
            return False
    
    def test_absensi_document_structure(self) -> bool:
        """Test the structure of saved absensi documents"""
        try:
            # Get some absensi data to examine document structure
            today = self.get_today_value()
            
            # Use admin riwayat endpoint to get detailed data
            response = requests.get(
                f"{self.base_url}/absensi/riwayat",
                params={"tanggal_start": today, "tanggal_end": today},
                headers=self.admin_headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if we have any data
                summary = data.get("summary", {})
                total_records = summary.get("total_records", 0)
                
                if total_records > 0:
                    self.log_test("Absensi Document Structure", True, f"Found {total_records} absensi records for today ({today})")
                    
                    # Print sample document structure info
                    print(f"\n📄 Sample Absensi Document Analysis:")
                    print(f"Total records for {today}: {total_records}")
                    
                    by_waktu = summary.get("by_waktu", {})
                    for waktu, counts in by_waktu.items():
                        total_waktu = sum(counts.values())
                        if total_waktu > 0:
                            print(f"  {waktu}: {total_waktu} records - {counts}")
                    
                    return True
                else:
                    self.log_test("Absensi Document Structure", True, f"No absensi records found for today ({today}) - this is expected if no data was created")
                    return True
            else:
                self.log_test("Absensi Document Structure", False, f"Failed to get absensi data", response.json())
                return False
                
        except Exception as e:
            self.log_test("Absensi Document Structure", False, f"Test error: {str(e)}")
            return False
    
    def cleanup_test_data(self) -> bool:
        """Clean up test data"""
        try:
            cleanup_success = True
            
            # Delete test santri (this will also clean up wali)
            if self.test_santri_id:
                delete_response = requests.delete(
                    f"{self.base_url}/santri/{self.test_santri_id}",
                    headers=self.admin_headers,
                    timeout=30
                )
                
                if delete_response.status_code == 200:
                    self.log_test("Cleanup Santri", True, f"Deleted test santri: {self.test_santri_id}")
                else:
                    self.log_test("Cleanup Santri", False, f"Failed to delete test santri", delete_response.json())
                    cleanup_success = False
            
            # Delete test pengabsen
            if self.test_pengabsen_id:
                delete_response = requests.delete(
                    f"{self.base_url}/pengabsen/{self.test_pengabsen_id}",
                    headers=self.admin_headers,
                    timeout=30
                )
                
                if delete_response.status_code == 200:
                    self.log_test("Cleanup Pengabsen", True, f"Deleted test pengabsen: {self.test_pengabsen_id}")
                else:
                    self.log_test("Cleanup Pengabsen", False, f"Failed to delete test pengabsen", delete_response.json())
                    cleanup_success = False
            
            return cleanup_success
            
        except Exception as e:
            self.log_test("Cleanup Test Data", False, f"Cleanup error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all date debugging tests"""
        print("🔍 Starting Date Debug Tests for Absensi Sholat")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Step 1: Login as admin
        if not self.login_admin():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        # Step 2: Setup test data
        print("\n🛠️ Setting up test data...")
        if not self.setup_test_data():
            print("❌ Cannot proceed without test data")
            return False
        
        # Step 3: Test timezone analysis
        print("\n🌍 Testing timezone edge cases...")
        self.test_timezone_edge_cases()
        
        # Step 4: Test date values consistency
        print("\n📅 Testing date values across endpoints...")
        self.test_date_values_across_endpoints()
        
        # Step 5: Test absensi creation and date consistency
        print("\n🕌 Testing absensi creation and date consistency...")
        self.test_absensi_creation_and_date_consistency()
        
        # Step 6: Test document structure
        print("\n📄 Testing absensi document structure...")
        self.test_absensi_document_structure()
        
        # Step 7: Cleanup
        print("\n🧹 Cleaning up test data...")
        self.cleanup_test_data()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 DATE DEBUG TEST SUMMARY")
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
        
        # Print key findings
        print("\n🔍 KEY FINDINGS:")
        today_value = self.get_today_value()
        current_utc = datetime.now(timezone.utc)
        current_local = current_utc.astimezone()
        
        print(f"📅 Backend 'today' value: {today_value}")
        print(f"🕐 Current UTC time: {current_utc.isoformat()}")
        print(f"🕐 Current local time: {current_local.isoformat()}")
        print(f"🌍 Timezone: {current_local.tzinfo}")
        print(f"⏰ UTC offset: {current_local.utcoffset()}")
        
        overall_success = failed_tests == 0
        print(f"\n🎯 Overall Result: {'✅ ALL TESTS PASSED' if overall_success else '❌ SOME TESTS FAILED'}")
        
        return overall_success

def main():
    """Main test runner"""
    tester = DateDebugTester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()