const { User } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Registrar un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} Usuario creado y token
   */
  async register(userData) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({
        where: {
          username: userData.username
        }
      });

      if (existingUser) {
        throw new Error('El nombre de usuario ya está en uso');
      }

      // Verificar si el correo ya está registrado
      const existingEmail = await User.findOne({
        where: {
          email: userData.email
        }
      });

      if (existingEmail) {
        throw new Error('El correo electrónico ya está registrado');
      }

      // Crear el usuario
      const user = await User.create(userData);

      // Generar el token JWT
      const token = this.generateToken(user);

      // Excluir la contraseña
      const userWithoutPassword = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      logger.error('Error al registrar usuario:', error);
      throw error;
    }
  }

  /**
   * Iniciar sesión
   * @param {string} username - Nombre de usuario
   * @param {string} password - Contraseña
   * @returns {Promise<Object>} Usuario y token
   */
  async login(username, password) {
    try {
      // Buscar el usuario
      const user = await User.findOne({
        where: {
          username
        }
      });

      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      // Verificar si el usuario está activo
      if (!user.isActive) {
        throw new Error('Usuario desactivado');
      }

      // Verificar la contraseña
      const isPasswordValid = await user.validatePassword(password);

      if (!isPasswordValid) {
        throw new Error('Credenciales inválidas');
      }

      // Generar el token JWT
      const token = this.generateToken(user);

      // Excluir la contraseña
      const userWithoutPassword = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      logger.error('Error al iniciar sesión:', error);
      throw error;
    }
  }

  /**
   * Obtener el perfil del usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} Datos del usuario
   */
  async getProfile(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      return user;
    } catch (error) {
      logger.error(`Error al obtener perfil de usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar la contraseña del usuario
   * @param {string} userId - ID del usuario
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<boolean>} Resultado de la operación
   */
  async updatePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar la contraseña actual
      const isPasswordValid = await user.validatePassword(currentPassword);

      if (!isPasswordValid) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Actualizar la contraseña
      await user.update({ password: newPassword });

      return true;
    } catch (error) {
      logger.error(`Error al actualizar contraseña de usuario ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Generar token JWT
   * @param {Object} user - Usuario
   * @returns {string} Token JWT
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  }
}

module.exports = new AuthService();