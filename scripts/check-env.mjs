const required = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_VERIFY_SERVICE_SID",
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length === 0) {
  console.log("All required environment variables are present.");
  process.exit(0);
}

console.log("Missing environment variables:");
for (const key of missing) {
  console.log(`- ${key}`);
}

console.log("\nCopy .env.example to .env.local and fill these values.");
process.exit(1);
