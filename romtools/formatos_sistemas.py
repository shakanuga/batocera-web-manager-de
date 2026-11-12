# -*- coding: utf-8 -*-
"""Los formatos que admite cada sistema y las utilidades que hacen falta.

El catalogo de `formats.py` es **por formato**: dice que de una ISO se puede
pasar a CHD, pero no si el sistema que se esta mirando admite ese formato. Un
PSP no admite un ZIP y un GameCube no admite un CHD, asi que ofrecer esas
conversiones es ofrecer un trabajo que luego no sirve.

Aqui esta el mapa de cada sistema:

- que formatos admite (segun el `es_systems.cfg` de Batocera 43.1 y la wiki
  oficial, que van en el mismo lado);
- cual es el formato que se suele usar en cada caso;
- que utilidad hace falta para cada conversion, y si la consola la trae.

La lista de formatos sale de dos sitios y manda el de la consola: el
`es_systems.cfg` que hay instalado (que ademas incluye los sistemas
personalizados del usuario) y, si no esta, la tabla de aqui.

Lo que **no** esta en la fuente no se inventa: si una utilidad falta en la
consola, la conversion aparece pero desactivada, diciendo que falta y como
conseguirla. Es mejor que callarse el problema.
"""

from __future__ import annotations

import shutil

# ── Utilidades ──────────────────────────────────────────────────────────
#: Cada utilidad externa que puede hacer falta, con su binario en la consola,
#: de donde sale y que licencia tiene. ``binario: None`` significa que la hace
#: el propio manager (biblioteca estandar de Python).
HERRAMIENTAS = {
    "nativo": {
        "nombre": "Der Manager",
        "binario": None,
        "url": None,
        "licencia": "MIT (dieses Projekt)",
        "para": "Die Konvertierung erledigt der Manager selbst, ohne externe Werkzeuge.",
        "instalar": "Schon vorhanden: Es ist der Manager selbst.",
    },
    "chdman": {
        "nombre": "chdman (MAME)",
        "binario": "chdman",
        "url": "https://github.com/mamedev/mame",
        "licencia": "GPL-2.0-or-later",
        "para": "Erstellt und entpackt CHD, das komprimierte Format von MAME: CHD zu ISO und CHD zu BIN/CUE.",
        "instalar": "Bereits in Batocera enthalten: /usr/bin/chdman",
    },
    "zip": {
        "nombre": "Info-ZIP",
        "binario": "zip",
        "url": "https://infozip.sourceforge.net/Zip.html",
        "licencia": "BSD-like (Info-ZIP)",
        "para": "Komprimiert eine Datei als ZIP. Der Manager nutzt die Standardbibliothek, aber es ist hier, falls man das der Konsole nutzen will.",
        "instalar": "Bereits in Batocera enthalten: /usr/bin/zip",
    },
    "7z": {
        "nombre": "7-Zip (p7zip)",
        "binario": "7z",
        "url": "https://www.7-zip.org/",
        "licencia": "LGPL-2.1-or-later (p7zip, mit der unRAR-Einschränkung)",
        "para": "Komprimiert als 7Z, das stärker packt als ZIP.",
        "instalar": "Bereits in Batocera enthalten: /usr/bin/7z",
    },
    "rom-converto": {
        "nombre": "rom-converto",
        "binario": "rom-converto",
        "url": "https://github.com/DevYukine/rom-converto",
        "licencia": "MIT",
        "para": "Das vollständigste von allen: konvertiert zwischen CSO, ZSO, CHD, RVZ, WBFS, WIA, GCZ, XISO, NSP, XCI, 3DS, PBP, ZAR und mehr.",
        "instalar": "Das install.sh installiert es selbst: lädt das Binary aus dem Release, prüft die SHA256 und legt es in /userdata/system/bin ab.",
    },
    "nodtool": {
        "nombre": "nodtool (nod)",
        "binario": "nodtool",
        "url": "https://github.com/encounter/nod",
        "licencia": "Apache-2.0",
        "para": "Erstellt und entpackt die komprimierten Dolphin-Formate: CISO, GCZ, RVZ, WBFS, WIA und GCM.",
        "instalar": "Das install.sh installiert es selbst: lädt das statische Binary aus dem Release und prüft die SHA256.",
    },
    "dolphin-tool": {
        "nombre": "dolphin-tool",
        "binario": "dolphin-tool",
        "url": "https://github.com/dolphin-emu/dolphin",
        "licencia": "GPL-2.0-or-later",
        "para": "Erstellt und entpackt RVZ, das komprimierte Format von Dolphin (GameCube und Wii), das von der Batocera-Wiki empfohlen wird.",
        "instalar": "Nicht auf der Konsole: Das dolphin-emu von Batocera ist die grafische Oberfläche und baut das Kommandozeilenwerkzeug nicht mit.",
    },
    "wiitool": {
        "nombre": "wiitool",
        "binario": "wiitool",
        "url": "https://github.com/dolphin-emu/dolphin/wiki/ExternalTools",
        "licencia": "GPL-3.0-or-later",
        "para": "Erstellt und entpackt WBFS und WIA, die Wii-Formate.",
        "instalar": "Kann sich nicht selbst installieren: Es gibt kein Release mit Linux-Binaries (das ursprüngliche wiitool hat kein offizielles Repository). Der heutige Ersatz sind die Wiimms ISO Tools.",
    },
    "extract-xiso": {
        "nombre": "extract-xiso",
        "binario": "extract-xiso",
        "url": "https://github.com/XboxDev/extract-xiso",
        "licencia": "Keine Lizenz im Repository angegeben",
        "para": "Extrae XDVDF (Xbox) a ISO.",
        "instalar": "Nicht nötig: Der Manager erledigt das schon in Python.",
    },
    "ndstool": {
        "nombre": "ndstool",
        "binario": "ndstool",
        "url": "https://github.com/devkitPro/ndstool",
        "licencia": "MIT o GPL-3.0-or-later (dual)",
        "para": "Wandelt ein Nintendo-DS-ROM in ein Modul (NOA/GB) um und extrahiert seinen Inhalt.",
        "instalar": "Kann sich nicht selbst installieren: Es gibt kein Release mit Linux-Binaries, es muss kompiliert werden.",
    },
    "3dstool": {
        "nombre": "3dstool",
        "binario": "3dstool",
        "url": "https://github.com/dnasdw/3dstool",
        "licencia": "MIT",
        "para": "Packt den Inhalt eines 3DS in eine CIA.",
        "instalar": "Das install.sh installiert es auf x86_64-Konsolen selbst: lädt das Tarball aus dem Release und prüft die SHA256.",
    },
    "maxcso": {
        "nombre": "maxcso",
        "binario": "maxcso",
        "url": "https://github.com/unknownbrackets/maxcso",
        "licencia": "ISC",
        "para": "Komprimiert die ISO als CSO, CSO2, ZSO oder DAX (PSP und PS2).",
        "instalar": "Nicht nötig: Der Manager erledigt das schon in Python.",
    },
    "xorriso": {
        "nombre": "xorriso",
        "binario": "xorriso",
        "url": "https://www.gnu.org/software/xorriso/",
        "licencia": "GPL-3.0-or-later",
        "para": "Mountet und entpackt XDVDF (Xbox) und andere Disc-Images.",
        "instalar": "Kann sich nicht selbst installieren: Das Paket ist im Buildroot von Batocera, aber in dessen Build nicht aktiviert, und es wird nur der Quellcode veröffentlicht.",
    },
}

# ── Conversiones ────────────────────────────────────────────────────────
#: Que extension produce cada conversion. Lo que no esta, la extension es su
#: propio identificador (``iso`` -> ``.iso``). ``None`` significa que la
#: conversion no deja un fichero nuevo (descomprimir).
EXTENSION_ACCION = {
    "bin-cue": "cue",
    "extraer": None,
}

#: Que utilidad hace falta para cada conversion. Lo que no esta, lo hace el
#: propio manager con la biblioteca estandar de Python.
HERRAMIENTA_ACCION = {
    "chd": "chdman",
    "7z": "7z",
    "rvz": "rom-converto",
    "wbfs": "rom-converto",
}

#: Las compresiones no dependen del formato del fichero sino del sistema: si
#: el sistema admite .zip o .7z, cualquier ROM se puede comprimir.
COMPRESIONES = ("zip", "7z")


# ── Los sistemas ────────────────────────────────────────────────────────
#: Que formatos admite cada sistema. La lista sale del `es_systems.cfg` de
#: Batocera 43.1 (253 sistemas) y de la wiki oficial, que van en el mismo
#: lado. Solo estan los sistemas en los que el formato importa de verdad: en
#: el resto manda el `es_systems.cfg` de la consola.
#:
#: ``formatos``: extensiones que acepta el sistema.
#: ``preferido``: el formato que se suele usar (el que da menos problemas).
#: ``nota``: lo que hay que saber de ese sistema.
SISTEMAS = {
    # ── Disco ───────────────────────────────────────────────────────────────
    "gamecube": {
        "formatos": ["ciso", "dol", "elf", "gcm", "gcz", "iso", "json", "m3u", "rvz",
                       "wbfs"],
        "preferido": "rvz",
        "nota": "Dolphin: RVZ ist das empfohlene Format. GCM ist der Original-Dump und ISO das unkomprimierte Image.",
    },
    "wii": {
        "formatos": ["ciso", "dol", "elf", "gcm", "gcz", "iso", "json", "m3u", "rvz",
                       "wad", "wbfs"],
        "preferido": "rvz",
        "nota": "Dolphin: RVZ ist das empfohlene Format. WBFS ist die Wii-Partition.",
    },
    "wiiu": {
        "formatos": ["rpx", "squashfs", "wud", "wua", "wup", "wux"],
        "preferido": "rpx",
        "nota": "WUP ist das Installationspaket und wird nicht empfohlen. WUA ist das Spiel komprimiert in einer einzigen Datei (Cemu 1.27 oder neuer) und WUX ist das komprimierte WUD.",
    },
    "ps3": {
        "formatos": ["iso", "ps3", "psn", "squashfs"],
        "preferido": "iso",
        "nota": "ISOs müssen entschlüsselt sein. PSN ist eine Textdatei mit der Kennung des Titels.",
    },
    "ps2": {
        "formatos": ["bin", "chd", "cso", "dump", "gz", "img", "iso", "m3u", "mdf",
                       "nrg"],
        "preferido": "chd",
        "nota": "CHD ist seit Version 31 empfohlen (vorher wurde CSO verwendet).",
    },
    "psx": {
        "formatos": ["bin", "cbn", "ccd", "chd", "cue", "img", "iso", "m3u", "mdf",
                       "pbp", "toc"],
        "preferido": "chd",
        "nota": "CHD ist empfohlen. PBP ist ein proprietäres Sony-Format und wird von der Wiki nicht empfohlen. Welches Format funktioniert, hängt vom Emulator ab: PCSX-ReARMed liest kein ISO, DuckStation schon.",
    },
    "psp": {
        "formatos": ["chd", "cso", "iso", "pbp"],
        "preferido": "cso",
        "nota": "CSO ist empfohlen, aber der Core libretro-ppsspp liest es nicht: In dem Fall musst du ISO verwenden.",
    },
    "psvita": {
        "formatos": ["psvita", "zip"],
        "preferido": "zip",
        "nota": "ZIP ist der Dump im Mai-Format.",
    },
    "saturn": {
        "formatos": ["ccd", "chd", "cue", "iso", "m3u", "zip"],
        "preferido": "chd",
        "nota": "CHD ist empfohlen. Für Spiele mit mehreren Discs M3U.",
    },
    "dreamcast": {
        "formatos": ["cdi", "chd", "cue", "gdi", "m3u"],
        "preferido": "chd",
        "nota": "CHD ist empfohlen. GDI ist das Original-Image der GD-ROM.",
    },
    "3do": {
        "formatos": ["chd", "cue", "iso"],
        "preferido": "chd",
        "nota": "CHD ist empfohlen. Der Emulator Opera lädt Spiele mit mehreren Discs nicht aus einer M3U.",
    },
    "neogeocd": {
        "formatos": ["chd", "cue", "iso"],
        "preferido": "chd",
        "nota": "CHD ist empfohlen.",
    },
    "pcenginecd": {
        "formatos": ["ccd", "chd", "cue", "img", "iso", "pce"],
        "preferido": "chd",
        "nota": "CHD wird bevorzugt: Es enthält das CUE-Sheet selbst.",
    },
    "megacd": {
        "formatos": ["chd", "cue", "iso", "m3u"],
        "preferido": "chd",
        "nota": "CHD ist empfohlen.",
    },
    "jaguarcd": {
        "formatos": ["bigpimg", "cdi", "cue"],
        "preferido": "cue",
        "nota": "BIGPIMG versteht nur BigPEmu.",
    },
    "pcfx": {
        "formatos": ["7z", "ccd", "chd", "cue", "m3u", "toc", "zip"],
        "preferido": "chd",
        "nota": "CHD steht in der Liste der unterstützten Formate.",
    },
    "supergrafx": {
        "formatos": ["7z", "ccd", "chd", "cue", "pce", "sgx", "zip"],
        "preferido": "chd",
        "nota": "CHD steht in der Liste der unterstützten Formate.",
    },
    "fmtowns": {
        "formatos": ["1dd", "7z", "bin", "cdr", "chd", "cqi", "cqm", "cue", "d77",
                       "d88", "dfi", "dsk", "gdi", "hfe", "imd", "iso", "m3u", "mfi",
                       "mfm", "nrg", "td0", "toc", "xdf", "zip"],
        "preferido": "cue",
        "nota": "Unterstützt fast alles. CHD akzeptieren nur MAME und libretro-mame; tsugaru nicht.",
    },
    "amigacd32": {
        "formatos": ["bin", "chd", "cue", "iso"],
        "preferido": "chd",
        "nota": "Amiberry akzeptiert kein CHD: Verwende BIN/CUE oder ISO.",
    },
    "amigacdtv": {
        "formatos": ["bin", "chd", "cue", "iso", "m3u"],
        "preferido": "chd",
        "nota": "CHD ist empfohlen.",
    },
    "cdi": {
        "formatos": ["cdr", "chd", "cue", "gdi", "iso", "nrg", "toc"],
        "preferido": "gdi",
        "nota": "DiscJuggler unterstützt GDI, CDR, TOC und Neros NRG.",
    },
    "macintosh": {
        "formatos": ["1dd", "2mg", "360", "7z", "cdr", "chd", "cqi", "cqm", "cue",
                       "d77", "d88", "dc42", "dfi", "dsk", "gdi", "hd", "hdi", "hdv",
                       "hfe", "ima", "imd", "img", "ipf", "iso", "mfi", "mfm", "nrg",
                       "td0", "toc", "ufi", "woz", "zip"],
        "preferido": "cue",
        "nota": "2MG ist das eigene Format des Emulators und der Disk-Images.",
    },
    "dos": {
        "formatos": ["cue", "dos", "dosz", "iso", "m3u", "pc", "squashfs", "zip"],
        "preferido": "dosz",
        "nota": "DOSZ ist das komprimierte DOSBox-Spiel. ZIP akzeptiert nur DOSBox_Pure.",
    },
    "scummvm": {
        "formatos": ["scummvm", "squashfs"],
        "preferido": "scummvm",
        "nota": "ScummVM nutzt Ordner: Das Spiel ist der Ordner, keine Datei.",
    },
    "daphne": {
        "formatos": ["daphne", "squashfs"],
        "preferido": "daphne",
        "nota": "Das Spiel ist ein Ordner mit seiner DAPHNE-Datei.",
    },
    "xbox": {
        "formatos": ["iso", "squashfs"],
        "preferido": "iso",
        "nota": "ISO ist das Format der Konsole.",
    },
    "xbox360": {
        "formatos": ["iso", "xbox360", "xex"],
        "preferido": "iso",
        "nota": "XBOX360 ist eine Textdatei mit dem Namen des Titels.",
    },
    "windows": {
        "formatos": ["exe", "pc", "wine", "wsquashfs", "wtgz"],
        "preferido": "pc",
        "nota": "WTGZ ist das komprimierte Spiel und WSQUASHFS das SQUASHFS für Windows.",
    },
    "jaguar": {
        "formatos": ["7z", "abs", "cdi", "cof", "cue", "j64", "jag", "rom", "zip"],
        "preferido": "rom",
        "nota": "J64 ist der Modul-Dump.",
    },
    "ports": {
        "formatos": ["sh"],
        "preferido": "sh",
        "nota": "Ports bringen ihre eigene run.sh mit.",
    },
    "steam": {
        "formatos": ["steam"],
        "preferido": "steam",
        "nota": "Jedes Spiel ist ein Ordner mit seinen Daten.",
    },
    "moonlight": {
        "formatos": ["moonlight"],
        "preferido": "moonlight",
        "nota": "Jedes Spiel ist ein Ordner mit seinen Daten.",
    },
    "openbor": {
        "formatos": ["pak"],
        "preferido": "pak",
        "nota": "PAK ist der Dump des Spiels.",
    },
    "triforce": {
        "formatos": ["ciso", "dol", "elf", "gcm", "gcz", "iso", "m3u", "wbfs"],
        "preferido": "iso",
        "nota": "Triforce (Arcade) nutzt dieselben Formate wie GameCube.",
    },
    # ── Cartucho ────────────────────────────────────────────────────────────
    "n64": {
        "formatos": ["7z", "n64", "v64", "z64", "zip"],
        "preferido": "z64",
        "nota": "Üblich ist Z64 (Little Endian) oder ZIP.",
    },
    "n64dd": {
        "formatos": ["7z", "n64", "ndd", "z64", "zip"],
        "preferido": "z64",
        "nota": "NDD ist der Dump der Magnetdisk.",
    },
    "snes": {
        "formatos": ["7z", "bsx", "dx2", "fig", "gd3", "gd7", "sfc", "smc", "swc",
                       "zip"],
        "preferido": "sfc",
        "nota": "SFC ist ohne Header und ZIP am bequemsten. SMC hat den Header des Kopierers.",
    },
    "megadrive": {
        "formatos": ["7z", "bin", "gen", "md", "sg", "smd", "zip"],
        "preferido": "md",
        "nota": "BIN ist ohne Header und ZIP am bequemsten.",
    },
    "mastersystem": {
        "formatos": ["7z", "bin", "sms", "zip"],
        "preferido": "sms",
        "nota": "SMS ist der Modul-Dump.",
    },
    "gamegear": {
        "formatos": ["7z", "bin", "gg", "zip"],
        "preferido": "gg",
        "nota": "GG ist der Modul-Dump.",
    },
    "nes": {
        "formatos": ["7z", "nes", "unf", "unif", "zip"],
        "preferido": "nes",
        "nota": "NES ist der Modul-Dump und UNIF das universelle Format.",
    },
    "gb": {
        "formatos": ["7z", "gb", "zip"],
        "preferido": "gb",
        "nota": "GB ist der Modul-Dump.",
    },
    "gbc": {
        "formatos": ["7z", "gbc", "zip"],
        "preferido": "gbc",
        "nota": "GBC ist der Modul-Dump.",
    },
    "gba": {
        "formatos": ["7z", "gba", "zip"],
        "preferido": "gba",
        "nota": "GBA ist der Modul-Dump.",
    },
    "nds": {
        "formatos": ["7z", "bin", "nds", "zip"],
        "preferido": "nds",
        "nota": "NDS ist der Modul-Dump.",
    },
    "3ds": {
        "formatos": ["3ds", "app", "axf", "cci", "cia", "cxi", "elf", "squashfs",
                       "zcci", "zcia", "zcxi"],
        "preferido": "3ds",
        "nota": "3DS ist der Modul-Dump und CIA der gepackte Inhalt.",
    },
    "vectrex": {
        "formatos": ["7z", "bin", "gam", "vec", "zip"],
        "preferido": "gam",
        "nota": "GAM ist der Modul-Dump.",
    },
    "atari2600": {
        "formatos": ["7z", "a26", "bin", "zip"],
        "preferido": "a26",
        "nota": "A26 ist der Modul-Dump.",
    },
    "atari5200": {
        "formatos": ["7z", "a52", "atr", "atx", "bin", "car", "cas", "cdm", "rom",
                       "xex", "xfd", "zip"],
        "preferido": "a52",
        "nota": "A52 ist der Modul-Dump.",
    },
    "atari7800": {
        "formatos": ["7z", "a78", "bin", "zip"],
        "preferido": "a78",
        "nota": "A78 ist der Modul-Dump.",
    },
    "atari800": {
        "formatos": ["7z", "a52", "atr", "atx", "bin", "car", "cas", "cdm", "m3u",
                       "rom", "xex", "xfd", "zip"],
        "preferido": "atr",
        "nota": "ATR ist der Disketten-Dump.",
    },
    "atarist": {
        "formatos": ["7z", "dim", "ipf", "m3u", "msa", "st", "stx", "zip"],
        "preferido": "st",
        "nota": "Der Emulator Hatari nutzt ST und MSA.",
    },
    "colecovision": {
        "formatos": ["7z", "bin", "col", "rom", "zip"],
        "preferido": "bin",
        "nota": "BIN ist der Modul-Dump.",
    },
    "intellivision": {
        "formatos": ["7z", "bin", "int", "rom", "zip"],
        "preferido": "bin",
        "nota": "BIN ist der Modul-Dump.",
    },
    "virtualboy": {
        "formatos": ["7z", "vb", "zip"],
        "preferido": "vb",
        "nota": "VB ist der Modul-Dump.",
    },
    "lynx": {
        "formatos": ["7z", "bll", "lnx", "lyx", "o", "zip"],
        "preferido": "lnx",
        "nota": "LNX ist der Modul-Dump.",
    },
    "wswan": {
        "formatos": ["7z", "ws", "zip"],
        "preferido": "ws",
        "nota": "WS ist der Modul-Dump.",
    },
    "wswanc": {
        "formatos": ["7z", "wsc", "zip"],
        "preferido": "wsc",
        "nota": "WSC ist der Modul-Dump.",
    },
    "pokemini": {
        "formatos": ["7z", "min", "zip"],
        "preferido": "min",
        "nota": "MIN ist der Modul-Dump.",
    },
    "gp32": {
        "formatos": ["7z", "smc", "zip"],
        "preferido": "smc",
        "nota": "SMC ist der Modul-Dump.",
    },
    "ti99": {
        "formatos": ["7z", "rpk", "wav", "zip"],
        "preferido": "rpk",
        "nota": "RPK bringt die Audiokassetten daneben mit.",
    },
    "pcengine": {
        "formatos": ["7z", "bin", "pce", "zip"],
        "preferido": "pce",
        "nota": "PCE ist der Modul-Dump.",
    },
    "amstradcpc": {
        "formatos": ["7z", "cdt", "dsk", "m3u", "sna", "tap", "voc", "zip"],
        "preferido": "dsk",
        "nota": "DSK ist der Disketten-Dump.",
    },
    "msx1": {
        "formatos": ["7z", "cas", "dsk", "m3u", "mx1", "ogv", "openmsx", "rom", "zip"],
        "preferido": "rom",
        "nota": "ROM ist der Modul-Dump.",
    },
    "msx2": {
        "formatos": ["7z", "cas", "dsk", "m3u", "mx2", "ogv", "openmsx", "rom", "zip"],
        "preferido": "rom",
        "nota": "ROM ist der Modul-Dump.",
    },
    "zxspectrum": {
        "formatos": ["7z", "dsk", "rzx", "scl", "tap", "trd", "tzx", "z80", "zip"],
        "preferido": "tzx",
        "nota": "TAP und TZX sind die Kassetten-Dumps.",
    },
    "c64": {
        "formatos": ["7z", "crt", "d64", "d71", "d81", "g64", "m3u", "nib", "prg",
                       "t64", "tap", "zip"],
        "preferido": "prg",
        "nota": "PRG gehört zu seinem CRT und D64 ist der Disketten-Dump.",
    },
    "amiga500": {
        "formatos": ["adf", "adz", "dms", "dmz", "exe", "hdf", "ipf", "lha", "m3u",
                       "raw", "scp", "uae", "zip"],
        "preferido": "adf",
        "nota": "ADF ist die Diskette und ADZ die komprimierte Version.",
    },
    "amiga1200": {
        "formatos": ["adf", "adz", "dms", "dmz", "exe", "hdf", "ipf", "lha", "m3u",
                       "raw", "scp", "uae", "zip"],
        "preferido": "adf",
        "nota": "ADF ist die Diskette und ADZ die komprimierte Version.",
    },
    "apple2": {
        "formatos": ["2mg", "7z", "chd", "dfi", "do", "dsk", "edd", "hdv", "mfi",
                       "nib", "po", "rti", "wav", "woz", "zip"],
        "preferido": "dsk",
        "nota": "DSK ist der Disketten-Dump.",
    },
    "apple2gs": {
        "formatos": ["7z", "do", "dsk", "edd", "mfi", "nib", "po", "rti", "wav", "woz",
                       "zip"],
        "preferido": "dsk",
        "nota": "DSK ist der Disketten-Dump.",
    },
    "pc98": {
        "formatos": ["2hd", "88d", "98d", "cmd", "d88", "d98", "dup", "fdd", "fdi",
                       "hdd", "hdi", "hdm", "hdn", "m3u", "nhd", "tfd", "thd", "xdf",
                       "zip"],
        "preferido": "hdi",
        "nota": "HDI und HDM sind die Disk-Dumps.",
    },
    "x68000": {
        "formatos": ["2hd", "7z", "88d", "cmd", "d88", "dim", "dup", "hdf", "hdm",
                       "img", "m3u", "xdf", "zip"],
        "preferido": "hdm",
        "nota": "HDM und HDF sind die Disk-Dumps.",
    },
    # ── Arcade ──────────────────────────────────────────────────────────────
    "mame": {
        "formatos": ["7z", "chd", "zip"],
        "preferido": "zip",
        "nota": "ZIP enthält das ROM-Set. CHD ist die Disc: Sie liegt in einem Ordner mit demselben Namen wie das ZIP.",
    },
    "fbneo": {
        "formatos": ["7z", "zip"],
        "preferido": "zip",
        "nota": "Unterstützt nur ZIP oder 7Z, kein rohes ROM.",
    },
    "neogeo": {
        "formatos": ["7z", "zip"],
        "preferido": "zip",
        "nota": "Unterstützt nur ZIP oder 7Z, kein rohes ROM.",
    },
    "naomi": {
        "formatos": ["7z", "bin", "dat", "lst", "zip"],
        "preferido": "zip",
        "nota": "ZIP enthält das ROM-Set und LST ist die Liste.",
    },
    "naomi2": {
        "formatos": ["7z", "zip"],
        "preferido": "zip",
        "nota": "Unterstützt nur ZIP oder 7Z.",
    },
    "atomiswave": {
        "formatos": ["7z", "bin", "dat", "lst", "zip"],
        "preferido": "zip",
        "nota": "ZIP enthält das ROM-Set und LST ist die Liste.",
    },
    "systemsp": {
        "formatos": ["7z", "bin", "dat", "lst", "zip"],
        "preferido": "zip",
        "nota": "ZIP enthält das ROM-Set und LST ist die Liste.",
    },
}


# ── Utilidades: disponibles o no ────────────────────────────────────────

def herramienta_disponible(nombre: str) -> bool:
    """Si la consola trae la utilidad que hace falta."""
    datos = HERRAMIENTAS.get(nombre)
    if datos is None:
        return False
    binario = datos.get("binario")
    if not binario:
        return True                       # la hace el propio manager
    return shutil.which(binario) is not None


def inventario_herramientas() -> list:
    """Todas las utilidades, con si estan en la consola ahora mismo."""
    out = []
    for nombre, datos in HERRAMIENTAS.items():
        item = dict(datos)
        item["id"] = nombre
        item["disponible"] = herramienta_disponible(nombre)
        out.append(item)
    return out


def herramienta_de_accion(id_accion: str) -> str:
    """Que utilidad hace falta para una conversion."""
    return HERRAMIENTA_ACCION.get(id_accion, "nativo")


def extension_de_accion(id_accion: str) -> str | None:
    """La extension que produce una conversion (``None`` si no deja fichero)."""
    if id_accion in EXTENSION_ACCION:
        return EXTENSION_ACCION[id_accion]
    return id_accion


# ── El mapa por sistema ─────────────────────────────────────────────────

def formatos_de_sistema(sistema: str | None, extensiones=None) -> list:
    """Los formatos que admite un sistema.

    ``extensiones`` son las que trae el `es_systems.cfg` de la consola: si
    estan, mandan sobre la tabla de aqui (que es el respaldo, y la que usan
    los sistemas personalizados).
    """
    if not sistema:
        return []
    slug = (sistema or "").strip().lower()
    if extensiones:
        return sorted({e.strip().lower().lstrip(".") for e in extensiones if e.strip()})
    datos = SISTEMAS.get(slug)
    if datos:
        return list(datos["formatos"])
    return []


def nota_de_sistema(sistema: str | None) -> str:
    """La nota del sistema (que formato se suele usar y que hay que saber)."""
    if not sistema:
        return ""
    datos = SISTEMAS.get((sistema or "").strip().lower())
    return (datos or {}).get("nota", "")


def _accion(id_accion: str, formatos: list, etiqueta: str) -> dict:
    """Prepara un boton de conversion, con la utilidad que hace falta."""
    from . import formats as _formats

    cap = _formats.CAPACIDADES.get(id_accion)
    if not cap:
        return {}
    ext = extension_de_accion(id_accion)
    herramienta = herramienta_de_accion(id_accion)
    tool = HERRAMIENTAS.get(herramienta, {})
    disponible = herramienta_disponible(herramienta)
    accion = {
        "id": id_accion,
        "label": cap["label"],
        "nota": cap["ayuda"],
        "herramienta": herramienta,
        "disponible": disponible,
        "admite": True,
    }
    if ext and ext not in formatos:
        # El sistema no admite este formato: no se ofrece, porque es un
        # trabajo que luego no sirve.
        accion["admite"] = False
        accion["motivo"] = "dieses System unterstützt das Format .%s nicht" % ext
        return accion
    if not disponible:
        accion["falta"] = tool.get("nombre", herramienta)
        accion["motivo"] = "Werkzeug %s fehlt" % accion["falta"]
    elif etiqueta:
        accion["motivo"] = ""
    return accion


def acciones_para(info, sistema: str | None = None, extensiones=None) -> list:
    """Las conversiones que admite un fichero **en su sistema**.

    Tres filtros:

    1. las que se pueden hacer desde el formato detectado;
    2. las que el sistema admite (si no lo admite, no se ofrece: es trabajo
       que luego no sirve);
    3. las compresiones que el sistema admite (ZIP, 7Z...): estas no dependen
       del formato del fichero sino del sistema.

    Cada accion lleva si se puede hacer y, si no, que falta.
    """
    from . import formats as _formats

    formatos = formatos_de_sistema(sistema, extensiones)
    if not formatos:
        # Sin datos del sistema: se ofrece lo de siempre (el catalogo por
        # formato), sin filtros.
        return _formats.acciones_de(info)

    acciones = []
    vistos = set()
    for id_accion in _formats.FORMAT_CATALOGUE.get(info.kind, ("", []))[1]:
        if id_accion in vistos:
            continue
        vistos.add(id_accion)
        accion = _accion(id_accion, formatos, "")
        if accion and accion["admite"]:
            acciones.append(accion)

    # Las compresiones: si el sistema admite .zip o .7z, se ofrecen. No
    # dependen del formato del fichero: un BIN de PlayStation 2 se puede
    # comprimir igual que una ISO.
    if info.kind != "zip":
        for id_comp in COMPRESIONES:
            if id_comp in vistos:
                continue
            ext = extension_de_accion(id_comp)
            if ext and ext not in formatos:
                continue
            vistos.add(id_comp)
            accion = _accion(id_comp, formatos, "compresion")
            if accion and accion["admite"]:
                acciones.append(accion)

    return acciones


def resumen_sistema(sistema: str | None, extensiones=None) -> dict:
    """Lo que la interfaz necesita saber de un sistema."""
    formatos = formatos_de_sistema(sistema, extensiones)
    slug = (sistema or "").strip().lower()
    datos = SISTEMAS.get(slug, {})
    return {
        "sistema": slug,
        "formatos": formatos,
        "preferido": datos.get("preferido", ""),
        "nota": datos.get("nota", ""),
        "compresiones": [c for c in COMPRESIONES
                         if extension_de_accion(c) in formatos],
    }
