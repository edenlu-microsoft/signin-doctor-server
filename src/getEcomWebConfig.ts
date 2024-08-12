import puppeteer from "puppeteer";

export const getEcomWebConfig = async (url: string) => {
  // const url = 'https://hgg-test-ecom.dynamics365commerce.ms/hgg_b2b';
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"], }); // Launch browser in non-headless mode
  const page = await browser.newPage();

  await page.goto(url); // Replace with your URL

  // Execute the command in the console
  const requestContext = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).___initialData___.requestContext;
  });

  return requestContext;
};
