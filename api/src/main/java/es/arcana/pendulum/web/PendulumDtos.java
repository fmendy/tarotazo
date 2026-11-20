package es.arcana.pendulum.web;

import es.arcana.common.Ids;
import es.arcana.common.ReadingContext;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.util.Map;

/** DTOs de {@code POST /api/v1/pendulum/answer} (CONTRACTS §6). */
public final class PendulumDtos {

    private PendulumDtos() {
    }

    /** @param options número de opciones (sólo modo {@code opciones}, 2–6); las opciones nunca se envían. */
    public record PendulumRequest(
            @NotBlank(message = "mode es obligatorio") @Pattern(regexp = Ids.RX_PENDULUM_MODE, message = "mode desconocido") String mode,
            @Pattern(regexp = Ids.RX_PENDULUM_MODEL, message = "model desconocido") String model,
            @Min(value = 2, message = "options debe estar entre 2 y 6") @Max(value = 6, message = "options debe estar entre 2 y 6") Integer options,
            @Valid ReadingContext context) {
    }

    public record PendulumResponse(String mode, Map<String, Object> result, String text) {
    }
}
