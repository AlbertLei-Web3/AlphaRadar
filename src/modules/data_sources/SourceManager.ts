import { IDataSource, RawDataItem, DataSourceConfig } from './DataSourceInterface';

export class SourceManager {
  private sources: Map<string, IDataSource> = new Map();
  private configs: Map<string, DataSourceConfig> = new Map();

  /**
   * Register a new data source
   */
  async registerSource(source: IDataSource, config: DataSourceConfig): Promise<void> {
    try {
      await source.initialize(config);
      this.sources.set(source.name, source);
      this.configs.set(source.name, config);
      console.log(`✅ Data source '${source.name}' registered successfully`);
    } catch (error) {
      console.error(`❌ Failed to register data source '${source.name}':`, error);
      throw error;
    }
  }

  /**
   * Unregister a data source
   */
  unregisterSource(sourceName: string): void {
    this.sources.delete(sourceName);
    this.configs.delete(sourceName);
    console.log(`🗑️ Data source '${sourceName}' unregistered`);
  }

  /**
   * Get a specific data source
   */
  getSource(name: string): IDataSource | undefined {
    return this.sources.get(name);
  }

  /**
   * Get all registered source names
   */
  getSourceNames(): string[] {
    return Array.from(this.sources.keys());
  }

  /**
   * Get all enabled sources
   */
  getEnabledSources(): IDataSource[] {
    return Array.from(this.sources.values()).filter(source => source.isEnabled);
  }

  /**
   * Fetch data from all enabled sources
   */
  async fetchFromAllSources(keywords: string[]): Promise<RawDataItem[]> {
    const enabledSources = this.getEnabledSources();
    const allData: RawDataItem[] = [];

    const fetchPromises = enabledSources.map(async (source) => {
      try {
        const data = await source.fetchData(keywords);
        console.log(`📊 Fetched ${data.length} items from ${source.name}`);
        return data;
      } catch (error) {
        console.error(`❌ Error fetching from ${source.name}:`, error);
        return [];
      }
    });

    const results = await Promise.allSettled(fetchPromises);
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allData.push(...result.value);
      }
    });

    console.log(`🔄 Total fetched: ${allData.length} items from ${enabledSources.length} sources`);
    return allData;
  }

  /**
   * Health check for all sources
   */
  async healthCheckAll(): Promise<Map<string, boolean>> {
    const healthStatus = new Map<string, boolean>();
    
    for (const [name, source] of this.sources) {
      try {
        const isHealthy = await source.healthCheck();
        healthStatus.set(name, isHealthy);
      } catch (error) {
        healthStatus.set(name, false);
      }
    }

    return healthStatus;
  }

  /**
   * Enable/disable a specific source
   */
  toggleSource(sourceName: string, enabled: boolean): void {
    const source = this.sources.get(sourceName);
    if (source) {
      source.isEnabled = enabled;
      console.log(`🔄 Source '${sourceName}' ${enabled ? 'enabled' : 'disabled'}`);
    }
  }
} 