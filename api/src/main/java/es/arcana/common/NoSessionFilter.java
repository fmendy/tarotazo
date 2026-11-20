package es.arcana.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Privacidad: la API no usa sesión HTTP. Cualquier intento de crearla (que emitiría {@code JSESSIONID}) falla
 * de forma explícita en vez de crear una cookie en silencio.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class NoSessionFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        chain.doFilter(new SessionlessRequest(request), response);
    }

    static final class SessionlessRequest extends HttpServletRequestWrapper {

        SessionlessRequest(HttpServletRequest request) {
            super(request);
        }

        @Override
        public HttpSession getSession(boolean create) {
            if (create) {
                throw new IllegalStateException("La API de Tarotazo no usa sesiones HTTP");
            }
            return null;
        }

        @Override
        public HttpSession getSession() {
            return getSession(true);
        }

        @Override
        public String changeSessionId() {
            throw new IllegalStateException("La API de Tarotazo no usa sesiones HTTP");
        }
    }
}
