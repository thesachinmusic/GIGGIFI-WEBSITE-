import fs from "fs";
import path from "path";

function loadEnvFile(fileName) {
  const envPath = path.resolve(process.cwd(), fileName);
  if (!fs.existsSync(envPath)) {
    return;
  }

  const contents = fs.readFileSync(envPath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");

const required = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
];

const optional = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_VERIFY_SERVICE_SID",
];

const missing = required.filter((key) => !process.env[key]);
const missingOptional = optional.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.log("Missing required environment variables:");
  for (const key of missing) {
    console.log(`- ${key}`);
  }

  console.log("\nFill these in .env.local before continuing.");
  process.exit(1);
}

console.log("All required environment variables are present.");

if (missingOptional.length > 0) {
  console.log("\nOptional values still missing:");
  for (const key of missingOptional) {
    console.log(`- ${key}`);
  }

  console.log("\nThe app can still run without them:");
  console.log("- Google login stays disabled until Google keys are added.");
  console.log("- SMS OTP uses local preview/mock mode until Twilio keys are added.");
}
