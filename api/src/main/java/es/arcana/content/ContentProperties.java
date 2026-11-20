package es.arcana.content;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.util.List;

/**
 * Configuración del contenido.
 *
 * @param contentDir        directorio de contenido en disco (p. ej. volumen de solo lectura). Si está vacío se usa
 *                          el contenido empaquetado en el jar ({@code classpath:content/}).
 * @param contentStrict     {@code true} (prod): el arranque falla si el contenido no valida contra los esquemas.
 *                          {@code false} (dev): arranca y avisa.
 * @param artDir            carpeta opcional del arte ({@code web/public/art}) para saber qué modelos tienen arte.
 * @param unavailableModels modelos que se publican con {@code available: false} aunque no haya art-dir.
 * @param zone              zona horaria para hora/día por defecto, estación y fase lunar.
 */
@ConfigurationProperties("arcana")
public record ContentProperties(String contentDir, @DefaultValue("true") boolean contentStrict, String artDir,
                                List<String> unavailableModels, @DefaultValue("Europe/Madrid") String zone) {

    public ContentProperties {
        unavailableModels = unavailableModels == null ? List.of() : List.copyOf(unavailableModels);
    }

    public boolean hasContentDir() {
        return contentDir != null && !contentDir.isBlank();
    }

    public boolean hasArtDir() {
        return artDir != null && !artDir.isBlank();
    }
}
