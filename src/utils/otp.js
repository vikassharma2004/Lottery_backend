import otpGenerator from "otp-generator";

export const generateOTP = (length = 6) => {
  return otpGenerator.generate(length, {
    digits: true,
    alphabets: false,
    upperCase: false,
    specialChars: false
  });
};

export const generateReferralCode = (length = 8) => {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
};
