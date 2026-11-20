package es.arcana.content;

/** El contenido no se puede cargar o no es válido (en modo estricto impide el arranque). */
public class ContentException extends RuntimeException {

    public ContentException(String message) {
        super(message);
    }
}
