## Statsig On-Premise (beta)
An on-premise solution for managing Statsig configs independently from Statsig Console.

### Example: Bootstrap
Bootstrap Statsig SDK using Statsig on-prem to generate a specs JSON
```ts
import { StatsigOnPrem, StatsigStorageExample } from "statsig-on-prem";
import StatsigSDK from "statsig-node";

const storage = new StatsigStorageExample();
const statsig = new StatsigOnPrem(storage);
const sdkKey = "secret-key";

await statsig.initialize();
await statsig.registerSDKKey(sdkKey);
await statsig.createGate("test-gate", { enabled: true });

const configSpecs = await statsig.getConfigSpecs(sdkKey);
await StatsigSDK.initialize(sdkKey, {
  bootstrapValues: JSON.stringify(configSpecs),
});

console.log(StatsigSDK.checkGateSync({ userID: "123" }, "test-gate"));
StatsigSDK.shutdown();
```
### Example: Data Adapter
Incorporate Statsig on-prem with a data adapter to serve updates to the Statsig SDK

```ts
import { StatsigOnPrem, StatsigStorageExample } from "statsig-on-prem";
import StatsigSDK, { IDataAdapter, AdapterResponse } from "statsig-node";

class ExampleDataAdapter implements IDataAdapter {
  public constructor(private statsigOnPrem: StatsigOnPrem, private sdkKey: string) {}

  public async get(key: string): Promise<AdapterResponse> {
    if (key === "statsig.cache") {
      const configSpecs = await this.statsigOnPrem.getConfigSpecs(this.sdkKey);
      return { result: JSON.stringify(configSpecs) };
    } else {
      return { error: new Error("Not supported") };
    }
  }

  public supportsPollingUpdatesFor(key: string): boolean {
    if (key === "statsig.cache") {
      return true;
    } else {
      return false;
    }
  }

  public async set(
    key: string,
    value: string,
    time?: number | undefined
  ): Promise<void> { /* no-op */ }

  public async initialize(): Promise<void> { /* no-op */ }

  public async shutdown(): Promise<void> { /* no-op */ }
}

const storage = new StatsigStorageExample();
const statsig = new StatsigOnPrem(storage);
const sdkKey = "secret-key";

await statsig.initialize();
await statsig.registerSDKKey(sdkKey);
await statsig.createGate("test-gate", { enabled: true });

await StatsigSDK.initialize(sdkKey, {
  dataAdapter: new ExampleDataAdapter(statsig, sdkKey),
});

console.log(StatsigSDK.checkGateSync({ userID: "123" }, "test-gate"));

await statsig.updateGate("test-gate", { enabled: false });
await StatsigSDK.syncConfigSpecs();

console.log(StatsigSDK.checkGateSync({ userID: "123" }, "test-gate"));
StatsigSDK.shutdown();
```
