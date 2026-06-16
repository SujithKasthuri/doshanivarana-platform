import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Track all navigation
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      console.log('Navigated to:', frame.url());
    }
  });

  console.log("Navigating to login...");
  await page.goto('http://localhost:5176/login');
  
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'admin@doshanivarana.com');
  await page.type('input[type="password"]', 'Admin@123');
  
  console.log("Clicking submit...");
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 10000));
  
  await browser.close();
}

run().catch(console.error);
