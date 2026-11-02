/** Browser-safe action contracts: schemas, canonical failures and explicit exposure policy. */
import type { Failure, FailureDefinition } from '@arki/failure';
import type { StandardSchemaV1 } from '@arki/schema';
import type { ActionDeclaration } from './unit-contract.js';
/** An adapter may call only an explicitly exposed boundary.
 * @fix Use an adapter listed by the action contract.
 * @verify bun run test -- src/tests/action.test.ts
 */
export declare const ActionNotExposed: FailureDefinition<"dot.action_not_exposed", undefined>;
/** The adapter must authenticate its caller before invoking this action.
 * @fix Authenticate the caller before invoking the action.
 * @verify bun run test -- src/tests/action.test.ts
 */
export declare const ActionPrincipalRequired: FailureDefinition<"dot.action_principal_required", undefined>;
/** Approval must be verified for this invocation, not inferred from another exposure.
 * @fix Verify approval bound to the caller, action and input.
 * @verify bun run test -- src/tests/action.test.ts
 */
export declare const ActionApprovalRequired: FailureDefinition<"dot.action_approval_required", undefined>;
/** Failures owned by execution rather than the business implementation. */
export declare const ACTION_FAILURES: readonly [FailureDefinition<"schema.invalid_input", StandardSchemaV1<unknown, {
    issues: readonly StandardSchemaV1.Issue[];
}>>, FailureDefinition<"schema.validator_defect", undefined>, FailureDefinition<"async.cancelled", undefined>, FailureDefinition<"async.deadline", undefined>, FailureDefinition<"failure.unexpected_defect", undefined>, FailureDefinition<"async.scope_failed", StandardSchemaV1<unknown, {
    primaryCount: number;
    cleanupCount: number;
}>>, FailureDefinition<"dot.action_not_exposed", undefined>, FailureDefinition<"dot.action_principal_required", undefined>, FailureDefinition<"dot.action_approval_required", undefined>];
/** Canonical definitions are shared with errorMap(), HTTP routes and JSON revival. */
export type ActionFailureDefinition = Pick<FailureDefinition, 'code' | 'status' | 'is' | 'dataSchema'> & ((...args: never[]) => Failure);
/** Minimum authority is shared by every exposure, including internal jobs. */
export type ActionPolicy = {
    readonly exposure: readonly string[];
    readonly principal: 'optional' | 'required';
    readonly approval: 'none' | 'required';
    /** Metadata for an explicit retry owner; execution never retries implicitly. */
    readonly retry: 'never' | 'idempotent';
};
/** The action's only authoring source. Its implementation is bound separately on the server. */
export type ActionOptions<Input extends StandardSchemaV1, Output extends StandardSchemaV1, Definitions extends readonly ActionFailureDefinition[]> = {
    readonly id: string;
    readonly summary?: string;
    readonly input: Input;
    readonly output: Output;
    readonly failures: Definitions;
    readonly policy: ActionPolicy;
};
/**
 * Define a reusable action without importing server services or an implementation.
 * It implements Dot's existing ActionSource protocol; no second registry is needed.
 *
 * @example
 * const lookup = action({ id: 'catalog.lookup', input: LookupInput, output: Item,
 *   failures: [ItemMissing], policy: { exposure: ['rpc', 'http'], principal: 'optional', approval: 'none', retry: 'never' } });
 */
export declare function action<Input extends StandardSchemaV1, Output extends StandardSchemaV1, const Definitions extends readonly ActionFailureDefinition[]>(options: ActionOptions<Input, Output, Definitions>): Readonly<{
    id: string;
    summary?: string;
    input: Input;
    output: Output;
    policy: Readonly<{
        principal: 'optional' | 'required';
        approval: 'none' | 'required';
        retry: 'never' | 'idempotent';
        exposure: readonly string[];
    }>;
    failures: readonly [...Readonly<Definitions>, FailureDefinition<"schema.invalid_input", StandardSchemaV1<unknown, {
        issues: readonly StandardSchemaV1.Issue[];
    }>>, FailureDefinition<"schema.validator_defect", undefined>, FailureDefinition<"async.cancelled", undefined>, FailureDefinition<"async.deadline", undefined>, FailureDefinition<"failure.unexpected_defect", undefined>, FailureDefinition<"async.scope_failed", StandardSchemaV1<unknown, {
        primaryCount: number;
        cleanupCount: number;
    }>>, FailureDefinition<"dot.action_not_exposed", undefined>, FailureDefinition<"dot.action_principal_required", undefined>, FailureDefinition<"dot.action_approval_required", undefined>];
    toDotAction(): ActionDeclaration;
}>;
/** The descriptor's members are inferred from action(), not restated. */
export type Action<Input extends StandardSchemaV1, Output extends StandardSchemaV1, Definitions extends readonly ActionFailureDefinition[]> = ReturnType<typeof action<Input, Output, Definitions>>;
//# sourceMappingURL=action.d.ts.map