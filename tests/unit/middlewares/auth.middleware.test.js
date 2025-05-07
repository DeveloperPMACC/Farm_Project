const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const { User } = require('../../../src/models');
const { authenticateJWT, isAdmin, checkUser } = require('../../../src/middlewares/auth.middleware');
const config = require('../../../src/config');

describe('Auth Middleware', () => {
    // Restaurar los stubs después de cada prueba
    afterEach(() => {
        sinon.restore();
    });

    describe('authenticateJWT', () => {
        it('should pass if token is valid', () => {
            // Mockear datos del token
            const user = {
                id: '123',
                username: 'testuser',
                role: 'admin'
            };

            // Mockear objetos de request y response
            const req = {
                headers: {
                    authorization: 'Bearer valid_token'
                }
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Mockear jwt.verify para devolver usuario decodificado
            sinon.stub(jwt, 'verify').callsFake((token, secret, callback) => {
                callback(null, user);
            });

            // Ejecutar middleware
            authenticateJWT(req, res, next);

            // Verificar resultados
            expect(req.user).to.deep.equal(user);
            expect(next.calledOnce).to.be.true;
            expect(res.status.notCalled).to.be.true;
            expect(res.json.notCalled).to.be.true;
        });

        it('should return 401 if no token is provided', () => {
            // Mockear objetos de request y response
            const req = {
                headers: {}
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Ejecutar middleware
            authenticateJWT(req, res, next);

            // Verificar resultados
            expect(res.status.calledWith(401)).to.be.true;
            expect(res.json.calledOnce).to.be.true;
            expect(res.json.firstCall.args[0]).to.have.property('success', false);
            expect(next.notCalled).to.be.true;
        });

        it('should return 401 if token format is invalid', () => {
            // Mockear objetos de request y response
            const req = {
                headers: {
                    authorization: 'InvalidFormat'
                }
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Ejecutar middleware
            authenticateJWT(req, res, next);

            // Verificar resultados
            expect(res.status.calledWith(401)).to.be.true;
            expect(res.json.calledOnce).to.be.true;
            expect(res.json.firstCall.args[0]).to.have.property('success', false);
            expect(next.notCalled).to.be.true;
        });

        it('should return 401 if token is expired', () => {
            // Mockear objetos de request y response
            const req = {
                headers: {
                    authorization: 'Bearer expired_token'
                }
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Mockear jwt.verify para simular token expirado
            const tokenError = new Error('Token expired');
            tokenError.name = 'TokenExpiredError';

            sinon.stub(jwt, 'verify').callsFake((token, secret, callback) => {
                callback(tokenError);
            });

            // Ejecutar middleware
            authenticateJWT(req, res, next);

            // Verificar resultados
            expect(res.status.calledWith(401)).to.be.true;
            expect(res.json.calledOnce).to.be.true;
            expect(res.json.firstCall.args[0]).to.have.property('success', false);
            expect(res.json.firstCall.args[0]).to.have.property('message', 'Token expirado');
            expect(next.notCalled).to.be.true;
        });

        it('should return 403 if token is invalid', () => {
            // Mockear objetos de request y response
            const req = {
                headers: {
                    authorization: 'Bearer invalid_token'
                }
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Mockear jwt.verify para simular token inválido
            sinon.stub(jwt, 'verify').callsFake((token, secret, callback) => {
                callback(new Error('Invalid token'));
            });

            // Ejecutar middleware
            authenticateJWT(req, res, next);

            // Verificar resultados
            expect(res.status.calledWith(403)).to.be.true;
            expect(res.json.calledOnce).to.be.true;
            expect(res.json.firstCall.args[0]).to.have.property('success', false);
            expect(res.json.firstCall.args[0]).to.have.property('message', 'Token inválido');
            expect(next.notCalled).to.be.true;
        });
    });

    describe('isAdmin', () => {
        it('should pass if user is admin', () => {
            // Mockear objetos de request y response
            const req = {
                user: {
                    id: '123',
                    username: 'admin',
                    role: 'admin'
                }
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Ejecutar middleware
            isAdmin(req, res, next);

            // Verificar resultados
            expect(next.calledOnce).to.be.true;
            expect(res.status.notCalled).to.be.true;
            expect(res.json.notCalled).to.be.true;
        });

        it('should return 403 if user is not admin', () => {
            // Mockear objetos de request y response
            const req = {
                user: {
                    id: '123',
                    username: 'regularuser',
                    role: 'user'
                }
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Ejecutar middleware
            isAdmin(req, res, next);

            // Verificar resultados
            expect(res.status.calledWith(403)).to.be.true;
            expect(res.json.calledOnce).to.be.true;
            expect(res.json.firstCall.args[0]).to.have.property('success', false);
            expect(res.json.firstCall.args[0]).to.have.property('message', 'Acceso denegado: se requiere rol de administrador');
            expect(next.notCalled).to.be.true;
        });

        it('should return 403 if user property is missing', () => {
            // Mockear objetos de request y response
            const req = {};

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Ejecutar middleware
            isAdmin(req, res, next);

            // Verificar resultados
            expect(res.status.calledWith(403)).to.be.true;
            expect(res.json.calledOnce).to.be.true;
            expect(next.notCalled).to.be.true;
        });
    });

    describe('checkUser', () => {
        it('should pass if user exists and is active', async () => {
            // Mockear objetos de request y response
            const userId = '123';
            const req = {
                user: {
                    id: userId
                }
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Mockear User.findByPk
            const user = {
                id: userId,
                username: 'testuser',
                isActive: true
            };

            sinon.stub(User, 'findByPk').resolves(user);

            // Ejecutar middleware
            await checkUser(req, res, next);

            // Verificar resultados
            expect(User.findByPk.calledWith(userId)).to.be.true;
            expect(next.calledOnce).to.be.true;
            expect(res.status.notCalled).to.be.true;
            expect(res.json.notCalled).to.be.true;
        });

        it('should return 404 if user not found', async () => {
            // Mockear objetos de request y response
            const userId = '123';
            const req = {
                user: {
                    id: userId
                }
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Mockear User.findByPk para devolver null
            sinon.stub(User, 'findByPk').resolves(null);

            // Ejecutar middleware
            await checkUser(req, res, next);

            // Verificar resultados
            expect(User.findByPk.calledWith(userId)).to.be.true;
            expect(res.status.calledWith(404)).to.be.true;
            expect(res.json.calledOnce).to.be.true;
            expect(res.json.firstCall.args[0]).to.have.property('success', false);
            expect(res.json.firstCall.args[0]).to.have.property('message', 'Usuario no encontrado');
            expect(next.notCalled).to.be.true;
        });

        it('should return 403 if user is inactive', async () => {
            // Mockear objetos de request y response
            const userId = '123';
            const req = {
                user: {
                    id: userId
                }
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Mockear User.findByPk para devolver usuario inactivo
            const user = {
                id: userId,
                username: 'testuser',
                isActive: false
            };

            sinon.stub(User, 'findByPk').resolves(user);

            // Ejecutar middleware
            await checkUser(req, res, next);

            // Verificar resultados
            expect(User.findByPk.calledWith(userId)).to.be.true;
            expect(res.status.calledWith(403)).to.be.true;
            expect(res.json.calledOnce).to.be.true;
            expect(res.json.firstCall.args[0]).to.have.property('success', false);
            expect(res.json.firstCall.args[0]).to.have.property('message', 'Usuario desactivado');
            expect(next.notCalled).to.be.true;
        });

        it('should handle database errors and return 500', async () => {
            // Mockear objetos de request y response
            const userId = '123';
            const req = {
                user: {
                    id: userId
                }
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Mockear User.findByPk para lanzar un error
            const error = new Error('Database error');
            sinon.stub(User, 'findByPk').rejects(error);

            // Ejecutar middleware
            await checkUser(req, res, next);

            // Verificar resultados
            expect(User.findByPk.calledWith(userId)).to.be.true;
            expect(res.status.calledWith(500)).to.be.true;
            expect(res.json.calledOnce).to.be.true;
            expect(res.json.firstCall.args[0]).to.have.property('success', false);
            expect(res.json.firstCall.args[0]).to.have.property('message', 'Error al verificar usuario');
            expect(next.notCalled).to.be.true;
        });
    });
});