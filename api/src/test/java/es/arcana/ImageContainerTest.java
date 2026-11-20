package es.arcana;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.utility.DockerImageName;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Prueba la imagen Docker de la API (el Dockerfile es de DevOps). Desactivada por defecto: se ejecuta con
 * {@code ./mvnw verify -Pcontainer-tests} y Docker disponible.
 * <p>
 * La imagen se construye con {@code docker build} (BuildKit: el Dockerfile usa {@code RUN --mount}) desde la raíz
 * del monorepo, y Testcontainers la arranca y espera a {@code /actuator/health}.
 */
@Tag("container")
@EnabledIf("dockerfileExists")
class ImageContainerTest {

    static final Path REPO_ROOT = Path.of("..").toAbsolutePath().normalize();
    static final Path DOCKERFILE = REPO_ROOT.resolve("api/Dockerfile");
    static final String IMAGE = "arcana-api:container-test";

    static boolean dockerfileExists() {
        return Files.isRegularFile(DOCKERFILE);
    }

    @Test
    void laImagenArrancaYSirveLaApi() throws Exception {
        Process build = new ProcessBuilder("docker", "build", "-f", DOCKERFILE.toString(), "-t", IMAGE, ".")
                .directory(REPO_ROOT.toFile())
                .inheritIO()
                .start();
        assertThat(build.waitFor(15, TimeUnit.MINUTES)).as("docker build termina").isTrue();
        assertThat(build.exitValue()).as("docker build").isZero();

        try (GenericContainer<?> api = new GenericContainer<>(DockerImageName.parse(IMAGE))
                .withExposedPorts(8080)
                .waitingFor(Wait.forHttp("/actuator/health").forStatusCode(200))
                .withStartupTimeout(Duration.ofMinutes(3))) {
            api.start();
            String base = "http://" + api.getHost() + ":" + api.getMappedPort(8080);
            HttpClient http = HttpClient.newHttpClient();
            HttpResponse<String> decks = http.send(HttpRequest.newBuilder(URI.create(base + "/api/v1/decks")).build(),
                    HttpResponse.BodyHandlers.ofString());
            assertThat(decks.statusCode()).isEqualTo(200);
            assertThat(decks.body()).contains("\"family\":\"tarot\"");
            assertThat(decks.headers().firstValue("Set-Cookie")).isEmpty();

            HttpResponse<String> reading = http.send(HttpRequest.newBuilder(URI.create(base + "/api/v1/readings"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(
                            "{\"deck\":\"tarot\",\"spread\":\"ppf\",\"cutIndex\":1,\"picks\":[1,2,3]}"))
                    .build(), HttpResponse.BodyHandlers.ofString());
            assertThat(reading.statusCode()).isEqualTo(200);
            assertThat(reading.body()).contains("\"cards\"");
        }
    }
}
