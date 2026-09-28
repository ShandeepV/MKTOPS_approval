import User from "../models/userModel.js";
import Otp from "../models/otpModel.js";

export const createUser = async (data) => {
  return await User.create(data);
};

export const updateUserById = async (userId, data) => {
  return await User.findByIdAndUpdate(userId, data);
};

export const updateUserByEmail = async (email, data) => {
  return await User.findOneAndUpdate({ email }, data);
};

export const findUser = async (email, mobile) => {
  let search = { $or: [] };
  if (email) {
    search["$or"].push({ email });
  }
  if (mobile) {
    search["$or"].push({ mobile });
  }
  return await User.findOne(search).select("+password");
};

export const findUserById = async (id, projection = {}) => {
  return await User.findById(id, projection);
};

export const saveRefreshToken = async (userId, token) => {
  return await User.findByIdAndUpdate(userId, { refreshToken: token });
};

export const insertOtp = async (data) => {
  return await Otp.findOneAndUpdate(
    { email: data.email },
    {
      otp: data.otp,
      expires_at: data.expires_at,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
};

export const deleteOtp = async (email) => {
  return await Otp.deleteOne({ email });
};

export const findOtp = async (email) => {
  let search = { email };

  return await Otp.findOne(search);
};
