package es.arcana.common;

/** Falta contenido necesario (sólo posible en dev con contenido incompleto). Responde 503. */
public class UnavailableException extends RuntimeException {

    public UnavailableException(String message) {
        super(message);
    }
}
