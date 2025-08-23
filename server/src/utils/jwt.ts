import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config();

export const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: "15m" })

  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: "7d" })

  return { accessToken, refreshToken }
}

export const verifyRefreshToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as { userId: string }
  } catch (error) {
    return null
  }
}
