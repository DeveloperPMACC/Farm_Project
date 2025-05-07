const { expect } = require('chai');
const sinon = require('sinon');
const { Device, App } = require('../../../src/models');
const DeviceService = require('../../../src/services/device.service');
const AdbService = require('../../../src/services/adb.service');

describe('DeviceService', () => {
    // Restaurar los stubs después de cada prueba
    afterEach(() => {
        sinon.restore();
    });

    describe('getAll', () => {
        it('should return all devices with installed apps', async () => {
            // Mockear el método findAll de Device
            const mockDevices = [
                {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    name: 'Test Device 1',
                    serial: 'ABC123',
                    status: 'online',
                    installedApps: [
                        { id: '123', name: 'App 1', packageName: 'com.test.app1' }
                    ]
                },
                {
                    id: '223e4567-e89b-12d3-a456-426614174001',
                    name: 'Test Device 2',
                    serial: 'DEF456',
                    status: 'offline',
                    installedApps: []
                }
            ];

            sinon.stub(Device, 'findAll').resolves(mockDevices);

            // Llamar al método a probar
            const result = await DeviceService.getAll();

            // Verificar resultados
            expect(result).to.deep.equal(mockDevices);
            expect(Device.findAll.calledOnce).to.be.true;
            expect(Device.findAll.firstCall.args[0]).to.have.property('include');
        });

        it('should handle errors and throw them', async () => {
            // Mockear el método findAll para lanzar un error
            const errorMessage = 'Database error';
            sinon.stub(Device, 'findAll').rejects(new Error(errorMessage));

            // Llamar al método y verificar que el error es propagado
            try {
                await DeviceService.getAll();
                // Si llegamos aquí, la prueba falla
                expect.fail('Expected an error to be thrown');
            } catch (error) {
                expect(error.message).to.equal(errorMessage);
            }
        });
    });

    describe('getById', () => {
        it('should return a device by id', async () => {
            const deviceId = '123e4567-e89b-12d3-a456-426614174000';
            const mockDevice = {
                id: deviceId,
                name: 'Test Device',
                serial: 'ABC123',
                status: 'online',
                installedApps: [
                    { id: '123', name: 'App 1', packageName: 'com.test.app1' }
                ]
            };

            // Mockear el método findByPk de Device
            sinon.stub(Device, 'findByPk').resolves(mockDevice);

            // Llamar al método a probar
            const result = await DeviceService.getById(deviceId);

            // Verificar resultados
            expect(result).to.deep.equal(mockDevice);
            expect(Device.findByPk.calledOnce).to.be.true;
            expect(Device.findByPk.firstCall.args[0]).to.equal(deviceId);
        });

        it('should return null if device not found', async () => {
            const deviceId = 'nonexistent-id';

            // Mockear el método findByPk para retornar null
            sinon.stub(Device, 'findByPk').resolves(null);

            // Llamar al método a probar
            const result = await DeviceService.getById(deviceId);

            // Verificar resultados
            expect(result).to.be.null;
            expect(Device.findByPk.calledOnce).to.be.true;
        });

        it('should handle errors and throw them', async () => {
            const deviceId = '123e4567-e89b-12d3-a456-426614174000';
            const errorMessage = 'Database error';

            // Mockear el método findByPk para lanzar un error
            sinon.stub(Device, 'findByPk').rejects(new Error(errorMessage));

            // Llamar al método y verificar que el error es propagado
            try {
                await DeviceService.getById(deviceId);
                // Si llegamos aquí, la prueba falla
                expect.fail('Expected an error to be thrown');
            } catch (error) {
                expect(error.message).to.equal(errorMessage);
            }
        });
    });

    describe('create', () => {
        it('should create a new device', async () => {
            const deviceData = {
                name: 'New Device',
                serial: 'NEW123',
                status: 'offline'
            };

            const createdDevice = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                ...deviceData,
                lastConnection: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Mockear el método create de Device
            sinon.stub(Device, 'create').resolves(createdDevice);

            // Llamar al método a probar
            const result = await DeviceService.create(deviceData);

            // Verificar resultados
            expect(result).to.deep.equal(createdDevice);
            expect(Device.create.calledOnce).to.be.true;
            expect(Device.create.firstCall.args[0]).to.deep.equal(deviceData);
        });

        it('should handle errors and throw them', async () => {
            const deviceData = {
                name: 'New Device',
                serial: 'NEW123',
                status: 'offline'
            };

            const errorMessage = 'Validation error';

            // Mockear el método create para lanzar un error
            sinon.stub(Device, 'create').rejects(new Error(errorMessage));

            // Llamar al método y verificar que el error es propagado
            try {
                await DeviceService.create(deviceData);
                expect.fail('Expected an error to be thrown');
            } catch (error) {
                expect(error.message).to.equal(errorMessage);
            }
        });
    });

    describe('update', () => {
        it('should update an existing device', async () => {
            const deviceId = '123e4567-e89b-12d3-a456-426614174000';
            const deviceData = {
                name: 'Updated Device',
                status: 'online'
            };

            const existingDevice = {
                id: deviceId,
                name: 'Old Device',
                serial: 'ABC123',
                status: 'offline',
                update: sinon.stub().resolves({
                    id: deviceId,
                    name: deviceData.name,
                    serial: 'ABC123',
                    status: deviceData.status
                })
            };

            // Mockear el método findByPk de Device
            sinon.stub(Device, 'findByPk').resolves(existingDevice);

            // Llamar al método a probar
            const result = await DeviceService.update(deviceId, deviceData);

            // Verificar resultados
            expect(Device.findByPk.calledOnce).to.be.true;
            expect(existingDevice.update.calledOnce).to.be.true;
            expect(existingDevice.update.firstCall.args[0]).to.deep.equal(deviceData);
            expect(result).to.have.property('name', deviceData.name);
            expect(result).to.have.property('status', deviceData.status);
        });

        it('should throw error if device not found', async () => {
            const deviceId = 'nonexistent-id';
            const deviceData = {
                name: 'Updated Device'
            };

            // Mockear el método findByPk para retornar null
            sinon.stub(Device, 'findByPk').resolves(null);

            // Llamar al método y verificar que el error es lanzado
            try {
                await DeviceService.update(deviceId, deviceData);
                expect.fail('Expected an error to be thrown');
            } catch (error) {
                expect(error.message).to.equal('Dispositivo no encontrado');
            }
        });

        it('should handle database errors', async () => {
            const deviceId = '123e4567-e89b-12d3-a456-426614174000';
            const deviceData = {
                name: 'Updated Device'
            };
            const errorMessage = 'Database error';

            // Mockear el método findByPk para lanzar un error
            sinon.stub(Device, 'findByPk').rejects(new Error(errorMessage));

            // Llamar al método y verificar que el error es propagado
            try {
                await DeviceService.update(deviceId, deviceData);
                expect.fail('Expected an error to be thrown');
            } catch (error) {
                expect(error.message).to.equal(errorMessage);
            }
        });
    });

    describe('delete', () => {
        it('should delete an existing device', async () => {
            const deviceId = '123e4567-e89b-12d3-a456-426614174000';

            const existingDevice = {
                id: deviceId,
                name: 'Device to Delete',
                serial: 'DEL123',
                destroy: sinon.stub().resolves(true)
            };

            // Mockear el método findByPk de Device
            sinon.stub(Device, 'findByPk').resolves(existingDevice);

            // Llamar al método a probar
            const result = await DeviceService.delete(deviceId);

            // Verificar resultados
            expect(Device.findByPk.calledOnce).to.be.true;
            expect(existingDevice.destroy.calledOnce).to.be.true;
            expect(result).to.have.property('success', true);
        });

        it('should throw error if device not found', async () => {
            const deviceId = 'nonexistent-id';

            // Mockear el método findByPk para retornar null
            sinon.stub(Device, 'findByPk').resolves(null);

            // Llamar al método y verificar que el error es lanzado
            try {
                await DeviceService.delete(deviceId);
                expect.fail('Expected an error to be thrown');
            } catch (error) {
                expect(error.message).to.equal('Dispositivo no encontrado');
            }
        });

        it('should handle database errors', async () => {
            const deviceId = '123e4567-e89b-12d3-a456-426614174000';
            const errorMessage = 'Database error';

            // Mockear el método findByPk para lanzar un error
            sinon.stub(Device, 'findByPk').rejects(new Error(errorMessage));

            // Llamar al método y verificar que el error es propagado
            try {
                await DeviceService.delete(deviceId);
                expect.fail('Expected an error to be thrown');
            } catch (error) {
                expect(error.message).to.equal(errorMessage);
            }
        });
    });

    describe('connect', () => {
        it('should connect to a device successfully', async () => {
            const deviceId = '123e4567-e89b-12d3-a456-426614174000';

            const device = {
                id: deviceId,
                name: 'Test Device',
                serial: 'TEST123',
                status: 'offline',
                update: sinon.stub().resolves({
                    id: deviceId,
                    name: 'Test Device',
                    serial: 'TEST123',
                    status: 'online',
                    lastConnection: new Date()
                })
            };

            // Mockear los métodos necesarios
            sinon.stub(Device, 'findByPk').resolves(device);
            sinon.stub(AdbService, 'connectDevice').resolves(true);

            // Llamar al método a probar
            const result = await DeviceService.connect(deviceId);

            // Verificar resultados
            expect(Device.findByPk.calledOnce).to.be.true;
            expect(AdbService.connectDevice.calledOnce).to.be.true;
            expect(AdbService.connectDevice.firstCall.args[0]).to.equal(device.serial);
            expect(device.update.calledOnce).to.be.true;
            expect(result).to.have.property('connected', true);
            expect(result).to.have.property('device');
        });

        it('should handle connection failure', async () => {
            const deviceId = '123e4567-e89b-12d3-a456-426614174000';

            const device = {
                id: deviceId,
                name: 'Test Device',
                serial: 'TEST123',
                status: 'offline'
            };

            // Mockear los métodos necesarios
            sinon.stub(Device, 'findByPk').resolves(device);
            sinon.stub(AdbService, 'connectDevice').resolves(false);

            // Llamar al método a probar
            const result = await DeviceService.connect(deviceId);

            // Verificar resultados
            expect(Device.findByPk.calledOnce).to.be.true;
            expect(AdbService.connectDevice.calledOnce).to.be.true;
            expect(result).to.have.property('connected', false);
            expect(result).to.have.property('message', 'No se pudo conectar al dispositivo');
        });

        it('should throw error if device not found', async () => {
            const deviceId = 'nonexistent-id';

            // Mockear el método findByPk para retornar null
            sinon.stub(Device, 'findByPk').resolves(null);

            // Llamar al método y verificar que el error es lanzado
            try {
                await DeviceService.connect(deviceId);
                expect.fail('Expected an error to be thrown');
            } catch (error) {
                expect(error.message).to.equal('Dispositivo no encontrado');
            }
        });
    });
});