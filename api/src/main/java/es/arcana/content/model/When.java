package es.arcana.content.model;

import java.util.List;

/** Condiciones de un fragmento (CONTRACTS §3.1; common.schema.json#/$defs/when). Todas AND; listas = OR. */
public record When(List<String> tema, Boolean invertida, String arcana, List<String> cardIds, List<String> suit,
                   List<String> family, List<String> spread, List<String> posicion, Integer decadaMin,
                   Integer decadaMax, Integer horaMin, Integer horaMax, Integer mayoresMin, Integer figurasMin,
                   String suitDominante, List<String> provincia, List<String> signo, List<Integer> diaSemana,
                   List<String> faseLunar, List<String> estacion, Boolean primeraCarta, Boolean ultimaCarta) {
}
