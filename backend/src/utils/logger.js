const fs = require('fs');
const path = require('path');

// Crear directorio de logs si no existe
const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

class Logger {
    constructor() {
        this.logFile = path.join(logsDir, `app-${new Date().toISOString().slice(0, 10)}.log`);
        this.errorFile = path.join(logsDir, `error-${new Date().toISOString().slice(0, 10)}.log`);
    }

    formatMessage(level, message, metadata = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...metadata
        };
        return JSON.stringify(logEntry) + '\n';
    }

    writeToFile(filename, content) {
        try {
            fs.appendFileSync(filename, content);
        } catch (error) {
            console.error('Error writing to log file:', error);
        }
    }

    info(message, metadata = {}) {
        const logEntry = this.formatMessage('INFO', message, metadata);
        console.log(`ℹ️  ${message}`);
        this.writeToFile(this.logFile, logEntry);
    }

    warn(message, metadata = {}) {
        const logEntry = this.formatMessage('WARN', message, metadata);
        console.warn(`⚠️  ${message}`);
        this.writeToFile(this.logFile, logEntry);
    }

    error(message, error = null, metadata = {}) {
        const errorMetadata = {
            ...metadata,
            ...(error && {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                }
            })
        };
        
        const logEntry = this.formatMessage('ERROR', message, errorMetadata);
        console.error(`❌ ${message}`, error);
        this.writeToFile(this.errorFile, logEntry);
        this.writeToFile(this.logFile, logEntry);
    }

    debug(message, metadata = {}) {
        if (process.env.NODE_ENV === 'development') {
            const logEntry = this.formatMessage('DEBUG', message, metadata);
            console.log(`🔍 ${message}`);
            this.writeToFile(this.logFile, logEntry);
        }
    }

    // Log específico para operaciones de BD
    dbOperation(operation, table, metadata = {}) {
        this.info(`DB Operation: ${operation} on ${table}`, {
            category: 'database',
            operation,
            table,
            ...metadata
        });
    }

    // Log específico para autenticación
    authEvent(event, user, metadata = {}) {
        this.info(`Auth Event: ${event}`, {
            category: 'authentication',
            event,
            user,
            ...metadata
        });
    }

    // Log específico para API requests
    apiRequest(method, url, statusCode, responseTime, user = null) {
        this.info(`API Request: ${method} ${url}`, {
            category: 'api',
            method,
            url,
            statusCode,
            responseTime,
            user
        });
    }

    // Limpiar logs antiguos (mantener últimos 30 días)
    cleanOldLogs() {
        try {
            const files = fs.readdirSync(logsDir);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            files.forEach(file => {
                const filePath = path.join(logsDir, file);
                const stats = fs.statSync(filePath);
                
                if (stats.mtime < thirtyDaysAgo) {
                    fs.unlinkSync(filePath);
                    this.info(`Deleted old log file: ${file}`);
                }
            });
        } catch (error) {
            this.error('Error cleaning old logs', error);
        }
    }
}

// Singleton instance
const logger = new Logger();

// Limpiar logs al iniciar (solo en producción)
if (process.env.NODE_ENV === 'production') {
    logger.cleanOldLogs();
}

module.exports = logger;