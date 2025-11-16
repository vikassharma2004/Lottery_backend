

import { randomInt } from 'crypto';

export const generateOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += String(randomInt(0, 10)); // 0..9
  }
  return otp;
};

export const generateReferralCode = (length = 8) => {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
};
// utils/generateWithdrawId.js
export const generateWithdrawId = () => {
  const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000); // 10-digit number
  return `WD-${randomDigits}`;
};

