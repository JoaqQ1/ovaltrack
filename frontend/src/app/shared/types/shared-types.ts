/** Cuerpo de errores y de respuestas que solo informan un resultado (aprobar, eliminar, registrar…). */
export interface MessageResponse {
    message: string
}
export const STATUS_CODE = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,

    // --- 4xx CLIENT ERRORS ---
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,

    // --- 5xx SERVER ERRORS ---
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
}