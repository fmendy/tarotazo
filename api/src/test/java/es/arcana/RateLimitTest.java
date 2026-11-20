package es.arcana;

import es.arcana.ops.RateLimitFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "arcana.content-dir=src/test/resources/content-fixture",
        "arcana.rate-limit.requests-per-minute=3"})
@AutoConfigureMockMvc
class RateLimitTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    RateLimitFilter filter;

    @Test
    void limitaPorIpYResponde429() throws Exception {
        for (int i = 0; i < 3; i++) {
            mvc.perform(get("/api/v1/decks").with(r -> { r.setRemoteAddr("10.1.1.1"); return r; }))
                    .andExpect(status().isOk());
        }
        mvc.perform(get("/api/v1/decks").with(r -> { r.setRemoteAddr("10.1.1.1"); return r; }))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.error", is("too_many_requests")));
        // otra IP tiene su propio cubo; actuator no está limitado
        mvc.perform(get("/api/v1/decks").with(r -> { r.setRemoteAddr("10.1.1.2"); return r; }))
                .andExpect(status().isOk());
        mvc.perform(get("/actuator/health").with(r -> { r.setRemoteAddr("10.1.1.1"); return r; }))
                .andExpect(status().isOk());
    }

    @Test
    void laIpSeGuardaSoloComoHashEfimero() {
        String h = filter.anonymize("192.168.1.10");
        org.assertj.core.api.Assertions.assertThat(h).doesNotContain("192").hasSize(22)
                .isEqualTo(filter.anonymize("192.168.1.10"))
                .isNotEqualTo(filter.anonymize("192.168.1.11"));
    }
}
