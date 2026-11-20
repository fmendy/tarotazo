package es.arcana.common;

/** Petición válida sintácticamente pero incoherente con el contenido (baraja, tirada, picks…). Responde 400. */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
