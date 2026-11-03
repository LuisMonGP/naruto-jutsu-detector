"""Máquina de Estados Finitos (FSM) con Búfer Temporal para Detección de Jutsus."""

from __future__ import annotations

import time
from collections import deque
from typing import Dict, List, Optional, Tuple


class JutsuFSM:
    """Administra secuencias temporales de sellos y activación de técnicas ninja."""

    RECETAS_JUTSUS = {
        "KATON_GOUKAKYUU": ["MI", "HITSUJI", "TORA"],
        "CHIDORI": ["TORA", "HITSUJI"],
        "RASENGAN": ["OPEN_PALM"],
        "KAGE_BUNSHIN": ["KAGE_BUNSHIN_CROSS"],
    }

    def __init__(self, ventana_segundos: float = 3.5, debounce_frames: int = 5) -> None:
        self.ventana_segundos = ventana_segundos
        self.debounce_frames = debounce_frames
        self.historial_sellos: deque = deque()
        self._ultimo_sello: Optional[str] = None
        self._contador_frames: int = 0
        self.jutsu_activo: Optional[str] = None
        self.timestamp_activacion: float = 0.0

    def registrar_frame(self, sello_detectado: str) -> Optional[str]:
        """Registra el sello del frame actual aplicando debounce y comprueba activación de Jutsus.

        Args:
            sello_detectado: Sello reconocido en el frame ('TORA', 'HITSUJI', etc.).

        Returns:
            Optional[str]: Nombre del Jutsu activado si se completó una secuencia válida.
        """
        ahora = time.time()

        # Limpiar sellos expirados por ventana temporal
        while self.historial_sellos and (ahora - self.historial_sellos[0][1] > self.ventana_segundos):
            self.historial_sellos.popleft()

        # Debounce: El sello debe mantenerse estable durante varios frames consecutivos
        if sello_detectado != "NONE":
            if sello_detectado == self._ultimo_sello:
                self._contador_frames += 1
            else:
                self._ultimo_sello = sello_detectado
                self._contador_frames = 1

            if self._contador_frames >= self.debounce_frames:
                # Agregar al historial si no es duplicado inmediato del último registrado
                if not self.historial_sellos or self.historial_sellos[-1][0] != sello_detectado:
                    self.historial_sellos.append((sello_detectado, ahora))
        else:
            self._ultimo_sello = "NONE"
            self._contador_frames = 0

        # Comprobar si la secuencia actual dispara algún Jutsu
        secuencia_actual = [item[0] for item in self.historial_sellos]

        for jutsu, receta in self.RECETAS_JUTSUS.items():
            len_receta = len(receta)
            if len(secuencia_actual) >= len_receta and secuencia_actual[-len_receta:] == receta:
                self.jutsu_activo = jutsu
                self.timestamp_activacion = ahora
                self.historial_sellos.clear()
                return jutsu

        return None
