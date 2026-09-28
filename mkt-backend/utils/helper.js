export const sendResponse = (
  res,
  statusCode = 200,
  success = true,
  data = null,
  message = "Success",
) => {
  return res.status(statusCode).json({
    success,
    message,
    data,
  });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const handlePayloadValidation = (sch, payload) => {
  try {
    const { error } = sch.validate(payload, {
      abortEarly: false,
      allowUnknown: true,
    });
    if (error) {
      return error.details.map((e) => e.message).join(" | ");
    }
  } catch (error) {
    return "";
  }
};

export const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

export const buildUpdatePayload = (data) => {
  const payload = {};

  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined && data[key] !== null && data[key] !== "") {
      payload[key] = data[key];
    }
  });

  return payload;
};

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} minutes`;

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return m ? `${h} hour ${m} minutes` : `${h} hour`;
}
