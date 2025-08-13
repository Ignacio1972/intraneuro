#!/usr/bin/env node
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = 7; // Mantener últimos 7 backups

// Crear directorio de backups si no existe
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function createBackup() {
    try {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const backupFile = path.join(BACKUP_DIR, `intraneuro_backup_${timestamp}.sql`);
        
        console.log(`🔄 Iniciando backup: ${backupFile}`);
        
        const pgDumpCommand = `export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH" && pg_dump -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} --no-password > "${backupFile}"`;
        
        return new Promise((resolve, reject) => {
            exec(pgDumpCommand, { 
                env: { 
                    ...process.env, 
                    PGPASSWORD: process.env.DB_PASS 
                } 
            }, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Error creando backup:', error);
                    reject(error);
                    return;
                }
                
                if (stderr) {
                    console.warn('⚠️ Warnings durante backup:', stderr);
                }
                
                console.log(`✅ Backup creado exitosamente: ${backupFile}`);
                
                // Verificar que el archivo se creó y tiene contenido
                if (fs.existsSync(backupFile) && fs.statSync(backupFile).size > 0) {
                    resolve(backupFile);
                } else {
                    reject(new Error('Backup file is empty or does not exist'));
                }
            });
        });
        
    } catch (error) {
        console.error('❌ Error en proceso de backup:', error);
        throw error;
    }
}

async function cleanOldBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(file => file.startsWith('intraneuro_backup_') && file.endsWith('.sql'))
            .map(file => ({
                name: file,
                path: path.join(BACKUP_DIR, file),
                time: fs.statSync(path.join(BACKUP_DIR, file)).mtime
            }))
            .sort((a, b) => b.time - a.time); // Más nuevos primero
        
        if (files.length > MAX_BACKUPS) {
            const filesToDelete = files.slice(MAX_BACKUPS);
            
            for (const file of filesToDelete) {
                fs.unlinkSync(file.path);
                console.log(`🗑️  Backup antiguo eliminado: ${file.name}`);
            }
        }
        
        console.log(`📁 Total de backups mantenidos: ${Math.min(files.length, MAX_BACKUPS)}`);
        
    } catch (error) {
        console.error('❌ Error limpiando backups antiguos:', error);
    }
}

async function getBackupInfo() {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(file => file.startsWith('intraneuro_backup_') && file.endsWith('.sql'))
            .map(file => {
                const filePath = path.join(BACKUP_DIR, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
                    created: stats.mtime.toISOString()
                };
            })
            .sort((a, b) => new Date(b.created) - new Date(a.created));
        
        return files;
    } catch (error) {
        console.error('❌ Error obteniendo info de backups:', error);
        return [];
    }
}

// Función principal
async function main() {
    try {
        console.log('🚀 Iniciando proceso de backup de INTRANEURO');
        
        // Crear backup
        const backupFile = await createBackup();
        
        // Limpiar backups antiguos
        await cleanOldBackups();
        
        // Mostrar información de backups
        const backups = await getBackupInfo();
        console.log('\n📋 Backups disponibles:');
        backups.forEach(backup => {
            console.log(`  - ${backup.name} (${backup.size}) - ${backup.created}`);
        });
        
        console.log('\n✅ Proceso de backup completado exitosamente');
        
    } catch (error) {
        console.error('❌ Error en proceso de backup:', error);
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = {
    createBackup,
    cleanOldBackups,
    getBackupInfo
};