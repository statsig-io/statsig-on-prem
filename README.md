## Statsig On-Premise (beta)
An on-premise solution for managing Statsig configs independently from Statsig Console.

### Example: Bootstrap
Bootstrap Statsig SDK using Statsig on-prem to generate a specs JSON
```
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

StatsigSDK.checkGateSync({ userID: "123" }, "test-gate"));
StatsigSDK.shutdown();
```
### Example: Data Adapter
Incorporate Statsig on-prem with a data adapter to serve updates to the Statsig SDK

```
import { StatsigOnPrem, StatsigStorageExample } from "statsig-on-prem";
import StatsigSDK, { IDataAdapter, AdapterResponse, DataAdapterKey } from "statsig-node";

class ExampleDataAdapter implements IDataAdapter {
  public constructor(private statsigOnPrem: StatsigOnPrem, private sdkKey: string) {}

  public async get(key: string): Promise<AdapterResponse> {
    if (key === DataAdapterKey.Rulesets) {
      return { result: JSON.stringify(statsigOnPrem.getConfigSpecs(this.sdkKey)) };
    } else if (key === DataAdapterKey.IDLists {
      return { error: new Error("ID Lists not supported") };
    } else {
      return { error: new Error("Should never occur");
    }
  }

  public supportsPollingUpdatesFor(key: string): boolean {
    if (key === DataAdapterKey.Rulesets) {
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

StatsigSDK.checkGateSync({ userID: "123" }, "test-gate"));
StatsigSDK.shutdown();
```
