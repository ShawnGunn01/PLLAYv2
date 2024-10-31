const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const logger = require('./logger');

class DatabaseBackup {
  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.retention = process.env.BACKUP_RETENTION_DAYS || 7;
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    const command = `PGPASSWORD=${process.env.DB_PASSWORD} pg_dump -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -F c -b -v -f ${filepath}`;

    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          logger.error('Backup failed:', error);
          reject(error);
          return;
        }
        logger.info(`Backup completed: ${filename}`);
        resolve(filepath);
      });
    });
  }

  async restore(filepath) {
    if (!fs.existsSync(filepath)) {
      throw new Error('Backup file not found');
    }

    const command = `PGPASSWORD=${process.env.DB_PASSWORD} pg_restore -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -c -v ${filepath}`;

    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          logger.error('Restore failed:', error);
          reject(error);
          return;
        }
        logger.info('Database restored successfully');
        resolve(true);
      });
    });
  }

  cleanup() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.retention);

    fs.readdir(this.backupDir, (err, files) => {
      if (err) {
        logger.error('Cleanup error:', err);
        return;
      }

      files.forEach(file => {
        const filepath = path.join(this.backupDir, file);
        const stats = fs.statSync(filepath);
        
        if (stats.mtime < cutoff) {
          fs.unlink(filepath, err => {
            if (err) {
              logger.error(`Failed to delete ${file}:`, err);
            } else {
              logger.info(`Deleted old backup: ${file}`);
            }
          });
        }
      });
    });
  }

  scheduleBackups(schedule = '0 0 * * *') { // Default: daily at midnight
    cron.schedule(schedule, async () => {
      try {
        await this.backup();
        this.cleanup();
      } catch (error) {
        logger.error('Scheduled backup failed:', error);
      }
    });
  }
}

module.exports = new DatabaseBackup();