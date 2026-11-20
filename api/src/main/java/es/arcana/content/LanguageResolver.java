package es.arcana.content;

import es.arcana.common.Ids;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Set;

/**
 * Idioma de la petición: {@code ?lang=} &gt; {@code context.lang} &gt; {@code Accept-Language} &gt; {@code es}.
 * Sólo se aceptan idiomas con carpeta de contenido; el resto cae a {@code es}.
 */
@Component
public class LanguageResolver {

    private final ContentRepository content;

    public LanguageResolver(ContentRepository content) {
        this.content = content;
    }

    public String resolve(String langParam, String contextLang, String acceptLanguage) {
        Set<String> supported = content.languages();
        for (String candidate : new String[] {langParam, contextLang}) {
            String l = normalize(candidate);
            if (l != null && supported.contains(l)) {
                return l;
            }
        }
        if (acceptLanguage != null && !acceptLanguage.isBlank()) {
            try {
                for (Locale.LanguageRange r : Locale.LanguageRange.parse(acceptLanguage)) {
                    String l = normalize(r.getRange());
                    if (l != null && supported.contains(l)) {
                        return l;
                    }
                }
            } catch (IllegalArgumentException ignored) {
                // cabecera mal formada: se usa el idioma por defecto
            }
        }
        return Ids.DEFAULT_LANG;
    }

    private static String normalize(String tag) {
        if (tag == null || tag.isBlank() || tag.equals("*")) {
            return null;
        }
        String primary = tag.trim().toLowerCase(Locale.ROOT).split("[-_]")[0];
        return primary.matches("[a-z]{2,3}") ? primary : null;
    }
}
