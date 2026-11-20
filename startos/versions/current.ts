import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.1.7:0',
  releaseNotes: {
    en_US:
      "Updates pogolo to v1.1.7: Stratum V2 share batching, Stratum V1 performance improvements, support for worker names containing periods, and the pogolo version in the API. Job and target share intervals are now capped at 65535 seconds. Bitcoin's RPC credential is now read from its public volume; update Bitcoin first if it is older.",
    es_ES:
      'Actualiza pogolo a v1.1.7: agrupación de shares en Stratum V2, mejoras de rendimiento en Stratum V1, soporte para nombres de worker con puntos y la versión de pogolo en la API. Los intervalos de trabajo y de share objetivo ahora tienen un máximo de 65535 segundos. La credencial RPC de Bitcoin ahora se lee desde su volumen público; actualice Bitcoin primero si es más antiguo.',
    de_DE:
      'Aktualisiert pogolo auf v1.1.7: Share-Batching für Stratum V2, Leistungsverbesserungen für Stratum V1, Unterstützung für Worker-Namen mit Punkten und die pogolo-Version in der API. Job- und Ziel-Share-Intervall sind jetzt auf 65535 Sekunden begrenzt. Die RPC-Zugangsdaten von Bitcoin werden jetzt aus dessen öffentlichem Volume gelesen; aktualisieren Sie Bitcoin zuerst, falls es älter ist.',
    pl_PL:
      'Aktualizuje pogolo do v1.1.7: grupowanie share w Stratum V2, poprawa wydajności Stratum V1, obsługa nazw workerów z kropkami oraz wersja pogolo w API. Interwały zadań i docelowych share są teraz ograniczone do 65535 sekund. Dane uwierzytelniające RPC Bitcoina są teraz odczytywane z jego publicznego woluminu; jeśli Bitcoin jest starszy, najpierw go zaktualizuj.',
    fr_FR:
      "Met à jour pogolo vers v1.1.7 : regroupement des shares en Stratum V2, amélioration des performances de Stratum V1, prise en charge des noms de worker contenant des points et version de pogolo dans l'API. Les intervalles de tâche et de share cible sont désormais limités à 65535 secondes. L'identifiant RPC de Bitcoin est désormais lu depuis son volume public ; mettez d'abord Bitcoin à jour s'il est plus ancien.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
