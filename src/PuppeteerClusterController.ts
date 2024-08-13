import { Cluster } from 'puppeteer-cluster';

export class PuppeteerClusterController {
  private static instance: PuppeteerClusterController;
  private cluster: Cluster<any, any> | null = null;

  private constructor() {
  }

  public static getInstance(): PuppeteerClusterController {
    if (!PuppeteerClusterController.instance) {
      PuppeteerClusterController.instance = new PuppeteerClusterController();
      PuppeteerClusterController.instance.init();
    }
    return PuppeteerClusterController.instance;
  }

  public async init(maxConcurrency: number = 10) {
    if (!this.cluster) {
      this.cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency,
        puppeteerOptions: {
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
      });
      console.log("Puppeteer Cluster created with maxConcurrency:", maxConcurrency);
    }
  }

  public getCluster(): Cluster<any, any> {
    if (!this.cluster) {
      throw new Error("Puppeteer Cluster is not initialized. Call init() first.");
    }
    return this.cluster;
  }

  public async close() {
    if (this.cluster) {
      await this.cluster.idle();
      await this.cluster.close();
      this.cluster = null;
      console.log("Puppeteer Cluster closed");
    }
  }
}
