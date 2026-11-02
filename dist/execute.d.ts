/** Server binding and owned execution shared by reusable actions and independent adapter contracts. */
import type { Failure } from '@arki/failure';
import type { StandardSchemaV1 } from '@arki/schema';
import { dynamicScope } from '@arki/async';
import type { ActionFailureDefinition, ActionOptions } from './action.js';
import { ACTION_FAILURES } from './action.js';
type ExecutionDefinitions<Definitions extends readonly ActionFailureDefinition[]> = readonly [
    ...Definitions,
    ...typeof ACTION_FAILURES
];
/** Inferred from the shared structured-concurrency owner, including typed acquisition and cleanup. */
export type ActionScope<Definitions extends readonly ActionFailureDefinition[]> = Parameters<Parameters<ReturnType<typeof dynamicScope<ExecutionDefinitions<Definitions>>>['run']>[0]>[0];
/** Trusted adapter attestations, never fields accepted from an external request body. */
export type ActionInvocation = {
    readonly binding: string;
    /** The adapter authenticates credentials and checks expiry before asserting this. */
    readonly principal: 'anonymous' | 'authenticated';
    /** The adapter verifies approval bound to this caller, operation and input. */
    readonly approval: 'absent' | 'granted';
    readonly signal?: AbortSignal;
    readonly deadline?: AbortSignal;
};
/**
 * Bind services through a closure, after the browser-safe contract is declared.
 * Implementations can return only successful output input or listed canonical failures.
 * A request owns its resources and children until they settle, even on cancellation.
 *
 * @example
 * const lookup = bindAction(lookupAction, (input, scope) => catalog.find(input.id, scope.signal));
 * const result = await lookup.run(body, { binding: 'http', principal: 'anonymous', approval: 'absent' });
 */
export declare function bindAction<const Definition extends ActionOptions<StandardSchemaV1, StandardSchemaV1, readonly ActionFailureDefinition[]>, Result extends NoInfer<StandardSchemaV1.InferInput<Definition['output']> | ReturnType<ExecutionDefinitions<Definition['failures']>[number]> | PromiseLike<StandardSchemaV1.InferInput<Definition['output']> | ReturnType<ExecutionDefinitions<Definition['failures']>[number]>>>>(definition: Definition, implementation: (input: StandardSchemaV1.InferOutput<Definition['input']>, scope: ActionScope<Definition['failures']>) => Result): {
    definition: Definition;
    /** Validate an untyped invocation, including asynchronous input/output transformations. */
    run(input: unknown, invocation: ActionInvocation): Promise<Failure<"dot.action_approval_required", undefined> | Failure<"dot.action_not_exposed", undefined> | Failure<"dot.action_principal_required", undefined> | Failure<"schema.invalid_input", {
        issues: readonly StandardSchemaV1.Issue[];
    }> | Failure<"schema.validator_defect", undefined> | Exclude<Awaited<StandardSchemaV1.InferOutput<Definition["output"]>>, Failure> | Exclude<Awaited<Extract<Awaited<Result>, Failure>>, Failure> | Exclude<Awaited<Extract<Awaited<StandardSchemaV1.InferOutput<Definition["input"]>>, Failure>>, Failure> | Extract<Awaited<StandardSchemaV1.InferOutput<Definition["output"]>>, Failure<string, unknown>> | Extract<Awaited<Extract<Awaited<Result>, Failure>>, Failure<string, unknown>> | Extract<Awaited<Extract<Awaited<StandardSchemaV1.InferOutput<Definition["input"]>>, Failure>>, Failure<string, unknown>> | ReturnType<(readonly [...Definition["failures"], import("@arki/failure").FailureDefinition<"schema.invalid_input", StandardSchemaV1<unknown, {
        issues: readonly StandardSchemaV1.Issue[];
    }>>, import("@arki/failure").FailureDefinition<"schema.validator_defect", undefined>, import("@arki/failure").FailureDefinition<"async.cancelled", undefined>, import("@arki/failure").FailureDefinition<"async.deadline", undefined>, import("@arki/failure").FailureDefinition<"failure.unexpected_defect", undefined>, import("@arki/failure").FailureDefinition<"async.scope_failed", StandardSchemaV1<unknown, {
        primaryCount: number;
        cleanupCount: number;
    }>>, import("@arki/failure").FailureDefinition<"dot.action_not_exposed", undefined>, import("@arki/failure").FailureDefinition<"dot.action_principal_required", undefined>, import("@arki/failure").FailureDefinition<"dot.action_approval_required", undefined>])[number]> | import("@arki/async").SupervisorFailure | import("@arki/async").ScopeAggregate<Failure<"dot.action_approval_required", undefined> | Failure<"dot.action_not_exposed", undefined> | Failure<"dot.action_principal_required", undefined> | Failure<"schema.invalid_input", {
        issues: readonly StandardSchemaV1.Issue[];
    }> | Failure<"schema.validator_defect", undefined> | Extract<Awaited<StandardSchemaV1.InferOutput<Definition["output"]>>, Failure<string, unknown>> | Extract<Awaited<Extract<Awaited<Result>, Failure>>, Failure<string, unknown>> | Extract<Awaited<Extract<Awaited<StandardSchemaV1.InferOutput<Definition["input"]>>, Failure>>, Failure<string, unknown>> | ReturnType<(readonly [...Definition["failures"], import("@arki/failure").FailureDefinition<"schema.invalid_input", StandardSchemaV1<unknown, {
        issues: readonly StandardSchemaV1.Issue[];
    }>>, import("@arki/failure").FailureDefinition<"schema.validator_defect", undefined>, import("@arki/failure").FailureDefinition<"async.cancelled", undefined>, import("@arki/failure").FailureDefinition<"async.deadline", undefined>, import("@arki/failure").FailureDefinition<"failure.unexpected_defect", undefined>, import("@arki/failure").FailureDefinition<"async.scope_failed", StandardSchemaV1<unknown, {
        primaryCount: number;
        cleanupCount: number;
    }>>, import("@arki/failure").FailureDefinition<"dot.action_not_exposed", undefined>, import("@arki/failure").FailureDefinition<"dot.action_principal_required", undefined>, import("@arki/failure").FailureDefinition<"dot.action_approval_required", undefined>])[number]> | import("@arki/async").SupervisorFailure, ReturnType<(readonly [...Definition["failures"], import("@arki/failure").FailureDefinition<"schema.invalid_input", StandardSchemaV1<unknown, {
        issues: readonly StandardSchemaV1.Issue[];
    }>>, import("@arki/failure").FailureDefinition<"schema.validator_defect", undefined>, import("@arki/failure").FailureDefinition<"async.cancelled", undefined>, import("@arki/failure").FailureDefinition<"async.deadline", undefined>, import("@arki/failure").FailureDefinition<"failure.unexpected_defect", undefined>, import("@arki/failure").FailureDefinition<"async.scope_failed", StandardSchemaV1<unknown, {
        primaryCount: number;
        cleanupCount: number;
    }>>, import("@arki/failure").FailureDefinition<"dot.action_not_exposed", undefined>, import("@arki/failure").FailureDefinition<"dot.action_principal_required", undefined>, import("@arki/failure").FailureDefinition<"dot.action_approval_required", undefined>])[number]> | import("@arki/async").SupervisorFailure>>;
    /**
     * Bind to a transport that already parses input and validates output, such
     * as an oRPC handler. Successful output is still the output schema's INPUT;
     * the transport owns encoding/transformation. Never parse either schema twice.
     */
    handle(input: StandardSchemaV1.InferOutput<Definition["input"]>, invocation: ActionInvocation): Promise<Failure<"dot.action_approval_required", undefined> | Failure<"dot.action_not_exposed", undefined> | Failure<"dot.action_principal_required", undefined> | Failure<"schema.invalid_input", {
        issues: readonly StandardSchemaV1.Issue[];
    }> | Failure<"schema.validator_defect", undefined> | Exclude<Awaited<Exclude<Awaited<Result>, Failure>>, Failure> | Exclude<Awaited<Extract<Awaited<Result>, Failure>>, Failure> | Exclude<Awaited<Extract<Awaited<StandardSchemaV1.InferOutput<Definition["input"]>>, Failure>>, Failure> | Extract<Awaited<Exclude<Awaited<Result>, Failure>>, Failure<string, unknown>> | Extract<Awaited<Extract<Awaited<Result>, Failure>>, Failure<string, unknown>> | Extract<Awaited<Extract<Awaited<StandardSchemaV1.InferOutput<Definition["input"]>>, Failure>>, Failure<string, unknown>> | ReturnType<(readonly [...Definition["failures"], import("@arki/failure").FailureDefinition<"schema.invalid_input", StandardSchemaV1<unknown, {
        issues: readonly StandardSchemaV1.Issue[];
    }>>, import("@arki/failure").FailureDefinition<"schema.validator_defect", undefined>, import("@arki/failure").FailureDefinition<"async.cancelled", undefined>, import("@arki/failure").FailureDefinition<"async.deadline", undefined>, import("@arki/failure").FailureDefinition<"failure.unexpected_defect", undefined>, import("@arki/failure").FailureDefinition<"async.scope_failed", StandardSchemaV1<unknown, {
        primaryCount: number;
        cleanupCount: number;
    }>>, import("@arki/failure").FailureDefinition<"dot.action_not_exposed", undefined>, import("@arki/failure").FailureDefinition<"dot.action_principal_required", undefined>, import("@arki/failure").FailureDefinition<"dot.action_approval_required", undefined>])[number]> | import("@arki/async").SupervisorFailure | import("@arki/async").ScopeAggregate<Failure<"dot.action_approval_required", undefined> | Failure<"dot.action_not_exposed", undefined> | Failure<"dot.action_principal_required", undefined> | Failure<"schema.invalid_input", {
        issues: readonly StandardSchemaV1.Issue[];
    }> | Failure<"schema.validator_defect", undefined> | Extract<Awaited<Exclude<Awaited<Result>, Failure>>, Failure<string, unknown>> | Extract<Awaited<Extract<Awaited<Result>, Failure>>, Failure<string, unknown>> | Extract<Awaited<Extract<Awaited<StandardSchemaV1.InferOutput<Definition["input"]>>, Failure>>, Failure<string, unknown>> | ReturnType<(readonly [...Definition["failures"], import("@arki/failure").FailureDefinition<"schema.invalid_input", StandardSchemaV1<unknown, {
        issues: readonly StandardSchemaV1.Issue[];
    }>>, import("@arki/failure").FailureDefinition<"schema.validator_defect", undefined>, import("@arki/failure").FailureDefinition<"async.cancelled", undefined>, import("@arki/failure").FailureDefinition<"async.deadline", undefined>, import("@arki/failure").FailureDefinition<"failure.unexpected_defect", undefined>, import("@arki/failure").FailureDefinition<"async.scope_failed", StandardSchemaV1<unknown, {
        primaryCount: number;
        cleanupCount: number;
    }>>, import("@arki/failure").FailureDefinition<"dot.action_not_exposed", undefined>, import("@arki/failure").FailureDefinition<"dot.action_principal_required", undefined>, import("@arki/failure").FailureDefinition<"dot.action_approval_required", undefined>])[number]> | import("@arki/async").SupervisorFailure, ReturnType<(readonly [...Definition["failures"], import("@arki/failure").FailureDefinition<"schema.invalid_input", StandardSchemaV1<unknown, {
        issues: readonly StandardSchemaV1.Issue[];
    }>>, import("@arki/failure").FailureDefinition<"schema.validator_defect", undefined>, import("@arki/failure").FailureDefinition<"async.cancelled", undefined>, import("@arki/failure").FailureDefinition<"async.deadline", undefined>, import("@arki/failure").FailureDefinition<"failure.unexpected_defect", undefined>, import("@arki/failure").FailureDefinition<"async.scope_failed", StandardSchemaV1<unknown, {
        primaryCount: number;
        cleanupCount: number;
    }>>, import("@arki/failure").FailureDefinition<"dot.action_not_exposed", undefined>, import("@arki/failure").FailureDefinition<"dot.action_principal_required", undefined>, import("@arki/failure").FailureDefinition<"dot.action_approval_required", undefined>])[number]> | import("@arki/async").SupervisorFailure>>;
};
export {};
//# sourceMappingURL=execute.d.ts.map