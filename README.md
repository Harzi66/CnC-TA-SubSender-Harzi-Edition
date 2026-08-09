# CnC-TA SubSender – Harzi Edition

Ein Tampermonkey-Script für **C&C Tiberium Alliances**, das die Verwaltung einer Spielervertretung (UV) automatisiert.

Das Script läuft unauffällig im Hintergrund und kann über das **Scripte-Menü** des Spiels geöffnet werden.

## Funktionen

- 🌍 Automatische Erkennung der aktuellen Welt
- 🛡 Automatische Erkennung der aktuellen Allianz
- 👤 Anzeige des aktuellen Spielers und der Spieler-ID
- 🔄 UV manuell senden
- ↩️ Bestehende UV manuell zurückrufen
- 🤖 Automatische UV-Verwaltung
- 💾 Einstellungen werden automatisch gespeichert
- 🌐 Einstellungen werden getrennt nach Welt und Allianz gespeichert
- 🖥 Mehrere gleichzeitig geöffnete Welten/Tabs werden unabhängig voneinander behandelt
- 🚫 Keine permanente Prüfung und keine unnötigen Serveranfragen

## Automatische UV-Verwaltung

Die automatische Verwaltung wird **pro Welt und Allianz** eingestellt.

Beispiel:

- Welt 71 → Automatik aktiviert → UV an Spieler `SpielerA`
- Welt 424 → Automatik deaktiviert
- Welt 500 → keine Einstellung → Automatik bleibt deaktiviert

Die Einstellung einer Welt beeinflusst keine andere Welt.

### Ablauf beim Login

Beim Laden einer Welt prüft das Script einmalig:

1. Welche Welt ist aktuell geöffnet?
2. Welche Allianz ist aktuell aktiv?
3. Gibt es für diese Welt/Allianz eine gespeicherte Einstellung?
4. Ist die automatische UV-Verwaltung aktiviert?
5. Besteht bereits eine ausgehende UV?

Wenn die Automatik aktiviert ist und **keine UV besteht**, wird die UV automatisch an den hinterlegten Spieler gesendet.

Besteht bereits eine UV, wird nichts verändert.

Nach dieser Prüfung erfolgt **keine laufende Überwachung**.

## Bedienung

Das Script erscheint nach dem Laden des Spiels unter:

**Scripte → SubSender – Harzi Edition**

Dort werden die aktuellen Spieldaten angezeigt.

### UV senden

Bei **„UV senden an“** den gewünschten Spieler eintragen.

Mit **„UV jetzt senden“** wird die UV sofort vergeben.

Die Einstellung wird dabei automatisch für die aktuelle Kombination aus Welt und Allianz gespeichert.

### Automatik aktivieren

Die Checkbox

**„Automatische UV-Verwaltung aktiv“**

aktivieren.

Die Einstellung wird automatisch gespeichert.

Beim nächsten Login auf dieser Welt prüft das Script die UV und stellt sie bei Bedarf wieder her.

### UV zurückrufen

Mit **„UV zurückrufen“** kann eine bestehende ausgehende UV manuell beendet werden.

### Status aktualisieren

Mit **„Status aktualisieren“** kann der aktuell vom Spiel gemeldete UV-Status erneut angezeigt werden.

## Mehrere Welten

Das Script kann gleichzeitig auf mehreren Welten verwendet werden.

Jeder Browser-Tab arbeitet unabhängig mit der jeweiligen C&C-TA-Spielinstanz.

Die Einstellungen werden anhand von:

**Welt-ID + Allianz-ID**

zugeordnet.

Dadurch können auf verschiedenen Welten unterschiedliche Zielspieler und unterschiedliche Automatik-Einstellungen verwendet werden.

## Installation

Voraussetzung ist:

- Firefox, Chrome oder ein kompatibler Browser
- [Tampermonkey](https://www.tampermonkey.net/)

### Installation über Tampermonkey

Die aktuelle Scriptdatei kann direkt über GitHub installiert werden:

**[CnC-TA SubSender – Harzi Edition.user.js](./CnC-TA%20SubSender%20-%20Harzi%20Edition.user.js)**

Alternativ kann die Datei in Tampermonkey über **„Neues Script“** bzw. durch Öffnen der Raw-Datei installiert werden.

## Version

**Aktuelle Version: 0.1.8**

## Hinweis

Dieses Script ist ein von Harzi erstelltes Community-Script für C&C Tiberium Alliances.

Die Nutzung erfolgt auf eigene Verantwortung.
