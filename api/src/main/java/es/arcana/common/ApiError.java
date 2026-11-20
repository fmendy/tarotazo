package es.arcana.common;

/** Formato de error del §6: {@code { "error": "bad_request", "message": "…" }}. */
public record ApiError(String error, String message) {

    public static ApiError badRequest(String message) {
        return new ApiError("bad_request", message);
    }
}
