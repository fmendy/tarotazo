package es.arcana.content;

import java.util.List;
import java.util.Optional;

/** Acceso de sólo lectura al árbol {@code content/} (disco o classpath). Rutas relativas con '/'. */
public interface ContentStore {

    /** Descripción legible del origen (para logs). */
    String description();

    Optional<byte[]> read(String path);

    /** Todos los {@code *.json} del árbol, rutas relativas ordenadas. */
    List<String> listAll();

    default boolean exists(String path) {
        return read(path).isPresent();
    }

    /** Nombres de fichero {@code *.json} directamente dentro de {@code dir}. */
    default List<String> list(String dir) {
        String prefix = dir.endsWith("/") ? dir : dir + "/";
        return listAll().stream()
                .filter(p -> p.startsWith(prefix) && p.indexOf('/', prefix.length()) < 0)
                .map(p -> p.substring(prefix.length()))
                .sorted()
                .toList();
    }
}
