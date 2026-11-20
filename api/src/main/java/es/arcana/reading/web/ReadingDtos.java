package es.arcana.reading.web;

import es.arcana.common.Ids;
import es.arcana.common.ReadingContext;
import es.arcana.content.model.LuckyColor;
import es.arcana.content.web.CatalogDtos.PositionDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/** DTOs de {@code /api/v1/readings} (CONTRACTS §6). */
public final class ReadingDtos {

    private ReadingDtos() {
    }

    public record ReadingRequest(
            @NotBlank(message = "deck es obligatorio") @Pattern(regexp = Ids.RX_FAMILY, message = "deck debe ser tarot o spanish") String deck,
            @Pattern(regexp = Ids.RX_SLUG, message = "model no válido") String model,
            @NotBlank(message = "spread es obligatorio") @Pattern(regexp = Ids.RX_SLUG, message = "spread no válido") String spread,
            @NotNull(message = "cutIndex es obligatorio") @Min(value = 0, message = "cutIndex debe ser 0, 1 o 2") @Max(value = 2, message = "cutIndex debe ser 0, 1 o 2") Integer cutIndex,
            @NotNull(message = "picks es obligatorio") @Size(min = 1, max = 10, message = "picks debe tener entre 1 y 10 índices") List<@NotNull(message = "pick nulo") @Min(value = 0, message = "pick negativo") Integer> picks,
            @Valid ReadingContext context,
            @Size(max = 500, message = "recentFragmentIds admite como mucho 500 ids") List<@Size(max = 120, message = "id demasiado largo") String> recentFragmentIds) {
    }

    public record ReadingResponse(String tone, SpreadView spread, String intro, List<CardView> cards, Summary summary,
                                  String outro, String disclaimer, List<String> usedFragmentIds) {
    }

    public record SpreadView(String id, String name, String layout, List<PositionDto> positions) {
    }

    public record CardView(String position, String cardId, String name, boolean reversed, String image, String tone,
                           List<LineView> lines, InteractionView interaction) {
    }

    public record LineView(String kind, String text) {
    }

    public record InteractionView(String id, String prompt, List<String> options) {
    }

    public record Summary(String text, int luckyNumber, LuckyColor luckyColor) {
    }

    public record NextLineRequest(
            @NotBlank(message = "interactionId es obligatorio") @Pattern(regexp = Ids.RX_SLUG, message = "interactionId no válido") String interactionId,
            @NotBlank(message = "answer es obligatorio") @Pattern(regexp = "si|no|skip", message = "answer debe ser si, no o skip") String answer,
            @Pattern(regexp = Ids.RX_TONE, message = "tone desconocido") String tone,
            @Valid ReadingContext context) {
    }

    public record NextLineResponse(String text) {
    }
}
