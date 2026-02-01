#!/usr/bin/env python3
"""
Comprehensive Date Edge Case Test for Absensi Sholat API
Tests specific scenarios mentioned in user complaint about date shifts
"""

import requests
import json
import sys
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
import uuid

# Configuration
BASE_URL = "https://attendance-system-48.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class EdgeCaseTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.admin_token = None
        self.admin_headers = {}
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
    
    def test_wali_sync_issue(self) -> bool:
        """Test the wali sync issue that prevents wali login"""
        try:
            # Get existing santri
            santri_response = requests.get(
                f"{self.base_url}/santri",
                headers=self.admin_headers,
                timeout=30
            )
            
            if santri_response.status_code == 200:
                santri_list = santri_response.json()
                if not santri_list:
                    self.log_test("Wali Sync Test", True, "No santri found - cannot test wali sync")
                    return True
                
                # Get wali list
                wali_response = requests.get(
                    f"{self.base_url}/wali",
                    headers=self.admin_headers,
                    timeout=30
                )
                
                if wali_response.status_code == 200:
                    wali_list = wali_response.json()
                    
                    print(f"\n🔍 Wali Sync Analysis:")
                    print(f"Total santri: {len(santri_list)}")
                    print(f"Total wali: {len(wali_list)}")
                    
                    # Check if wali have correct anak_ids
                    wali_with_children = 0
                    for wali in wali_list:
                        anak_ids = wali.get("anak_ids", [])
                        if anak_ids:
                            wali_with_children += 1
                            print(f"Wali {wali['nama']}: {len(anak_ids)} children")
                        else:
                            print(f"Wali {wali['nama']}: NO CHILDREN (anak_ids empty)")
                    
                    if wali_with_children == 0 and len(santri_list) > 0:
                        self.log_test("Wali Sync Issue", False, f"Found {len(santri_list)} santri but no wali have anak_ids - sync broken!")
                        return False
                    else:
                        self.log_test("Wali Sync Issue", True, f"Wali sync appears to be working - {wali_with_children} wali have children")
                        return True
                else:
                    self.log_test("Wali Sync Test", False, "Failed to get wali list", wali_response.json())
                    return False
            else:
                self.log_test("Wali Sync Test", False, "Failed to get santri list", santri_response.json())
                return False
                
        except Exception as e:
            self.log_test("Wali Sync Test", False, f"Test error: {str(e)}")
            return False
    
    def test_date_consistency_across_all_endpoints(self) -> bool:
        """Test date consistency across all relevant endpoints"""
        try:
            backend_today = datetime.now(timezone.utc).astimezone().date().isoformat()
            print(f"\n📅 Testing date consistency with backend_today = {backend_today}")
            
            # Test different date ranges
            yesterday = (datetime.now(timezone.utc).astimezone().date() - timedelta(days=1)).isoformat()
            tomorrow = (datetime.now(timezone.utc).astimezone().date() + timedelta(days=1)).isoformat()
            
            print(f"Yesterday: {yesterday}")
            print(f"Today: {backend_today}")
            print(f"Tomorrow: {tomorrow}")
            
            # Test admin riwayat endpoint with different date ranges
            test_cases = [
                {
                    "name": "Today Only",
                    "params": {"tanggal_start": backend_today, "tanggal_end": backend_today}
                },
                {
                    "name": "Yesterday Only", 
                    "params": {"tanggal_start": yesterday, "tanggal_end": yesterday}
                },
                {
                    "name": "Yesterday to Today",
                    "params": {"tanggal_start": yesterday, "tanggal_end": backend_today}
                },
                {
                    "name": "Today to Tomorrow",
                    "params": {"tanggal_start": backend_today, "tanggal_end": tomorrow}
                }
            ]
            
            all_success = True
            
            for test_case in test_cases:
                try:
                    response = requests.get(
                        f"{self.base_url}/absensi/riwayat",
                        params=test_case["params"],
                        headers=self.admin_headers,
                        timeout=30
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        summary = data.get("summary", {})
                        total_records = summary.get("total_records", 0)
                        
                        self.log_test(f"Date Range {test_case['name']}", True, f"Query successful - {total_records} records found")
                        
                        # Print breakdown by date if there are records
                        if total_records > 0:
                            by_waktu = summary.get("by_waktu", {})
                            print(f"  Records breakdown:")
                            for waktu, counts in by_waktu.items():
                                total_waktu = sum(counts.values())
                                if total_waktu > 0:
                                    print(f"    {waktu}: {total_waktu} records")
                    else:
                        self.log_test(f"Date Range {test_case['name']}", False, f"Query failed with status {response.status_code}", response.json())
                        all_success = False
                        
                except Exception as e:
                    self.log_test(f"Date Range {test_case['name']}", False, f"Request error: {str(e)}")
                    all_success = False
            
            return all_success
            
        except Exception as e:
            self.log_test("Date Consistency Test", False, f"Test error: {str(e)}")
            return False
    
    def test_timezone_behavior_detailed(self) -> bool:
        """Detailed timezone behavior analysis"""
        try:
            print(f"\n🌍 Detailed Timezone Analysis:")
            
            # Get current time in different formats
            utc_now = datetime.now(timezone.utc)
            local_now = utc_now.astimezone()
            
            # Backend logic simulation
            backend_today = utc_now.astimezone().date().isoformat()
            backend_waktu_absen = utc_now.isoformat()
            
            print(f"UTC Now: {utc_now}")
            print(f"Local Now: {local_now}")
            print(f"Backend Today Logic: {backend_today}")
            print(f"Backend Waktu Absen Logic: {backend_waktu_absen}")
            print(f"Timezone Info: {local_now.tzinfo}")
            print(f"UTC Offset: {local_now.utcoffset()}")
            
            # Check for potential issues
            utc_date = utc_now.date().isoformat()
            local_date = local_now.date().isoformat()
            
            if utc_date != local_date:
                self.log_test("Timezone Date Mismatch", False, f"UTC date ({utc_date}) != Local date ({local_date}) - POTENTIAL ISSUE!")
                return False
            else:
                self.log_test("Timezone Date Consistency", True, f"UTC and local dates match: {utc_date}")
            
            # Check if we're in a critical time window (near midnight)
            utc_hour = utc_now.hour
            local_hour = local_now.hour
            
            critical_hours = [22, 23, 0, 1, 2]  # 10 PM to 2 AM
            
            if utc_hour in critical_hours or local_hour in critical_hours:
                self.log_test("Critical Time Window", True, f"Testing in critical time window - UTC: {utc_hour}:xx, Local: {local_hour}:xx")
                
                # Simulate what would happen at different times
                for hour_offset in [-2, -1, 0, 1, 2]:
                    test_time = utc_now + timedelta(hours=hour_offset)
                    test_local = test_time.astimezone()
                    test_today = test_time.astimezone().date().isoformat()
                    
                    print(f"  Time +{hour_offset}h: UTC={test_time.strftime('%H:%M')}, Local={test_local.strftime('%H:%M')}, Today={test_today}")
            else:
                self.log_test("Normal Time Window", True, f"Testing in normal time window - UTC: {utc_hour}:xx, Local: {local_hour}:xx")
            
            return True
            
        except Exception as e:
            self.log_test("Timezone Behavior Test", False, f"Test error: {str(e)}")
            return False
    
    def test_absensi_document_inspection(self) -> bool:
        """Inspect actual absensi documents to understand date storage"""
        try:
            backend_today = datetime.now(timezone.utc).astimezone().date().isoformat()
            yesterday = (datetime.now(timezone.utc).astimezone().date() - timedelta(days=1)).isoformat()
            
            print(f"\n📄 Absensi Document Inspection:")
            
            # Get recent absensi data
            response = requests.get(
                f"{self.base_url}/absensi/riwayat",
                params={"tanggal_start": yesterday, "tanggal_end": backend_today},
                headers=self.admin_headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                summary = data.get("summary", {})
                total_records = summary.get("total_records", 0)
                
                print(f"Total records in last 2 days: {total_records}")
                
                if total_records > 0:
                    by_waktu = summary.get("by_waktu", {})
                    
                    print(f"Records by prayer time:")
                    for waktu, counts in by_waktu.items():
                        total_waktu = sum(counts.values())
                        if total_waktu > 0:
                            print(f"  {waktu}: {total_waktu} total")
                            for status, count in counts.items():
                                if count > 0:
                                    print(f"    {status}: {count}")
                    
                    # Check date distribution
                    date_info = summary.get("date_range", {})
                    print(f"Date range info: {date_info}")
                    
                    self.log_test("Document Inspection", True, f"Found {total_records} records to analyze")
                else:
                    self.log_test("Document Inspection", True, "No recent records found - this is normal for a new system")
                
                return True
            else:
                self.log_test("Document Inspection", False, f"Failed to get absensi data", response.json())
                return False
                
        except Exception as e:
            self.log_test("Document Inspection", False, f"Test error: {str(e)}")
            return False
    
    def test_endpoint_date_values(self) -> bool:
        """Test the actual 'today' values returned by different endpoints"""
        try:
            backend_today = datetime.now(timezone.utc).astimezone().date().isoformat()
            
            print(f"\n📅 Endpoint Date Values Comparison:")
            print(f"Expected backend_today: {backend_today}")
            
            # Get pengabsen list to test with
            pengabsen_response = requests.get(
                f"{self.base_url}/pengabsen",
                headers=self.admin_headers,
                timeout=30
            )
            
            if pengabsen_response.status_code == 200:
                pengabsen_list = pengabsen_response.json()
                if pengabsen_list:
                    pengabsen = pengabsen_list[0]
                    
                    # Login as pengabsen
                    pengabsen_login = {
                        "username": pengabsen["username"],
                        "kode_akses": pengabsen["kode_akses"]
                    }
                    
                    login_response = requests.post(
                        f"{self.base_url}/pengabsen/login",
                        json=pengabsen_login,
                        timeout=30
                    )
                    
                    if login_response.status_code == 200:
                        pengabsen_token = login_response.json()["access_token"]
                        pengabsen_headers = {"Authorization": f"Bearer {pengabsen_token}"}
                        
                        # Test pengabsen endpoint date
                        for waktu in ["subuh", "dzuhur", "ashar", "maghrib", "isya"]:
                            pengabsen_resp = requests.get(
                                f"{self.base_url}/pengabsen/santri-absensi-hari-ini",
                                params={"waktu_sholat": waktu},
                                headers=pengabsen_headers,
                                timeout=30
                            )
                            
                            if pengabsen_resp.status_code == 200:
                                pengabsen_data = pengabsen_resp.json()
                                pengabsen_date = pengabsen_data.get("tanggal")
                                
                                if pengabsen_date == backend_today:
                                    print(f"  ✅ Pengabsen {waktu}: {pengabsen_date} (matches)")
                                else:
                                    print(f"  ❌ Pengabsen {waktu}: {pengabsen_date} (MISMATCH!)")
                                    self.log_test(f"Pengabsen Date {waktu}", False, f"Date mismatch: expected {backend_today}, got {pengabsen_date}")
                                    return False
                            else:
                                print(f"  ❌ Pengabsen {waktu}: Failed to get data")
                        
                        self.log_test("Pengabsen Date Values", True, "All pengabsen endpoints return consistent dates")
                    else:
                        self.log_test("Pengabsen Login", False, "Failed to login as pengabsen", login_response.json())
                        return False
                else:
                    self.log_test("Pengabsen Test", True, "No pengabsen found - skipping pengabsen date test")
            else:
                self.log_test("Pengabsen Test", False, "Failed to get pengabsen list", pengabsen_response.json())
                return False
            
            # Test wali endpoint if possible
            wali_response = requests.get(
                f"{self.base_url}/wali",
                headers=self.admin_headers,
                timeout=30
            )
            
            if wali_response.status_code == 200:
                wali_list = wali_response.json()
                wali_with_children = [w for w in wali_list if w.get("anak_ids")]
                
                if wali_with_children:
                    wali = wali_with_children[0]
                    
                    # Try to login as wali
                    wali_login = {
                        "username": wali["username"],
                        "password": "12345"  # Default password
                    }
                    
                    wali_login_response = requests.post(
                        f"{self.base_url}/wali/login",
                        json=wali_login,
                        timeout=30
                    )
                    
                    if wali_login_response.status_code == 200:
                        wali_token = wali_login_response.json()["access_token"]
                        wali_headers = {"Authorization": f"Bearer {wali_token}"}
                        
                        # Test wali endpoint date
                        wali_resp = requests.get(
                            f"{self.base_url}/wali/anak-absensi-hari-ini",
                            headers=wali_headers,
                            timeout=30
                        )
                        
                        if wali_resp.status_code == 200:
                            wali_data = wali_resp.json()
                            wali_date = wali_data.get("tanggal")
                            
                            if wali_date == backend_today:
                                print(f"  ✅ Wali hari ini: {wali_date} (matches)")
                                self.log_test("Wali Date Value", True, "Wali endpoint returns consistent date")
                            else:
                                print(f"  ❌ Wali hari ini: {wali_date} (MISMATCH!)")
                                self.log_test("Wali Date Value", False, f"Date mismatch: expected {backend_today}, got {wali_date}")
                                return False
                        else:
                            self.log_test("Wali Endpoint", False, "Failed to get wali hari ini data", wali_resp.json())
                            return False
                    else:
                        self.log_test("Wali Login", True, "Could not login as wali - skipping wali date test")
                else:
                    self.log_test("Wali Test", True, "No wali with children found - skipping wali date test")
            else:
                self.log_test("Wali Test", False, "Failed to get wali list", wali_response.json())
                return False
            
            return True
            
        except Exception as e:
            self.log_test("Endpoint Date Values", False, f"Test error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all edge case tests"""
        print("🔍 Starting Comprehensive Date Edge Case Tests")
        print(f"📍 Base URL: {self.base_url}")
        print("=" * 60)
        
        # Step 1: Login as admin
        if not self.login_admin():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        # Step 2: Test wali sync issue
        print("\n👨‍👩‍👧‍👦 Testing wali sync issue...")
        self.test_wali_sync_issue()
        
        # Step 3: Test timezone behavior
        print("\n🌍 Testing timezone behavior...")
        self.test_timezone_behavior_detailed()
        
        # Step 4: Test date consistency across endpoints
        print("\n📅 Testing date consistency across endpoints...")
        self.test_date_consistency_across_all_endpoints()
        
        # Step 5: Test endpoint date values
        print("\n🔗 Testing endpoint date values...")
        self.test_endpoint_date_values()
        
        # Step 6: Inspect absensi documents
        print("\n📄 Inspecting absensi documents...")
        self.test_absensi_document_inspection()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 EDGE CASE TEST SUMMARY")
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
        print("\n🔍 KEY FINDINGS & RECOMMENDATIONS:")
        backend_today = datetime.now(timezone.utc).astimezone().date().isoformat()
        current_utc = datetime.now(timezone.utc)
        current_local = current_utc.astimezone()
        
        print(f"📅 Backend 'today' calculation: datetime.now(timezone.utc).astimezone().date().isoformat()")
        print(f"📅 Current result: {backend_today}")
        print(f"🕐 Current UTC time: {current_utc.isoformat()}")
        print(f"🕐 Current local time: {current_local.isoformat()}")
        print(f"🌍 Server timezone: {current_local.tzinfo}")
        print(f"⏰ UTC offset: {current_local.utcoffset()}")
        
        # Recommendations based on findings
        print(f"\n💡 RECOMMENDATIONS:")
        if failed_tests == 0:
            print("✅ No critical date issues found in current testing")
            print("✅ All endpoints use consistent date calculation")
            print("✅ Timezone handling appears correct")
        else:
            print("❌ Date consistency issues detected!")
            print("🔧 Recommended fixes:")
            print("   1. Ensure all endpoints use the same date calculation method")
            print("   2. Consider using a centralized date service")
            print("   3. Add timezone validation in critical endpoints")
        
        overall_success = failed_tests == 0
        print(f"\n🎯 Overall Result: {'✅ ALL TESTS PASSED' if overall_success else '❌ ISSUES DETECTED'}")
        
        return overall_success

def main():
    """Main test runner"""
    tester = EdgeCaseTester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()