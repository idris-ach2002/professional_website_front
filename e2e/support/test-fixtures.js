import { expect, test as base } from "@playwright/test";
import {
  assertHermeticNetwork,
  assertNoRuntimeFaults,
  captureRuntimeFaults,
  forceHostedRunnerBrowserHardwareFloor,
  installHermeticNetworkContract,
  installPublicApiContract,
  installRuntimeWatchdogContract,
} from "./runtime-contract";

async function attachJson(testInfo, name, value) {
  await testInfo.attach(name, {
    body: JSON.stringify(value, null, 2),
    contentType: "application/json",
  });
}

export const test = base.extend({
  runtimeGuard: [async ({ context, page }, use, testInfo) => {
    // Shared preconditions for every E2E test, independent of worker/browser:
    // deterministic hardware profile, hermetic network, isolated public API.
    await forceHostedRunnerBrowserHardwareFloor(context);
    await installRuntimeWatchdogContract(context);
    const network = await installHermeticNetworkContract(context);
    await installPublicApiContract(context);
    const runtime = captureRuntimeFaults(page);

    await use({ runtime, network });

    // Disarm close monitoring before Playwright performs normal page teardown.
    runtime.dispose();

    if (runtime.all.length > 0) {
      await attachJson(testInfo, "runtime-events.json", runtime);
    }
    if (network.violations.length > 0) {
      await attachJson(testInfo, "network-contract-violations.json", network.violations);
    }

    // Preserve the primary assertion error. The automatic postcondition becomes
    // authoritative only when the test body itself has not already failed.
    if (testInfo.errors.length === 0) {
      assertNoRuntimeFaults(runtime, "Postcondition runtime automatique");
      assertHermeticNetwork(network);
    }
  }, { auto: true }],
});

export { expect };
