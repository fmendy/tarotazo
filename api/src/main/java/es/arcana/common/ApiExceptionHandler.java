package es.arcana.common;

import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.stream.Collectors;

/**
 * Errores con el formato del §6. Nunca se registra el cuerpo de la petición ni la IP: sólo el tipo de
 * error (y la traza en los 500, que no contiene datos de la petición).
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(BadRequestException.class)
    ResponseEntity<ApiError> badRequest(BadRequestException e) {
        return bad(e.getMessage());
    }

    @ExceptionHandler(UnavailableException.class)
    ResponseEntity<ApiError> unavailable(UnavailableException e) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ApiError("unavailable", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> invalid(MethodArgumentNotValidException e) {
        String msg = e.getBindingResult().getFieldErrors().stream()
                .map(ApiExceptionHandler::describe)
                .sorted()
                .collect(Collectors.joining("; "));
        if (msg.isEmpty()) {
            msg = e.getBindingResult().getAllErrors().stream()
                    .map(err -> err.getDefaultMessage() == null ? err.getObjectName() : err.getDefaultMessage())
                    .collect(Collectors.joining("; "));
        }
        return bad(msg.isEmpty() ? "Petición no válida" : msg);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    ResponseEntity<ApiError> invalid(HandlerMethodValidationException e) {
        String msg = e.getAllErrors().stream()
                .map(err -> err.getDefaultMessage() == null ? "valor no válido" : err.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return bad(msg.isEmpty() ? "Petición no válida" : msg);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ApiError> invalid(ConstraintViolationException e) {
        String msg = e.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .sorted()
                .collect(Collectors.joining("; "));
        return bad(msg);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> unreadable(HttpMessageNotReadableException e) {
        // No se devuelve el mensaje de Jackson: podría citar fragmentos del cuerpo.
        return bad("JSON mal formado o con tipos incorrectos");
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    ResponseEntity<ApiError> missingParam(MissingServletRequestParameterException e) {
        return bad("Falta el parámetro '" + e.getParameterName() + "'");
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ApiError> typeMismatch(MethodArgumentTypeMismatchException e) {
        return bad("Parámetro '" + e.getName() + "' no válido");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ApiError> notFound(NoResourceFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError("not_found", "Recurso no encontrado"));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ApiError> method(HttpRequestMethodNotSupportedException e) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(new ApiError("method_not_allowed", "Método no permitido"));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<ApiError> mediaType(HttpMediaTypeNotSupportedException e) {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(new ApiError("unsupported_media_type", "Usa Content-Type: application/json"));
    }

    @ExceptionHandler(HttpMediaTypeNotAcceptableException.class)
    ResponseEntity<ApiError> notAcceptable(HttpMediaTypeNotAcceptableException e) {
        return ResponseEntity.status(HttpStatus.NOT_ACCEPTABLE)
                .body(new ApiError("not_acceptable", "Sólo se sirve application/json"));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> internal(Exception e) {
        log.error("Error interno ({})", e.getClass().getSimpleName(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError("internal_error", "La bola de cristal se ha empañado. Prueba otra vez."));
    }

    private static ResponseEntity<ApiError> bad(String message) {
        return ResponseEntity.badRequest().body(ApiError.badRequest(message));
    }

    private static String describe(FieldError fe) {
        return fe.getField() + ": " + (fe.getDefaultMessage() == null ? "valor no válido" : fe.getDefaultMessage());
    }
}
