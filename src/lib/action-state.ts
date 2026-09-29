import * as z from 'zod'

/**
 * The one shape every Server Action returns to a form. `useActionState` consumers switch on `status`.
 * Keep it serialisable: no Error objects, no class instances.
 */
export type ActionState<T = undefined> =
  | { status: 'idle' }
  | { status: 'success'; data: T; message?: string }
  | { status: 'error'; formError?: string; fieldErrors?: Record<string, string[] | undefined>; values?: Record<string, string> }

export const idle = { status: 'idle' } as const satisfies ActionState<never>

export function success<T>(data: T, message?: string): ActionState<T> {
  return { status: 'success', data, message }
}

export function failure(formError: string, values?: Record<string, string>): ActionState<never> {
  return { status: 'error', formError, values }
}

/** Turn a zod error into field errors, echoing back submitted text so inputs keep their values. */
export function invalid(error: z.ZodError, formData?: FormData): ActionState<never> {
  const { formErrors, fieldErrors } = z.flattenError(error)
  return {
    status: 'error',
    formError: formErrors[0],
    fieldErrors: fieldErrors as Record<string, string[]>,
    values: formData ? echo(formData) : undefined,
  }
}

function echo(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of formData) {
    if (typeof value === 'string' && !/password/i.test(key)) out[key] = value
  }
  return out
}
