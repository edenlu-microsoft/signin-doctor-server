import bodyParser from "body-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import { diagnoseSignIn } from "./diagnoseSignIn";
import { getEcomWebConfig } from "./getEcomWebConfig";

const port = 8080;
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://signin-doctor.azurewebsites.net",
];

app.use(bodyParser.json());
app.use(
  cors({
    origin: allowedOrigins
  })
);
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
    res.status(400).send(exception);
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
    res.status(400).send(exception);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
