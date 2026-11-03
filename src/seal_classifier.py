"""Clasificador Geométrico de los 12 Sellos Sagrados de Naruto + Posturas Especiales."""

from __future__ import annotations

from typing import Dict, List, Optional, Tuple
import numpy as np


class SealClassifier:
    """Clasifica configuraciones de manos en los 12 sellos canónicos del zodíaco ninja y posturas de Jutsu."""

    SELLOS = [
        "TORI",               # Pájaro (酉)
        "I",                  # Jabalí (亥)
        "INU",                # Perro (戌)
        "TATSU",              # Dragón (辰)
        "U",                  # Liebre (卯)
        "UMA",                # Caballo (午)
        "SARU",               # Mono (申)
        "USHI",               # Buey (丑)
        "HITSUJI",            # Carnero (未)
        "NE",                 # Rata (子)
        "MI",                 # Serpiente (巳)
        "TORA",               # Tigre (寅)
        "OPEN_PALM",          # Palma Abierta (Rasengan)
        "KAGE_BUNSHIN_CROSS", # Sello de la Cruz (Clones)
        "NONE",               # Sin sello detectado
    ]

    def clasificar(
        self,
        angulos_mano1: Dict[str, float],
        angulos_mano2: Optional[Dict[str, float]] = None,
        distancia_manos: float = 1.0,
        orientacion_mano1: str = "UPRIGHT",
        orientacion_mano2: Optional[str] = None,
    ) -> Tuple[str, float]:
        """Determina el sello presente según la configuración angular, proximidad y orientación espacial de las manos."""

        # Descarte de poses boca abajo / invertidas hacia el suelo
        if orientacion_mano1 == "DOWN" or (orientacion_mano2 is not None and orientacion_mano2 == "DOWN"):
            return "NONE", 0.20

        # -------------------------------------------------------------
        # 1. GESTOS A DOS MANOS (Prioridad cuando ambas manos están juntas)
        # -------------------------------------------------------------
        if angulos_mano2 is not None and distancia_manos < 0.42:
            # Sello de Cruz Kage Bunshin
            if (
                angulos_mano1.get("index", 0) > 135
                and angulos_mano2.get("index", 0) > 135
                and angulos_mano1.get("ring", 0) < 110
                and angulos_mano2.get("ring", 0) < 110
            ):
                return "KAGE_BUNSHIN_CROSS", 0.95

            # Perro (Inu): Una mano abierta plana sobre un puño cerrado (la mano abierta descansa preferentemente horizontal)
            mano1_abierta = all(angulos_mano1.get(d, 0) > 130 for d in ["index", "middle", "ring", "pinky"])
            mano2_cerrada = all(angulos_mano2.get(d, 0) < 110 for d in ["index", "middle", "ring", "pinky"])
            mano2_abierta = all(angulos_mano2.get(d, 0) > 130 for d in ["index", "middle", "ring", "pinky"])
            mano1_cerrada = all(angulos_mano2.get(d, 0) < 110 for d in ["index", "middle", "ring", "pinky"])

            if (mano1_abierta and mano2_cerrada) or (mano2_abierta and mano1_cerrada):
                return "INU", 0.93

            # Jabalí (I): Ambas manos en puño cerrado
            if (
                all(angulos_mano1.get(d, 0) < 115 for d in ["index", "middle", "ring", "pinky"])
                and all(angulos_mano2.get(d, 0) < 115 for d in ["index", "middle", "ring", "pinky"])
            ):
                return "I", 0.92

            # Pájaro (Tori): Pulgares y meñiques erguidos hacia arriba, dedos centrales plegados
            if (
                orientacion_mano1 == "UPRIGHT" and (orientacion_mano2 is None or orientacion_mano2 == "UPRIGHT")
                and angulos_mano1.get("pinky", 0) > 125
                and angulos_mano2.get("pinky", 0) > 125
                and angulos_mano1.get("middle", 0) < 120
                and angulos_mano2.get("middle", 0) < 120
            ):
                return "TORI", 0.90

            # Caballo (Uma): Índices en tienda triangular erguida hacia arriba, dedos restantes plegados
            if (
                orientacion_mano1 == "UPRIGHT" and (orientacion_mano2 is None or orientacion_mano2 == "UPRIGHT")
                and angulos_mano1.get("index", 0) > 140
                and angulos_mano2.get("index", 0) > 140
                and angulos_mano1.get("middle", 0) < 110
                and angulos_mano2.get("middle", 0) < 110
                and angulos_mano1.get("pinky", 0) < 100
            ):
                return "UMA", 0.88

            # Rata (Ne): Mano derecha con índice/medio erguidos hacia arriba envuelta por la izquierda
            if (
                orientacion_mano1 == "UPRIGHT"
                and angulos_mano1.get("index", 0) > 140
                and angulos_mano1.get("middle", 0) > 140
                and angulos_mano1.get("ring", 0) < 105
                and all(angulos_mano2.get(d, 0) < 120 for d in ["middle", "ring", "pinky"])
            ):
                return "NE", 0.91

            # Buey (Ushi): Mano 1 extendida, mano 2 con índice y medio cruzados
            if (
                angulos_mano1.get("index", 0) > 135
                and angulos_mano1.get("middle", 0) > 135
                and angulos_mano2.get("index", 0) > 135
                and angulos_mano2.get("ring", 0) < 105
            ):
                return "USHI", 0.88

            # Carnero (Hitsuji): Índices y medios erguidos hacia arriba juntos en paralelo
            if (
                orientacion_mano1 == "UPRIGHT" and (orientacion_mano2 is None or orientacion_mano2 == "UPRIGHT")
                and angulos_mano1.get("index", 0) > 145
                and angulos_mano1.get("middle", 0) > 145
                and angulos_mano2.get("index", 0) > 140
                and angulos_mano2.get("middle", 0) > 140
                and angulos_mano1.get("pinky", 0) < 105
            ):
                return "HITSUJI", 0.94

            # Tigre (Tora): Índices erguidos estrictamente hacia arriba juntos
            if (
                orientacion_mano1 == "UPRIGHT" and (orientacion_mano2 is None or orientacion_mano2 == "UPRIGHT")
                and angulos_mano1.get("index", 0) > 145
                and angulos_mano2.get("index", 0) > 140
                and angulos_mano1.get("ring", 0) < 105
                and angulos_mano2.get("ring", 0) < 105
            ):
                return "TORA", 0.95

            # Mono (Saru): Dedos extendidos horizontalmente entre ambas manos
            if (
                all(angulos_mano1.get(d, 0) > 130 for d in ["index", "middle", "ring"])
                and all(angulos_mano2.get(d, 0) > 130 for d in ["index", "middle", "ring"])
            ):
                return "SARU", 0.87

            # Dragón (Tatsu) / Serpiente (Mi): Manos unidas entrelazadas
            if angulos_mano1.get("thumb", 0) > 130 and angulos_mano2.get("thumb", 0) > 130:
                return "TATSU", 0.86
            return "MI", 0.89

        # -------------------------------------------------------------
        # 2. GESTOS UNIMANUALES O STANDALONE
        # -------------------------------------------------------------
        # Palma Abierta (Rasengan): los 5 dedos extendidos (no boca abajo)
        if all(angulos_mano1.get(d, 0) > 138 for d in ["thumb", "index", "middle", "ring", "pinky"]):
            return "OPEN_PALM", 0.96

        # Carnero unimanual: Índices y medios rectos hacia arriba
        if (
            orientacion_mano1 == "UPRIGHT"
            and angulos_mano1.get("index", 0) > 145
            and angulos_mano1.get("middle", 0) > 145
            and angulos_mano1.get("pinky", 0) < 100
        ):
            return "HITSUJI", 0.89

        # Liebre (U): Forma de pistola (pulgar e índice extendidos)
        if (
            angulos_mano1.get("thumb", 0) > 135
            and angulos_mano1.get("index", 0) > 140
            and angulos_mano1.get("middle", 0) < 105
            and angulos_mano1.get("ring", 0) < 105
            and angulos_mano1.get("pinky", 0) < 105
        ):
            return "U", 0.91

        # Tigre unimanual: Solo índice erguido estrictamente hacia arriba
        if (
            orientacion_mano1 == "UPRIGHT"
            and angulos_mano1.get("index", 0) > 145
            and angulos_mano1.get("middle", 0) < 100
            and angulos_mano1.get("ring", 0) < 100
            and angulos_mano1.get("pinky", 0) < 100
            and angulos_mano1.get("thumb", 0) <= 135
        ):
            return "TORA", 0.88

        return "NONE", 0.50
