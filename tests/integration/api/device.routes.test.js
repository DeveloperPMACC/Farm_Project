const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const app = require('../../../app');
const { Device } = require('../../../src/models');
const config = require('../../../src/config');

describe('Device API Routes', () => {
    let authToken;

    // Generar un token de autenticación para las pruebas
    before(() => {
        const user = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            username: 'testuser',
            role: 'admin'
        };

        authToken = jwt.sign(user, config.jwt.secret, { expiresIn: '1h' });
    });

    // Restaurar los stubs después de cada prueba
    afterEach(() => {
        sinon.restore();
    });

    describe('GET /api/devices', () => {
        it('should return all devices', async () => {
            // Mockear datos de dispositivos
            const mockDevices = [
                {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    name: 'Device 1',
                    serial: 'ABC123',
                    status: 'online',
                    lastConnection: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    installedApps: []
                },
                {
                    id: '223e4567-e89b-12d3-a456-426614174001',
                    name: 'Device 2',
                    serial: 'DEF456',
                    status: 'offline',
                    lastConnection: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    installedApps: []
                }
            ];

            // Mockear el método findAll de Device
            sinon.stub(Device, 'findAll').resolves(mockDevices);

            // Realizar la solicitud
            const response = await request(app)
                .get('/api/devices')
                .set('Authorization', `Bearer ${authToken}`);

            // Verificar la respuesta
            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('count', 2);
            expect(response.body).to.have.property('data').that.is.an('array').with.lengthOf(2);
            expect(response.body.data[0]).to.have.property('name', 'Device 1');
            expect(response.body.data[1]).to.have.property('name', 'Device 2');
        });

        it('should return 401 if no token is provided', async () => {
            // Realizar la solicitud sin token
            const response = await request(app)
                .get('/api/devices');

            // Verificar la respuesta
            expect(response.status).to.equal(401);
            expect(response.body).to.have.property('success', false);
        });
    });

    describe('GET /api/devices/:id', () => {
        it('should return a device by id', async () => {
            const deviceId = '123e4567-e89b-12d3-a456-426614174000';

            // Mockear datos del dispositivo
            const mockDevice = {
                id: deviceId,
                name: 'Test Device',
                serial: 'ABC123',
                status: 'online',
                lastConnection: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
                installedApps: []
            };

            // Mockear el método findByPk de Device
            sinon.stub(Device, 'findByPk').resolves(mockDevice);

            // Realizar la solicitud
            const response = await request(app)
                .get(`/api/devices/${deviceId}`)
                .set('Authorization', `Bearer ${authToken}`);

            // Verificar la respuesta
            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('data').that.is.an('object');
            expect(response.body.data).to.have.property('id', deviceId);
            expect(response.body.data).to.have.property('name', 'Test Device');
        });

        it('should return 404 if device not found', async () => {
            const deviceId = 'nonexistent-id';

            // Mockear el método findByPk de Device para devolver null
            sinon.stub(Device, 'findByPk').resolves(null);

            // Realizar la solicitud
            const response = await request(app)
                .get(`/api/devices/${deviceId}`)
                .set('Authorization', `Bearer ${authToken}`);

            // Verificar la respuesta
            expect(response.status).to.equal(404);
            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('message', 'Dispositivo no encontrado');
        });
    });

    describe('POST /api/devices', () => {
        it('should create a new device', async () => {
            // Datos para crear un dispositivo
            const deviceData = {
                name: 'New Device',
                serial: 'NEW123',
                status: 'offline'
            };

            // Mockear el dispositivo creado
            const createdDevice = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                ...deviceData,
                lastConnection: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Mockear el método create de Device
            sinon.stub(Device, 'create').resolves(createdDevice);

            // Realizar la solicitud
            const response = await request(app)
                .post('/api/devices')
                .set('Authorization', `Bearer ${authToken}`)
                .send(deviceData);

            // Verificar la respuesta
            expect(response.status).to.equal(201);
            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('data').that.is.an('object');
            expect(response.body.data).to.have.property('name', deviceData.name);
            expect(response.body.data).to.have.property('serial', deviceData.serial);
        });

        it('should return 400 for invalid data', async () => {
            // Datos incompletos para crear un dispositivo (falta serial)
            const invalidData = {
                name: 'Invalid Device'
            };

            // Realizar la solicitud
            const response = await request(app)
                .post('/api/devices')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData);

            // Verificar la respuesta
            expect(response.status).to.equal(400);
            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('errors').that.is.an('array');
            // Al menos un error debe estar relacionado con el campo serial
            expect(response.body.errors.some(err => err.param === 'serial')).to.be.true;
        });
    });

    describe('PUT /api/devices/:id', () => {
        it('should update an existing device', async () => {
            const deviceId = '123e4567-e89b-12d3-a456-426614174000';

            // Datos para actualizar el dispositivo
            const updateData = {
                name: 'Updated Device',
                status: 'online'
            };

            // Mockear el dispositivo existente
            const existingDevice = {
                id: deviceId,
                name: 'Old Device',
                serial: 'ABC123',
                status: 'offline',
                lastConnection: new Date(),
                update: sinon.stub().resolves({
                    id: deviceId,
                    name: updateData.name,
                    serial: 'ABC123',
                    status: updateData.status,
                    lastConnection: new Date(),
                    updatedAt: new Date()
                })
            };

            // Mockear el método findByPk de Device
            sinon.stub(Device, 'findByPk').resolves(existingDevice);

            // Realizar la solicitud
            const response = await request(app)
                .put(`/api/devices/${deviceId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            // Verificar la respuesta
            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('data').that.is.an('object');
            expect(response.body.data).to.have.property('name', updateData.name);
            expect(response.body.data).to.have.property('status', updateData.status);
        });

        it('should return 404 if device not found', async () => {
            const deviceId = 'nonexistent-id';

            // Datos para actualizar
            const updateData = {
                name: 'Updated Device'
            };

            // Mockear el método findByPk de Device para devolver null
            sinon.stub(Device, 'findByPk').resolves(null);

            // Realizar la solicitud
            const response = await request(app)
                .put(`/api/devices/${deviceId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            // Verificar la respuesta
            expect(response.status).to.equal(404);
            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('message', 'Dispositivo no encontrado');
        });
    });

    describe('DELETE /api/devices/:id', () => {
        it('should delete an existing device', async () => {
            const deviceId = '123e4567-e89b-12d3-a456-426614174000';

            // Mockear el dispositivo existente
            const existingDevice = {
                id: deviceId,
                name: 'Device to Delete',
                serial: 'DEL123',
                destroy: sinon.stub().resolves(true)
            };

            // Mockear el método findByPk de Device
            sinon.stub(Device, 'findByPk').resolves(existingDevice);

            // Realizar la solicitud
            const response = await request(app)
                .delete(`/api/devices/${deviceId}`)
                .set('Authorization', `Bearer ${authToken}`);

            // Verificar la respuesta
            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('message', 'Dispositivo eliminado exitosamente');
        });

        it('should return 404 if device not found', async () => {
            const deviceId = 'nonexistent-id';

            // Mockear el método findByPk de Device para devolver null
            sinon.stub(Device, 'findByPk').resolves(null);

            // Realizar la solicitud
            const response = await request(app)
                .delete(`/api/devices/${deviceId}`)
                .set('Authorization', `Bearer ${authToken}`);

            // Verificar la respuesta
            expect(response.status).to.equal(404);
            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('message', 'Dispositivo no encontrado');
        });

        it('should require admin role', async () => {
            const deviceId = '123e4567-e89b-12d3-a456-426614174000';

            // Generar un token de un usuario no administrador
            const userToken = jwt.sign(
                { id: '999', username: 'regularuser', role: 'user' },
                config.jwt.secret,
                { expiresIn: '1h' }
            );

            // Realizar la solicitud con el token de usuario no administrador
            const response = await request(app)
                .delete(`/api/devices/${deviceId}`)
                .set('Authorization', `Bearer ${userToken}`);

            // Verificar la respuesta
            expect(response.status).to.equal(403);
            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('message', 'Acceso denegado: se requiere rol de administrador');
        });
    });

    describe('POST /api/devices/:id/connect', () => {
        it('should connect to a device', async () => {
            const deviceId = '123e4567-e89b-12d3-a456-426614174000';

            // Mockear el dispositivo existente
            const deviceBefore = {
                id: deviceId,
                name: 'Test Device',
                serial: 'ABC123',
                status: 'offline',
                lastConnection: new Date(),
                update: sinon.stub().resolves({
                    id: deviceId,
                    name: 'Test Device',
                    serial: 'ABC123',
                    status: 'online',
                    lastConnection: new Date()
                })
            };

            // Mockear servicios necesarios
            sinon.stub(Device, 'findByPk').resolves(deviceBefore);

            // Mockear AdbService.connectDevice para simular conexión exitosa
            const adbService = require('../../../src/services/adb.service');
            sinon.stub(adbService, 'connectDevice').resolves(true);

            // Realizar la solicitud
            const response = await request(app)
                .post(`/api/devices/${deviceId}/connect`)
                .set('Authorization', `Bearer ${authToken}`);

            // Verificar la respuesta
            expect(response.status).to.equal(200);
            expect(response.body).to.have.property('success', true);
            expect(response.body).to.have.property('message', 'Dispositivo conectado exitosamente');
            expect(response.body).to.have.property('data').that.is.an('object');
            expect(response.body.data).to.have.property('connected', true);
        });

        it('should return 404 if device not found', async () => {
            const deviceId = 'nonexistent-id';

            // Mockear el método findByPk de Device para devolver null
            sinon.stub(Device, 'findByPk').resolves(null);

            // Realizar la solicitud
            const response = await request(app)
                .post(`/api/devices/${deviceId}/connect`)
                .set('Authorization', `Bearer ${authToken}`);

            // Verificar la respuesta
            expect(response.status).to.equal(404);
            expect(response.body).to.have.property('success', false);
            expect(response.body).to.have.property('message', 'Dispositivo no encontrado');
        });
    });
});