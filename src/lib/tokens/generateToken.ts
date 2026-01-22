
import { nanoid } from 'nanoid'

export function generateToken(): string {
    return nanoid(10) // 10 chars is sufficient for share tokens
}
