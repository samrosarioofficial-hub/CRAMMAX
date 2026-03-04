#!/usr/bin/env python3

import requests
import sys
import json
import time
from datetime import datetime

class StudyMaxAPITester:
    def __init__(self, base_url="https://consistency-lab-3.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.session_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log(self, message, status="INFO"):
        """Log test messages with status"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {status}: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, skip_auth=False):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if not skip_auth and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}", "PASS")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}", "FAIL")
                self.log(f"Response: {response.text[:200]}", "ERROR")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except requests.exceptions.Timeout:
            self.log(f"❌ {name} - Request timeout", "FAIL")
            self.failed_tests.append({"test": name, "error": "timeout"})
            return False, {}
        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}", "FAIL")
            self.failed_tests.append({"test": name, "error": str(e)})
            return False, {}

    def test_health_check(self):
        """Test API health"""
        return self.run_test("Health Check", "GET", "", 200, skip_auth=True)

    def test_signup(self, name, email, password):
        """Test user signup"""
        success, response = self.run_test(
            "User Signup",
            "POST",
            "auth/signup",
            200,
            data={"name": name, "email": email, "password": password},
            skip_auth=True
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['user_id']
            self.log(f"Signup successful - User ID: {self.user_id}")
            return True
        return False

    def test_login(self, email, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password},
            skip_auth=True
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['user_id']
            self.log(f"Login successful - User ID: {self.user_id}")
            return True
        return False

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test("Get Current User", "GET", "auth/me", 200)
        if success:
            self.log(f"Current user: {response.get('name', 'Unknown')}")
        return success

    def test_start_session(self):
        """Test starting a study session"""
        success, response = self.run_test("Start Session", "POST", "session/start", 200)
        if success and 'session_id' in response:
            self.session_id = response['session_id']
            self.log(f"Session started - ID: {self.session_id}")
        return success, response

    def test_get_active_session(self):
        """Test getting active session"""
        return self.run_test("Get Active Session", "GET", "session/active", 200)

    def test_complete_phase(self, phase_name):
        """Test completing a session phase"""
        if not self.session_id:
            self.log("No active session for phase completion", "ERROR")
            return False, {}
        
        success, response = self.run_test(
            f"Complete Phase: {phase_name}",
            "POST",
            f"session/{self.session_id}/complete-phase",
            200,
            data={"phase": phase_name}
        )
        return success, response

    def test_dashboard(self):
        """Test dashboard data retrieval"""
        success, response = self.run_test("Dashboard Data", "GET", "dashboard", 200)
        if success:
            self.log(f"Dashboard - Score: {response.get('discipline_score', 0)}, Streak: {response.get('current_streak', 0)}")
        return success, response

    def test_profile(self):
        """Test profile data retrieval"""
        success, response = self.run_test("Profile Data", "GET", "profile", 200)
        if success:
            badges = response.get('badges', [])
            self.log(f"Profile - Level: {response.get('level', 0)}, Badges: {len(badges)}")
        return success, response

    def test_ai_coach_latest(self):
        """Test getting latest AI feedback"""
        return self.run_test("AI Coach Latest", "GET", "ai-coach/latest", 200)

    def test_ai_coach_generate(self):
        """Test generating AI feedback"""
        success, response = self.run_test("AI Coach Generate", "POST", "ai-coach/generate", 200)
        if success:
            feedback = response.get('feedback', '')
            self.log(f"AI Feedback generated: {feedback[:100]}...")
        return success, response

    def run_full_test_suite(self):
        """Run the complete test suite"""
        self.log("Starting StudyMax API Test Suite", "START")
        self.log(f"Base URL: {self.base_url}")
        
        # 1. Health Check
        self.test_health_check()
        
        # 2. Authentication Tests
        test_user = {
            "name": "Test User",
            "email": "testuser@studymax.com", 
            "password": "Test123!"
        }
        
        # Try signup first (might fail if user exists)
        signup_success = self.test_signup(test_user["name"], test_user["email"], test_user["password"])
        
        if not signup_success:
            self.log("Signup failed, trying login with existing credentials")
            login_success = self.test_login(test_user["email"], test_user["password"])
            if not login_success:
                self.log("Both signup and login failed. Cannot continue tests.", "ERROR")
                return self.print_summary()
        
        # 3. User Info Test
        self.test_get_me()
        
        # 4. Session Management Tests
        self.log("Testing session management...")
        session_success, session_data = self.test_start_session()
        
        if session_success:
            self.test_get_active_session()
            
            # Test completing all 4 phases
            phases = ["preview", "learn", "recall", "test"]
            session_completed = False
            
            for phase in phases:
                success, phase_response = self.test_complete_phase(phase)
                if success and phase_response.get('is_completed'):
                    session_completed = True
                    self.log(f"Session completed after {phase} phase!")
                    break
                time.sleep(0.5)  # Small delay between phases
        
        # 5. Dashboard Tests
        self.test_dashboard()
        
        # 6. Profile Tests  
        self.test_profile()
        
        # 7. AI Coach Tests
        self.test_ai_coach_latest()
        
        # Give some time for AI generation
        self.log("Testing AI Coach generation (this may take a few seconds)...")
        self.test_ai_coach_generate()
        
        return self.print_summary()

    def print_summary(self):
        """Print test execution summary"""
        self.log("=" * 60, "SUMMARY")
        self.log(f"Tests Run: {self.tests_run}")
        self.log(f"Tests Passed: {self.tests_passed}")
        self.log(f"Tests Failed: {len(self.failed_tests)}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        self.log(f"Success Rate: {success_rate:.1f}%")
        
        if self.failed_tests:
            self.log("Failed Tests:", "ERROR")
            for failure in self.failed_tests:
                self.log(f"  - {failure['test']}: {failure.get('error', 'Status code mismatch')}", "ERROR")
        
        self.log("=" * 60)
        
        # Return 0 for success, 1 for failure
        return 0 if len(self.failed_tests) == 0 else 1

if __name__ == "__main__":
    tester = StudyMaxAPITester()
    sys.exit(tester.run_full_test_suite())