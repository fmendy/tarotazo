package es.arcana.narrative;

import es.arcana.content.model.LuckyColor;

import java.util.List;

/** Textos de una lectura completa, en orden de lectura. */
public record ReadingNarrative(String tone, String intro, List<CardNarrative> cards, String summary, int luckyNumber,
                               LuckyColor luckyColor, String outro, String disclaimer, List<String> usedFragmentIds) {

    public record CardNarrative(String tone, List<Line> lines, InteractionPrompt interaction) {
    }

    public record Line(String kind, String text) {
    }

    public record InteractionPrompt(String id, String prompt, List<String> options) {
    }
}
