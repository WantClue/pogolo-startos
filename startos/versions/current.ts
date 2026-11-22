import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '1.1.7:0',
  releaseNotes: {
    en_US: `**Before updating:** Change miner usernames that contain only a Bitcoin address to \`address.worker\` in each miner's settings. In v1.1.7, a bare address is rejected when no default payout address is set; otherwise rewards go to the default payout address, not the address in the username.

Updates pogolo to v1.1.7: Stratum V2 share batching, Stratum V1 performance improvements, support for worker names containing periods, and the pogolo version in the API. Job intervals are capped at 65535 seconds and target share intervals at 65 seconds. Existing target share intervals above 65 seconds reset to the 5-second default. Adds a Connect your miners dashboard card and keeps the Stratum V2 authority key stable across restarts and backups.

Bitcoin's RPC credential is now read from its public volume; update Bitcoin first if it is older.

[Upstream changes](https://github.com/0xf0xx0/pogolo/compare/v1.1.6...v1.1.7)`,
    es_ES: `**Antes de actualizar:** Cambia los nombres de usuario que contienen solo una dirección Bitcoin a \`address.worker\` en la configuración de cada minero. En v1.1.7 se rechaza una dirección sin nombre de worker si no hay una dirección de pago predeterminada; de lo contrario, las recompensas van a la dirección predeterminada, no a la del nombre de usuario.

Actualiza pogolo a v1.1.7: agrupación de shares en Stratum V2, mejoras de rendimiento en Stratum V1, soporte para nombres de worker con puntos y la versión de pogolo en la API. El intervalo de trabajo tiene un máximo de 65535 segundos y el de share objetivo, de 65 segundos. Los intervalos de share objetivo existentes superiores a 65 segundos vuelven al valor predeterminado de 5 segundos. Añade una tarjeta para conectar los mineros al panel y mantiene la clave de autoridad Stratum V2 entre reinicios y copias de seguridad.

La credencial RPC de Bitcoin ahora se lee desde su volumen público; actualice Bitcoin primero si es más antiguo.

[Cambios de upstream](https://github.com/0xf0xx0/pogolo/compare/v1.1.6...v1.1.7)`,
    de_DE: `**Vor dem Update:** Benutzernamen, die nur eine Bitcoin-Adresse enthalten, in den Einstellungen jedes Miners in \`address.worker\` ändern. In v1.1.7 wird eine reine Adresse ohne Standard-Auszahlungsadresse abgelehnt; andernfalls gehen die Belohnungen an die Standard-Auszahlungsadresse, nicht an die Adresse im Benutzernamen.

Aktualisiert pogolo auf v1.1.7: Share-Batching für Stratum V2, Leistungsverbesserungen für Stratum V1, Unterstützung für Worker-Namen mit Punkten und die pogolo-Version in der API. Das Job-Intervall ist auf 65535 Sekunden und das Ziel-Share-Intervall auf 65 Sekunden begrenzt. Bestehende Ziel-Share-Intervalle über 65 Sekunden werden auf den Standardwert von 5 Sekunden zurückgesetzt. Ergänzt eine Dashboard-Karte zum Verbinden der Miner und erhält den Stratum-V2-Authority-Key über Neustarts und Backups hinweg.

Die RPC-Zugangsdaten von Bitcoin werden jetzt aus dessen öffentlichem Volume gelesen; aktualisieren Sie Bitcoin zuerst, falls es älter ist.

[Upstream-Änderungen](https://github.com/0xf0xx0/pogolo/compare/v1.1.6...v1.1.7)`,
    pl_PL: `**Przed aktualizacją:** W ustawieniach każdej koparki zmień nazwy użytkownika zawierające sam adres Bitcoin na \`address.worker\`. W v1.1.7 sam adres jest odrzucany, jeśli nie ustawiono domyślnego adresu wypłaty; w przeciwnym razie nagrody trafiają na adres domyślny, a nie na adres w nazwie użytkownika.

Aktualizuje pogolo do v1.1.7: grupowanie share w Stratum V2, poprawa wydajności Stratum V1, obsługa nazw workerów z kropkami oraz wersja pogolo w API. Interwały zadań są ograniczone do 65535 sekund, a docelowych share do 65 sekund. Istniejące interwały docelowych share powyżej 65 sekund są resetowane do domyślnych 5 sekund. Dodaje do panelu kartę podłączania koparek i zachowuje klucz autoryzacji Stratum V2 po restartach i przywróceniu kopii zapasowej.

Dane uwierzytelniające RPC Bitcoina są teraz odczytywane z jego publicznego woluminu; jeśli Bitcoin jest starszy, najpierw go zaktualizuj.

[Zmiany upstream](https://github.com/0xf0xx0/pogolo/compare/v1.1.6...v1.1.7)`,
    fr_FR: `**Avant la mise à jour :** Dans les paramètres de chaque mineur, remplacez les noms d'utilisateur contenant uniquement une adresse Bitcoin par \`address.worker\`. En v1.1.7, une adresse seule est refusée si aucune adresse de paiement par défaut n'est définie ; sinon, les récompenses vont à l'adresse par défaut, pas à celle du nom d'utilisateur.

Met à jour pogolo vers v1.1.7 : regroupement des shares en Stratum V2, amélioration des performances de Stratum V1, prise en charge des noms de worker contenant des points et version de pogolo dans l'API. L'intervalle de tâche est limité à 65535 secondes et celui de share cible à 65 secondes. Les intervalles de share cible existants supérieurs à 65 secondes reviennent à la valeur par défaut de 5 secondes. Ajoute une carte de connexion des mineurs au tableau de bord et conserve la clé d'autorité Stratum V2 après les redémarrages et les restaurations de sauvegarde.

L'identifiant RPC de Bitcoin est désormais lu depuis son volume public ; mettez d'abord Bitcoin à jour s'il est plus ancien.

[Modifications upstream](https://github.com/0xf0xx0/pogolo/compare/v1.1.6...v1.1.7)`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
