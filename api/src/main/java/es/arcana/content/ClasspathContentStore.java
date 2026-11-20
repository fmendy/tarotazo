package es.arcana.content;

import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.Optional;
import java.util.TreeSet;

/** Contenido empaquetado en el jar bajo {@code classpath:content/}. */
final class ClasspathContentStore implements ContentStore {

    static final String ROOT = "content/";

    private final ResourcePatternResolver resolver;
    private final ClassLoader classLoader;

    ClasspathContentStore(ClassLoader classLoader) {
        this.classLoader = classLoader;
        this.resolver = new PathMatchingResourcePatternResolver(classLoader);
    }

    static boolean available(ClassLoader cl) {
        return !new ClasspathContentStore(cl).listAll().isEmpty();
    }

    @Override
    public String description() {
        return "classpath:" + ROOT + " (contenido empaquetado en el jar)";
    }

    @Override
    public Optional<byte[]> read(String path) {
        if (path.contains("..")) {
            return Optional.empty();
        }
        try (InputStream in = classLoader.getResourceAsStream(ROOT + path)) {
            return in == null ? Optional.empty() : Optional.of(in.readAllBytes());
        } catch (IOException e) {
            throw new UncheckedIOException("No se puede leer classpath:" + ROOT + path, e);
        }
    }

    @Override
    public List<String> listAll() {
        try {
            TreeSet<String> out = new TreeSet<>();
            for (Resource r : resolver.getResources("classpath*:" + ROOT + "**/*.json")) {
                String url = r.getURL().toString();
                int idx = url.lastIndexOf("/" + ROOT);
                if (idx >= 0) {
                    out.add(url.substring(idx + ROOT.length() + 1));
                }
            }
            return List.copyOf(out);
        } catch (IOException e) {
            throw new UncheckedIOException("No se puede listar classpath:" + ROOT, e);
        }
    }
}
