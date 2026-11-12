"""Linea de comandos de las herramientas de ROMs.

La usa el instalador para dejar los DAT descargados y se puede usar a mano:

    python3 -m romtools dats --list
    python3 -m romtools dats --install
    python3 -m romtools dats --install ps2 gc
    python3 -m romtools dats --remove ps2

Tambien vale la forma corta, sin el grupo `dats`:

    python3 -m romtools list
    python3 -m romtools install ps2
    python3 -m romtools remove ps2

Y el grupo `utilidades`, que deja las utilidades de conversion listas:

    python3 -m romtools utilidades --list
    python3 -m romtools utilidades --install
    python3 -m romtools utilidades --install rom-converto
    python3 -m romtools utilidades --remove nodtool
"""

from __future__ import annotations

import argparse
import os
import sys
import time

from . import dats
from . import utilidades


def _log(message: str) -> None:
    print(f"  {message}", flush=True)


def cmd_list(args) -> int:
    print("Verfügbare DATs für die Batocera-Systeme:")
    for item in dats.systems_with_dat():
        print(f"  {item['system']:<16} {item['source_name']:<9} {item['dat']}")
    print()
    cache = dats.dat_dir(args.root)
    installed = dats.dat_files(cache)
    if installed:
        print(f"Bereits heruntergeladen in {cache}:")
        for info in installed:
            games = info.get("games")
            games = f", {games} juegos" if games else ""
            print(f"  {info['system']:<16} {info.get('dat') or '?'}{games}")
    else:
        print(f"Noch kein DAT heruntergeladen ({cache}).")
    return 0


def cmd_install(args) -> int:
    systems = args.systems or [item["system"] for item in dats.systems_with_dat()]
    cache = dats.dat_dir(args.root)
    os.makedirs(cache, exist_ok=True)

    fallos = []
    catalogo = dats.catalogue(cache, timeout=args.timeout)
    for system in systems:
        resolucion = dats.resolve_dat(system, None, catalogo)
        if not resolucion:
            print(f"  [X] {system}: kein DAT konfiguriert")
            fallos.append(system)
            continue
        dat_name = resolucion["dat"]
        print(f"  · {system} ({dat_name})")
        try:
            started = time.time()
            info = dats.install_dat(system, cache, timeout=args.timeout,
                                    progress=_log, catalogo=catalogo)
            print(f"    [OK] {info['games']} juegos, "
                  f"{info['size'] / 1048576:.1f} MiB, "
                  f"{time.time() - started:.0f} s")
        except Exception as exc:  # noqa: BLE001 - aqui se informa y se sigue
            print(f"    [X] {exc}")
            fallos.append(system)
    return 1 if fallos else 0


def cmd_dats(args) -> int:
    """El grupo `dats`: los DAT se listan, se bajan o se borran."""
    if getattr(args, "remove", False):
        if not args.systems:
            print("  du musst angeben, welche Systeme gelöscht werden sollen")
            return 1
        return cmd_remove(args)
    if getattr(args, "install", False):
        return cmd_install(args)
    return cmd_list(args)


def cmd_remove(args) -> int:
    cache = dats.dat_dir(args.root)
    for system in args.systems:
        info = dats.remove_dat(system, cache)
        print(f"  {system}: {'borrado' if info['removed'] else 'no estaba'}")
    return 0


def cmd_utilidades(args) -> int:
    """El grupo `utilidades`: las utilidades de conversion."""
    destino = args.destino or utilidades.utilidades_dir(args.root)
    if getattr(args, "remove", False):
        if not args.ids:
            print("  du musst angeben, welche Werkzeuge gelöscht werden sollen")
            return 1
        for identificador in args.ids:
            entrada = utilidades.por_id(identificador)
            if not entrada:
                print(f"  [X] {identificador}: ist kein Werkzeug")
                return 1
            borrado = utilidades.quitar(entrada, destino)
            print(f"  {identificador}: {'borrado' if borrado else 'no estaba'}")
        return 0
    if getattr(args, "install", False):
        return _instala_utilidades(args, destino)
    return _lista_utilidades(args, destino)


def _lista_utilidades(args, destino) -> int:
    """Ensena que utilidades se pueden instalar y cuales no."""
    arq = args.arq or utilidades.arquitectura()
    print(f"Utilidades de conversion (arquitectura: {arq or 'nicht erkannt'}):")
    for entrada in utilidades.UTILIDADES:
        if arq in entrada["assets"]:
            estado = "installiert sich selbst"
        else:
            estado = f"kein Binary für {arq or 'dieses Gerät'}"
        print(f"  {entrada['id']:<14} {entrada['version']:<18} "
              f"{entrada['licencia']:<12} {estado}")
    print()
    print("Können sich nicht selbst installieren:")
    for entrada in utilidades.no_instalables():
        print(f"  {entrada['nombre']:<14} {entrada['motivo']}")
    print()
    print(f"Ordner der Binaries: {destino}")
    return 0


def _instala_utilidades(args, destino) -> int:
    """Descarga e instala las utilidades, enseñando el progreso."""
    os.makedirs(destino, exist_ok=True)
    tty = sys.stdout.isatty()
    visto = {"pct": -1}

    def progreso(escritos, total):
        if not total:
            return
        pct = int(escritos * 100 / total)
        if pct == visto["pct"]:
            return
        visto["pct"] = pct
        barra = "#" * (pct // 4)
        texto = f"  {barra:<25} {pct:3d}%"
        if tty:
            print("\r\033[K" + texto, end="", flush=True)
        else:
            print(texto, flush=True)

    def aviso(entrada, resumen):
        if tty:
            print("\r\033[K", end="")
        if resumen["estado"] == "instalada":
            print(f"  [OK] {resumen['detalle']}", flush=True)
        elif resumen["estado"] == "ya-estaba":
            print(f"  [OK] {resumen['nombre']}: war bereits in {resumen['ruta']}",
                  flush=True)
        elif resumen["estado"] == "sin-binario":
            print(f"  [--] {resumen['nombre']}: {resumen['detalle']}", flush=True)
        else:
            print(f"  [X] {resumen['nombre']}: {resumen['detalle']}", flush=True)

    resultados = utilidades.instalar_varias(
        destino, ids=args.ids or None, timeout=args.timeout,
        progreso=progreso, aviso=aviso, forzar=args.forzar)
    fallos = [resumen for resumen in resultados if resumen["estado"] == "error"]
    if fallos:
        print(f"  {len(fallos)} Werkzeug(e) konnten nicht installiert werden")
    return 1 if fallos else 0


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(prog="romtools",
                                     description="ROM-Werkzeuge")
    parser.add_argument("--root", default="/userdata/system",
                        help="wo der DAT-Ordner liegt")
    sub = parser.add_subparsers(dest="command")

    p_list = sub.add_parser("list", help="listet die verfügbaren DATs")
    p_list.set_defaults(func=cmd_list)

    p_install = sub.add_parser("install", help="lädt die DATs herunter")
    p_install.add_argument("systems", nargs="*", help="Systeme (Standard: alle)")
    p_install.add_argument("--timeout", type=int, default=900)
    p_install.set_defaults(func=cmd_install)

    p_remove = sub.add_parser("remove", help="löscht die DATs eines Systems")
    p_remove.add_argument("systems", nargs="+")
    p_remove.set_defaults(func=cmd_remove)

    # El grupo `dats` es la forma que usa el instalador:
    # `python3 -m romtools dats --install`.
    p_dats = sub.add_parser("dats", help="verwaltet die DATs (auflisten, installieren oder löschen)")
    grupo = p_dats.add_mutually_exclusive_group()
    grupo.add_argument("--list", action="store_true", help="listet die DATs")
    grupo.add_argument("--install", action="store_true", help="lädt die DATs herunter")
    grupo.add_argument("--remove", action="store_true", help="löscht die DATs")
    p_dats.add_argument("systems", nargs="*", help="Systeme (Standard: alle)")
    p_dats.add_argument("--timeout", type=int, default=900)
    p_dats.set_defaults(func=cmd_dats)

    # El grupo `utilidades` deja las utilidades de conversion listas: es la
    # forma que usa el instalador (`python3 -m romtools utilidades --install`).
    p_util = sub.add_parser("utilidades",
                             help="verwaltet die Konvertierungswerkzeuge")
    grupo = p_util.add_mutually_exclusive_group()
    grupo.add_argument("--list", action="store_true", help="listet die Werkzeuge")
    grupo.add_argument("--install", action="store_true", help="installiert die Werkzeuge")
    grupo.add_argument("--remove", action="store_true", help="löscht die Werkzeuge")
    p_util.add_argument("ids", nargs="*", help="Werkzeuge (Standard: alle)")
    p_util.add_argument("--destino", default="",
                        help="Ordner der Binaries (Standard: <root>/bin)")
    p_util.add_argument("--arq", default="",
                        help="Architektur (Standard: die dieses Geräts)")
    p_util.add_argument("--timeout", type=int, default=utilidades.TIMEOUT_DESCARGA)
    p_util.add_argument("--forzar", action="store_true",
                        help="installiert erneut, auch wenn es schon da ist")
    p_util.set_defaults(func=cmd_utilidades)

    args = parser.parse_args(argv)
    if not getattr(args, "func", None):
        args.func = cmd_list
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
