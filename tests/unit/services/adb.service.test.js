const { expect } = require('chai');
const sinon = require('sinon');
const { EventEmitter } = require('events');
const AdbService = require('../../../src/services/adb.service');
const adb = require('adbkit');
const { spawn } = require('child_process');

describe('AdbService', () => {
    // Restaurar los stubs después de cada prueba
    afterEach(() => {
        sinon.restore();
    });

    describe('startServer', () => {
        it('should start ADB server successfully', async () => {
            // Crear un mock para el proceso de spawn
            const mockProcess = new EventEmitter();
            mockProcess.stdout = new EventEmitter();
            mockProcess.stderr = new EventEmitter();

            // Mockear la función spawn para retornar el proceso mock
            const spawnStub = sinon.stub(require('child_process'), 'spawn').returns(mockProcess);

            // Crear una promesa que se resolverá cuando llamemos al método
            const startPromise = AdbService.startServer();

            // Emitir un evento de cierre exitoso
            mockProcess.emit('close', 0);

            // Esperar a que se resuelva la promesa
            const result = await startPromise;

            // Verificar resultados
            expect(result).to.be.true;
            expect(spawnStub.calledOnce).to.be.true;
            expect(spawnStub.firstCall.args[1]).to.deep.equal(['start-server']);
        });

        it('should handle ADB server start failure', async () => {
            // Crear un mock para el proceso de spawn
            const mockProcess = new EventEmitter();
            mockProcess.stdout = new EventEmitter();
            mockProcess.stderr = new EventEmitter();

            // Mockear la función spawn para retornar el proceso mock
            const spawnStub = sinon.stub(require('child_process'), 'spawn').returns(mockProcess);

            // Crear una promesa que se resolverá cuando llamemos al método
            const startPromise = AdbService.startServer();

            // Emitir un evento de cierre con error
            mockProcess.emit('close', 1);

            // Esperar a que se resuelva la promesa
            const result = await startPromise;

            // Verificar resultados
            expect(result).to.be.false;
            expect(spawnStub.calledOnce).to.be.true;
        });

        it('should handle spawn errors', async () => {
            // Crear un mock para el proceso de spawn
            const mockProcess = new EventEmitter();
            mockProcess.stdout = new EventEmitter();
            mockProcess.stderr = new EventEmitter();

            // Mockear la función spawn para retornar el proceso mock
            const spawnStub = sinon.stub(require('child_process'), 'spawn').returns(mockProcess);

            // Crear una promesa que se resolverá cuando llamemos al método
            const startPromise = AdbService.startServer();

            // Emitir un evento de error
            mockProcess.emit('error', new Error('Spawn error'));

            // Verificar que la promesa es rechazada
            try {
                await startPromise;
                expect.fail('Expected an error to be thrown');
            } catch (error) {
                expect(error.message).to.equal('Spawn error');
            }
        });
    });

    describe('listDevices', () => {
        it('should list connected devices', async () => {
            // Mockear la lista de dispositivos
            const mockDevices = [
                { id: 'ABC123', type: 'device' },
                { id: 'DEF456', type: 'device' }
            ];

            // Mockear el cliente ADB
            const clientStub = {
                listDevices: sinon.stub().resolves(mockDevices)
            };

            // Mockear la creación del cliente
            sinon.stub(adb, 'createClient').returns(clientStub);

            // Reemplazar el cliente en el servicio (puedes necesitar modificar tu implementación para esto)
            AdbService.client = clientStub;

            // Llamar al método a probar
            const result = await AdbService.listDevices();

            // Verificar resultados
            expect(result).to.deep.equal(mockDevices);
            expect(clientStub.listDevices.calledOnce).to.be.true;
        });

        it('should handle errors when listing devices', async () => {
            const errorMessage = 'ADB error';

            // Mockear el cliente ADB
            const clientStub = {
                listDevices: sinon.stub().rejects(new Error(errorMessage))
            };

            // Mockear la creación del cliente
            sinon.stub(adb, 'createClient').returns(clientStub);

            // Reemplazar el cliente en el servicio
            AdbService.client = clientStub;

            // Llamar al método y verificar que el error es propagado
            try {
                await AdbService.listDevices();
                expect.fail('Expected an error to be thrown');
            } catch (error) {
                expect(error.message).to.equal(errorMessage);
            }
        });
    });

    describe('connectDevice', () => {
        it('should connect to IP device successfully', async () => {
            const deviceIp = '192.168.1.100:5555';

            // Mockear el cliente ADB
            const clientStub = {
                connect: sinon.stub().resolves(true),
                listDevices: sinon.stub().resolves([])
            };

            // Mockear la creación del cliente
            sinon.stub(adb, 'createClient').returns(clientStub);

            // Reemplazar el cliente en el servicio
            AdbService.client = clientStub;

            // Llamar al método a probar
            const result = await AdbService.connectDevice(deviceIp);

            // Verificar resultados
            expect(result).to.be.true;
            expect(clientStub.connect.calledOnce).to.be.true;
            expect(clientStub.connect.firstCall.args[0]).to.equal(deviceIp);
        });

        it('should detect already connected device', async () => {
            const deviceSerial = 'ABC123';

            // Mockear el cliente ADB con un dispositivo ya conectado
            const clientStub = {
                listDevices: sinon.stub().resolves([
                    { id: deviceSerial, type: 'device' }
                ])
            };

            // Mockear la creación del cliente
            sinon.stub(adb, 'createClient').returns(clientStub);

            // Reemplazar el cliente en el servicio
            AdbService.client = clientStub;

            // Llamar al método a probar
            const result = await AdbService.connectDevice(deviceSerial);

            // Verificar resultados
            expect(result).to.be.true;
            expect(clientStub.listDevices.calledOnce).to.be.true;
        });

        it('should handle connection errors', async () => {
            const deviceIp = '192.168.1.100:5555';
            const errorMessage = 'Connection error';

            // Mockear el cliente ADB
            const clientStub = {
                connect: sinon.stub().rejects(new Error(errorMessage)),
                listDevices: sinon.stub().resolves([])
            };

            // Mockear la creación del cliente
            sinon.stub(adb, 'createClient').returns(clientStub);

            // Reemplazar el cliente en el servicio
            AdbService.client = clientStub;

            // Llamar al método a probar
            const result = await AdbService.connectDevice(deviceIp);

            // Verificar resultados
            expect(result).to.be.false;
        });
    });

    describe('startApp', () => {
        it('should start an app on a device', async () => {
            const deviceSerial = 'ABC123';
            const packageName = 'com.test.app';

            // Mockear el cliente ADB
            const clientStub = {
                shell: sinon.stub().resolves('Starting: Intent { act=android.intent.action.MAIN }')
            };

            // Mockear la creación del cliente
            sinon.stub(adb, 'createClient').returns(clientStub);

            // Reemplazar el cliente en el servicio
            AdbService.client = clientStub;

            // Llamar al método a probar
            const result = await AdbService.startApp(deviceSerial, packageName);

            // Verificar resultados
            expect(result).to.be.true;
            expect(clientStub.shell.calledOnce).to.be.true;
            expect(clientStub.shell.firstCall.args[0]).to.equal(deviceSerial);
            expect(clientStub.shell.firstCall.args[1]).to.include(packageName);
        });

        it('should handle errors when starting an app', async () => {
            const deviceSerial = 'ABC123';
            const packageName = 'com.test.app';
            const errorMessage = 'Shell command error';

            // Mockear el cliente ADB
            const clientStub = {
                shell: sinon.stub().rejects(new Error(errorMessage))
            };

            // Mockear la creación del cliente
            sinon.stub(adb, 'createClient').returns(clientStub);

            // Reemplazar el cliente en el servicio
            AdbService.client = clientStub;

            // Llamar al método a probar
            const result = await AdbService.startApp(deviceSerial, packageName);

            // Verificar resultados
            expect(result).to.be.false;
        });
    });

    // Agregar más pruebas para otros métodos (stopApp, tap, swipe, screenshot, etc.)
});