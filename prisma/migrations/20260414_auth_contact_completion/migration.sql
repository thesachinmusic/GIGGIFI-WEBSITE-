CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'PHONE_OTP');

ALTER TABLE "User"
ADD COLUMN "lastAuthProvider" "AuthProvider";
