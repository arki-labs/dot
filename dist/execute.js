import { dynamicScope } from '@arki/async';
import { isFailure, UnexpectedDefect } from '@arki/failure';
import { parseAsync } from '@arki/failure/schema';
import { ACTION_FAILURES, ActionApprovalRequired, ActionNotExposed, ActionPrincipalRequired } from './action.js';
import { telemetryFor } from './telemetry.js';
function succeeded(value) {
    return !isFailure(value);
}
function failed(value) {
    return isFailure(value);
}
/**
 * Bind services through a closure, after the browser-safe contract is declared.
 * Implementations can return only successful output input or listed canonical failures.
 * A request owns its resources and children until they settle, even on cancellation.
 *
 * @example
 * const lookup = bindAction(lookupAction, (input, scope) => catalog.find(input.id, scope.signal));
 * const result = await lookup.run(body, { binding: 'http', principal: 'anonymous', approval: 'absent' });
 */
export function bindAction(definition, implementation) {
    const declared = definition.failures;
    const definitions = [...declared, ...ACTION_FAILURES];
    const owner = dynamicScope(definitions);
    const telemetry = telemetryFor({ name: definition.id });
    function execute(read, complete, invocation) {
        return telemetry.span('dot.action', () => owner.run(async (scope) => {
            if (!definition.policy.exposure.includes(invocation.binding))
                return ActionNotExposed();
            if (definition.policy.principal === 'required' && invocation.principal !== 'authenticated')
                return ActionPrincipalRequired();
            if (definition.policy.approval === 'required' && invocation.approval !== 'granted')
                return ActionApprovalRequired();
            const parsed = await read();
            if (failed(parsed))
                return parsed;
            // The owner recognizes its own cancellation reason. Admission closes even
            // when an asynchronous validator ignored the signal while it was running.
            scope.signal.throwIfAborted();
            const outcome = await implementation(parsed, scope);
            if (failed(outcome)) {
                // Untyped JS callers still cannot leak an undeclared business failure.
                return definitions.some(failure => failure.is(outcome)) ? outcome : UnexpectedDefect({ cause: outcome });
            }
            if (succeeded(outcome))
                return complete(outcome);
            throw new Error('Unreachable action outcome');
        }, invocation), { attributes: { 'dot.action.id': definition.id, 'dot.binding': invocation.binding } });
    }
    return {
        definition,
        /** Validate an untyped invocation, including asynchronous input/output transformations. */
        run(input, invocation) {
            return execute(() => parseAsync(definition.input, input), async (outcome) => {
                const output = await parseAsync(definition.output, outcome);
                // Invalid server output is a defect, not a client input refusal.
                return failed(output) ? UnexpectedDefect({ cause: output }) : output;
            }, invocation);
        },
        /**
         * Bind to a transport that already parses input and validates output, such
         * as an oRPC handler. Successful output is still the output schema's INPUT;
         * the transport owns encoding/transformation. Never parse either schema twice.
         */
        handle(input, invocation) {
            return execute(() => Promise.resolve(input), outcome => outcome, invocation);
        },
    };
}
//# sourceMappingURL=execute.js.map