import Joi from "joi";

// ==================== USER VALIDATION ====================
export const userValidationSchema = Joi.object({

  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Invalid email format",
    "string.empty": "Email is required",
  }),

  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "string.empty": "Password is required",
  }),
 referralCode: Joi.string().allow("").optional()

});
