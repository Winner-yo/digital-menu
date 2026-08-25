import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/client';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import { generateToken, slugify } from '../../utils/helpers';
import { UserRole } from '@prisma/client';

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

const generateTokens = (userId: string, email: string, role: UserRole, restaurantId?: string) => {
  const payload = { id: userId, email, role, restaurantId };
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
  return { accessToken, refreshToken };
};

export const authService = {
  async register(dto: RegisterDto) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, ...(dto.phone ? [{ phone: dto.phone }] : [])] },
    });
    if (existing) throw new AppError('An account with this email or phone already exists', 409);

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const verifyToken = generateToken();

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: dto.restaurantName ? UserRole.RESTAURANT_OWNER : UserRole.CASHIER,
          emailVerifyToken: verifyToken,
        },
      });

      // Create restaurant if provided
      if (dto.restaurantName) {
        let slug = slugify(dto.restaurantName);
        const existingSlug = await tx.restaurant.findUnique({ where: { slug } });
        if (existingSlug) slug = `${slug}-${Date.now()}`;

        const restaurant = await tx.restaurant.create({
          data: {
            name: dto.restaurantName,
            slug,
            address: dto.restaurantAddress || 'Addis Ababa, Ethiopia',
            phone: dto.restaurantPhone || dto.phone || '',
            email: dto.email,
          },
        });

        await tx.restaurantUser.create({
          data: {
            restaurantId: restaurant.id,
            userId: newUser.id,
            role: UserRole.RESTAURANT_OWNER,
          },
        });

        // Create default opening hours
        const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
        await tx.openingHour.createMany({
          data: days.map((day) => ({
            restaurantId: restaurant.id,
            day: day as never,
            openTime: '08:00',
            closeTime: '22:00',
            isClosed: false,
          })),
        });

        return { user: newUser, restaurantId: restaurant.id };
      }

      return { user: newUser, restaurantId: undefined };
    });

    const { accessToken, refreshToken } = generateTokens(
      user.user.id,
      user.user.email,
      user.user.role,
      user.restaurantId
    );

    return {
      user: {
        id: user.user.id,
        email: user.user.email,
        firstName: user.user.firstName,
        lastName: user.user.lastName,
        role: user.user.role,
      },
      restaurantId: user.restaurantId,
      accessToken,
      refreshToken,
    };
  },

  async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new AppError('Invalid email or password', 401);
    if (!user.isActive) throw new AppError('Account is deactivated', 403);

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new AppError('Invalid email or password', 401);

    // Get restaurant for non super-admins
    let restaurantId: string | undefined;
    if (user.role !== UserRole.SUPER_ADMIN) {
      const membership = await prisma.restaurantUser.findFirst({
        where: { userId: user.id, isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      restaurantId = membership?.restaurantId;
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role, restaurantId);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
      restaurantId,
      accessToken,
      refreshToken,
    };
  },

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
        id: string;
        email: string;
        role: UserRole;
        restaurantId?: string;
      };
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user || !user.isActive) throw new AppError('Invalid token', 401);

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(
        user.id, user.email, user.role, decoded.restaurantId
      );
      return { accessToken, refreshToken: newRefreshToken };
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  },

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Silent fail for security

    const resetToken = generateToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // TODO: Send email with resetToken
    console.log(`Password reset token for ${email}: ${resetToken}`);
    return resetToken; // Return for dev purposes
  },

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
      },
    });
    if (!user) throw new AppError('Invalid or expired reset token', 400);

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, passwordResetToken: null, passwordResetExpiry: null },
    });
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, avatar: true, isEmailVerified: true,
        restaurantUsers: {
          where: { isActive: true },
          include: {
            restaurant: {
              select: { id: true, name: true, slug: true, logo: true },
            },
          },
        },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    return user;
  },
};
