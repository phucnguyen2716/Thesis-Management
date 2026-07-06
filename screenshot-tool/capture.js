const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = 'C:\\Users\\nguye\\Downloads\\interfaces';
const BASE_URL = 'http://localhost:5173';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const PAGES = [
  // General
  { name: '01_LoginPage', url: '/login', role: 'none' },

  // Student
  { name: '02_Student_Dashboard', url: '/', role: 'Student', email: 'student@ethesis.edu.vn' },
  { name: '03_Student_Lookup', url: '/lookup', role: 'Student', email: 'student@ethesis.edu.vn' },
  { name: '04_Student_Analysis', url: '/analysis', role: 'Student', email: 'student@ethesis.edu.vn' },
  { name: '05_Student_News', url: '/news', role: 'Student', email: 'student@ethesis.edu.vn' },
  { name: '06_Student_Guidelines', url: '/guidelines', role: 'Student', email: 'student@ethesis.edu.vn' },
  { name: '07_Student_Practice_A4', url: '/practice', role: 'Student', email: 'student@ethesis.edu.vn' },
  { name: '08_Student_Chatbot', url: '/chatbot', role: 'Student', email: 'student@ethesis.edu.vn' },
  { name: '09_Student_Games', url: '/games', role: 'Student', email: 'student@ethesis.edu.vn' },
  { name: '10_Student_Schedule', url: '/schedule', role: 'Student', email: 'student@ethesis.edu.vn' },
  { name: '11_Student_Profile', url: '/profile', role: 'Student', email: 'student@ethesis.edu.vn' },

  // Lecturer
  { name: '12_Lecturer_Dashboard', url: '/lecturer', role: 'Advisor', email: 'advisor@ethesis.edu.vn' },
  { name: '13_Lecturer_Theses', url: '/lecturer/theses', role: 'Advisor', email: 'advisor@ethesis.edu.vn' },
  { name: '14_Lecturer_Reports', url: '/lecturer/reports', role: 'Advisor', email: 'advisor@ethesis.edu.vn' },
  { name: '15_Lecturer_ProposeEvent', url: '/lecturer/propose-event', role: 'Advisor', email: 'advisor@ethesis.edu.vn' },
  { name: '16_Lecturer_Controller', url: '/lecturer/controller', role: 'Advisor', email: 'advisor@ethesis.edu.vn' },

  // Admin
  { name: '17_Admin_Dashboard', url: '/admin', role: 'Admin', email: 'admin@ethesis.edu.vn' },
  { name: '18_Admin_Students', url: '/admin/students', role: 'Admin', email: 'admin@ethesis.edu.vn' },
  { name: '19_Admin_Advisors', url: '/admin/advisors', role: 'Admin', email: 'admin@ethesis.edu.vn' },
  { name: '20_Admin_Events', url: '/admin/events', role: 'Admin', email: 'admin@ethesis.edu.vn' },
  { name: '21_Admin_Theses_Project', url: '/admin/theses/project', role: 'Admin', email: 'admin@ethesis.edu.vn' },
  { name: '22_Admin_Theses_Topic', url: '/admin/theses/topic', role: 'Admin', email: 'admin@ethesis.edu.vn' },
  { name: '23_Admin_Theses_Thesis', url: '/admin/theses/thesis', role: 'Admin', email: 'admin@ethesis.edu.vn' },
  { name: '24_Admin_Audit', url: '/admin/audit', role: 'Admin', email: 'admin@ethesis.edu.vn' },
  { name: '25_Admin_Hangfire', url: '/admin/hangfire', role: 'Admin', email: 'admin@ethesis.edu.vn' },
];

(async () => {
  console.log('🚀 Starting screenshot automation using Edge...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--window-size=1920,1080', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Helper to log in programmatically
  async function performLogin(email, role) {
    console.log(`🔑 Logging in as ${role} (${email})...`);
    await page.goto(`${BASE_URL}/login`);
    await sleep(1000);

    const success = await page.evaluate(async (loginEmail) => {
      try {
        const response = await fetch('http://localhost:5145/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail, password: '123' })
        });
        if (!response.ok) return false;
        
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          role: data.role,
          fullName: data.fullName,
          email: data.email,
          id: data.userId || 1
        }));
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    }, email);

    if (!success) {
      console.log(`⚠️ API login failed for ${email}, attempting UI login form...`);
      // UI Fallback
      await page.type('input[type="email"], input[placeholder*="email"]', email);
      await page.type('input[type="password"]', '123');
      await page.click('button[type="submit"]');
      await sleep(2000);
    }
  }

  let currentRole = 'none';

  for (const item of PAGES) {
    const { name, url, role, email } = item;
    console.log(`📸 Capturing: ${name} (${url})`);

    // Handle Login/Session changes
    if (role !== 'none' && role !== currentRole) {
      await performLogin(email, role);
      currentRole = role;
    } else if (role === 'none') {
      // Clear storage to show actual login page
      await page.goto(`${BASE_URL}/login`);
      await page.evaluate(() => localStorage.clear());
      currentRole = 'none';
    }

    // Navigate to target page
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'networkidle2' });
    await sleep(2000); // Wait for animations, dynamic seedings, etc.

    // Apply rule-based CSS modifications:
    // 1. Hide sidebars (if exists)
    // 2. Hide headers to focus on content (rule 3: "đừng dính ở trên lúc chụp")
    await page.evaluate(() => {
      // 1. Hide aside/sidebar elements (for desktop layout)
      const aside = document.querySelector('aside');
      if (aside) aside.style.display = 'none';

      // Hide mobile navigation bar at bottom
      const mobileNav = document.querySelector('nav.md\\:hidden');
      if (mobileNav) mobileNav.style.display = 'none';

      // 2. Hide header/navbar at the top
      const header = document.querySelector('header');
      if (header) header.style.display = 'none';

      // If there are other specific floating headers (like Chatbot header)
      const chatHeader = document.querySelector('.h-\\[72px\\].px-8.flex.items-center');
      if (chatHeader) chatHeader.style.display = 'none';

      // Make the main workspace fill the remaining screen space properly
      const main = document.querySelector('main');
      if (main) {
        main.style.marginLeft = '0px';
        main.style.paddingLeft = '0px';
        main.style.width = '100%';
        main.style.maxWidth = '100%';
      }

      const workspace = document.querySelector('.flex-1.flex.flex-col');
      if (workspace) {
        workspace.style.padding = '0px';
        workspace.style.margin = '0px';
      }
    });

    await sleep(500);

    // Save screenshot
    const outputPath = path.join(OUTPUT_DIR, `${name}.png`);
    await page.screenshot({ path: outputPath, fullPage: false });
    console.log(`✅ Saved to ${outputPath}`);
  }

  await browser.close();
  console.log('🎉 Screenshot generation finished successfully!');
})();
