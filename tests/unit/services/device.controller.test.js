const { expect } = require('chai');
const sinon = require('sinon');
const DeviceController = require('../../../src/controllers/device.controller');
const DeviceService = require('../../../src/services/device.service');

describe('DeviceController', () => {
    // Restaurar los stubs después de cada prueba
    afterEach(() => {
        sinon.restore();
    });

    describe('getAllDevices', () => {
        it('should get all devices and return 200 status', async () => {
            // Mockear objetos req y res
            const req = {};
            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };
            const next = sinon.stub();

            // Mockear datos de dispositivos
            const mockDevices = [
                { id: '1', name: 'Device 1' },
                { id: '2', name: 'Device 2' }
            ];

            // Mockear el servicio
            sinon.stub(DeviceService, 'getAll').resolves(mockDevices);

            // Llamar al método del controlador
            await DeviceController.getAllDevices(req, res, next);

            // Verificar resultados
            expect(DeviceService.getAll.calledOnce).to.be.true;
            expect(res.status.calledWith(200)).to.be.true;
            expect(res.json.calledWith({
                success: true,
                count: mockDevices.length,
                data: mockDevices
            })).to.be.true;
            expect(next.notCalled).to.be.true;
        });

        it('should handle errors and call next middleware', async () => {
            // Mockear objetos req y res
            const req = {};
            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };
            const next = sinon.stub();

            // Mockear el servicio para que lance un error
            const error = new Error('Database error');
            sinon.stub(DeviceService, 'getAll').rejects(error);

            // Llamar al método del controlador
            await DeviceController.getAllDevices(req, res, next);

            // Verificar resultados
            expect(DeviceService.getAll.calledOnce).to.be.true;
            expect(res.status.notCalled).to.be.true;
            expect(res.json.notCalled).to.be.true;
            expect(next.calledWith(error)).to.be.true;
        });
    });

    describe('getDeviceById', () => {
        it('should get a device by id and return 200 status', async () => {
            // Mockear objetos req y res
            const req = {
                params: { id: '123' }
            };
            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };
            const next = sinon.stub();

            // Mockear datos del dispositivo
            const mockDevice = { id: '123', name: 'Test Device' };

            // Mockear el servicio
            sinon.stub(DeviceService, 'getById').resolves(mockDevice);

            // Llamar al método del controlador
            await DeviceController.getDeviceById(req, res, next);

            // Verificar resultados
            expect(DeviceService.getById.calledWith('123')).to.be.true;
            expect(res.status.calledWith(200)).to.be.true;
            expect(res.json.calledWith({
                success: true,
                data: mockDevice
            })).to.be.true;
            expect(next.notCalled).to.be.true;
        });

        it('should return 404 if device not found', async () => {
            // Mockear objetos req y res
            const req = {
                params: { id: 'nonexistent' }
            };
            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };
            const next = sinon.stub();

            // Mockear el servicio
            sinon.stub(DeviceService, 'getById').resolves(null);

            // Llamar al método del controlador
            await DeviceController.getDeviceById(req, res, next);

            // Verificar resultados
            expect(DeviceService.getById.calledWith('nonexistent')).to.be.true;
            expect(res.status.calledWith(404)).to.be.true;
            expect(res.json.calledWith({
                success: false,
                message: 'Dispositivo no encontrado'
            })).to.be.true;
            expect(next.notCalled).to.be.true;
        });

        it('should handle errors and call next middleware', async () => {
            // Mockear objetos req y res
            const req = {
                params: { id: '123' }
            };
            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };
            const next = sinon.stub();

            // Mockear el servicio para que lance un error
            const error = new Error('Database error');
            sinon.stub(DeviceService, 'getById').rejects(error);

            // Llamar al método del controlador
            await DeviceController.getDeviceById(req, res, next);

            // Verificar resultados
            expect(DeviceService.getById.calledWith('123')).to.be.true;
            expect(res.status.notCalled).to.be.true;
            expect(res.json.notCalled).to.be.true;
            expect(next.calledWith(error)).to.be.true;
        });
    });

    describe('createDevice', () => {
        it('should create a device and return 201 status', async () => {
            // Mockear objetos req y res
            const deviceData = {
                name: 'New Device',
                serial: 'NEW123'
            };

            const req = {
                body: deviceData
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Mockear validationResult para que no haya errores
            const validationResult = {
                isEmpty: sinon.stub().returns(true),
                array: sinon.stub().returns([])
            };
            sinon.stub(require('express-validator'), 'validationResult').returns(validationResult);

            // Mockear datos del dispositivo creado
            const createdDevice = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                ...deviceData,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Mockear el servicio
            sinon.stub(DeviceService, 'create').resolves(createdDevice);

            // Llamar al método del controlador
            await DeviceController.createDevice(req, res, next);

            // Verificar resultados
            expect(DeviceService.create.calledWith(deviceData)).to.be.true;
            expect(res.status.calledWith(201)).to.be.true;
            expect(res.json.calledWith({
                success: true,
                data: createdDevice
            })).to.be.true;
            expect(next.notCalled).to.be.true;
        });

        it('should return 400 on validation error', async () => {
            // Mockear objetos req y res
            const req = {
                body: { name: 'Invalid Device' } // Falta campo serial
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Mockear validationResult para que tenga errores
            const validationErrors = [
                { param: 'serial', msg: 'El número de serie es requerido' }
            ];

            const validationResult = {
                isEmpty: sinon.stub().returns(false),
                array: sinon.stub().returns(validationErrors)
            };

            sinon.stub(require('express-validator'), 'validationResult').returns(validationResult);

            // Llamar al método del controlador
            await DeviceController.createDevice(req, res, next);

            // Verificar resultados
            expect(res.status.calledWith(400)).to.be.true;
            expect(res.json.calledWith({
                success: false,
                errors: validationErrors
            })).to.be.true;
            expect(next.notCalled).to.be.true;
        });

        it('should handle service errors and call next middleware', async () => {
            // Mockear objetos req y res
            const deviceData = {
                name: 'New Device',
                serial: 'NEW123'
            };

            const req = {
                body: deviceData
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Mockear validationResult para que no haya errores
            const validationResult = {
                isEmpty: sinon.stub().returns(true),
                array: sinon.stub().returns([])
            };

            sinon.stub(require('express-validator'), 'validationResult').returns(validationResult);

            // Mockear el servicio para que lance un error
            const error = new Error('Database error');
            sinon.stub(DeviceService, 'create').rejects(error);

            // Llamar al método del controlador
            await DeviceController.createDevice(req, res, next);

            // Verificar resultados
            expect(next.calledWith(error)).to.be.true;
        });
    });

    describe('updateDevice', () => {
        it('should update a device and return 200 status', async () => {
            // Mockear objetos req y res
            const deviceId = '123';
            const deviceData = {
                name: 'Updated Device'
            };

            const req = {
                params: { id: deviceId },
                body: deviceData
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Mockear validationResult para que no haya errores
            const validationResult = {
                isEmpty: sinon.stub().returns(true),
                array: sinon.stub().returns([])
            };

            sinon.stub(require('express-validator'), 'validationResult').returns(validationResult);

            // Mockear datos del dispositivo actualizado
            const updatedDevice = {
                id: deviceId,
                name: deviceData.name,
                serial: 'OLD123',
                status: 'online',
                updatedAt: new Date()
            };

            // Mockear el servicio
            sinon.stub(DeviceService, 'update').resolves(updatedDevice);

            // Llamar al método del controlador
            await DeviceController.updateDevice(req, res, next);

            // Verificar resultados
            expect(DeviceService.update.calledWith(deviceId, deviceData)).to.be.true;
            expect(res.status.calledWith(200)).to.be.true;
            expect(res.json.calledWith({
                success: true,
                data: updatedDevice
            })).to.be.true;
            expect(next.notCalled).to.be.true;
        });

        it('should handle service errors and call next middleware', async () => {
            // Mockear objetos req y res
            const deviceId = '123';
            const deviceData = {
                name: 'Updated Device'
            };

            const req = {
                params: { id: deviceId },
                body: deviceData
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Mockear validationResult para que no haya errores
            const validationResult = {
                isEmpty: sinon.stub().returns(true),
                array: sinon.stub().returns([])
            };

            sinon.stub(require('express-validator'), 'validationResult').returns(validationResult);

            // Mockear el servicio para que lance un error
            const error = new Error('Device not found');
            sinon.stub(DeviceService, 'update').rejects(error);

            // Llamar al método del controlador
            await DeviceController.updateDevice(req, res, next);

            // Verificar resultados
            expect(next.calledWith(error)).to.be.true;
        });
    });

    describe('deleteDevice', () => {
        it('should delete a device and return 200 status', async () => {
            // Mockear objetos req y res
            const deviceId = '123';

            const req = {
                params: { id: deviceId }
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Mockear respuesta del servicio
            const serviceResponse = { success: true };
            sinon.stub(DeviceService, 'delete').resolves(serviceResponse);

            // Llamar al método del controlador
            await DeviceController.deleteDevice(req, res, next);

            // Verificar resultados
            expect(DeviceService.delete.calledWith(deviceId)).to.be.true;
            expect(res.status.calledWith(200)).to.be.true;
            expect(res.json.calledWith({
                success: true,
                message: 'Dispositivo eliminado exitosamente'
            })).to.be.true;
            expect(next.notCalled).to.be.true;
        });

        it('should handle service errors and call next middleware', async () => {
            // Mockear objetos req y res
            const deviceId = '123';

            const req = {
                params: { id: deviceId }
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Mockear el servicio para que lance un error
            const error = new Error('Device not found');
            sinon.stub(DeviceService, 'delete').rejects(error);

            // Llamar al método del controlador
            await DeviceController.deleteDevice(req, res, next);

            // Verificar resultados
            expect(next.calledWith(error)).to.be.true;
        });
    });

    describe('connectDevice', () => {
        it('should connect a device and return 200 status', async () => {
            // Mockear objetos req y res
            const deviceId = '123';

            const req = {
                params: { id: deviceId }
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Mockear respuesta del servicio
            const serviceResponse = {
                connected: true,
                device: { id: deviceId, name: 'Test Device', status: 'online' }
            };

            sinon.stub(DeviceService, 'connect').resolves(serviceResponse);

            // Llamar al método del controlador
            await DeviceController.connectDevice(req, res, next);

            // Verificar resultados
            expect(DeviceService.connect.calledWith(deviceId)).to.be.true;
            expect(res.status.calledWith(200)).to.be.true;
            expect(res.json.calledWith({
                success: true,
                message: 'Dispositivo conectado exitosamente',
                data: serviceResponse
            })).to.be.true;
            expect(next.notCalled).to.be.true;
        });

        it('should handle service errors and call next middleware', async () => {
            // Mockear objetos req y res
            const deviceId = '123';

            const req = {
                params: { id: deviceId }
            };

            const res = {
                status: sinon.stub().returnsThis(),
                json: sinon.stub()
            };

            const next = sinon.stub();

            // Mockear el servicio para que lance un error
            const error = new Error('Connection error');
            sinon.stub(DeviceService, 'connect').rejects(error);

            // Llamar al método del controlador
            await DeviceController.connectDevice(req, res, next);

            // Verificar resultados
            expect(next.calledWith(error)).to.be.true;
        });
    });
});