package es.arcana.content;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/** Resultado de la validación del contenido al arrancar. */
public final class ContentReport {

    public enum Level { ERROR, WARNING }

    public record Issue(Level level, String file, String message) {
        @Override
        public String toString() {
            return "[" + level + "] " + file + ": " + message;
        }
    }

    private final List<Issue> issues = Collections.synchronizedList(new ArrayList<>());
    private int filesChecked;

    void error(String file, String message) {
        issues.add(new Issue(Level.ERROR, file, message));
    }

    void warning(String file, String message) {
        issues.add(new Issue(Level.WARNING, file, message));
    }

    void countFile() {
        filesChecked++;
    }

    public int filesChecked() {
        return filesChecked;
    }

    public List<Issue> issues() {
        return List.copyOf(issues);
    }

    public List<Issue> errors() {
        return issues().stream().filter(i -> i.level() == Level.ERROR).toList();
    }

    public List<Issue> warnings() {
        return issues().stream().filter(i -> i.level() == Level.WARNING).toList();
    }

    public boolean hasErrors() {
        return !errors().isEmpty();
    }

    /** Resumen multilínea, limitado a {@code max} incidencias. */
    public String format(int max) {
        List<Issue> all = new ArrayList<>(errors());
        all.addAll(warnings());
        String body = all.stream().limit(max).map(i -> "  - " + i).collect(Collectors.joining("\n"));
        String more = all.size() > max ? "\n  … y " + (all.size() - max) + " más" : "";
        return "Contenido: " + filesChecked + " ficheros revisados, " + errors().size() + " errores, "
                + warnings().size() + " avisos" + (all.isEmpty() ? "" : ":\n" + body + more);
    }
}
