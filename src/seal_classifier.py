"""Clasificador Geométrico de Sellos de Manos de Naruto."""

from __future__ import annotations

from typing import Dict, List, Optional, Tuple
import numpy as np


class SealClassifier:
    """Clasifica configuraciones de manos en sellos clásicos (Tigre, Carnero, Serpiente, Cruz, Palma Abierta)."""

    SELLOS = ["TORA", "HITSUJI", "MI", "KAGE_BUNSHIN_CROSS", "OPEN_PALM", "NONE"]

    def clasificar(
        self,
        angulos_mano1: Dict[str, float],
        angulos_mano2: Optional[Dict[str, float]] = None,
        distancia_manos: float = 1.0,
    ) -> Tuple[str, float]:
        """Determina el sello presente según la postura geométrica.

        Args:
            angulos_mano1: Ángulos de extensión de la primera mano.
            angulos_mano2: Ángulos de la segunda mano (si ambas están visibles).
            distancia_manos: Distancia euclídea normalizada entre muñecas.

        Returns:
            Tuple[str, float]: Nombre del sello y score de confianza [0.0, 1.0].
        """
        # 1. Sello del Tigre (Tora): Índices y pulgares extendidos hacia arriba
        if angulos_mano1.get("index", 0) > 150 and angulos_mano1.get("ring", 0) < 90:
            if angulos_mano2 and angulos_mano2.get("index", 0) > 150:
                return "TORA", 0.94
            return "TORA", 0.82

        # 2. Sello del Carnero (Hitsuji): Índices y medios erguidos
        if (
            angulos_mano1.get("index", 0) > 150
            and angulos_mano1.get("middle", 0) > 150
            and angulos_mano1.get("pinky", 0) < 90
        ):
            return "HITSUJI", 0.91

        # 3. Palma Abierta (Rasengan Stance): Los 5 dedos extendidos
        if all(angulos_mano1.get(d, 0) > 140 for d in ["thumb", "index", "middle", "ring", "pinky"]):
            return "OPEN_PALM", 0.96

        # 4. Sello de Cruz Kage Bunshin (manos cercanas y cruzadas)
        if angulos_mano2 and distancia_manos < 0.35:
            if (
                angulos_mano1.get("index", 0) > 140
                and angulos_mano2.get("index", 0) > 140
                and angulos_mano1.get("ring", 0) < 100
            ):
                return "KAGE_BUNSHIN_CROSS", 0.93

        # 5. Sello de la Serpiente (Mi): Manos unidas entrelazadas
        if angulos_mano2 and distancia_manos < 0.25:
            return "MI", 0.88

        return "NONE", 0.50
