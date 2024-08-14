import { PuppeteerClusterController } from "./PuppeteerClusterController";

export const getEcomWebConfig = async (url: string) => {
  const cluster = PuppeteerClusterController.getInstance().getCluster();

  const requestContext = await cluster.execute(
    url,
    async ({ page, data: url }) => {
      await page.goto(url);

      // Execute the command in the console
      const requestContext = await page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (window as any).___initialData___.requestContext;
      });

      return requestContext;
    }
  );

  return requestContext;
};
