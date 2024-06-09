import bcrypt from 'bcrypt';
import { RequestHandler } from 'express';
import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';

import { Gender } from '@prisma/client';

import env from '../env';
import prisma from '../prisma';

export const getUser: RequestHandler = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.params.user_id,
      },
      include: {
        sitter: {
          select: {
            status: true,
          },
        },
      },
      omit: {
        password: true,
      },
    });

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    res.status(200).json({
      status: true,
      message: 'get user successd',
      data: user,
    });
  } catch (error) {
    // next(error);
    return res.status(401).json({
      status: false,
      message: 'get user failed',
    });
  }
};

// interface SignUpBody {
//   real_name: string;
//   email: string;
//   password: string;
// }

export const signUp: RequestHandler = async (req, res, next) => {
  const { real_name, email, password: passwordRaw } = req.body;

  if (!real_name) {
    return next(createHttpError(400, 'username is required'));
  }

  if (!email) {
    return next(createHttpError(400, 'email is required'));
  }

  if (!passwordRaw) {
    return next(createHttpError(400, 'password is required'));
  }

  if (passwordRaw.length < 8) {
    return next(createHttpError(400, 'passwords must be at least 8 characters long'));
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return next(createHttpError(409, 'This email is already in use'));
    }

    const passwordHashed = await bcrypt.hash(passwordRaw, 10);

    const newUser = await prisma.user.create({
      data: {
        real_name,
        email,
        password: passwordHashed,
      },
      include: {
        sitter: {
          select: {
            status: true,
          },
        },
      },
      omit: {
        password: true,
      },
    });

    const accessToken = jwt.sign({ id: newUser.id }, env.JWT_ACCESS_SECRET, {
      expiresIn: '7d',
    });

    // req.logIn(newUser, (error) => {
    //   if (error) throw createHttpError(401, error);
    //   res.status(201).json({
    //     status: true,
    //     message: 'register successd',
    //     data: {
    //       ...newUser,
    //       accessToken,
    //     },
    //   });
    // });
    res.status(201).json({
      status: true,
      message: 'register successd',
      data: {
        ...newUser,
        accessToken,
      },
    });
  } catch (error) {
    // next(error);
    next(createHttpError(401, 'register failed'));
  }
};

export const logIn: RequestHandler = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email) {
    return next(createHttpError(400, 'email is required'));
  }

  if (!password) {
    return next(createHttpError(400, 'password is required'));
  }
  const existingUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
    include: {
      sitter: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!existingUser || !existingUser.password) {
    return next(createHttpError(400, 'Incorrect email or password.'));
  }

  const passwordMatch = await bcrypt.compare(password, existingUser.password);

  if (!passwordMatch) {
    return next(createHttpError(400, 'Incorrect email or password.'));
  }

  const accessToken = jwt.sign({ id: existingUser.id, iat: Math.floor(Date.now() / 1000) }, env.JWT_ACCESS_SECRET, {
    expiresIn: '7d',
  });

  const { password: userPassword, ...user } = existingUser;

  res.status(200).json({
    status: true,
    message: 'login successful',
    data: {
      ...user,
      accessToken,
    },
  });
};

export const logOut: RequestHandler = (req, res) => {
  // if (error) throw createHttpError(401, error);
  res.status(200).json({
    status: true,
    message: 'logout successd',
  });
};

export const updateUser: RequestHandler = async (req, res, next) => {
  const { phone, avatar, nickname, birthdate, gender, self_introduction } = req.body;
  // const profilePic = req.file;

  try {
    const existingUser = await prisma.user.findUnique({
      where: {
        id: req.params.user_id,
      },
    });

    if (!existingUser) {
      return next(createHttpError(409, 'User not found.'));
    }

    const data: {
      phone?: string;
      password?: string;
      lastPasswordChange?: Date;
      avatar?: string;
      nickname?: string;
      birthdate?: Date;
      gender?: Gender;
      self_introduction?: string;
    } = {};

    if (phone !== undefined) data.phone = phone;
    if (avatar !== undefined) data.avatar = avatar;
    if (nickname !== undefined) data.nickname = nickname;
    if (birthdate !== undefined) data.birthdate = new Date(birthdate);
    if (gender !== undefined) data.gender = gender as Gender;
    if (self_introduction !== undefined) data.self_introduction = self_introduction;

    // if (profilePic) {
    //   const profilePicDestinationPath = '/uploads/profile-pictures/' + req.params.user_id + '.png';

    //   await sharp(profilePic.buffer)
    //     .resize(500, 500, { withoutEnlargement: true })
    //     .toFile('./' + profilePicDestinationPath);

    //   data.avatar = env.BACK_END_URL + profilePicDestinationPath + '?lastupdated=' + Date.now();
    // }

    const user = await prisma.user.update({
      where: {
        id: req.params.user_id,
      },
      data,
      include: {
        sitter: {
          select: {
            status: true,
          },
        },
      },
      omit: {
        password: true,
      },
    });

    // const accessToken = jwt.sign({ id: user.id, iat: Math.floor(Date.now() / 1000) }, env.JWT_ACCESS_SECRET, {
    //   expiresIn: '7d',
    // });

    res.status(200).json({
      status: true,
      message: 'update user successd',
      data: {
        ...user,
        // accessToken,
      },
    });
  } catch (error) {
    // next(error);
    next(createHttpError(401, 'update user failed'));
  }
};

export const resetPassword: RequestHandler = async (req, res, next) => {
  const { old_password, password, password_confirm } = req.body;
  try {
    if (!password) {
      return next(createHttpError(400, 'password is required'));
    }
    if (!password_confirm) {
      return next(createHttpError(400, 'confirm password is required'));
    }

    if (password !== password_confirm) {
      return next(createHttpError(400, 'passwords do not match'));
    }

    if (password.length < 8) {
      return next(createHttpError(400, 'passwords must be at least 8 characters long'));
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        id: req.params.user_id,
      },
    });

    if (!existingUser) {
      return next(createHttpError(409, 'User not found.'));
    }

    if (!existingUser.password) {
      return next(createHttpError(400, 'User has no password set.'));
    }

    const passwordMatch = await bcrypt.compare(old_password, existingUser.password);

    if (!passwordMatch) {
      return next(createHttpError(400, 'Incorrect old password.'));
    }

    const passwordHashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: {
        id: req.params.user_id,
      },
      data: {
        password: passwordHashed,
        lastPasswordChange: new Date(),
      },
      omit: {
        password: true,
      },
    });

    const accessToken = jwt.sign({ id: user.id, iat: Math.floor(Date.now() / 1000) }, env.JWT_ACCESS_SECRET, {
      expiresIn: '7d',
    });

    res.status(200).json({
      status: true,
      message: 'reset password successd',
      data: {
        ...user,
        accessToken,
      },
    });
  } catch (error) {
    next(createHttpError(401, 'reset password failed'));
  }
};
