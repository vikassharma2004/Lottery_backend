import Joi from "joi";

// ==================== USER VALIDATION ====================
export const userValidationSchema = Joi.object({

  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Invalid email format",
    "string.empty": "Email is required",
  }),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .messages({
      "string.pattern.base": "Phone must be a 10-digit number",
      "string.empty": "Phone is required",
    }),

  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "string.empty": "Password is required",
  }),

  referralCode: Joi.string().optional(),
});
