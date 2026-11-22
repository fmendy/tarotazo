package es.arcana.common;

import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import java.util.List;

/**
 * Cabeceras de caché (QA S-3): las lecturas y el péndulo ({@code POST}) y cualquier error son {@code no-store};
 * los GET de contenido, {@code public, max-age=300} (el ETag lo pone {@link CachingConfig}).
 */
@RestControllerAdvice
public class CacheHeadersAdvice implements ResponseBodyAdvice<Object> {

    public static final String NO_STORE = "no-store";
    public static final String PUBLIC_5_MIN = "public, max-age=300";

    /** GET de contenido cacheables (también los usa el filtro de ETag). */
    public static final List<String> CACHEABLE_PATHS = List.of("/api/v1/decks", "/api/v1/spreads",
            "/api/v1/provinces", "/api/v1/titles", "/api/v1/content/*");

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        return true;
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType contentType,
                                  Class<? extends HttpMessageConverter<?>> converterType, ServerHttpRequest request,
                                  ServerHttpResponse response) {
        String path = request.getURI().getPath();
        if (!path.startsWith("/api/")) {
            return body;
        }
        HttpHeaders h = response.getHeaders();
        if (body instanceof ApiError || !HttpMethod.GET.equals(request.getMethod()) || !isCacheable(path)) {
            h.setCacheControl(NO_STORE);
        } else {
            h.setCacheControl(PUBLIC_5_MIN);
        }
        return body;
    }

    static boolean isCacheable(String path) {
        for (String p : CACHEABLE_PATHS) {
            if (p.endsWith("/*") ? path.startsWith(p.substring(0, p.length() - 1)) : path.equals(p)) {
                return true;
            }
        }
        return false;
    }
}
