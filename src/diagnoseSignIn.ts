import * as jwt from "jsonwebtoken";
import puppeteer, { Page, TimeoutError } from "puppeteer";

export const diagnoseSignIn = async (
  signInUrl: string,
  email: string,
  pwd: string
) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36"
  );
  await page.setRequestInterception(true);
  const result: any = { authStack: [] };

  const startTime = Date.now();

  page.on("request", async (request) => {
    const requestPayload = {
      url: request.url(),
      method: request.method(),
      postData: request.postData(),
      headers: request.headers(),
    };
    request.continue();

    if (requestPayload.url.includes("/authresp")) {
      if (!result.redirects) result.redirects = [];
      result.redirects.push({ request: requestPayload });

      // process
      const urlParams = new URLSearchParams(requestPayload.postData);
      const idToken = urlParams.get("id_token");

      result.authStack.push(requestPayload);

      if (idToken) {
        result.token = idToken;
        result.tokenPayload = jwt.decode(idToken);
      }
    }
  });

  try {
    await page.goto(signInUrl, {
      waitUntil: "networkidle0",
    });

    const azureRedirectUrl = page.url();
    const urlObj = new URL(azureRedirectUrl);
    const queryParams = new URLSearchParams(urlObj.search);

    result.signInPolicy = queryParams.get("p");
    result.signInClientId = queryParams.get("client_id");
    result.signInSucceed = false;

    // #0 check if azure load the page properly
    await checkAzurePageLoaded(page);

    // #1 try signin
    await submitCredential(page, email, pwd);

    // #2 wait for redirect completed, should redirect to the url specied in ru
    await checkSignInError(page, result);

    // #3 verify user info
    const user = await page.evaluate(() => {
      return (window as any).___initialData___?.requestContext?.user;
    });

    result.token = user?.token;
    result.signInSucceed =
      !result.retailServerErrorCode &&
      !result.retailServerErrorMessage &&
      !!result.token;

    if (result.token) {
      const tokenPayload = jwt.decode(result.token);
      result.tokenPayload = tokenPayload;
    }
  } catch (exception: any) {
    result.error = exception.message ?? JSON.stringify(exception);
  } finally {
    await browser.close();
  }

  result.time = (Date.now() - startTime) / 1000;

  return result;
};

const checkAzurePageLoaded = async (page: Page) => {
  const azureError = await page.$(".error-page-detail");
  if (azureError) {
    const azureErrorMessage = await azureError.evaluate(
      (node) => node.innerHTML
    );
    if (azureErrorMessage) {
      throw azureErrorMessage;
    }
  }
};

const submitCredential = async (page: Page, email: string, pwd: string) => {
  const emailInput = await page.$("#email");
  await emailInput?.type(email);
  const passwordInput = await page.$("#password");
  await passwordInput?.type(pwd);
  const nextButton = await page.$("#next");
  if (nextButton) {
    await nextButton?.click();
  } else {
    console.log("Submit button is not available");
    throw new Error("Submit button is not available");
  }
};

const checkSignInError = async (page: Page, result: any) => {
  try {
    const error = await page.waitForSelector(".error.pageLevel p", {
      timeout: 2000,
      visible: true,
    });

    if (error) {
      const errorMessage = await error.evaluate((node) => node.innerHTML);
      if (errorMessage) {
        throw errorMessage;
      }
    }
  } catch (error) {
    if (error instanceof TimeoutError) {
      await waitForUserTokenOrRetailError(page, result);
    } else {
      throw error;
    }
  }
};

const waitForUserTokenOrRetailError = async (page: Page, result: any) => {
  try {
    await page.waitForFunction(
      () => {
        const user = (window as any).___initialData___?.requestContext?.user;
        const retailServerErrorCode = user?.retailServerErrorCode;
        const retailServerErrorMessage = user?.retailServerErrorMessage;

        // either token available or retail error available
        return (
          (user && user.token) ||
          retailServerErrorCode ||
          retailServerErrorMessage
        );
      },
      { timeout: 15000, polling: 500 }
    );
  } catch (error) {
    if (error instanceof TimeoutError) {
      throw "Somehow token is not available in requestContext after sign-in";
    } else {
      throw error;
    }
  }

  const user = await page.evaluate(() => {
    return (window as any).___initialData___?.requestContext?.user;
  });

  result.retailServerErrorCode = user?.retailServerErrorCode;
  result.retailServerErrorMessage = user?.retailServerErrorMessage;

  if (result.retailServerErrorCode || result.retailServerErrorMessage) {
    throw `Failed to get Customer from CSU due to ${result.retailServerErrorCode}`;
  }
};
