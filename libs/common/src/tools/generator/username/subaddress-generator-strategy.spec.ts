import { mock } from "jest-mock-extended";
import { of, firstValueFrom } from "rxjs";

import { PolicyType } from "../../../admin-console/enums";
// FIXME: use index.ts imports once policy abstractions and models
// implement ADR-0002
import { Policy } from "../../../admin-console/models/domain/policy";
import { StateProvider } from "../../../platform/state";
import { UserId } from "../../../types/guid";
import { DefaultPolicyEvaluator } from "../default-policy-evaluator";
import { SUBADDRESS_SETTINGS } from "../key-definitions";

import { SubaddressGeneratorStrategy, UsernameGenerationServiceAbstraction } from ".";

const SomeUser = "some user" as UserId;
const SomePolicy = mock<Policy>({
  type: PolicyType.PasswordGenerator,
  data: {
    minLength: 10,
  },
});

describe("Email subaddress list generation strategy", () => {
  describe("toEvaluator()", () => {
    it.each([[[]], [null], [undefined], [[SomePolicy]], [[SomePolicy, SomePolicy]]])(
      "should map any input (= %p) to the default policy evaluator",
      async (policies) => {
        const strategy = new SubaddressGeneratorStrategy(null, null);

        const evaluator$ = of(policies).pipe(strategy.toEvaluator());
        const evaluator = await firstValueFrom(evaluator$);

        expect(evaluator).toBeInstanceOf(DefaultPolicyEvaluator);
      },
    );
  });

  describe("durableState", () => {
    it("should use password settings key", () => {
      const provider = mock<StateProvider>();
      const legacy = mock<UsernameGenerationServiceAbstraction>();
      const strategy = new SubaddressGeneratorStrategy(legacy, provider);

      strategy.durableState(SomeUser);

      expect(provider.getUser).toHaveBeenCalledWith(SomeUser, SUBADDRESS_SETTINGS);
    });
  });

  describe("cache_ms", () => {
    it("should be a positive non-zero number", () => {
      const legacy = mock<UsernameGenerationServiceAbstraction>();
      const strategy = new SubaddressGeneratorStrategy(legacy, null);

      expect(strategy.cache_ms).toBeGreaterThan(0);
    });
  });

  describe("policy", () => {
    it("should use password generator policy", () => {
      const legacy = mock<UsernameGenerationServiceAbstraction>();
      const strategy = new SubaddressGeneratorStrategy(legacy, null);

      expect(strategy.policy).toBe(PolicyType.PasswordGenerator);
    });
  });

  describe("generate()", () => {
    it("should call the legacy service with the given options", async () => {
      const legacy = mock<UsernameGenerationServiceAbstraction>();
      const strategy = new SubaddressGeneratorStrategy(legacy, null);
      const options = {
        type: "website-name" as const,
        email: "someone@example.com",
      };

      await strategy.generate(options);

      expect(legacy.generateSubaddress).toHaveBeenCalledWith({
        subaddressType: "website-name" as const,
        subaddressEmail: "someone@example.com",
      });
    });
  });
});
