import { getDB } from '../../db/connection';
import { syncLogs, businesses, dataSources } from '../../db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { ALL_STATE_CONFIGS } from '../config';
import { StateConfig } from '../types';

// Add proper type definitions
interface CategoryCount {
  category: string;
  count: number;
}

interface StateCount {
  state: string;
  count: number;
}

interface TierCount {
  tier: number;
  count: number;
}

interface LogRow {
  id: number;
  dataSourceId: number;
  status: string;
  recordsProcessed: number;
  recordsAdded: number;
  recordsUpdated: number;
  recordsFailed: number;
  errorMessage: string | null;
  duration: number | null;
  createdAt: string;
}

// Log levels
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// Log entry interface
interface LogEntry {
  id?: number;
  timestamp: Date;
  level: LogLevel;
  source: string;
  message: string;
  metadata?: Record<string, any>;
  duration?: number;
  success?: boolean;
}

// Scraping metrics interface
interface ScrapingMetrics {
  totalBusinesses: number;
  successfulBusinesses: number;
  failedBusinesses: number;
  averageDataQuality: number;
  businessesByCategory: Record<string, number>;
  businessesByState: Record<string, number>;
  businessesByTier: Record<number, number>;
  scrapingRate: number; // businesses per minute
  errorRate: number; // percentage
  lastUpdated: Date;
}

class MonitoringService {
  private db: any;
  private logBuffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds

  constructor() {
    this.db = getDB();
    this.startFlushInterval();
  }

  // Log a message with specified level
  log(level: LogLevel, source: string, message: string, metadata?: Record<string, any>, duration?: number): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      source,
      message,
      metadata,
      duration
    };

    // Add to buffer
    this.logBuffer.push(logEntry);

    // Also log to console for development
    this.logToConsole(logEntry);

    // Flush if buffer is getting large
    if (this.logBuffer.length >= 100) {
      this.flushLogs();
    }
  }

  // Convenience methods for different log levels
  debug(source: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, source, message, metadata);
  }

  info(source: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, source, message, metadata);
  }

  warn(source: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, source, message, metadata);
  }

  error(source: string, message: string, metadata?: Record<string, any>, duration?: number): void {
    this.log(LogLevel.ERROR, source, message, metadata, duration);
  }

  // Log to console with appropriate formatting
  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.source}]`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.metadata || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.metadata || '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.metadata || '');
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.metadata || '');
        break;
    }
  }

  // Start periodic flushing of logs
  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flushLogs();
    }, this.FLUSH_INTERVAL) as unknown as NodeJS.Timeout;
  }

  // Flush buffered logs to database
  async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Get or create a data source for monitoring logs
      let dataSource = await this.db.select().from(dataSources).where(eq(dataSources.name, 'Monitoring Service')).limit(1);
      
      if (dataSource.length === 0) {
        const result = await this.db.insert(dataSources).values({
          name: 'Monitoring Service',
          type: 'manual',
          isActive: true
        });
        dataSource = [{ id: result.insertId! }];
      }

      const dataSourceId = dataSource[0].id;

      // Insert logs into sync_logs table
      await this.db.insert(syncLogs).values(
        logsToFlush.map(log => ({
          dataSourceId,
          status: log.level === LogLevel.ERROR ? 'failed' : 'success',
          recordsProcessed: 1,
          recordsAdded: log.level === LogLevel.INFO ? 1 : 0,
          recordsUpdated: 0,
          recordsFailed: log.level === LogLevel.ERROR ? 1 : 0,
          errorMessage: log.level === LogLevel.ERROR ? log.message : null,
          duration: log.duration || null
        }))
      );
      
      this.debug('MonitoringService', `Flushed ${logsToFlush.length} logs to database`);
    } catch (error) {
      console.error('Failed to flush logs to database:', error);
      // Re-add logs to buffer for retry
      this.logBuffer.unshift(...logsToFlush);
    }
  }

  // Log scraping start
  logScrapingStart(source: string, tier: number, states: string[], targetBusinesses: number): void {
    this.info(source, `Starting tier ${tier} scraping`, {
      tier,
      states,
      targetBusinesses,
      totalStates: states.length
    });
  }

  // Log scraping completion
  logScrapingCompletion(source: string, tier: number, results: any[]): void {
    const totalProcessed = results.reduce((sum, result) => sum + result.processed, 0);
    const totalSuccess = results.reduce((sum, result) => sum + result.success, 0);
    const totalFailed = results.reduce((sum, result) => sum + result.failed, 0);
    const totalDuration = results.reduce((sum, result) => sum + result.duration, 0);

    this.info(source, `Tier ${tier} scraping completed`, {
      tier,
      totalStates: results.length,
      totalProcessed,
      totalSuccess,
      totalFailed,
      successRate: totalProcessed > 0 ? (totalSuccess / totalProcessed) * 100 : 0,
      totalDuration,
      avgDurationPerState: totalDuration / results.length
    });
  }

  // Log business processing
  logBusinessProcessing(source: string, businessName: string, success: boolean, error?: string, duration?: number): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    this.log(level, source, `Processing business: ${businessName}`, {
      businessName,
      success,
      error,
      duration
    }, duration);
  }

  // Log rate limit events
  logRateLimit(source: string, platform: string, retryAfter?: number): void {
    this.warn(source, `Rate limit hit for ${platform}`, {
      platform,
      retryAfter,
      timestamp: new Date().toISOString()
    });
  }

  // Log API errors
  logApiError(source: string, platform: string, error: any, endpoint?: string): void {
    this.error(source, `API error from ${platform}`, {
      platform,
      endpoint,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  // Get scraping metrics
  async getScrapingMetrics(): Promise<ScrapingMetrics> {
    try {
      // Get total businesses
      const totalBusinessesResult = await this.db.select({ count: sql`count(*)` }).from(businesses);
      const totalBusinesses = totalBusinessesResult[0].count;

      // Get successful vs failed businesses (approximate based on data quality)
      const successfulBusinessesResult = await this.db.select({ count: sql`count(*)` }).from(businesses).where(sql`dataQuality >= 6`);
      const successfulBusinesses = successfulBusinessesResult[0].count;

      // Get average data quality
      const avgQualityResult = await this.db.select({ avg: sql`avg(dataQuality)` }).from(businesses);
      const averageDataQuality = avgQualityResult[0].avg || 0;

      // Get businesses by category
      const businessesByCategory = await this.db
        .select({ category: businesses.category, count: sql`count(*)` })
        .from(businesses)
        .groupBy(businesses.category);

      // Get businesses by state
      const businessesByState = await this.db
        .select({ state: businesses.state, count: sql`count(*)` })
        .from(businesses)
        .groupBy(businesses.state);

      // Get businesses by tier using centralized configuration
      const businessesByTier = await this.db
        .select({ 
          tier: sql`CASE 
            WHEN state IN (${this.getTier1StatesSQL()}) THEN 1
            WHEN state IN (${this.getTier2StatesSQL()}) THEN 2
            WHEN state IN (${this.getTier3StatesSQL()}) THEN 3
            ELSE 4
          END`,
          count: sql`count(*)`
        })
        .from(businesses)
        .groupBy(sql`CASE 
          WHEN state IN (${this.getTier1StatesSQL()}) THEN 1
          WHEN state IN (${this.getTier2StatesSQL()}) THEN 2
          WHEN state IN (${this.getTier3StatesSQL()}) THEN 3
          ELSE 4
        END`);

      // Convert to record format
      const categoryMap: Record<string, number> = {};
      (businessesByCategory as CategoryCount[]).forEach(item => {
        categoryMap[item.category] = item.count;
      });

      const stateMap: Record<string, number> = {};
      (businessesByState as StateCount[]).forEach(item => {
        stateMap[item.state] = item.count;
      });

      const tierMap: Record<number, number> = {};
      (businessesByTier as TierCount[]).forEach(item => {
        tierMap[item.tier] = item.count;
      });

      // Calculate scraping rate (businesses per minute since last update)
      const recentBusinesses = await this.db
        .select({ count: sql`count(*)` })
        .from(businesses)
        .where(sql`createdAt >= datetime('now', '-1 hour')`);

      const scrapingRate = recentBusinesses[0].count / 60; // businesses per minute

      // Calculate error rate (businesses with low data quality)
      const errorBusinesses = await this.db.select({ count: sql`count(*)` }).from(businesses).where(sql`dataQuality < 6`);
      const errorRate = totalBusinesses > 0 ? (errorBusinesses[0].count / totalBusinesses) * 100 : 0;

      return {
        totalBusinesses,
        successfulBusinesses,
        failedBusinesses: totalBusinesses - successfulBusinesses,
        averageDataQuality,
        businessesByCategory: categoryMap,
        businessesByState: stateMap,
        businessesByTier: tierMap,
        scrapingRate,
        errorRate,
        lastUpdated: new Date()
      };

    } catch (error) {
      this.error('MonitoringService', 'Failed to get scraping metrics', { error: (error as Error).message });
      throw error;
    }
  }

  // Helper method to get Tier 1 states as SQL list
  private getTier1StatesSQL(): string {
    const tier1States = ALL_STATE_CONFIGS
      .filter((config: StateConfig) => config.tier === 1)
      .map((config: StateConfig) => `'${config.state}'`)
      .join(', ');
    return tier1States;
  }

  // Helper method to get Tier 2 states as SQL list
  private getTier2StatesSQL(): string {
    const tier2States = ALL_STATE_CONFIGS
      .filter((config: StateConfig) => config.tier === 2)
      .map((config: StateConfig) => `'${config.state}'`)
      .join(', ');
    return tier2States;
  }

  // Helper method to get Tier 3 states as SQL list
  private getTier3StatesSQL(): string {
    const tier3States = ALL_STATE_CONFIGS
      .filter((config: StateConfig) => config.tier === 3)
      .map((config: StateConfig) => `'${config.state}'`)
      .join(', ');
    return tier3States;
  }

  // Get recent logs
  async getRecentLogs(limit: number = 100, level?: LogLevel): Promise<LogEntry[]> {
    try {
      let query = this.db
        .select()
        .from(syncLogs)
        .orderBy(desc(syncLogs.createdAt))
        .limit(limit);

      // Filter by status based on log level
      if (level) {
        const status = level === LogLevel.ERROR ? 'failed' : 'success';
        query = query.where(eq(syncLogs.status, status));
      }

      const logs = await query;
      return logs.map((log: LogRow) => ({
        id: log.id,
        timestamp: new Date(log.createdAt),
        level: log.status === 'failed' ? LogLevel.ERROR : LogLevel.INFO,
        source: 'Monitoring Service',
        message: log.errorMessage || `Processed ${log.recordsProcessed} records`,
        metadata: {
          recordsProcessed: log.recordsProcessed,
          recordsAdded: log.recordsAdded,
          recordsUpdated: log.recordsUpdated,
          recordsFailed: log.recordsFailed,
          duration: log.duration
        },
        duration: log.duration || undefined,
        success: log.status === 'success'
      }));
    } catch (error) {
      this.error('MonitoringService', 'Failed to get recent logs', { error: (error as Error).message });
      throw error;
    }
  }

  // Get error summary
  async getErrorSummary(hours: number = 24): Promise<any> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      const errors = await this.db
        .select()
        .from(syncLogs)
        .where(and(
          eq(syncLogs.status, 'failed'),
          sql`createdAt >= ${since.toISOString()}`
        ))
        .orderBy(desc(syncLogs.createdAt));

      const errorSummary = {
        totalErrors: errors.length,
        errorsBySource: {} as Record<string, number>,
        errorsByHour: {} as Record<string, number>,
        recentErrors: errors.slice(0, 10).map((error: LogRow) => ({
          timestamp: new Date(error.createdAt),
          source: 'Monitoring Service',
          message: error.errorMessage || 'Unknown error',
          metadata: {
            recordsProcessed: error.recordsProcessed,
            recordsFailed: error.recordsFailed,
            duration: error.duration
          }
        }))
      };

      // Group by hour
      errors.forEach((error: LogRow) => {
        const hour = new Date(error.createdAt).toISOString().slice(0, 13); // YYYY-MM-DDTHH
        errorSummary.errorsByHour[hour] = (errorSummary.errorsByHour[hour] || 0) + 1;
      });

      return errorSummary;
    } catch (error) {
      this.error('MonitoringService', 'Failed to get error summary', { error: (error as Error).message });
      throw error;
    }
  }

  // Cleanup old logs
  async cleanupOldLogs(days: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const result = await this.db
        .delete(syncLogs)
        .where(sql`createdAt < ${cutoffDate.toISOString()}`);

      this.info('MonitoringService', `Cleaned up ${result.changes} old logs older than ${days} days`);
      return result.changes || 0;
    } catch (error) {
      this.error('MonitoringService', 'Failed to cleanup old logs', { error: (error as Error).message });
      throw error;
    }
  }

  // Shutdown and flush remaining logs
  async shutdown(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    await this.flushLogs();
    this.info('MonitoringService', 'Monitoring service shutdown completed');
  }
}

// Export the monitoring service
export const monitoringService = new MonitoringService();
export default MonitoringService;
