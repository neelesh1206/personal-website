import { z } from 'zod'

export const contactInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().trim().email('Enter a valid email').max(255, 'Email is too long'),
  message: z
    .string()
    .trim()
    .max(2000, 'Message is too long')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  referrer: z.string().trim().max(500).optional(),
  /** Honeypot — bots fill this; humans don't. */
  website: z.string().max(0).optional(),
})

export type ContactInput = z.infer<typeof contactInputSchema>
