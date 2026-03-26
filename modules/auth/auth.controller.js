import { env } from "../../config/env.js";
import { ROLES } from "../../constants/roles.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/token.js";
import User from "../user/user.model.js";
import bcrypt from "bcryptjs";
import { loginSchema, registerSchema } from "./auth.schema.js";



// ------------------- REGISTER -------------------
export const register = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if(!parsed.success){
        return res.status(400).json(parsed.error.format())
    }
    const { confirmPassword, name, email, password, role, image } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error("Email already in use");
      error.statusCode = 409;
      throw error;
    }

    const user = await User.create({
      name,
      email,
      image,
      password,
      role: role || ROLES.USER,
      provider: "local",
    });

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({
      id: user._id,
      role: user.role,
    });

    const isProd = env.NODE_ENV === "production";

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      path: "/",
      maxAge: 30 * 60 * 1000, // 30 mins for access token
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
      },
    });
  } catch (error) {
    next(error);
  }
};



// ------------------- LOGIN -------------------
export const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if(!parsed.success){
        return res.status(400).json(parsed.error.format())
    }
    const { email, password } = parsed.data;

    const user = await User.findOne({ email, isActive: true, isSuspended: false }).select("+password");

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 401;
      throw error;
    }

    if(user.isSuspended){
      return res.status(400).json({
        success: false,
        message: "Account is currently suspended!"
      })
    }

    if (user && user.provider !== "local") {
      const error = new Error(
        `Email already registered via ${user.provider}. Please use ${user.provider} to login.`,
      );
      error.statusCode = 409;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if(!isPasswordValid){
        const error = new Error("Invalid Password");
        error.statusCode = 401;
        throw error;
    }

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({
      id: user._id,
      role: user.role,
    });

    const isProd = env.NODE_ENV === "production";

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      path: "/",
      maxAge: 30 * 60 * 1000, // 30 mins for access token
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
    });

    user.lastLoginAt = new Date();
    await user.save();

    return res.status(201).json({
      success: true,
      message: "User signed in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        token: accessToken,
      },
    });

  } catch (error) {
    next(error);
  }
};


// ------------------- LOGOUT -------------------
export const logout = async (req, res, next) => {
  try {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ------------------- FETCH CURRENT USER -------------------
export const fetchMe = async(req, res) => {
    try{
        const user = await User.findById(req.user.id, {
      isActive: true,
      isSuspended: false, 
    })
        .select("_id name email role image provider company")

        res.status(200).json({ user });
    } catch(error){
        res.status(500).json({ message: "Failed to fetch user" })
    }
}


// ------------------- GOOGLE CALLBACK -------------------
export const googleCallback = async (req, res) => {
  const user = req.user;

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

  const redirectPath = req.cookies.redirect_after_login || "/";
  const redirectUrl = `${env.CLIENT_URL}${redirectPath}`

  const isProd = env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: isProd ? "None" : "Lax",
    path: "/",
    maxAge: 30 * 60 * 1000,
  })

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: isProd ? "None" : "Lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.clearCookie("redirect_after_login");

  return res.redirect(redirectUrl);
}



export const googleAuth = async(req, res, next) => {
  const redirect = req.query.redirect || "/";

  res.cookie("redirect_after_login", redirect, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    path: "/",
    maxAge: 10 * 60 * 1000,
  })

  next();
}