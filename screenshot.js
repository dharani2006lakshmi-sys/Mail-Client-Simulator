const puppeteer = require('puppeteer-core');

(async () => {
    try {
        const browser = await puppeteer.launch({
            executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            headless: 'new',
            defaultViewport: { width: 1280, height: 800 }
        });
        
        const page = await browser.newPage();
        await page.goto('https://minigmaildemo.vercel.app/', { waitUntil: 'networkidle2' });
        
        // Take screenshot of the login page
        await page.screenshot({ path: 'D:\\mini-gmail\\screenshot.png' });
        
        await browser.close();
        console.log("Screenshot saved successfully.");
    } catch (e) {
        console.error("Error:", e);
    }
})();
