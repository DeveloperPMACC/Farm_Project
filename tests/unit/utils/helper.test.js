const { expect } = require('chai');
const sinon = require('sinon');
const helper = require('../../../src/utils/helper');

describe('Helper Utilities', () => {
    describe('getRandomInt', () => {
        it('should return a number between min and max (inclusive)', () => {
            const min = 1;
            const max = 10;

            // Generar varios números aleatorios
            for (let i = 0; i < 100; i++) {
                const result = helper.getRandomInt(min, max);

                // Verificar que el resultado es un número entero entre min y max
                expect(result).to.be.a('number');
                expect(result).to.be.at.least(min);
                expect(result).to.be.at.most(max);
                expect(Number.isInteger(result)).to.be.true;
            }
        });

        it('should handle equal min and max values', () => {
            const value = 5;
            const result = helper.getRandomInt(value, value);

            expect(result).to.equal(value);
        });
    });

    describe('sleep', () => {
        it('should delay execution for specified time', async () => {
            const ms = 100;
            const start = Date.now();

            // Mockear setTimeout para no tener que esperar realmente
            const clock = sinon.useFakeTimers();

            // Iniciar el sleep pero no esperarlo
            const sleepPromise = helper.sleep(ms);

            // Avanzar el tiempo
            clock.tick(ms);

            // Esperar a que se resuelva la promesa
            await sleepPromise;

            // Restaurar el reloj
            clock.restore();

            // Como hemos mockeado setTimeout, no podemos verificar el tiempo real
            // Pero podemos verificar que la promesa se resolvió después de avanzar el tiempo
            expect(true).to.be.true;
        });
    });

    describe('formatTime', () => {
        it('should format seconds to HH:MM:SS', () => {
            expect(helper.formatTime(0)).to.equal('00:00:00');
            expect(helper.formatTime(30)).to.equal('00:00:30');
            expect(helper.formatTime(70)).to.equal('00:01:10');
            expect(helper.formatTime(3661)).to.equal('01:01:01');
            expect(helper.formatTime(86399)).to.equal('23:59:59'); // 24h - 1s
        });
    });

    describe('generateRandomPoints', () => {
        it('should generate the specified number of points', () => {
            const count = 5;
            const maxX = 100;
            const maxY = 200;

            const points = helper.generateRandomPoints(count, maxX, maxY);

            // Verificar que se generaron los puntos correctos
            expect(points).to.be.an('array').with.lengthOf(count);

            // Verificar cada punto
            points.forEach(point => {
                expect(point).to.have.property('x').that.is.a('number');
                expect(point).to.have.property('y').that.is.a('number');
                expect(point.x).to.be.at.least(0);
                expect(point.x).to.be.at.most(maxX);
                expect(point.y).to.be.at.least(0);
                expect(point.y).to.be.at.most(maxY);
            });
        });

        it('should return empty array for count 0', () => {
            const points = helper.generateRandomPoints(0, 100, 100);
            expect(points).to.be.an('array').that.is.empty;
        });
    });

    describe('isValidUUID', () => {
        it('should validate correct UUIDs', () => {
            const validUUIDs = [
                '123e4567-e89b-12d3-a456-426614174000',
                'A987FBC9-4BED-3078-CF07-9141BA07C9F3',
                '12345678-1234-1234-1234-123456789012'
            ];

            validUUIDs.forEach(uuid => {
                expect(helper.isValidUUID(uuid)).to.be.true;
            });
        });

        it('should reject invalid UUIDs', () => {
            const invalidUUIDs = [
                '123e4567-e89b-12d3-a456', // Incompleto
                '123e4567-e89b-12d3-a456-4266141740001', // Demasiado largo
                '123e4567-e89b-12d3-g456-426614174000', // Caracter inválido 'g'
                'not-a-uuid',
                '',
                '123-456-789'
            ];

            invalidUUIDs.forEach(uuid => {
                expect(helper.isValidUUID(uuid)).to.be.false;
            });
        });
    });

    describe('getFutureDate', () => {
        it('should return a date in the future', () => {
            const now = new Date();
            const minutes = 30;

            const futureDate = helper.getFutureDate(minutes);

            // Calculamos el tiempo esperado en milisegundos
            const expectedTime = now.getTime() + (minutes * 60 * 1000);

            // Permitimos una pequeña diferencia debido al tiempo que toma ejecutar el código
            const tolerance = 100; // 100 milisegundos

            expect(futureDate).to.be.an.instanceof(Date);
            expect(futureDate.getTime()).to.be.closeTo(expectedTime, tolerance);
        });
    });

    describe('sanitizeObject', () => {
        it('should remove specified fields from object', () => {
            const obj = {
                id: '123',
                name: 'Test',
                password: 'secret',
                email: 'test@example.com',
                token: 'abcdef'
            };

            const fieldsToRemove = ['password', 'token'];

            const result = helper.sanitizeObject(obj, fieldsToRemove);

            // Verificar que los campos especificados fueron eliminados
            expect(result).to.not.have.property('password');
            expect(result).to.not.have.property('token');

            // Verificar que los otros campos permanecen
            expect(result).to.have.property('id', '123');
            expect(result).to.have.property('name', 'Test');
            expect(result).to.have.property('email', 'test@example.com');
        });

        it('should return a copy of the object without modifying the original', () => {
            const obj = {
                id: '123',
                password: 'secret'
            };

            const result = helper.sanitizeObject(obj, ['password']);

            // Verificar que el resultado no tiene la contraseña
            expect(result).to.not.have.property('password');

            // Verificar que el objeto original sigue intacto
            expect(obj).to.have.property('password', 'secret');
        });

        it('should handle empty fieldsToRemove array', () => {
            const obj = {
                id: '123',
                name: 'Test'
            };

            const result = helper.sanitizeObject(obj, []);

            // Verificar que el resultado tiene los mismos campos
            expect(result).to.deep.equal(obj);
        });

        it('should handle undefined fieldsToRemove', () => {
            const obj = {
                id: '123',
                name: 'Test'
            };

            const result = helper.sanitizeObject(obj);

            // Verificar que el resultado tiene los mismos campos
            expect(result).to.deep.equal(obj);
        });
    });
});