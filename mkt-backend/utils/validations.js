import Joi from "joi";

export const signUpSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(20).required(),
  confirm_password: Joi.any().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
  }),
});
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(20).required(),
  device_type: Joi.string().optional().allow(""),
  device_id: Joi.string().optional().allow(""),
  device_token: Joi.string().optional().allow(""),
  version: Joi.string().optional().allow(""),
});

export const verifyOtpSchema = Joi.object({
  type: Joi.number().valid(1, 2).required().messages({
    "any.only": "Type must be either 1 or 2",
  }),

  email: Joi.string().email().required(),

  otp: Joi.string().required(),

  password: Joi.when("type", {
    is: 1,
    then: Joi.string().min(8).max(20).required(),
    otherwise: Joi.optional().allow(""),
  }),

  confirm_password: Joi.when("type", {
    is: 1,
    then: Joi.any().valid(Joi.ref("password")).required().messages({
      "any.only": "Passwords do not match",
    }),
    otherwise: Joi.optional().allow(""),
  }),

  device_type: Joi.string().optional().allow(""),
  device_id: Joi.string().optional().allow(""),
  device_token: Joi.string().optional().allow(""),
  version: Joi.string().optional().allow(""),
});

export const newPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(20).required(),
  confirm_password: Joi.any().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
  }),
  temp_code: Joi.number().required(),
});

export const quizResultSchema = Joi.object({
  user_id: Joi.string().required(),
  quiz_id: Joi.string().required(),
  quiz_type: Joi.number().integer().required(),
  total_questions: Joi.number().integer().min(0).required(),
  correct_answers: Joi.number().integer().min(0).required(),
  wrong_answers: Joi.number().integer().min(0).required(),
  skipped_answers: Joi.number().integer().min(0).required(),
  marks: Joi.number().min(0).required(),
  time_spent: Joi.number().min(0).required(),
});
