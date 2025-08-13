const sequelize = require('../config/database');
const { Patient, Admission } = require('../models');

// Health check básico
exports.healthCheck = async (req, res) => {
    try {
        const startTime = Date.now();
        
        // Verificar conexión a BD
        await sequelize.authenticate();
        
        // Verificar que las tablas principales respondan
        const patientCount = await Patient.count();
        const admissionCount = await Admission.count();
        
        const responseTime = Date.now() - startTime;
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            responseTime: `${responseTime}ms`,
            database: {
                status: 'connected',
                patients: patientCount,
                admissions: admissionCount
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
            },
            environment: process.env.NODE_ENV || 'development'
        });
        
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message,
            database: {
                status: 'disconnected'
            }
        });
    }
};

// Health check detallado para monitoreo
exports.detailedHealth = async (req, res) => {
    try {
        const startTime = Date.now();
        const results = {};
        
        // Test de BD
        try {
            await sequelize.authenticate();
            const [dbResult] = await sequelize.query('SELECT NOW() as current_time');
            results.database = {
                status: 'healthy',
                responseTime: Date.now() - startTime,
                currentTime: dbResult[0].current_time
            };
        } catch (dbError) {
            results.database = {
                status: 'unhealthy',
                error: dbError.message
            };
        }
        
        // Test de tablas críticas
        try {
            const activePatients = await Patient.count({
                include: [{
                    model: Admission,
                    as: 'admissions',
                    where: { status: 'active' },
                    required: true
                }]
            });
            
            results.criticalTables = {
                status: 'healthy',
                activePatients: activePatients
            };
        } catch (tableError) {
            results.criticalTables = {
                status: 'unhealthy',
                error: tableError.message
            };
        }
        
        // Métricas del sistema
        const memUsage = process.memoryUsage();
        results.system = {
            uptime: process.uptime(),
            memory: {
                rss: Math.round(memUsage.rss / 1024 / 1024),
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024)
            },
            cpu: process.cpuUsage()
        };
        
        // Determinar estado general
        const isHealthy = results.database.status === 'healthy' && 
                         results.criticalTables.status === 'healthy';
        
        const statusCode = isHealthy ? 200 : 503;
        
        res.status(statusCode).json({
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            totalResponseTime: `${Date.now() - startTime}ms`,
            checks: results
        });
        
    } catch (error) {
        console.error('Detailed health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
};