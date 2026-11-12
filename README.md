<div align="center">

# 🕹️ Batocera System Manager Web

**Weboberfläche, um dein Batocera im Browser zu verwalten**: eigene Systeme,
ROMs, BIOS, Themes, Cover und Scraping — ganz ohne Kommandozeile.

> **Ein Projekt, ein Repository.** Die Oberfläche ist eine SPA in React + Tailwind CSS, das
> Backend bleibt **reines Python** (ohne Abhängigkeiten). Die klassische Oberfläche in einer
> einzigen Datei (`templates/index.html`) bleibt als **Ausweichlösung** erhalten: Liegt das
> kompilierte Bundle nicht auf der Konsole, liefert das Backend stattdessen diese aus.
>
> Während der Entwicklung war das Projekt auf **zwei Repositorys** mit demselben Backend aufgeteilt.
> Sie wurden zusammengelegt, weil zwei Kopien derselben `app.py` jede Änderung an zwei Stellen
> nötig machten. Der [Grund für die Zusammenlegung](#-warum-nur-ein-repository) steht weiter
> unten.

> 🇩🇪 **Deutsche Übersetzung.** Diese README und die Oberfläche wurden aus dem spanischen Original
> ins Deutsche übersetzt. Das spanische Original liegt als [README.es.md](README.es.md) daneben.

[![Version](https://img.shields.io/badge/Version-2.0-5a69d1?style=flat)](https://github.com/Thundertruck4K/batocera-web-manager/releases)
[![Lizenz: MIT](https://img.shields.io/badge/Lizenz-MIT-3da639?style=flat)](LICENSE)
[![Batocera v43+](https://img.shields.io/badge/Batocera-v43%2B-8a5cf6?style=flat)](https://batocera.org)
[![Python 3 · stdlib](https://img.shields.io/badge/Python%203-stdlib-3776AB?logo=python&logoColor=white)](https://docs.python.org/3/)
[![Backend ohne Abhängigkeiten](https://img.shields.io/badge/Backend-ohne%20Abh%C3%A4ngigkeiten-16a34a)]()
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat&logo=react&logoColor=black)](frontend)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?style=flat&logo=tailwindcss&logoColor=white)](frontend)
[![Tests](https://img.shields.io/badge/Tests-991%20OK-success)](tests)
[![Sterne](https://img.shields.io/github/stars/Thundertruck4K/batocera-web-manager?label=Sterne&color=yellow)](https://github.com/Thundertruck4K/batocera-web-manager/stargazers)
[![Forks](https://img.shields.io/github/forks/Thundertruck4K/batocera-web-manager?label=Forks)](https://github.com/Thundertruck4K/batocera-web-manager/forks)
[![Issues](https://img.shields.io/github/issues/Thundertruck4K/batocera-web-manager?label=Issues)](https://github.com/Thundertruck4K/batocera-web-manager/issues)
[![Letzter Commit](https://img.shields.io/github/last-commit/Thundertruck4K/batocera-web-manager?label=letzter%20Commit)](https://github.com/Thundertruck4K/batocera-web-manager/commits/master)
[![Größe](https://img.shields.io/github/repo-size/Thundertruck4K/batocera-web-manager?label=Gr%C3%B6%C3%9Fe)](https://github.com/Thundertruck4K/batocera-web-manager)

![Banner von Batocera System Manager Web](docs/media/banner.png)

**Open-Source-Projekt** · MIT-Lizenz · Backend in reinem Python (ohne Abhängigkeiten) · Oberfläche in React + Tailwind CSS  
[Installation](#-installation) · [Screenshots](#-screenshots) · [API](#-rest-api) · [FAQ](#-häufige-fragen) · [Projekt unterstützen](#-projekt-unterstützen)

</div>

---

## 🧭 Inhalt

| | | |
|:--|:--|:--|
| [Was ist das?](#-was-ist-das) | [Installation](#-installation) | [REST-API](#-rest-api) |
| [Nur ein Repository](#-warum-nur-ein-repository) | [Funktionen](#-funktionen) | [Bedienung](#-bedienung) |
| [Screenshots](#-screenshots) | [Tests](#-tests) | [Cover-Scraper](#-cover-scraper) |
| [BIOS](#-bios) | [Projektstruktur](#-projektstruktur) | [Architektur](#-architektur) |
| [Voraussetzungen](#-voraussetzungen-und-kompatibilität) | [Sicherheit](#-sicherheit) | [Häufige Fragen](#-häufige-fragen) |
| [Roadmap](#-roadmap) | [Mitmachen](#-mitmachen) | [Projekt unterstützen](#-projekt-unterstützen) |
| [ROM-Werkzeuge](#-rom-werkzeuge) | [Lizenz](#-lizenz) | |

---

## ❓ Was ist das?

**Batocera System Manager Web** ist eine eigenständige Weboberfläche, mit der du ein Gerät mit
[Batocera](https://batocera.org) von jedem Browser im Haus aus verwaltest: Handy, Tablet oder PC.

EmulationStation zeigt nur die Systeme an, die bereits in seinen `es_systems.cfg`-Dateien definiert
sind (von Hand geschrieben, in XML, per SSH). Dieses Werkzeug macht daraus ein Formular:
Du wählst ein Referenzsystem von Batocera, passt Name, Dateiendungen, Emulator, Core und Theme an,
und der Manager schreibt die richtige `es_systems_<slug>.cfg` und legt die nötigen Ordner an.

Neben der Systemverwaltung enthält er eine **Live-Übersicht** (CPU, GPU, RAM, Laufwerk und
Lüfter, dazu der Status von EmulationStation und die neuesten Batocera-Versionen, gelesen aus
`/proc` und `/sys`), einen **ROM- und BIOS-Monitor**, der die Systeme nach Gerätetyp gruppiert, einen
**BIOS-Bereich**, der jede Datei gegen den offiziellen Katalog der Konsole selbst prüft (und sie
repariert, ohne die SD zu verlassen), einen **Scraper mit mehreren Quellen** und einen Assistenten für
den **Autostart**.

Auf dem Gerät **muss nichts kompiliert werden**: Das Bundle der Oberfläche liegt bereits kompiliert im
Repository, und das Backend liefert es unverändert aus. Das Backend hat **keine einzige Abhängigkeit**:
Es ist ein HTTP-Server aus der Python-Standardbibliothek. Node brauchst du nur, wenn du an der
Oberfläche etwas ändern willst; um sie auf Batocera zu benutzen, nicht einmal das.

Ausgeliefert wird eine **SPA in React + Tailwind CSS** (in `frontend/`, kompiliert und
versioniert). Die klassische Ein-Datei-Oberfläche (`templates/index.html`) lebt als
**Ausweichlösung** weiter: Liegt das Bundle nicht auf der Konsole, liefert das Backend unbemerkt
diese aus. Beide sprechen mit derselben API.

## 🧩 Warum nur ein Repository?

Das Projekt ist aus einem praktischen Grund so aufgebaut: Während eines Großteils der Entwicklung
gab es **zwei Repositorys** mit demselben Backend.

| | React-Variante | Variante „reines Python“ |
|:--|:--|:--|
| Oberfläche | `frontend/` — SPA in React + Tailwind | `templates/index.html` — alles in einer Datei |
| Backend | `app.py` | `app.py` **identisch** bis auf `APP_REPO` |
| Installer | `install.sh` mit Node-Phase | `install.sh` ohne Node-Phase |

Zwei Kopien desselben Backends (etwa 6000 Zeilen) zu pflegen, ist nicht umsonst: Jede Korrektur
musste in beiden Repositorys eingespielt werden, und es brauchte eine automatische Prüfung, damit
sie nicht unbemerkt auseinanderliefen. Für ein Ein-Personen-Projekt ist das reiner Wartungsaufwand
ohne Nutzen für die Anwender.

Nach der Zusammenlegung sieht es so aus:

- **Ein einziges Backend** (`app.py`), eine API und ein Installer.
- **Zwei Oberflächen auf diesem Backend**: Die React-SPA ist die Hauptoberfläche; die klassische
  Ein-Datei-Oberfläche bleibt als Ausweichlösung, und das Backend liefert sie automatisch aus, wenn
  das Bundle fehlt.
- **Das Repository der Variante „reines Python“ wurde gelöscht** — es hieß `batocera-web-manager`,
  derselbe Name, den dieses jetzt trägt — und seine Historie ist hier gelandet: Sein `master` ist ein
  direkter Vorfahre von diesem, es ging also kein einziger Commit verloren.
- Die API ändert sich nicht: Beide Oberflächen nutzen dieselben `/api/*`-Endpunkte.

## ✨ Funktionen

- **🕹️ Systemverwaltung** — eigene Systeme anlegen, bearbeiten und löschen, mit vollständigem Formular,
  XML-Vorschau und Protokoll dessen, was auf die Platte geschrieben wird.
- **📊 Live-Übersicht** — Tachos für CPU (Auslastung, Kerne, Temperatur), GPU (Modell,
  Auslastung, VRAM, Verbrauch) und RAM; Speicher und Lüfter; Status/PID von EmulationStation und die
  neuesten offiziellen Batocera-Versionen. Mit optionaler automatischer Aktualisierung.
  - **Mit Farbe, ohne Neugestaltung**: Jede Karte hat einen Akzentton (CPU in Bernstein, RAM in Cyan,
    Temperatur in Rosa, Laufwerk in Violett …), und oben auf der Seite liegt ein sehr dezenter
    Farbschimmer. Layout, Diagramme und Raster sind wie immer: Nur der Akzent jedes Elements ändert
    sich. Die Töne sind CSS-Tokens, und jede Diagrammkomponente akzeptiert ein `tone`-Prop; **ohne
    dieses Prop bleibt das Diagramm einfarbig**, der Rest der App sieht also unverändert aus.
- **📚 ROM-Bibliothek: Inventar, Duplikate und Audit** — Der Bereich **ROMs und BIOS** hat zwei
  Reiter. Der ROM-Reiter durchleuchtet die ganze Bibliothek, ohne sie zu hashen (ein
  **Schnell-Fingerabdruck** aus Größe und Anfang/Ende der Datei), meldet Duplikate, Einträge ohne
  Datei, leere Dateien, Medien ohne Spiel und Spiele, die in mehreren Systemen doppelt vorkommen, und
  verschiebt Überflüssiges in eine **Quarantäne** mit **Rückgängig**-Button. Außerdem bereinigt er
  die `gamelist.xml` von Einträgen, die es nicht mehr gibt.
- **🧭 „Was fehlt“: die anderen Versionen der Spiele, die du schon hast** — Statt die 13.000 Spiele
  aufzulisten, die dir aus einem PlayStation-2-DAT fehlen, zeigt es **welche anderen Versionen es von
  den Spielen gibt, die du schon hast** (andere Region, andere Revision, andere Sprache, Disc 2), mit
  Begründung und der Markierung **„bessere Version“**, wenn das Fehlende besser ist als das, was du
  hast. Es wird nichts gelöscht oder umbenannt: Dieser Bereich informiert nur.
- **🔧 Die angebotenen Formate hängen vom System ab, nicht nur von der Datei** — Die Zuordnung stammt
  aus der `es_systems.cfg` der Konsole selbst (inklusive eigener Systeme) und aus der offiziellen
  Wiki: Eine PSP unterstützt kein ZIP und ein GameCube kein CHD, also werden diese Konvertierungen
  gar nicht erst angeboten. Das System-Panel zeigt, welche Formate unterstützt werden, welches
  bevorzugt ist und den Hinweis aus der Wiki; das Werkzeug-Panel zeigt, welches Programm für jede
  Konvertierung gebraucht wird und ob es auf der Konsole ist.
- **📥 Der Installer richtet die Konvertierungswerkzeuge ein** — `rom-converto`, `nodtool` und
  `3dstool` werden aus dem offiziellen Release des jeweiligen Projekts geladen, ihre `sha256` wird
  geprüft (fest im Code hinterlegt, nicht aus dem Netz geladen), und sie landen in
  `/userdata/system/bin`, verlinkt nach `/usr/bin`. Gesteuert wird das mit `BM_UTILS=auto|all|skip`,
  von Hand mit `python3 -m romtools utilidades --list|--install|--remove`.
- **🎲 Zufallsspiel + Statistiken** — Karte mit Cover, Eintrag und Beschreibung eines zufälligen
  Spiels aus deiner Bibliothek, Rangliste der meistgespielten Spiele und Gesamtstunden. Sie füllt sich
  beim Öffnen der App von selbst (mit System, Cover und Metadaten), und der Button **Drehen** ist
  weiterhin da, um jederzeit ein anderes zu holen.
- **📚 Zähler, die die Platte zählen** — Die Karten *Systeme* und *Spiele* der Übersicht zählen, was
  **wirklich auf der SD liegt**: Systeme mit Spielen (nicht nur die eigenen) und echte Spiele
  (Spieldateien und Spielordner), nicht das, was in der `gamelist.xml` steht.
- **🎨 Karten mit eigenen Diagrammen** — Die ganze Übersicht nutzt abgerundete Karten mit eigener
  Farbe: 240°-Tachos, Flächen-Sparklines, ein Donut zur Platten-Belegung und abgerundete Balken. In
  der SPA werden sie mit Recharts gezeichnet, in der klassischen Oberfläche mit reinem CSS/JS.
- **🚀 Autostart** — Fügt den Manager mit einem Klick zur `custom.sh` von Batocera hinzu oder entfernt
  ihn, und weist auf dem Bildschirm darauf hin, wenn er im manuellen Modus läuft (von Hand gestartet,
  ohne Autostart).
- **🧩 Zwei Oberflächen, ein Backend** — Standardmäßig wird die React-SPA ausgeliefert; die klassische
  Ein-Datei-Oberfläche bleibt als Ausweichlösung, falls das Bundle auf der Konsole nicht kompiliert ist.
- **🌗 Helles/dunkles Design** — Die Oberfläche lässt sich dunkel (Standard) oder hell anzeigen oder
  folgt der Systemeinstellung. Der Button in der Seitenleiste schaltet sofort um; in den Einstellungen
  wählst du den Modus. Er wird im Manager gespeichert und gilt daher auf Handy und PC gleichermaßen.
- **🐞 Live-Fehlersuche** — Eine Debug-Ansicht mit dem Ereignisstrom des Managers in Echtzeit: Jede
  Anfrage, Aktion und Warnung kommt per SSE an und lässt sich nach Stufe (debug, info, Warnung,
  Fehler) und nach Text filtern. Der Verlauf liegt im Speicher des Servers (die letzten 500 Ereignisse).
- **🏆 Erfolgs-Dashboard** — Die RetroAchievements-Spiele, in denen du am meisten freigeschaltet hast,
  in Karten mit **dem Cover, das der Scraper** in deiner Bibliothek abgelegt hat, dem Fortschritt in
  Prozent und dem Status jedes Spiels (gemeistert, abgeschlossen, durchgespielt, in Arbeit). Sortieren
  lässt sich nach erreichten Erfolgen, nach Prozent oder nach Gesamtzahl. Ist kein Konto eingerichtet,
  weist der Bereich darauf hin und führt dich zu den Einstellungen.
- **🧲 Scraper in der SPA** — Die Systeme deiner Bibliothek als Karten mit thematischem Symbol, Name,
  kurzer Beschreibung und Anzahl der ROMs. Öffnest du eins, werden die ROMs in *Medien vorhanden* und
  *Medien fehlen* aufgeteilt; über ein schwebendes Fenster scrapst du das ganze System oder ein
  einzelnes Spiel, mit sichtbarem Cover und den drei Quellen nach Priorität (zuerst ScreenScraper,
  TheGamesDB und IGDB als Ausweichquellen).
- **🔄 BIOS-Prüfung beim ersten Start** — Beim ersten Öffnen des Managers prüft er, welche BIOS
  Batocera für **deine** Systeme braucht, lädt fehlende **mit Fortschrittsbalken** aus der Quelle und
  sagt dir, was er gefunden hat und was nicht. Die Installation selbst scannt nicht (dafür muss die
  Konsole schon laufen): Sie richtet es nur ein und weist darauf hin. Und es gibt immer den Button
  **System scannen**, um es von Hand zu wiederholen.
- **🧰 ROM-Werkzeuge** — zwei neue Seiten in der Seitenleiste unter **Werkzeuge**:
  **Formate** (die Images deiner Disc-Systeme erkennen, konvertieren, komprimieren und patchen)
  und **Umbenennen** (die Bibliothek nach der Konvention der Sets ordnen, wie es Romulus
  Manager macht, mit den offiziellen DATs von Redump und No-Intro).
- **🌐 Null Abhängigkeiten** — nur die Python-Standardbibliothek. Optional Pillow, und das nur, um
  Platzhalter-Logos zu erzeugen.

### Was noch in der klassischen Oberfläche ist

Backend und API können alles, aber diese Bereiche **sind noch nicht in der SPA** (im Menü sind sie
als *Bald* markiert). Bis dahin nutzt du sie über die klassische Oberfläche, die das Backend weiterhin
ausliefert:

- **💾 ROM-Monitor** — Inventar pro System (Anzahl ROMs, Dateiendungen, Unterordner), gruppiert in
  aufklappbare Abschnitte nach Gerätetyp (Arcade, Konsolen, Handhelds, Computer, Sonstige) mit
  kombinierbaren Filtern nach Typ und Hersteller. Die **BIOS-Prüfung** ist schon in der SPA
  (Bereich *ROMs und BIOS*), wo sich falsch abgelegte Dateien auch reparieren lassen.
- **🎨 Themes und Assets** — installierte Themes, aktives Theme, erwartete Asset-Struktur und
  Logo-Upload; Logos werden als `art/logo.png` im aktiven Theme gespeichert (hast du keins, erzeugt
  Pillow ein Platzhalter-Logo).
- **✏️ ROM-Bearbeitung** — Dateien umbenennen, Metadaten aktualisieren, Bildinfos ansehen und Cover
  nach Typ hoch- oder herunterladen bzw. löschen.

---

## 📸 Screenshots

Alle stammen von einer **echten Installation** (Batocera 43.1) der React-Oberfläche, die der Manager
standardmäßig ausliefert. *(Die Screenshots zeigen noch die spanische Originaloberfläche.)*

### 📊 Übersicht

Die Startseite fasst den Zustand des Geräts zusammen: Tachos für CPU, RAM, Temperatur und Laufwerk;
Zähler für Systeme, Prozesse, Partitionen und Spiele; die Spielaktivität der letzten Tage und die
Prozesse mit der höchsten CPU-Last. Oben rechts wählst du, wie oft aktualisiert wird (automatisch,
alle 30 s oder manuell), und das Design (hell oder dunkel).

Die Zähler in der Mitte schauen auf **die echte Bibliothek**: *Systeme* zeigt die Systeme mit Spielen
(mit der Zahl der eigenen Systeme im Hilfstext), und *Spiele* zählt die Spiele auf der Platte. Die
Karte *Zufallsspiel* bleibt nicht leer: Beim Öffnen der App zeigt sie schon ein Spiel mit Cover und
Metadaten, und **Drehen** wechselt das Spiel.

![Übersicht](docs/screenshots/01-dashboard.png)

*Übersicht mit Live-Tachos, den Zählern der Bibliothek und den Diagrammen zu Aktivität und Last.
Jede Karte hat ihren eigenen Akzentton: Das Layout ist wie immer, nur etwas farbiger.*

### 🕹️ Eigene Systeme

Die mit dem Manager angelegten eigenen Systeme, mit ROM-Ordner, Theme, Hardware-Typ und der Datei
`es_systems_<slug>.cfg`, die sie definiert. Von hier aus werden sie bearbeitet.

![Eigene Systeme](docs/screenshots/02-sistemas.png)

*Liste der angelegten Systeme mit Suche und Direktzugriff zum Bearbeiten.*

### ✏️ System hinzufügen

Das Formular zum Anlegen: Du wählst ein Referenzsystem aus dem Batocera-Katalog, das Formular füllt
sich von selbst, und du passt Identität (Name, Slug, Hersteller, Jahr, Gerätetyp, Plattform), ROMs
und Dateiendungen, Theme und Beschreibung an. Rechts siehst du **die XML-Vorschau** dessen, was
geschrieben wird, und du kannst **simulieren, ohne etwas zu schreiben**.

![System hinzufügen](docs/screenshots/03-anadir-sistema.png)

*Formular zum Anlegen eines eigenen Systems, mit Vorschau der `es_systems_<slug>.cfg`.*

### 🏆 Erfolge

Die RetroAchievements-Spiele, in denen du am meisten freigeschaltet hast. Jede Karte zeigt **das
Cover, das der Scraper** in deiner Bibliothek abgelegt hat (ist das Spiel keinem lokalen ROM
zugeordnet, wird das RetroAchievements-Symbol verwendet), die erreichten Erfolge von der Gesamtzahl,
den Prozentsatz, den Status und wann du den letzten geholt hast.

Die Daten werden **einmal heruntergeladen und gespeichert** (im Speicher und auf der Platte, neben den
Einstellungen des Managers). Der Bereich ruft also beim Öffnen nicht die RetroAchievements-API auf:
Angezeigt werden die gespeicherten Daten, und nur der Neu-laden-Button holt frische Daten, immer mit
einem Mindestabstand zwischen Anfragen. Die RA-API veröffentlicht kein festes Kontingent, bittet in
ihrer Doku aber um maßvolle Anfragen — daher der Cache.

![Erfolge](docs/screenshots/06-logros.png)

*Erfolgs-Dashboard: Die Cover kommen vom Scraper, der Ring zeigt den Fortschritt in Prozent.*

### 🧲 Scraper

Die Systeme deiner Bibliothek als Karten: jede mit thematischem Symbol (ein Joystick für Arcade, ein
Controller für Konsolen, ein Bildschirm für Handhelds, eine Disc für CD-Konsolen), dem Systemnamen,
einer kurzen Beschreibung und der Anzahl der ROMs. Die Filter grenzen nach Text, Gerätetyp und Status
ein (mit Medien, ohne Medien, leer), sortiert wird nach Anzahl der ROMs oder nach Cover-Abdeckung.

![Scraper](docs/screenshots/07-scraper.png)

*Systemkarten mit thematischem Symbol, Anzahl der ROMs und Cover-Abdeckung.*

Öffnest du ein System, werden seine ROMs in **Medien vorhanden** und **Medien fehlen** aufgeteilt:

![ROMs des Systems](docs/screenshots/08-scraper-roms.png)

*Die ROMs des Systems mit Cover und der Aufteilung in die, die schon ein Bild haben, und die ohne.*

In der Liste **erscheinen nur Spiele**: Die `_info.txt` jedes Systems, die `gamelist.xml` und
Spielstände (`.srm`, `.dat`, `.keys` …) werden weder aufgelistet noch gescrapt.

Von dort aus kannst du in einem schwebenden Fenster **das ganze System** oder ein einzelnes Spiel mit
ScreenScraper, TheGamesDB oder IGDB **scrapen**: Du wählst Quelle und Optionen, und mit
**Aktualisieren**, **Bearbeiten** und **Speichern** werden die Zugangsdaten geprüft und bestätigt; sie
werden auf der Konsole gespeichert und nie angezeigt.

Im Fenster eines Spiels siehst du **das Cover**, das die Quelle anbietet (das heruntergeladen wird),
woher es stammt und welche Bilder zum Herunterladen verfügbar sind (2D-Box, Fanart, Screenshot,
Logo …). Die Quellen lassen sich einzeln ein- und ausschalten und erscheinen **nach Priorität
nummeriert**: zuerst ScreenScraper und, falls das Spiel dort nicht gefunden wird, TheGamesDB und IGDB
als Ausweichquellen. Der **Zurück**-Button ist immer in der oberen Leiste, du musst also nicht nach
oben scrollen, um das System zu wechseln.

Beim Speichern aktualisiert sich die Tabelle sofort: Das Spiel wandert von **Medien fehlen** zu
**Medien vorhanden**, ohne die Seite neu zu laden, und ein Hinweisfenster bestätigt den Erfolg (es
schließt sich nach ein paar Sekunden von selbst). Geht etwas schief, bleibt der Hinweis mit **dem
Fehlerprotokoll** und einem **Schließen**-Button stehen.

Und wenn das Scraping mit dem Dateinamen **nichts findet**, bietet das Fenster an, **diesen Namen zu
bearbeiten**, um die Suche einzugrenzen („007: Agent Under Fire“, „Super Mario Sunshine“ …), mit einem
**Suchen**-Button daneben. Das ROM wird nicht umbenannt: Die Daten werden weiterhin in der
Originaldatei gespeichert.

Und wenn das Spiel **schon seinen Eintrag hat**, wird es nicht erneut gescrapt: Ein Klick öffnet
seine **lokalen Infos** (die schon in der `gamelist.xml` stehen) mit **seinem Cover aus der
Bibliothek**, und gescrapt wird nur, was noch keine Medien hat. Der Eintrag lässt sich von Hand
**bearbeiten**, und „Scrapen“ ist weiterhin da, falls du ihn aus den Quellen aktualisieren willst.

![Scraping-Fenster](docs/screenshots/09-scraper-modal.png)

*Das Fenster eines Spiels: das Cover, die Quellen nach Priorität und die herunterzuladenden Bilder.*

### 🐞 Fehlersuche

Der Ereignisstrom des Managers in Echtzeit: Jede Anfrage, Aktion und Warnung kommt per SSE an. Er
lässt sich nach Stufe (debug, info, Warnung, Fehler) und Text filtern, pausieren und leeren, und der
Verlauf liegt im Speicher des Servers (die letzten 500 Ereignisse).

![Fehlersuche](docs/screenshots/04-depuracion.png)

*Live-Ereignisstrom mit Zählern pro Stufe und Suchfilter.*

### ⚙️ Einstellungen

Der Dienststatus (Autostart, PID, Port und der Block in `custom.sh` zum Ansehen), das Design der
Oberfläche, die **Systeminformationen** (Version des Managers, welche Oberfläche gerade ausgeliefert
wird, Python, Node, Pillow, Port, Bundle und Startskript) und die eingebauten **Anleitungen** zum
Installieren, Aktualisieren oder Neukompilieren.

![Einstellungen](docs/screenshots/05-configuracion.png)

*Einstellungen mit Dienststatus, Systeminformationen und Anleitungen.*

---

## 🚀 Installation

Alles wird direkt auf Batocera per SSH installiert. **Du brauchst nur Python 3**, und das ist im
System schon enthalten.

Bevor irgendetwas installiert wird, **prüft der Installer die Hilfsprogramme**: Sind Git und Node
schon da, macht er ohne Rückfrage weiter; fehlt eins, weist er darauf hin, dass es nötig ist, und
installiert es (Git mit micromamba aus dem Kanal `conda-forge`, Node mit dem offiziellen Tarball von
nodejs.org; in beiden Fällen wird vor dem Entpacken die sha256 geprüft). Mit `BM_GIT=skip` und
`BM_NODE=skip` überspringst du diesen Teil.

```bash
ssh root@BATOCERA

git clone https://github.com/shakanuga/batocera-web-manager-de.git /userdata/system/batocera_web
cd /userdata/system/batocera_web
bash install.sh
```

(Du kannst ihn auch direkt starten: `./install.sh`, er ist bereits ausführbar.)

> 🇩🇪 Dieses Repository ist die deutsche Fassung (Fork von
> [Thundertruck4K/batocera-web-manager](https://github.com/Thundertruck4K/batocera-web-manager)).

**Ohne git** (Batocera bringt es standardmäßig nicht mit): Du kannst den aktuellen Stand als Archiv
herunterladen und entpacken:

```bash
cd /userdata/system
wget -O batocera_web.tar.gz https://github.com/shakanuga/batocera-web-manager-de/archive/refs/heads/master.tar.gz
tar -xzf batocera_web.tar.gz
mv batocera-web-manager-de-master batocera_web
chmod +x batocera_web/install.sh
cd batocera_web
./install.sh
```

Der Installer prüft zuerst die **Hilfsprogramme** (Git und Node): Sind sie schon da, geht die
Installation ohne Rückfrage weiter; fehlen sie, weist er darauf hin und installiert sie. Danach prüft
er Python und Pillow (optional), validiert den Port, legt die Dateien in
`/userdata/system/batocera_web/` ab und **fragt, ob du den Autostart willst**: Wenn ja, schreibt er
einen markierten Block in `/userdata/system/custom.sh` und startet den Manager sofort.

Zum Schluss **installiert er auch die Konvertierungswerkzeuge**, die sich automatisch laden lassen
(`rom-converto`, `nodtool` und `3dstool`): Sie werden aus dem offiziellen Release jedes Projekts
geladen, ihre `sha256` wird geprüft, und sie landen in `/userdata/system/bin`, verlinkt nach
`/usr/bin`. Ändern lässt sich das mit `BM_UTILS=auto|all|skip`.

**Die Prüfsummen sind fest im Code hinterlegt** (`romtools/utilidades.py`) und werden nicht aus dem
Netz geladen: Ändert sich ein Release, kann kein anderes Binary als das erwartete untergeschoben
werden. Passt die Summe nicht, **wird nichts installiert** und es gibt eine Warnung. Der Download
**zeigt den Fortschritt in Prozent**, und der Installer weist darauf hin, dass du das Fenster nicht
schließen musst (es sind etwa 50 MB).

Die Werkzeuge lassen sich auch von Hand verwalten, ohne Installer:

```bash
cd /userdata/system/batocera_web
python3 -m romtools utilidades --list      # was da ist und was fehlt
python3 -m romtools utilidades --install   # installiert fehlende
python3 -m romtools utilidades --remove    # entfernt sie
```

Was sich **nicht** installieren lässt, wird mit Begründung angezeigt statt verschwiegen: `dolphin-tool`
(Dolphin wird mit `-DENABLE_CLI_TOOL=OFF` kompiliert), `wiitool` (kein Release mit Binaries),
`ndstool` (das einzige vorkompilierte braucht den musl-Loader aus `/opt/wonderful`), `extract-xiso`
(keine Lizenzangabe), `maxcso` (das Release enthält nur das Windows-Binary) sowie `xorriso`,
`cdrdao` und `makecue` (entweder wird kein Binary veröffentlicht oder der Manager erledigt es schon in
Python). Die vollständige Liste mit Lizenzen und Repositorys steht in
[`docs/utilidades-conversion.md`](docs/utilidades-conversion.md) (spanisch).

Der Startblock wird bei jeder Installation **neu geschrieben** (er wird nicht verdoppelt und behält
keinen alten Port) und beginnt mit einem `pkill`, der die vorherige Instanz beendet, damit der neue
Manager nicht ohne Port dasteht, falls er von Hand gestartet war. Lief der Manager schon, hält der
Installer ihn an und startet ihn mit dem neuen Code neu.

Am Ende siehst du etwa Folgendes:

```
  ╭─────────────────────────────────────────────────────────
  │  Batocera System Manager · Installer
  │  Ziel: /userdata/system/batocera_web
  ╰─────────────────────────────────────────────────────────

  ◆ Python 3               ✔ Python 3.12.x
  ◆ Pillow (logos)         ✔ verfügbar
  ◆ Git                    ✔ git version 2.56.0 · /usr/bin/git
  ◆ Node.js                ✔ v26.13.0 · /usr/bin/node
  ◆ Werkzeuge              ✔ git und node bereit

  Den Manager zum Autostart von Batocera hinzufügen?
     Dann startet er jedes Mal von selbst, wenn du die Konsole einschaltest.
  [J]a / [n]ein: j
  ◆ Autostart              ✔ Block in /userdata/system/custom.sh
  ✔ Jetzt gestartet auf Port 5000

  ╰─ Fertig. Öffne http://BATOCERA:5000
```

### Git (optional)

Git brauchst du nicht, um den Manager zu **benutzen**, aber es ist der bequeme Weg, ihn zu
aktualisieren (`git pull`). Batocera ist **Buildroot**: Es bringt weder `git` noch einen
Paketmanager oder Compiler mit.

Findet der Installer es nicht, weist er darauf hin und installiert es mit **micromamba**, einem
statischen Binary, aus dem Kanal `conda-forge`:

1. micromamba (2.10.0) wird heruntergeladen und **seine sha256 wird** gegen den im Skript
   hinterlegten Hash **geprüft**: Passt sie nicht, wird nichts entpackt.
2. Die Umgebung wird mit `micromamba create` in `/userdata/system/mamba/envs/git` angelegt (das
   prüft die sha256 jedes heruntergeladenen Pakets).
3. `git` wird nach `/usr/bin` verlinkt und der Paket-Cache gelöscht, der Hunderte MB belegt.
4. In `custom.sh` wird ein Block `# [batocera-git]` geschrieben, damit der Link bei jedem Start neu
   angelegt wird (`/usr` ist ein Overlay, das beim Neustart verloren geht).

Achtung: Das `git`-Paket von conda-forge zieht etwa 250 MB nach sich (Perl, OpenSSL, curl …).
Wenn du lieber nichts installieren willst, nimm den Weg über das Release-Tarball und aktualisiere
von Hand.

### Node.js (optional)

**Zum Benutzen des Managers nicht nötig**: Das Frontend wird schon kompiliert in `frontend/dist/`
ausgeliefert, die Konsole braucht also weder Node noch einen Build-Schritt. Node dient nur dazu, das
Bundle auf der Konsole selbst *neu zu kompilieren*.

Findet der Installer es nicht, fragt er, ob du es installieren willst. Die Konsole ist **Buildroot**
(ohne `apt`, `dpkg` oder Paketmanager), daher geschieht das mit dem offiziellen Tarball von nodejs.org:

1. Das Tarball der **neuesten LTS** wird geladen (oder der in `BM_NODE_VERSION` festgelegten Version).
2. **Die sha256 wird gegen die offizielle `SHASUMS256.txt` geprüft**: Passt sie nicht, wird nichts entpackt.
3. Es wird nach `/userdata/system/node/` entpackt und der Link `current` angelegt.
4. `node`, `npm`, `npx` und `corepack` werden nach `/usr/bin` verlinkt.
5. In `custom.sh` wird ein Block `# [batocera-node]` geschrieben, damit die Links bei jedem Start neu
   angelegt werden (`/usr` ist ein Overlay, das beim Neustart verloren geht) und damit
   `npm_config_prefix` und `npm_config_cache` dauerhaft auf der SD liegen.

### Optionen des Installers

| Variable | Standard | Wofür |
|---|---|---|
| `BM_PORT` | `5000` | Port des Webservers (zwischen 1 und 65535) |
| `BM_BASE_DIR` | `/userdata/system` | Basisordner von Batocera |
| `BM_CUSTOM_SH` | `$BM_BASE_DIR/custom.sh` | Startskript, das geändert wird |
| `BM_PYTHON` | `python3` | Zu verwendender Interpreter |
| `BM_AUTOSTART` | *(fragt)* | `j` / `n` (oder `s` / `y`) für unbeaufsichtigte Installationen |
| `BM_GIT` | `auto` | `auto` (installiert es, falls es fehlt), `install` (installiert es auf jeden Fall) oder `skip` |
| `BM_GIT_DIR` | `$BM_BASE_DIR/mamba` | Wo Git installiert wird (die Umgebung liegt in `$BM_GIT_DIR/envs/git`) |
| `BM_GIT_BIN_DIR` | `/usr/bin` | Wohin die Binaries verlinkt werden |
| `BM_MICROMAMBA_URL` | `https://micro.mamba.pm/api/micromamba` | Spiegel für micromamba (falls ein anderer nötig ist) |
| `BM_MICROMAMBA_VERSION` | `2.10.0` | Version von micromamba |
| `BM_MICROMAMBA_SHA256` | *(der von conda-forge)* | Erwarteter Hash: Passt er nicht, wird nichts installiert |
| `BM_CONDA_CHANNEL` | `conda-forge` | Conda-Kanal, aus dem Git kommt |
| `BM_NODE` | `auto` | `auto` (fragt, wenn kein Node da ist), `install` (installiert es auf jeden Fall) oder `skip` |
| `BM_NODE_VERSION` | *(neueste LTS)* | Bestimmte Node-Version, z. B. `v26.13.0` |
| `BM_NODE_DIR` | `$BM_BASE_DIR/node` | Wo Node installiert wird |
| `BM_NODE_BIN_DIR` | `/usr/bin` | Wohin die Binaries verlinkt werden |
| `BM_NODE_URL` | `https://nodejs.org/dist` | Spiegel für nodejs.org (falls ein anderer nötig ist) |
| `BM_UTILS` | `auto` | `auto` (installiert fehlende), `all` (installiert alle) oder `skip` |
| `BM_TOOLS_DIR` | `$BM_BASE_DIR/bin` | Wo die Konvertierungswerkzeuge abgelegt werden |
| `BM_TOOLS_BIN_DIR` | `/usr/bin` | Wohin sie in den `PATH` verlinkt werden |
| `NO_COLOR` | — | Schaltet die farbige Ausgabe ab |

Beispiel ohne Rückfragen: `BM_PORT=8080 BM_AUTOSTART=j bash install.sh`

Mit erzwungener Installation von Git und Node, ohne Rückfragen: `BM_GIT=install BM_NODE=install BM_AUTOSTART=j bash install.sh`

Ohne Git (oder Node) zu installieren: `BM_GIT=skip BM_NODE=skip BM_AUTOSTART=j bash install.sh`

### Auf die neueste Version aktualisieren

Wenn er schon installiert ist und du **git** auf der Konsole hast:

```bash
cd /userdata/system/batocera_web
git pull
./install.sh
```

Der Installer hält die laufende Instanz an und startet die neue mit dem frisch geladenen Code, du
musst also nichts von Hand beenden.

> 🇩🇪 `git pull` holt den Stand dieses deutschen Forks. Neue Versionen des spanischen Originals
> kommen erst hier an, wenn sie übernommen und übersetzt wurden.

Wenn du **kein git** hast (Batocera bringt es standardmäßig nicht mit), lade die neueste Version
herunter und ersetze den Ordner (deine Einstellungen, Themes und ROMs liegen außerhalb, gehen also
nicht verloren):

```bash
cd /userdata/system
mv batocera_web batocera_web.bak
wget -O batocera_web.tar.gz https://github.com/shakanuga/batocera-web-manager-de/archive/refs/heads/master.tar.gz
tar -xzf batocera_web.tar.gz
mv batocera-web-manager-de-master batocera_web
chmod +x batocera_web/install.sh
cd batocera_web
BM_AUTOSTART=j ./install.sh
```

Der Installer erkennt, dass die Dateien schon an ihrem Platz sind, und startet nur den Dienst mit dem
neuen Code neu. Wenn du geprüft hast, dass alles läuft, lösche die Sicherung:
`rm -rf /userdata/system/batocera_web.bak`.

### Manueller Start (ohne Autostart)

Wenn du ihn lieber von Hand startest (oder ihn ausprobieren willst, bevor du ihn fest einrichtest):

```bash
python3 /userdata/system/batocera_web/app.py --port 5000
```

Der Manager erkennt das: In den **Einstellungen** erscheint ein Hinweis auf den *manuellen Modus* und
ein Button, um den Autostart mit einem Klick zu aktivieren.

> **Pillow (optional).** Wird nur verwendet, um Platzhalter-Logos zu erzeugen, wenn ein System kein
> Logo hat. Zum Installieren: `python3 -m pip install pillow --break-system-packages`

---

## 📖 Bedienung

Nach der Installation öffnest du im Browser:

```
http://BATOCERA:5000          # ersetze BATOCERA durch den Namen oder die IP deines Geräts
```

Der Server lauscht auf `0.0.0.0`, funktioniert also auch vom Handy aus.

| Bereich | Wofür |
|---|---|
| **Übersicht** | Systemstatus live, Zufallsspiel, Statistiken und Aktivität |
| **Eigene Systeme** | Die mit dem Manager angelegten Systeme: XML ansehen und bearbeiten |
| **System hinzufügen** | Formular, um ein System auf Basis eines Referenzsystems aus dem Katalog anzulegen |
| **Fehlersuche** | Live-Ereignisstrom des Managers, filterbar nach Stufe und Text |
| **Einstellungen** | Dienststatus und Autostart (mit sichtbarem Block aus `custom.sh`), Design der Oberfläche, Systeminformationen und Anleitungen |
| **Erfolge** | RetroAchievements-Dashboard: die Spiele mit den meisten Erfolgen, mit dem Cover aus deiner Bibliothek |
| **Scraper** | Scrapt Cover und Metadaten für ein ganzes System oder ein einzelnes Spiel von ScreenScraper, TheGamesDB oder IGDB |
| **ROMs und BIOS** | Inventar der Bibliothek (Duplikate, Audit und Quarantäne mit Rückgängig), Prüfung der BIOS gegen den offiziellen Katalog der Konsole (was korrekt ist, was fehlt und was falsch abgelegt ist, mit Reparatur direkt auf der SD, manuellem Upload und Ausnahmeliste) und **Was fehlt**: die anderen Versionen der Spiele, die du schon hast |
| **Werkzeuge → Formate** | Images deiner Disc-Systeme erkennen, konvertieren, komprimieren und patchen, je nachdem, was das System unterstützt |
| **Werkzeuge → Umbenennen** | Die Bibliothek nach der Konvention der Sets (Redump und No-Intro) ordnen, mit Vorschau-Plan, Fortschritt im Hintergrund und Rückgängig |

Nachdem du ein System angelegt oder geändert hast, muss Batocera seine Konfiguration neu einlesen:
Der Manager bietet an, EmulationStation direkt aus der Oberfläche neu zu starten.

---

## 🧲 Cover-Scraper

Der Scraper arbeitet in drei Modi (**ein Spiel**, **ein ganzes System** oder **Stapel-Warteschlange**)
und unterstützt drei Quellen:

| Quelle | Zugangsdaten |
|---|---|
| **ScreenScraper.fr** (Standard) | Benutzername und Passwort des Kontos |
| **TheGamesDB** | API-Key |
| **IGDB (Twitch)** | Client-ID und Client-Secret |

**ScreenScraper kommt immer zuerst**, TheGamesDB und IGDB dienen als Ausweichquellen: Hat die erste
Quelle keine Daten zum Spiel, werden die nächsten der Reihe nach probiert, und die erste, die es
findet, gewinnt. In der SPA lässt sich jede Quelle direkt im Fenster ein- oder ausschalten, und es
wird angezeigt, welche getroffen hat und welche keine Infos hatten.

Die Zugangsdaten werden aus der Batocera-Konfiguration (`batocera.conf`) gelesen und über die
Weboberfläche gespeichert. Die Bilder werden nach der Namenskonvention von EmulationStation
geschrieben (`images/<rom>-image.png`, `-box`, `-wheel`, `-fanart`, `-marquee`, `-thumbnail` …), sie
erscheinen also, ohne dass du sonst etwas ändern musst. Die Anfragelimits jeder API werden eingehalten
(maximale Threads und Mindestpause).

**Spiele, die ein Ordner sind.** Bei manchen Systemen ist das Spiel keine Datei, sondern ein Ordner
(ScummVM: `Myst.scummvm/`, DOSBox: `Alone in the Dark.pc/`, MUGEN: `kof94.pc/`). Das ist die
Konvention von EmulationStation: Trägt der Ordnername eine Dateiendung des Systems, **ist der Ordner
das Spiel**, und die `gamelist.xml` speichert seinen Pfad (`<path>./Myst.scummvm</path>`). Der Manager
berücksichtigt das und scrapt nach dem Ordnernamen (ohne Endung), also dem Spieltitel; Eintrag und
Cover werden genauso gespeichert wie bei einem normalen ROM.

**Was als Spiel gilt.** Maßstab ist EmulationStation: Eine Datei ist ein Spiel, wenn ihre Endung zu
denen des Systems gehört (aus der `es_systems.cfg`: der des Benutzers, falls er das System definiert,
sonst der offiziellen) **plus** die globale Liste der ROM-Endungen, damit nichts verloren geht.
Draußen bleiben Dateien, die auf keinen Fall Spiele sind — die `_info.txt`, die die Formate jedes
Systems dokumentiert, die `gamelist.xml`, Spielstände (`.sav`, `.srm`, `.state`, `.autosave`,
`.mstate`, `.save`, `.ram`), Tastenbelegungen (`.keys`), `.dat` sowie `.cfg`/`.ini` —: **Sie werden
weder aufgelistet noch gescrapt**. Zwei Feinheiten: Deklariert das System selbst eine Endung, gilt
seine Deklaration (die `.dat` von **naomi**, atomiswave oder systemsp *sind* das Spiel), und
Konfigurationsdateien von Emulatoren (`citron_config.xci_config`) bleiben immer draußen. Dasselbe
Kriterium gilt für die Spielezähler der Übersicht und für das Zufallsspiel.

---

## 🧬 BIOS

Der Bereich **ROMs und BIOS** der SPA prüft System für System, ob die BIOS, die Batocera verlangt,
an der richtigen Stelle liegen und den richtigen Inhalt haben.

**Der Katalog kommt von der Konsole selbst**, nicht aus einer im Manager eingefrorenen Liste: Die
BIOS-Liste ändert sich mit der Batocera-Version, daher wird sie aus `/usr/bin/batocera-systems`
gelesen (dem offiziellen Skript mit Slug und Name des Systems, dem Pfad jedes BIOS, seinem md5 und
**welche Datei in jedem ZIP stecken muss**), mit der `readme.txt` aus
`/usr/share/batocera/datainit/bios/` als Rückfallebene. Deshalb weiß der Manager, was *deine* Version
verlangt, und nicht die einer anderen.

**Jedes BIOS hat einen Status**: `korrekt` (an seinem Platz und mit dem Hash, den Batocera verlangt),
`ungeprüft` (an seinem Platz, aber Batocera veröffentlicht keinen Hash), `abweichender Hash`, `eine
Datei fehlt` im ZIP, `reparierbar` (der Inhalt liegt in einem anderen ZIP oder Ordner auf der SD),
`fehlt`, `übersprungen` (brauchst du nicht) und `unlesbar`. Die Karten sind nach Dringlichkeit
sortiert: zuerst das, was das Spielen verhindert.

**Nach Inhalt prüfen, nicht nach Name.** Batocera vergleicht nicht den Hash des ZIPs (der zu einem
bestimmten ZIP gehört), sondern den Hash dessen, was **darin** steckt. Der Manager öffnet das ZIP und
prüft jedes Element — genau wie Batocera. Darum kann ein BIOS völlig in Ordnung sein und trotzdem
keinen eigenen veröffentlichten Hash haben.

**Der Hash ist kein Urteil.** Auch Batocera ist beim BIOS-Hash nicht streng: Liegt die Datei an ihrem
Platz, funktioniert der Emulator trotzdem (die BIOS von triforce oder hikaru zum Beispiel starten die
Spiele mit dem Hash, der auf der Karte war). Der Status wird daher nach **Vorhandensein und Struktur**
bestimmt — liegt die Datei dort, wo sie erwartet wird, und enthält das ZIP, was der Katalog verlangt —,
und der md5 wird als Information berechnet und angezeigt, nicht als Urteil.

**Reparieren, ohne die SD zu verlassen.** Liegt der fehlende Inhalt schon auf der Konsole (in einem
anderen ZIP oder Ordner), stellt der Manager ihn zusammen, legt ihn genau in den Pfad, den der Katalog
verlangt, prüft das Ergebnis und legt die Originaldatei in `/userdata/bios/.quarantine/` ab. Gibt es
nichts einzusetzen, wird das Ziel nicht angefasst.

**Nicht auf der Konsole: Google oder manueller Upload.** Der Button *Reparieren* bleibt nicht bei
„nicht gefunden“ stehen: Ist der Inhalt nicht auf der SD, bietet die App die beiden verbleibenden Wege
an — **bei Google suchen** (direkter Link mit dem exakten, in Anführungszeichen gesetzten Dateinamen
und ein weiterer mit den BIOS des Systems) oder **die Datei hochladen** (die App legt sie an ihren
Platz und prüft, dass sie richtig liegt). Ist das BIOS ein ZIP, musst du das vollständige ZIP hochladen.

### 🔄 Die Prüfung beim ersten Start

Der Batocera-Katalog sagt, welche BIOS nötig sind, **liefert sie aber nicht mit**: Er nennt Name und
Hash. Damit du nicht jedes BIOS von Hand suchen musst, lädt der Manager sie aus **einer Quelle, die
sie alle schon hat**, in derselben Anordnung, in der Batocera sie erwartet (`Acorn/basic2.rom`,
`enterprise/ep128emu/roms/exos21.rom` …), das Herunterladen ist also nur ein Kopieren an den richtigen
Platz.

**Das passiert nicht bei der Installation.** `install.sh` **richtet** die Prüfung nur **ein** (es
löscht die Markierung in `/userdata/system/batocera_manager_bios_first.json`) und weist darauf hin.
Der Scan selbst braucht den BIOS-Katalog der Konsole — den es nur bei laufendem Manager gibt —, und
der Fortschritt lässt sich nur in der Oberfläche anzeigen, nicht im Terminal. Beim **ersten Öffnen
des Managers** erscheint ein Fenster, das:

- prüft, welche BIOS Batocera für deine Systeme braucht;
- fehlende aus der Quelle lädt, **mit Fortschrittsbalken** (und darauf hinweist, dass du das Fenster
  nicht offen lassen musst);
- meldet, **wie viele geprüft, wie viele heruntergeladen wurden, wie viele nicht in der Quelle sind
  und wie viele Probleme gemacht haben**, und die Liste der nicht gefundenen zeigt.

**Der Button *System scannen*** ist im BIOS-Bereich immer griffbereit (in der oberen Leiste) und auch
im Fenster selbst, um die Prüfung jederzeit zu wiederholen.

**Die Quelle ist ein Verzeichnisindex**, daher muss nicht der ganze Baum geladen werden: Indiziert
werden **nur die benötigten Ordner** (6 Anfragen für 51 BIOS gegenüber ~64 für den ganzen Baum, was auf
der Konsole mehrere Minuten wären). Zugeordnet wird in dieser Reihenfolge: exakter Pfad → exakter Pfad
ohne Groß-/Kleinschreibung → gleicher Dateiname in einem anderen Ordner.

**Was nicht in der Quelle ist, wird nicht erfunden.** Taucht ein BIOS nicht auf, wird es mit Namen
gemeldet und bleibt, wie es war; es wird nirgendwo anders gesucht. **Was schon passt, wird nicht
angefasst**: Es wird nur geladen, was fehlt, und nach dem Download wird erneut gescannt, um zu prüfen,
dass jedes BIOS dort liegt, wo Batocera es erwartet.

Standardmäßig wird diese Quelle verwendet:
`http://rgsretro1986.ds78102.seedhost.eu/update/Batocera/bios/` (ein Apache-Index mit den BIOS in
derselben Anordnung wie bei Batocera). Auf der Entwicklungskonsole wurden von 51 fehlenden BIOS 49 über
ihren exakten Pfad gefunden; die beiden anderen (`BBCMicro/dfs-2.26.rom` und `BBCMicro/os12.rom`) sind
nicht in der Quelle und werden als solche gemeldet.

> ⚖️ Hinweis: BIOS-Dateien sind urheberrechtlich geschützt. Ob du sie aus einer solchen Quelle laden
> darfst, hängt von deiner Rechtslage ab (in der Regel nur von eigener Hardware).

---

## 🧰 ROM-Werkzeuge

In der Seitenleiste fasst **Werkzeuge** zwei Seiten zusammen, die mit den Dateien der Bibliothek
arbeiten: **Formate** und **Umbenennen**. Das Backend dahinter ist das Paket `romtools/`, in Python
aus der Standardbibliothek (ohne Abhängigkeiten, wie der Rest des Projekts).

### 🧬 Formate: konvertieren, komprimieren und patchen

**Formate** listet die Dateien eines Systems mit dem erkannten Format auf und lässt dich damit
arbeiten. Das Format wird **anhand des Datei-Headers** bestimmt, nicht anhand der Endung: Eine
GameCube-`.iso`, eine falsch benannte `.v64` oder eine `.chd` werden als das erkannt, was sie
wirklich sind. In der echten Bibliothek einer Konsole wurden früher 64 % der Dateien als „unbekanntes
Format“ angezeigt; jetzt wird fast alles erkannt (BIN+CUE, ISO 9660 und von welcher Konsole, PBP,
XDVDF, GCM, CHD, WBFS, WIA, RVZ, MDF/CCD, G64/NDD, 3DO, NSP, XCI, WAD, ZIP, IPS …), und wenn sich
etwas nicht konvertieren lässt, sagt die Oberfläche das, statt eine Lücke zu lassen.

**Welche Optionen angeboten werden, hängt vom System ab, nicht nur vom Format.** Die Zuordnung stammt
aus der `es_systems.cfg` der Konsole (derselben, die EmulationStation nutzt, inklusive eigener
Systeme) und aus der offiziellen Wiki: Eine PSP unterstützt kein ZIP und ein GameCube kein CHD, also
werden diese Konvertierungen nicht angeboten. Mit gewähltem System zeigt die Seite die unterstützten
Formate, das bevorzugte und was man darüber wissen sollte.

- **Konvertieren** zwischen Formaten, die sich verlustfrei wiederherstellen lassen: BIN/CUE ↔ ISO,
  PBP ↔ BIN/CUE, XDVDF → ISO, GCM → ISO, Nintendo 64 zwischen seinen drei Byte-Reihenfolgen (`.n64`,
  `.z64`, `.v64`), Super Nintendo zwischen `.sfc`, `.smc` und `.fig`, ISO ↔ CSO/CISO/GCZ (PSP,
  GameCube und Wii), ISO ↔ CHD und proprietäre Disc-Images (GDI, MDS, CCD) → ISO.
- **Stapelkonvertierung**: Du wählst ein Ziel, und alle Dateien des Systems, die es unterstützen,
  werden konvertiert, optional gefiltert nach Quellformat. Am Ende gibt es eine Zusammenfassung, wie
  viele geklappt haben und warum die anderen fehlgeschlagen sind.
- **Komprimieren** und **entpacken** als **ZIP** und **7Z**. Komprimierung ist eine Eigenschaft des
  **Systems**, nicht des Formats: Unterstützt das System `.zip` oder `.7z`, wird es für jedes ROM
  angeboten. Bei einem SNES spart ZIP viel Platz; bei einer PSP, die kein ZIP lesen kann, wird es
  nicht angeboten.
- **Patchen** mit einem IPS-Patch und das Rückgängigmachen.

Externe Werkzeuge werden auf der Konsole erkannt: **CHD** wird mit `chdman` von MAME erstellt, das
schon in Batocera steckt (`/usr/bin/chdman`), und **7Z** mit `7z` aus p7zip.

**RVZ** (das von der Batocera-Wiki für GameCube und Wii empfohlene Format) und **WBFS** werden mit
**`rom-converto`** erstellt. Es ist nicht im Image enthalten, aber **das `install.sh` installiert es
selbst** beim ersten Durchlauf: Es ist ein Linux-Binary mit veröffentlichter `sha256`, das nach
`/userdata/system/bin` kopiert wird (der Pfad, der Neustarts übersteht) und nach `/usr/bin` verlinkt
wird. Das `install.sh` hinterlässt in der `custom.sh` einen Block, der diesen Link bei jedem Start
wieder anlegt, weil `/usr` ein Overlay ist, das beim Neustart verloren geht.
Damit installiert konvertiert der Manager wirklich: GameCube-ISO oder -GCM → RVZ, Wii-ISO oder -WBFS
→ RVZ, GCZ oder WIA → RVZ, RVZ → ISO und Wii-RVZ → WBFS.
Auf dieselbe Weise werden **`nodtool`** (die komprimierten Dolphin-Formate) und **`3dstool`**
installiert, jeweils mit geprüfter `sha256`.

Fehlende Werkzeuge erscheinen **deaktiviert** und sagen, was fehlt und wie du es bekommst, statt so
zu tun, als hätte es geklappt. Die Seite enthält ein **Werkzeug-Panel** mit der vollständigen Liste:
wofür jedes gut ist, seine Lizenz und woher es stammt.

Die vollständige Liste mit Lizenzen, Repositorys und Installationswegen für Batocera steht in
[`docs/utilidades-conversion.md`](docs/utilidades-conversion.md) (spanisch).

Jede Konvertierung schreibt die neue Datei **neben das Original**, nie darüber (existiert der Name
schon, wird nummeriert: „Spiel (1).chd“), der Vorgang lässt sich also jederzeit von Hand rückgängig
machen.

### 🏷️ Umbenennen: die Konvention der Sets

**Umbenennen** ordnet die Bibliothek nach der Konvention, die Romulus Manager und die GoodTools-Sets
verwenden: Titel, Region und Sprache, Disc-Nummer, Seriennummer in eckigen Klammern und die
Dump-Markierungen (`[!]` verifiziert, `[b]` mit fehlerhaften Daten, `[f]` repariert, `[t]` übersetzt).

**Der Zielname ist der aus dem DAT.** Ein DAT (Redump oder No-Intro) ist die Liste der Spiele mit dem
offiziellen Namen und den Hashes jeder Datei; dieser Name *ist* die Konvention, also übernimmt der
Manager ihn unverändert, statt einen zu erfinden. Nur wenn es kein DAT gibt oder das DAT den Eintrag
nicht enthält, wird der Name nach derselben Grammatik aus der vorhandenen Datei zusammengesetzt.

**DATs werden heruntergeladen, nicht mitgeliefert.** Sie kommen vom Spiegel der `libretro-database`
(Redump und No-Intro), aus dem DAT-Katalog pro System von libretro und aus dem täglichen Rebuild, und
sind Metadaten: die Liste der Spiele mit ihren Hashes, ohne ein einziges ROM. Gespeichert werden sie
in `/userdata/system/batocera_manager_dats/`, und der Installer kann sie gleich mit herunterladen
(Schritt 7, mit `BM_DATS=auto|all|skip`).

**Die Berechnung des Plans hat einen eigenen Fortschrittsbalken.** Bei einem großen System dauert die
Berechnung (Tausende Dateien müssen identifiziert und manchmal 4-GB-ISOs gehasht werden), daher läuft
sie **in einem eigenen Thread**: Die Seite zeigt einen Balken mit den bereits geprüften Dateien und der
gerade bearbeiteten, und die Arbeit geht nicht verloren, auch wenn du die App weiter benutzt. Die
Endpunkte `GET /api/tools/rename/plan/start` und `POST /api/tools/rename/apply/start` liefern die
Kennung des Auftrags, und `GET /api/tools/rename/job?id=…` meldet den Stand.

**Jedes System hat sein DAT, und es wird gesagt, woher es kommt.** Schlüssel ist der **Name des
Systemordners** in `/userdata/roms`, denn den nutzt der Manager: Mit 122 auf die tatsächlich
vorhandenen Ordner abgebildeten Systemen funktioniert das Umbenennen in der ganzen Bibliothek und nicht
nur beim 3DO. Für Systeme, die nicht in der Zuordnung stehen, wird das DAT **über den Namen** im echten
Katalog gesucht und nur akzeptiert, wenn es **alle** Wörter des Systems abdeckt und die Zuverlässigkeit
0,7 oder mehr beträgt (sonst landete „Wolfenstein - Enemy Territory“ bei „Wolfenstein 3D“). Die
Oberfläche zeigt das an: „DAT bereit“, „DAT über Namen (Zuverlässigkeit 92 %)“ oder „für dieses System
ist kein DAT verfügbar“.

**Wie eine Datei ihrem Spiel zugeordnet wird**, vom zuverlässigsten zum unsichersten:

1. **Name und Größe**: Stimmen Dateiname und Größe mit denen im DAT überein, ist es das Spiel. Die
   Platte wird nicht angefasst, und das ist der häufigste Fall.
2. **Hash**: md5, sha1 und crc32 in einem Durchgang. Das ist der endgültige Beweis, erfordert aber, die
   ganze Datei zu lesen, daher hat der Plan ein **Budget von 512 MB** pro Durchgang: Bei Bibliotheken
   mit 40 GB wird nicht alles gehasht; es gibt einen Hinweis, und mit dem Rest wird weitergemacht.
3. **Seriennummer der Disc**: die Kennung im Image (`SLUS_010.10`, `SLES-022.41`, `GALE01`,
   `RVL-RZ4E`, `T-503 8914` …).
4. **Titel**: Die Titel werden ohne die Angaben in Klammern verglichen, mit einer Ähnlichkeit, die
   Zeichenfolgen und Wörter kombiniert.

Eine Zuordnung über den Titel ist eine **Heuristik** und wird auch so angezeigt: Der Plan markiert die
Zuverlässigkeit und lässt die Zeile zum Prüfen stehen. Unter den Kandidaten wird **die Variante
desselben Spiels** gewählt (Titel und Disc identifizieren ein Spiel, die Region nicht), und innerhalb
dieses Spiels gewinnt die, die du bevorzugst: zuerst die Region, dann die Revision, dann die
Dump-Markierungen.

**Nichts wird blind umbenannt.** Der Plan wird vollständig angezeigt (aktueller Name, vorgeschlagener
Name, Methode und Zuverlässigkeit), bevor etwas verändert wird; beim Anwenden werden auch CUE, M3U und
die übrigen Begleitdateien umbenannt; und jeder Durchgang hinterlässt ein Journal in
`/userdata/system/batocera_manager_renames.json`, mit einem Button, um den letzten **rückgängig** zu
machen.

**Bei Wii wird über den Spielcode identifiziert.** Der Dateiname verrät nichts (der Dump heißt
`REXP01.wbfs`), aber die Disc enthält ihren Spielcode (`REXP`) und den MD5-Hash des Spiels, und das DAT
speichert denselben Code in seiner Seriennummer (`RVL-REXP-EUR`). Der Abgleich ist also exakt, und die
620 MB des Dumps müssen nicht gehasht werden. Der Plan zeigt beide Seiten: den Code und den MD5 aus der
Disc sowie crc32/md5/sha1 aus dem DAT (die zur 4,7-GB-ISO gehören, nicht zum Dump). Jedes Wii-Spiel ist
ein Ordner (`Spiel [REXP01]`), umbenannt wird also der Ordner, mit beibehaltenem Suffix aus dem
Disc-Code.

**Umbenennen aktualisiert die `gamelist.xml`.** Ein neuer Name ohne aktualisierte Liste bringt die
Bibliothek durcheinander: EmulationStation würde weiter auf Dateien zeigen, die es nicht mehr gibt, und
die Cover stünden ohne Spiel da. Beim Anwenden aktualisiert der Manager den `<path>` jedes Eintrags,
benennt die zum Spiel gehörenden Medien um (in `images/`, `videos/`, `manuals/` und `downloads/`) und
biegt die Tags um (`image`, `video`, `marquee`, `thumbnail` …), die übrigen Metadaten bleiben
unverändert. Medien werden nur umbenannt, wenn der Name genau `<stamm>-<etwas>` lautet, also wird
„Clay Fighter-image.png“ umbenannt und „Clay Fighter 2-image.png“ nicht. Die ursprüngliche
`gamelist.xml` wird im Journal gespeichert: **Rückgängig** stellt sie genau so wieder her.

### 📚 ROM-Bibliothek: Duplikate und Audit

Der Bereich **ROMs und BIOS** (der Pfad `/roms`) hatte ein Stimmigkeitsproblem: Er enthielt nur BIOS.
Es gab keine Möglichkeit, die ROM-Bibliothek als Ganzes zu sehen oder zu verwalten. Jetzt ist es **eine
Seite mit zwei Reitern**, **ROMs** und **BIOS**, und der ROM-Reiter macht die komplette Durchleuchtung.

**Das Audit betrachtet die ganze Bibliothek**, hasht sie aber nicht: Das würde bei einer Bibliothek
mit 1,8 TB Stunden dauern. Duplikate werden mit einem **Schnell-Fingerabdruck** gesucht (die Größe plus
die ersten und letzten 64 KB), der nichts kostet, und nur die Kandidaten werden mit dem vollständigen
Hash bestätigt. Diese Bestätigung hat ein **Byte-Budget** (8 GB), eine Gruppe, die nicht hineinpasst,
wird also als *Kandidat* markiert (der Fingerabdruck stimmt überein) und nicht als bestätigtes Duplikat:
Die Oberfläche lügt nicht über das, was sie weiß.

Spiele, die **Ordner** sind (Wii, ScummVM, DOSBox, die Lindbergh-Arcades), werden **vollständig**
verglichen: Ihre größte Datei ist die Engine, die bei allen Spielen gleich ist, sie zu hashen würde
also falsche Duplikate ergeben.

Was es findet:

| Was | Bedeutung |
|---|---|
| **Duplikate** | Doppelte Spiele, mit Anzahl der Kopien und wie viel Platz frei wird, wenn eine bleibt |
| **Einträge ohne Datei** | Einträge der `gamelist.xml`, die auf ein Spiel zeigen, das nicht mehr da ist |
| **Leere Dateien** | Spiele mit 0 Bytes: Sie starten nicht |
| **Dateien, die keine Spiele sind** | Notizen, Listen und andere lose Dateien |
| **Medien ohne Spiel** | Bilder und Videos, deren Spiel nicht mehr da ist |
| **Doppelt in mehreren Systemen** | Dasselbe Spiel in `naomi` und `atomiswave` (die Arcades) |
| **Speicherplatz pro System** | Wo der Speicher der Karte hingeht |

**Nichts wird gelöscht.** Überflüssiges wird in eine **Quarantäne** verschoben
(`/userdata/roms/.quarantine/`), die innerhalb der Bibliothek liegt: Das Verschieben ist ein
Umbenennen, geht also sofort und kopiert keine 63 GB. Jeder Durchgang landet in einem Journal, und ein
**Rückgängig**-Button bringt alles wieder an seinen Platz. Dasselbe gilt für die `gamelist.xml`: Beim
Bereinigen wird der Originaltext gespeichert, und Rückgängig stellt ihn wieder her.

Wie die anderen langen Aufträge (der Umbenennungsplan) läuft das Audit **im Hintergrund mit
Fortschrittsbalken**: Die Seite zeigt, was gerade passiert und welche Datei gerade geprüft wird, und
weist darauf hin, dass du das Fenster nicht offen lassen musst.

**Rechtliches**: Der Manager stellt keine ROMs bereit und lädt keine herunter. DATs sind öffentliche
Metadaten; Konvertierungen, Komprimierungen und Patches werden auf die Dateien angewendet, die schon auf
deiner SD liegen.

> 💡 **Tipp zum Aufräumen:** Für „doppelte Versionen aussortieren“ ist dieser Reiter die richtige
> Stelle. Starte **Bibliothek prüfen**, sieh dir die Gruppe **Doppelte Spiele** an, hake die
> überflüssigen Kopien ab und verschiebe sie in die Quarantäne. Wenn du dir sicher bist, kannst du
> den Ordner `/userdata/roms/.quarantine/` später von Hand leeren. Für verschiedene *Versionen*
> desselben Spiels (z. B. Europa und USA) nutze zusätzlich **Was fehlt**, um zu sehen, welche Varianten
> es gibt und welche als „bessere Version“ gilt.

---

### 🧭 Was fehlt: die anderen Versionen der Spiele, die du hast

Das DAT eines Systems ist die Liste **aller** seiner Spiele. Mit deiner Bibliothek verglichen sagt es,
was dir fehlt … aber die vollständige Liste sagt nichts aus: Das PlayStation-2-DAT hat 13.618 Spiele,
eine normale Bibliothek hat 300. „Dir fehlen 13.300 Spiele“ ist keine Information.

Aussagekräftig ist das Gegenteil: **Welche anderen Versionen gibt es von den Spielen, die du schon
hast?** Hast du „Super Mario 64 (Japan)“ und das DAT enthält auch die amerikanische und die
europäische, interessiert dich vielleicht die amerikanische. Und hat das Spiel drei Discs und du nur die
erste, fehlt diese Disc wirklich.

Deshalb listet der Bereich **Was fehlt** nicht alles auf, was fehlt, sondern **die Varianten der Spiele,
die du hast**. Für jedes Spiel:

| | |
|---|---|
| **Du hast** | Den Namen, den das DAT ihm gibt, und **wie zugeordnet wurde**: über den Namen, den Hash, den Disc-Code, die Seriennummer oder den Titel (Letzteres mit dem Hinweis, dass es besser geprüft werden sollte) |
| **Fehlen** | Jede Version, die du nicht hast, mit **Begründung**: `dir fehlt Disc 2`, `andere Region (USA)`, `andere Revision`, `andere Sprache` oder `andere Version` |

Wenn die fehlende Version **besser abschneidet** als die vorhandene (zum Beispiel ein verifizierter Dump
gegenüber einem mit fehlerhaften Daten), erscheint sie mit der Markierung **„bessere Version“**. Die
Filter sind *Alle*, *Spiele mit fehlenden Discs* und *Spiele mit besserer Version*: Jede Zahl sagt, ob
sie Spiele oder Versionen zählt, damit zwei ähnliche Zahlen nicht verwechselt werden.

Der Vergleich erfolgt **pro System und auf Anforderung** und läuft **im Hintergrund mit
Fortschrittsbalken**: Alle 17 Indizes auf einmal zu laden, wären 55 MB JSON, also Hunderte MB Speicher
auf der Konsole. Außerdem werden große Dateien nicht gehasht, wenn sie nicht ins **Budget von 512 MB**
passen: Sie werden über den Namen oder den Titel zugeordnet, und die Oberfläche sagt das.

**Es wird nichts behauptet, was nicht bekannt ist**, und dafür gibt es zwei Regeln:

- **Das Spiel** bestimmen die bloßen Titel (ohne Angaben): Sie müssen gleich sein. „Tomb Raider  I“
  und „Tomb Raider (USA)“ sehen sich sehr ähnlich und sind verschiedene Spiele.
- **Die Variante** bestimmt die Region (oder Revision), die im Namen steht: Sie muss auf beiden Seiten
  gleich sein. Sagt das DAT „(USA)“ und deine Datei nichts, ist das Spiel identifiziert, **die Variante
  aber nicht**: Solche landen bei **„vielleicht“** und zählen weder als vorhanden noch als fehlend.

Und die, die sich nicht einmal ähneln (Mods, Übersetzungen), werden getrennt gezählt, wie die, die
nicht im DAT stehen.

**Es wird nichts verändert**: Dieser Bereich informiert nur. Er löscht nichts, benennt nichts um und
lädt nichts herunter.

---

## 🧱 Architektur

Absichtlich einfach: **ein Prozess, ein Server und ein Client**.

```
Browser    ──HTTP──▶  app.py (http.server)  ──▶  /userdata/system/…
                          │                      ├── configs/emulationstation/es_systems_<slug>.cfg
                          │                      ├── roms/<system>/…
                          │                      ├── batocera.conf
                          │                      └── batocera_manager_settings.json
                          │
                          ├── frontend/dist/     # React-SPA (statischer Inhalt)
                          ├── templates/         # klassische Ausweich-Oberfläche
                          │   index.html
                          └── romtools/          # Paket für DATs, Umbenennen und Formate
                              dats · identify · naming · sets · rename · formats
                              library · faltantes · progress · jobs
```

- **`app.py`** — reiner HTTP-Server (`http.server`) mit allen Endpunkten, liest `/proc` und `/sys` für
  die Messwerte, schreibt EmulationStation-Konfigurationen und enthält die Clients für ScreenScraper,
  TheGamesDB und IGDB. Ohne Frameworks.
- **`romtools/`** — Backend-Paket für die ROM-Werkzeuge: DAT-Katalog und -Download, Identifizierung
  über Hash, Disc-Signatur und Titel, Grammatik der Set-Namen, Umbenennungs-Engine mit Plan und
  Rückgängig, Konvertierung, Komprimierung und Patchen von Formaten sowie die Engine für
  Hintergrundaufträge mit Fortschrittsbalken. Es ist Python aus der Standardbibliothek wie alles
  andere und wird abgesichert importiert: Fehlt das Paket, antwortet die Werkzeug-API mit einer klaren
  Fehlermeldung, und der Rest der App läuft weiter.
- **`frontend/`** — die React- + Tailwind-SPA. Der Server liefert `frontend/dist/` unverändert aus (mit
  der Version in einem `<meta>`-Tag); fehlt dieses Bundle, fällt er auf `templates/index.html` zurück.
- **`templates/index.html`** — vollständige klassische Oberfläche (HTML, CSS und JavaScript in einer
  Datei). Der Server liefert sie aus und ersetzt dabei eine Reihe von Platzhaltern durch bereits
  berechnete Daten, sodass die erste Ansicht ohne Wartezeit erscheint. Sie ist die Ausweichlösung,
  wenn kein Bundle da ist.
- **`batocera_systems.json`** — Referenzkatalog mit den Systemen und Emulatoren, die Batocera
  mitbringt; er speist das Anlegeformular (Dateiendungen, Cores und Referenzsystem).
- **Kein Zustand im Speicher** außer dem ROM-Cache (60 s), dem Cache für Systemmetadaten (300 s) und
  den API-Tokens. Die HTTP-Handler antworten immer: Jeder unerwartete Fehler wird als `500` in JSON
  zurückgegeben, mit Traceback in der Konsole, nie als leere Antwort.

---

## 🔌 REST-API

Die Oberfläche stützt sich auf eine eigene HTTP-API (JSON), die du auch separat nutzen kannst. **Die
SPA und die klassische Oberfläche nutzen genau dieselben Endpunkte**:

| Gruppe | Endpunkte |
|---|---|
| **System** | `/api/info` · `/api/dashboard` · `/api/settings` · `/api/news` · `/api/fans` |
| **Dienst** | `/api/service/status` · `/api/service/install` · `/api/service/remove` · `/api/service/restart` · `/api/service/kill` · `/api/service/read-sh` |
| **EmulationStation** | `/api/es/status` · `/api/es/restart` |
| **Systeme** | `/api/systems` · `/api/create` · `/api/preview` · `/api/batocera-systems` · `/api/themes` · `/api/upload-logo` |
| **ROMs** | `/api/rom-systems` · `/api/rom/rename` · `/api/rom/update-meta` · `/api/rom-image-info` · `/api/game-stats` · `/api/random-game` |
| **Bibliothek** | `/api/library/summary` · `/api/library/audit/start` · `/api/library/job` · `/api/library/journal` · `/api/library/quarantine` · `/api/library/gamelist/clean` · `/api/library/undo` · `/api/library/missing/systems` · `/api/library/missing/start` |
| **BIOS** | `/api/bios/catalog` · `/api/bios/summary` · `/api/bios/scan` · `/api/bios/repair` · `/api/bios/all` · `/api/bios/missing` · `/api/bios/fetch` · `/api/bios/upload` · `/api/bios/missing/skip` · `/api/bios/missing/skipped` · `/api/bios/missing/unskip` · `/api/bios/firstcheck` · `/api/bios/descargar/start` · `/api/bios/job` |
| **Scraper** | `/api/scraper/config` · `/api/scraper/save-config` · `/api/scraper/search` · `/api/scraper/download` · `/api/scraper/scrape-system` · `/api/scraper/batch` · `/api/scraper/image` |
| **RetroAchievements** | `/api/retroachievements` · `/api/retroachievements/test` · `/api/retroachievements/games` |
| **Werkzeuge** | `/api/tools/systems` · `/api/tools/dats` · `/api/tools/dats/install` · `/api/tools/dats/remove` · `/api/tools/formats` · `/api/tools/formats/sistemas` · `/api/tools/formats/detect` · `/api/tools/formats/convert` · `/api/tools/formats/batch` · `/api/tools/formats/compress` · `/api/tools/formats/patch` · `/api/tools/roms` · `/api/tools/rename/plan` · `/api/tools/rename/plan/start` · `/api/tools/rename/apply` · `/api/tools/rename/apply/start` · `/api/tools/rename/job` · `/api/tools/rename/undo` · `/api/tools/rename/journal` |
| **Aktualisierung** | `/api/update` · `/api/app-update` |

Die Zähler der Bibliothek kommen aus `GET /api/info`: `rom_systems_count` (die Systeme mit Spielen),
`disk_games_count` und `disk_systems_count` (die Spiele und Systeme, die wirklich auf der Platte sind)
und `systems_count` (die eigenen Systeme, die der Manager verwaltet). `GET /api/random-game` liefert ein
Spiel aus der Bibliothek mit Cover und Metadaten.

---

## 🧪 Tests

Die Backend-Logik und die Hilfsfunktionen der Oberfläche sind mit **991 Tests** in `pytest` abgedeckt
(es werden keine Projektabhängigkeiten gebraucht, nur pytest selbst):

```bash
python -m pytest
# 991 passed in ~60s
```

> 🇩🇪 In der übersetzten Fassung schlagen einige Tests fehl, weil sie die ursprünglichen spanischen
> Texte der Oberfläche und der Meldungen prüfen. Die Programmlogik selbst ist unverändert.

---

## 📁 Projektstruktur

```
batocera_web/
├── app.py                    # HTTP-Server und die gesamte Logik (stdlib)
├── frontend/                 # Oberfläche in React + Tailwind (SPA)
│   ├── src/
│   │   ├── components/       # UI, Layout und Diagramme
│   │   ├── pages/            # Übersicht, Systeme, Formular und Einstellungen
│   │   ├── hooks/            # Design, Toasts, Haptik und Datenladen
│   │   └── lib/              # typisierter API-Client, Typen und Normalisierer
│   ├── dist/                 # kompiliertes Bundle (versioniert: das Gerät hat kein Node)
│   └── package.json
├── templates/
│   └── index.html            # klassische Oberfläche (HTML + CSS + JS), dient als Ausweichlösung
├── romtools/                 # Backend-Paket für DATs, Umbenennen und Formate
│   ├── dats.py               # Quellen, Download, Cache und Parsen der DATs
│   ├── identify.py           # Hashes, Disc-Signaturen und Titelähnlichkeit
│   ├── naming.py             # Grammatik der Set-Namen
│   ├── sets.py               # Bewertung der Varianten und Auswahl pro Spiel
│   ├── rename.py             # Plan, Anwenden und Rückgängigmachen des Umbenennens
│   ├── formats.py            # Erkennung, Konvertierung, Komprimierung und Patches
│   ├── formatos_sistemas.py  # welche Formate jedes System unterstützt und welches Werkzeug nötig ist
│   ├── utilidades.py          # die Konvertierungswerkzeuge, die sich selbst installieren
│   ├── library.py            # Inventar der Bibliothek, Duplikate und Audit
│   ├── faltantes.py          # welche anderen Versionen es von deinen Spielen gibt
│   ├── progress.py           # Fortschrittszählung langer Aufträge
│   ├── jobs.py               # Hintergrundaufträge mit Fortschritt
│   └── __main__.py            # CLI: `python3 -m romtools dats --install` und `utilidades --install`
├── batocera_systems.json     # Referenzkatalog der Batocera-Systeme
├── install.sh                # Installer (bash: Hilfsprogramme, Dateien und Autostart)
├── tests/                    # 991 Tests mit pytest
├── docs/
│   ├── media/banner.png      # Projektbanner (Kopf der README)
│   ├── media/logo.png        # Projektlogo
│   ├── screenshots/          # Screenshots der README
│   └── superpowers/          # Design und Pläne des Projekts
├── CHANGELOG.md              # Änderungsverlauf pro Version
├── README.md                 # diese Datei (deutsch)
└── README.es.md              # spanisches Original
```

### 🧑‍💻 Frontend entwickeln

Die Oberfläche wird mit Node kompiliert; **das Batocera-Gerät braucht es nicht**, weil das Bundle schon
versioniert in `frontend/dist/` liegt und das Backend es unverändert ausliefert.

```bash
cd frontend
npm install          # nur beim ersten Mal
npm run dev          # Vite auf http://localhost:5173, leitet /api an das Backend weiter
npm run build        # erzeugt frontend/dist/
```

Starte das Backend in einem anderen Terminal (`python3 app.py`), um echte Daten zu haben. Vite leitet
standardmäßig an `http://127.0.0.1:5000` weiter; mit `BATOCERA_BACKEND` gibst du ein anderes an (die
lokale Entwicklungsumgebung nutzt `:5001`, siehe [Ports in der Entwicklung](#ports-in-der-entwicklung)).
Die API ist dieselbe wie bei der klassischen Oberfläche, im Backend muss also nichts Neues ausgerollt
werden.

> **Und auf der Konsole selbst?** Auf der Entwicklungs-Batocera ist **Node v26 LTS** schon installiert
> (`/userdata/system/node/current`, verlinkt nach `/usr/bin/node`), du kannst das Frontend also auch
> direkt dort neu kompilieren:
>
> ```bash
> cd /userdata/system/batocera_web/frontend
> npm ci
> npm run build
> ```
>
> Das Bundle hat dann **dieselben Hashes** wie das im Repository versionierte. Trotzdem bleibt der
> normale Weg, das schon kompilierte `frontend/dist/` hochzuladen: Die App soll ohne Node funktionieren.

### 🧑‍💻 Entwicklungsablauf

Das Projekt lebt in **einem einzigen Repository**, in dem beide Oberflächen nebeneinander existieren:

| | Wo |
|:--|:--|
| GitHub | `Thundertruck4K/batocera-web-manager` |
| Lokal | `D:\PROGRAMACION\PROYECTOS PROPIOS\batocera_web_react` |
| Hauptoberfläche | `frontend/` — React 19 + Vite + Tailwind v4 |
| Ausweich-Oberfläche | `templates/index.html` — eine Datei, ohne Build |
| Backend | `app.py` — Python stdlib, null Abhängigkeiten |

#### Ports in der Entwicklung

| Port | Was |
|:--|:--|
| `5001` | Backend in der Entwicklung |
| `5173` | Vite — Dev-Server des Frontends; leitet `/api` an `:5001` weiter |

Um das Frontend gegen das lokale Backend zu starten:

```bash
cd frontend
BATOCERA_BACKEND=http://127.0.0.1:5001 npm run dev
```

#### Häufige Befehle

```bash
# Backend in der Entwicklung
python app.py --port 5001

# Backend-Tests (991)
python -m pytest

# Frontend
cd frontend && npm run build      # erzeugt frontend/dist/ neu (wird versioniert)
npx tsc -b --noEmit               # Typprüfung
```

#### Branches und Pull Requests

Der Ablauf ist der übliche, und **es wird nicht direkt auf `master` gepusht**: Man legt einen Branch an
(`feature/...` oder `fix/...`), pusht ihn und öffnet einen *Pull Request* gegen `master`.

---

## 💻 Voraussetzungen und Kompatibilität

| | |
|---|---|
| **System** | Batocera **v43 oder neuer**, Linux (getestet mit 43.1) |
| **Python** | Das Python 3, das Batocera schon mitbringt — nichts zu installieren |
| **Abhängigkeiten** | Keine (Pillow ist optional, nur für Platzhalter-Logos) |
| **Client** | Jeder moderne Browser (Handy, Tablet oder PC) |
| **Pfade** | Schreibt in `/userdata/system/`, `/userdata/roms/` und `batocera.conf` |

Außerhalb von Batocera funktioniert es nicht: Es liest `/proc`, `/sys` und die Pfade unter
`/userdata`, die systemspezifisch sind.

---

## 🔒 Sicherheit

Dieser Manager ist für das **Heimnetz** gedacht: **Er hat keine Anmeldung**. Jeder, der
`http://BATOCERA:5000` öffnen kann, kann Konfigurationen anlegen und löschen, Dateien hochladen und
Dienste neu starten (unter Batocera ist der Benutzer `root`).

- Stelle ihn nicht direkt ins Internet.
- Wenn du von außen zugreifen musst, nutze ein VPN (zum Beispiel Tailscale oder WireGuard), als wärst du
  zu Hause.
- Ist dein Netz nicht vertrauenswürdig, lass ihn lieber aus und starte ihn nur, wenn du ihn brauchst.
- Der **Web-API-Key von RetroAchievements wird nicht im Klartext ausgeliefert**: `/api/settings` gibt
  ihn maskiert zurück (`abcd••••••••wxyz`), zusammen mit einem Hinweis, ob er eingerichtet ist. Beim
  Speichern verhält sich das Feld wie „nur schreiben“: Rührst du es nicht an, bleibt der Key erhalten;
  leerst du es, wird er gelöscht.
- Auch die **Zugangsdaten des Scrapers werden nicht im Klartext ausgeliefert**: `/api/scraper/config`
  und das Feld `cfg` von `/api/scraper/search` geben das ScreenScraper-Passwort, die Entwickler-Daten
  und die API-Keys von TheGamesDB und IGDB **maskiert** zurück, jeweils mit einem Hinweis, ob sie
  eingerichtet sind. Beim Speichern verhalten sie sich wie „nur schreiben“: Rührst du das Feld nicht
  an, bleibt der Wert erhalten; leerst du es, wird er gelöscht.
- Auch die **Cover-URLs enthalten keine Zugangsdaten**: ScreenScraper liefert sie mit eingebettetem
  Passwort, daher gehen sie bereinigt an den Browser, und der Server signiert sie beim Herunterladen
  (`/api/scraper/image` bedient nur die Hosts der Scraping-Quellen).

---

## ❔ Häufige Fragen

**Muss ich Python oder eine Bibliothek installieren?**  
Nein. Es wird nur die Standardbibliothek von Python 3 genutzt, die Batocera schon mitbringt.

**Was ist der Unterschied zwischen der React- und der klassischen Oberfläche?**  
Die React-SPA wird standardmäßig ausgeliefert; die klassische (eine einzige HTML-Datei) bleibt als
Ausweichlösung, und das Backend liefert sie automatisch aus, wenn das kompilierte Bundle nicht auf der
Konsole liegt. Beide sprechen mit derselben API, was die eine kann, kann also auch die andere. Die
BIOS-Prüfung ist schon in der SPA (Bereich *ROMs und BIOS*); ROM-Inventar, Themes und ROM-Bearbeitung
gibt es weiterhin nur in der klassischen.

**Warum gab es früher zwei Repositorys und jetzt eins?**  
Während der Entwicklung gab es sie tatsächlich: Dieses war das für die React-Oberfläche, das andere das
für die Variante „reines Python“. Bei der Zusammenlegung bekam dieses den kurzen Namen
`batocera-web-manager` zurück, und das andere wurde gelöscht (seine Historie ist hier: Sein `master` ist
ein direkter Vorfahre von diesem). GitHub behält eine Weiterleitung vom alten Namen, bereits geteilte
Links funktionieren also weiter.

**Kann ich Systeme anlegen, ohne XML von Hand anzufassen?**  
Ja, genau darum geht es: Du wählst ein Referenzsystem, passt die Felder an, und der Manager schreibt die
`es_systems_<slug>.cfg` und legt die Ordner an.

**Warum stimmt die Zahl der Spiele nicht mit der in der `gamelist.xml` überein?**  
Weil die `gamelist.xml` nur die Spiele verzeichnet, die EmulationStation schon erfasst hat. Die Karte
*Spiele* in der Übersicht zählt, **was auf der Platte liegt**: Dateien, die Spiele sind, und
Spielordner (ScummVM, DOSBox, MUGEN), die Zahl kann also größer sein als die in der `gamelist.xml`. Die
Karte *Systeme* zählt die Systeme mit Spielen, und im Hilfstext steht, wie viele davon eigene sind.

**Warum erscheinen in der ROM-Liste weder die `_info.txt` noch Spielstände?**  
Weil sie keine Spiele sind. Aufgelistet werden nur Dateien, deren Endung zu denen des Systems gehört
(plus die globale Liste der ROM-Endungen); die `_info.txt`, die die Formate dokumentiert, die
`gamelist.xml`, `.srm`/`.sav`/`.dat`/`.keys` und Co. bleiben außen vor und können nicht gescrapt werden.

**Wo wird die Konfiguration gespeichert?**  
In `/userdata/system/batocera_manager_settings.json` (Pfade, Port, Design der Oberfläche und
RetroAchievements-Benutzer). Die Zugangsdaten des Scrapers werden separat in `batocera.conf`
gespeichert.

**Kann ich die Farbe der Oberfläche ändern?**  
Ja. Unter **Einstellungen → Design der Oberfläche** wählst du hell, dunkel oder „System folgen“, und der
Button in der Seitenleiste schaltet sofort um. Die Einstellung wird im Manager gespeichert und gilt
daher auf Handy und PC gleichermaßen.

**Wie entferne ich den Autostart?**  
In den **Einstellungen** mit einem Klick oder indem du den markierten Block `# [batocera-manager]` …
`# [/batocera-manager]` aus `/userdata/system/custom.sh` löschst.

**Warum bekomme ich den Hinweis „manueller Modus“?**  
Weil der Manager von Hand gestartet wurde (`python3 app.py`) und nicht im Autostart von Batocera steht:
Nach einem Neustart läuft er nicht wieder an. Der Hinweis enthält den Button, um ihn zu aktivieren.

**Funktioniert es mit Batocera v41 oder v42?**  
Entwickelt und getestet ist es mit v43+; die verwendeten Dateien und Pfade sind in neueren Versionen
dieselben, aber für alte Versionen gibt es keine Garantie.

**Warum sehe ich kein Platzhalter-Logo für ein System?**  
Weil Pillow optional ist; ohne Pillow erzeugt der Manager keine Platzhalter-Logos (alles andere
funktioniert gleich).

**Kann es meine Batocera-Installation kaputt machen?**  
Es schreibt nur neue Dateien (`es_systems_<slug>.cfg`, Bilder und einen Block in `custom.sh`), und du
kannst das XML vorher ansehen. Trotzdem: Sichere `/userdata/system/configs`, wenn du viel änderst.

**Ist die Oberfläche auch auf Deutsch verfügbar?**  
In dieser übersetzten Fassung ja: Die React-Oberfläche, die klassische Oberfläche, die Meldungen des
Backends und der Installer sind auf Deutsch. Eine Sprachauswahl hat das Original (noch) nicht.

---

## 🗺️ Roadmap

Als Erstes **die Bereiche, die es schon in der klassischen Oberfläche gibt, in die SPA bringen** (im Menü
als *Bald* markiert):

- **Themes und Assets** — installierte Themes, aktives Theme und Logo-Upload.
- **ROM-Bearbeitung** — Umbenennen, Metadaten und Cover.
- **ROM-Monitor** — das Inventar pro System, gruppiert nach Gerätetyp.

Und ~~**Scraper** — die drei Quellen und der Bild-Download~~ — **erledigt**: Der Scraper-Bereich ist
schon in der SPA, mit den drei Quellen, Scraping pro System und pro Spiel und Bearbeitung der Metadaten.

Danach notierte Ideen, ohne Termine:

- Optionale Anmeldung (Benutzer und Passwort) für unsichere Netze.
- Sicherung und Wiederherstellung der `es_systems_*.cfg` über die Weboberfläche.
- Mehr Scraping-Quellen und Download von Videos.
- Auswahl der Sprache der Oberfläche.
- ~~Hell-/Dunkelmodus und Themes für die Weboberfläche selbst~~ — **erledigt**: helles Design und
  Option „System folgen“.

---

## 🤝 Mitmachen

Beiträge sind willkommen! Es ist ein offenes Projekt und absichtlich leicht zu lesen:

1. Eröffne ein *Issue* und beschreibe das Problem oder die Idee.
2. Erstelle einen *Fork*, lege einen Branch an und füge deine Änderungen hinzu.
3. Führe `python -m pytest` aus und prüfe, dass alles grün bleibt.
4. Schicke einen *Pull Request* und erkläre das Was und das Warum.

Erwünscht ist ein Code-Stil passend zum Rest (Kommentare auf Spanisch, keine neuen Abhängigkeiten im
Server), und Änderungen an der Oberfläche sollen die Kennungen der Tests beibehalten.

Wenn die Änderung das Frontend betrifft, denk daran, auch das neu kompilierte Bundle (`frontend/dist/`)
hochzuladen, denn das Gerät hat kein Node.

---

## ☕ Projekt unterstützen

Dieser Manager entstand aus dem eigenen Bedarf des Autors und wird mit allen geteilt, denen er nützt.
Wenn er dir Zeit beim Herumbasteln mit XML spart und du dem Autor einen Kaffee spendieren willst, freut
er sich!

<div align="center">

**PayPal** — [folk3n30@gmail.com](https://www.paypal.com/donate/?business=folk3n30%40gmail.com&no_recurring=0&item_name=Apoyar%20Batocera%20System%20Manager&currency_code=USD)

*Jedes Trinkgeld fließt in Entwicklungszeit und Tests auf weiteren Geräten.*

</div>

Sehr hilfreich und kostenlos: einen ⭐ im Repository hinterlassen, deine Erfahrungen in den *Issues*
teilen oder es an andere mit Batocera weitergeben.

---

## 📄 Lizenz

Veröffentlicht unter der **MIT**-Lizenz. Details in der Datei [LICENSE](LICENSE).
Du darfst den Code nutzen, ändern und weiterverbreiten, auch kommerziell, solange der
Copyright-Hinweis erhalten bleibt.

---

<div align="center">

**Inoffizielles Projekt**: nicht mit dem [Batocera](https://batocera.org)-Team verbunden oder von ihm
unterstützt.

Gemacht mit reinem Python auf dem Server (ohne Abhängigkeiten) und React in der Oberfläche, für die
Batocera-Community. 🕹️

*Deutsche Übersetzung von README und Oberfläche: inoffiziell, auf Basis des spanischen Originals.*

</div>
