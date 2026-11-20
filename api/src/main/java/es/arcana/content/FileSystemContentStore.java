package es.arcana.content;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

/** Contenido en un directorio del disco ({@code arcana.content-dir}). */
final class FileSystemContentStore implements ContentStore {

    private final Path root;

    FileSystemContentStore(Path root) {
        this.root = root.toAbsolutePath().normalize();
    }

    @Override
    public String description() {
        return "directorio " + root;
    }

    @Override
    public Optional<byte[]> read(String path) {
        Path p = root.resolve(path).normalize();
        if (!p.startsWith(root) || !Files.isRegularFile(p)) {
            return Optional.empty();
        }
        try {
            return Optional.of(Files.readAllBytes(p));
        } catch (IOException e) {
            throw new UncheckedIOException("No se puede leer " + p, e);
        }
    }

    @Override
    public List<String> listAll() {
        if (!Files.isDirectory(root)) {
            return List.of();
        }
        try (Stream<Path> s = Files.walk(root)) {
            return s.filter(Files::isRegularFile)
                    .filter(p -> p.getFileName().toString().endsWith(".json"))
                    .map(p -> root.relativize(p).toString().replace('\\', '/'))
                    .filter(p -> !p.contains("node_modules/"))
                    .sorted()
                    .toList();
        } catch (IOException e) {
            throw new UncheckedIOException("No se puede listar " + root, e);
        }
    }
}
