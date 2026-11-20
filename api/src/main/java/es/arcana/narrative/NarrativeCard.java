package es.arcana.narrative;

import es.arcana.content.model.CardDef;

/**
 * Carta ya sorteada, con lo que el motor necesita para elegir y rellenar textos.
 *
 * @param positionInline forma para insertar en frase ({@code {posicion}}), p. ej. «tu pasado».
 */
public record NarrativeCard(CardDef def, String name, String suitName, boolean reversed, String positionId,
                            String positionLabel, String positionInline) {
}
