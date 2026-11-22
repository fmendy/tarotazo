package es.arcana.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Límite de tamaño de cuerpo en {@code /api/**} (defensa en profundidad; Caddy también lo limita). Si
 * {@code Content-Length} lo supera se responde 413 sin leer nada; si el cuerpo llega troceado, la lectura se corta
 * al superar el límite y {@link ApiExceptionHandler} responde 413.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class RequestBodyLimitFilter extends OncePerRequestFilter {

    private final long maxBytes;

    public RequestBodyLimitFilter(@Value("${arcana.max-body-bytes:16384}") long maxBytes) {
        this.maxBytes = maxBytes;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (request.getContentLengthLong() > maxBytes) {
            writeTooLarge(response, maxBytes);
            return;
        }
        chain.doFilter(new LimitedRequest(request, maxBytes), response);
    }

    static void writeTooLarge(HttpServletResponse response, long maxBytes) throws IOException {
        response.setStatus(413);
        response.setHeader("Cache-Control", CacheHeadersAdvice.NO_STORE);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"error\":\"payload_too_large\",\"message\":\"" + message(maxBytes) + "\"}");
    }

    static String message(long maxBytes) {
        return "El cuerpo de la petición supera " + (maxBytes / 1024) + " KB";
    }

    /** Se lanza al superar el límite leyendo un cuerpo sin Content-Length. */
    public static final class PayloadTooLargeException extends IOException {
        private final long maxBytes;

        PayloadTooLargeException(long maxBytes) {
            super(message(maxBytes));
            this.maxBytes = maxBytes;
        }

        public long maxBytes() {
            return maxBytes;
        }
    }

    private static final class LimitedRequest extends HttpServletRequestWrapper {
        private final long max;
        private ServletInputStream stream;

        LimitedRequest(HttpServletRequest request, long max) {
            super(request);
            this.max = max;
        }

        @Override
        public ServletInputStream getInputStream() throws IOException {
            if (stream == null) {
                stream = new LimitedStream(super.getInputStream(), max);
            }
            return stream;
        }
    }

    private static final class LimitedStream extends ServletInputStream {
        private final ServletInputStream in;
        private final long max;
        private long count;

        LimitedStream(ServletInputStream in, long max) {
            this.in = in;
            this.max = max;
        }

        private void add(long n) throws PayloadTooLargeException {
            if (n > 0) {
                count += n;
                if (count > max) {
                    throw new PayloadTooLargeException(max);
                }
            }
        }

        @Override
        public int read() throws IOException {
            int b = in.read();
            if (b >= 0) {
                add(1);
            }
            return b;
        }

        @Override
        public int read(byte[] b, int off, int len) throws IOException {
            int n = in.read(b, off, len);
            add(n);
            return n;
        }

        @Override
        public boolean isFinished() {
            return in.isFinished();
        }

        @Override
        public boolean isReady() {
            return in.isReady();
        }

        @Override
        public void setReadListener(ReadListener listener) {
            in.setReadListener(listener);
        }
    }
}
