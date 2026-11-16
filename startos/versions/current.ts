import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.1.7:0',
  releaseNotes: {
    en_US:
      'Updates pogolo to v1.1.7: Stratum V2 share batching, Stratum V1 performance improvements, support for worker names containing periods, and the pogolo version in the API. Job and target share intervals are now capped at 65535 seconds.',
    es_ES:
      'Actualiza pogolo a v1.1.7: agrupación de shares en Stratum V2, mejoras de rendimiento en Stratum V1, soporte para nombres de worker con puntos y la versión de pogolo en la API. Los intervalos de trabajo y de share objetivo ahora tienen un máximo de 65535 segundos.',
    de_DE:
      'Aktualisiert pogolo auf v1.1.7: Share-Batching für Stratum V2, Leistungsverbesserungen für Stratum V1, Unterstützung für Worker-Namen mit Punkten und die pogolo-Version in der API. Job- und Ziel-Share-Intervall sind jetzt auf 65535 Sekunden begrenzt.',
    pl_PL:
      'Aktualizuje pogolo do v1.1.7: grupowanie share w Stratum V2, poprawa wydajności Stratum V1, obsługa nazw workerów z kropkami oraz wersja pogolo w API. Interwały zadań i docelowych share są teraz ograniczone do 65535 sekund.',
    fr_FR:
      "Met à jour pogolo vers v1.1.7 : regroupement des shares en Stratum V2, amélioration des performances de Stratum V1, prise en charge des noms de worker contenant des points et version de pogolo dans l'API. Les intervalles de tâche et de share cible sont désormais limités à 65535 secondes.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
