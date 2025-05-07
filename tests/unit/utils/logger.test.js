const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const config = require('../../../src/config');

// Necesitamos cargar el logger después de mockear las dependencias
let logger;

describe('Logger Utility', () => {
    // Restaurar los stubs después de cada prueba
    afterEach(() => {
        sinon.restore();
    });

    beforeEach(() => {
        // Mockear fs.existsSync y fs.mkdirSync
        sinon.stub(fs, 'existsSync').returns(true);
        sinon.stub(fs, 'mkdirSync');

        // Mockear winston
        sinon.stub(winston, 'createLogger').returns({
            add: sinon.stub(),
            info: sinon.stub(),
            error: sinon.stub(),
            warn: sinon.stub(),
            debug: sinon.stub()
        });

        // Limpiar la caché de módulos para recargar el logger
        delete require.cache[require.resolve('../../../src/utils/logger')];
        logger = require('../../../src/utils/logger');
    });

    it('should create a logger with proper configuration', () => {
        expect(winston.createLogger.calledOnce).to.be.true;
        const loggerConfig = winston.createLogger.firstCall.args[0];

        expect(loggerConfig).to.have.property('level', config.logging.level);
        expect(loggerConfig).to.have.property('format');
        expect(loggerConfig).to.have.property('transports').that.is.an('array');
        expect(loggerConfig.transports).to.have.lengthOf(2); // Un transporte para errores y otro para todos los logs
    });

    it('should create logs directory if it does not exist', () => {
        // Reconfiguramos fs.existsSync para simular que el directorio no existe
        fs.existsSync.restore();
        sinon.stub(fs, 'existsSync').returns(false);

        // Recargamos el logger
        delete require.cache[require.resolve('../../../src/utils/logger')];
        logger = require('../../../src/utils/logger');

        // Verificar que se intentó crear el directorio
        expect(fs.mkdirSync.calledOnce).to.be.true;
    });

    it('should add console transport in development environment', () => {
        // Simular entorno de desarrollo
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        // Recargamos el logger
        delete require.cache[require.resolve('../../../src/utils/logger')];
        logger = require('../../../src/utils/logger');

        // Restaurar el entorno original
        process.env.NODE_ENV = originalEnv;

        // Verificar que se agregó el transporte de consola
        expect(logger.add.calledOnce).to.be.true;
    });

    it('should not add console transport in production environment', () => {
        // Simular entorno de producción
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        // Recargamos el logger
        delete require.cache[require.resolve('../../../src/utils/logger')];
        logger = require('../../../src/utils/logger');

        // Restaurar el entorno original
        process.env.NODE_ENV = originalEnv;

        // Verificar que no se agregó el transporte de consola
        expect(logger.add.notCalled).to.be.true;
    });

    it('should expose logging methods', () => {
        expect(logger).to.have.property('info').that.is.a('function');
        expect(logger).to.have.property('error').that.is.a('function');
        expect(logger).to.have.property('warn').that.is.a('function');
        expect(logger).to.have.property('debug').that.is.a('function');
    });
});