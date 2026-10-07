import { z } from 'zod';

export const contractStateSchema = z.object({
  status: z.enum(['ACTIVE', 'SUBMITTED', 'REVISION_REQUESTED', 'COMPLETED', 'CANCELLED']),
  revisionCount: z.number().int().min(0).max(1),
}).strict();
export type ContractState = z.infer<typeof contractStateSchema>;
export type ContractAction = 'submit' | 'requestRevision' | 'approve';

/** Pure lifecycle guard only, not authorization or concurrent database enforcement. */
export function transitionContract(input: ContractState, action: ContractAction): ContractState {
  const state = contractStateSchema.parse(input);
  if (action === 'submit' && (state.status === 'ACTIVE' || state.status === 'REVISION_REQUESTED')) {
    return { ...state, status: 'SUBMITTED' };
  }
  if (action === 'requestRevision' && state.status === 'SUBMITTED' && state.revisionCount === 0) {
    return { status: 'REVISION_REQUESTED', revisionCount: 1 };
  }
  if (action === 'approve' && state.status === 'SUBMITTED') return { ...state, status: 'COMPLETED' };
  throw new Error('Invalid contract transition');
}

export const taskStatusSchema = z.enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUESTED', 'COMPLETED', 'CANCELLED']);
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskAction = 'publish' | 'hire' | 'submit' | 'requestRevision' | 'approve';

export function transitionTask(input: TaskStatus, action: TaskAction): TaskStatus {
  const status = taskStatusSchema.parse(input);
  const next: Partial<Record<TaskAction, TaskStatus>> = {
    publish: status === 'DRAFT' ? 'OPEN' : undefined,
    hire: status === 'OPEN' ? 'IN_PROGRESS' : undefined,
    submit: status === 'IN_PROGRESS' || status === 'REVISION_REQUESTED' ? 'SUBMITTED' : undefined,
    requestRevision: status === 'SUBMITTED' ? 'REVISION_REQUESTED' : undefined,
    approve: status === 'SUBMITTED' ? 'COMPLETED' : undefined,
  };
  if (!Object.hasOwn(next, action) || !next[action]) throw new Error('Invalid task transition');
  return next[action];
}