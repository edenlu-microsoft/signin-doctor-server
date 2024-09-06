import * as appInsights from "applicationinsights";
import axios from "axios";
import bodyParser from "body-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import { diagnoseSignIn } from "./diagnoseSignIn";
import { getEcomWebConfig } from "./getEcomWebConfig";
import { PuppeteerClusterController } from "./PuppeteerClusterController";

// Initialize Application Insights
const connectionString =
  "InstrumentationKey=b520cbde-7a0a-49c6-92f1-44b24163e3c0;IngestionEndpoint=https://westus-0.in.applicationinsights.azure.com/;LiveEndpoint=https://westus.livediagnostics.monitor.azure.com/;ApplicationId=e324d531-7429-447d-82c9-5c7446739cf9";
console.log(`appinsight connection string: ${connectionString}`);
appInsights
  .setup(connectionString)
  .setAutoCollectConsole(true, true)
  .setAutoCollectExceptions(true)
  .setAutoCollectPerformance(true, true)
  .setAutoCollectRequests(true)
  .setUseDiskRetryCaching(true)
  .start();

const client = appInsights.defaultClient;

// initialize the brower clusters
PuppeteerClusterController.getInstance().init();

const port = process.env.PORT || 8080;
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://signin-doctor.azurewebsites.net",
];

app.use(bodyParser.json());
app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.use((err: any, req: any, res: any, next: any) => {
  client.trackException({ exception: err });
  res.status(500).send(err);
});

app.get("/ecom-config", async (req, res) => {
  try {
    let ecomUrl = req.query.ecomUrl as string;

    if (!ecomUrl.includes(`https://`)) {
      ecomUrl = `https://${ecomUrl}`;
    }
    // const input = encodeURIComponent(query);

    const requestContext = await getEcomWebConfig(ecomUrl);
    res.send(requestContext);
  } catch (exception) {
    console.error("Error occurred during sign-in diagnose:", exception);
    client.trackException({ exception: exception as any });
    res.status(500).send({
      message: "Internal Server Error",
      error: (exception as any).message,
      stack: (exception as any).stack,
    });
  }
});

app.post("/sign-in-diagnose", async (req: Request, res: Response) => {
  try {
    const signInUrl = req.body?.signInUrl;
    const email = req.body?.email;
    const pwd = req.body?.pwd;

    if (!signInUrl || !email || !pwd) {
      res.status(400).send("missing inputs");
    }

    const diagnoseResult = await diagnoseSignIn(signInUrl, email, pwd);

    res.send(diagnoseResult);
  } catch (exception) {
    client.trackException({ exception: exception as any });
    console.error(exception);
    res.status(400).send(exception);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

app.post("/csu", async (req: Request, res: Response) => {
  try {
    const method = req.body?.method;
    const endpoint = req.body?.endpoint;
    const body = req.body?.body;
    const headers = req.body?.headers;

    if (!method || !endpoint) {
      res.status(400).send("missing inputs");
    }

    if (method === "GET") {
      const response = await axios.get(endpoint, { headers });
      res.send(response.data);
      return;
    } else if (method === "POST") {
      const response = await axios.post(endpoint, body, { headers });
      res.send(response.data);
      return;
    }
  } catch (exception) {
    const castedException = exception as any;
    const error = castedException?.response?.data;
    client.trackException({ exception: error });
    console.error(error);
    res.status(400).send(error);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
